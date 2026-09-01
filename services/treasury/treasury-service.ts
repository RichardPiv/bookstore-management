import { AppError } from "@/lib/api/route-errors";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

import {
  TREASURY_ACCOUNT_ID,
  isTreasuryDebitType,
  toTreasuryOverview,
  treasuryAccountSelect,
  treasuryMovementSelect,
  type ApplyTreasuryMovementInput,
  type ListTreasuryMovementsOptions,
  type TreasuryAccountPublic,
  type TreasuryMovementPublic,
  type TreasuryOverview,
} from "./types";
import {
  validateAdjustTreasuryInput,
  validateListTreasuryMovementsOptions,
} from "./validation";

type TransactionClient = Prisma.TransactionClient;

async function getAccountOrThrow(
  tx: TransactionClient,
): Promise<TreasuryAccountPublic> {
  const account = await tx.treasury_account.findUnique({
    where: { id: TREASURY_ACCOUNT_ID },
    select: treasuryAccountSelect,
  });

  if (!account) {
    throw new AppError(
      "NOT_FOUND",
      "Treasury account not found. Apply migration 014_treasury.sql.",
      404,
    );
  }

  return account;
}

/**
 * Ensure the single treasury account exists (idempotent seed helper).
 * Prefer the SQL migration INSERT; this is a safety net for local resets.
 */
export async function ensureTreasuryAccount(
  options: {
    balance?: Prisma.Decimal | number | string;
    low_threshold?: Prisma.Decimal | number | string;
  } = {},
  tx: TransactionClient = prisma,
): Promise<TreasuryAccountPublic> {
  const existing = await tx.treasury_account.findUnique({
    where: { id: TREASURY_ACCOUNT_ID },
    select: treasuryAccountSelect,
  });

  if (existing) {
    return existing;
  }

  return tx.treasury_account.create({
    data: {
      id: TREASURY_ACCOUNT_ID,
      balance: options.balance ?? 10000,
      low_threshold: options.low_threshold ?? 1000,
      updated_at: new Date(),
    },
    select: treasuryAccountSelect,
  });
}

/** Read the treasury account. */
export async function getAccount(
  tx: TransactionClient = prisma,
): Promise<TreasuryAccountPublic> {
  return getAccountOrThrow(tx);
}

/** Read account + `is_low` (D67). */
export async function getTreasuryOverview(
  tx: TransactionClient = prisma,
): Promise<TreasuryOverview> {
  const account = await getAccountOrThrow(tx);
  return toTreasuryOverview(account);
}

/** List movements, newest first. */
export async function listMovements(
  options: ListTreasuryMovementsOptions | URLSearchParams = {},
): Promise<TreasuryMovementPublic[]> {
  const parsed =
    options instanceof URLSearchParams
      ? validateListTreasuryMovementsOptions(options)
      : {
          type: options.type,
          limit: options.limit ?? 50,
        };

  return prisma.treasury_movements.findMany({
    where: parsed.type ? { type: parsed.type } : undefined,
    select: treasuryMovementSelect,
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: parsed.limit ?? 50,
  });
}

/**
 * Apply one treasury movement and update the balance atomically.
 * Debit types refuse with 409 if balance is insufficient (D63).
 */
export async function applyMovement(
  input: ApplyTreasuryMovementInput,
  tx: TransactionClient = prisma,
): Promise<{
  account: TreasuryAccountPublic;
  movement: TreasuryMovementPublic;
}> {
  const run = async (client: TransactionClient) => {
    const account = await getAccountOrThrow(client);
    const isDebit = isTreasuryDebitType(input.type);

    if (isDebit && account.balance.lessThan(input.amount)) {
      throw new AppError(
        "BUSINESS_RULE",
        "Insufficient treasury balance.",
        409,
      );
    }

    const balanceAfter = isDebit
      ? account.balance.minus(input.amount)
      : account.balance.plus(input.amount);

    const updatedAccount = await client.treasury_account.update({
      where: { id: account.id },
      data: {
        balance: balanceAfter,
        updated_at: new Date(),
      },
      select: treasuryAccountSelect,
    });

    const movement = await client.treasury_movements.create({
      data: {
        type: input.type,
        amount: input.amount,
        balance_after: balanceAfter,
        unit_price: input.unit_price ?? null,
        qty: input.qty ?? null,
        order_id: input.order_id ?? null,
        order_line_id: input.order_line_id ?? null,
        book_id: input.book_id ?? null,
        simulation_event_id: input.simulation_event_id ?? null,
        note: input.note ?? null,
      },
      select: treasuryMovementSelect,
    });

    return { account: updatedAccount, movement };
  };

  if (tx === prisma) {
    return prisma.$transaction((client) => run(client));
  }

  return run(tx);
}

/** Debit helper (supplier purchase / adjustment out). */
export async function applyDebit(
  input: Omit<ApplyTreasuryMovementInput, "type"> & {
    type: "supplier_purchase" | "adjustment_out";
  },
  tx: TransactionClient = prisma,
) {
  return applyMovement(input, tx);
}

/** Credit helper (customer sale / adjustment in). */
export async function applyCredit(
  input: Omit<ApplyTreasuryMovementInput, "type"> & {
    type: "customer_sale" | "adjustment_in";
  },
  tx: TransactionClient = prisma,
) {
  return applyMovement(input, tx);
}

/** Manual admin adjustment (D66). */
export async function adjustTreasury(body: unknown): Promise<{
  account: TreasuryOverview;
  movement: TreasuryMovementPublic;
}> {
  const input = validateAdjustTreasuryInput(body);

  const result = await applyMovement({
    type: input.direction === "in" ? "adjustment_in" : "adjustment_out",
    amount: input.amount,
    note: input.note,
  });

  return {
    account: toTreasuryOverview(result.account),
    movement: result.movement,
  };
}

export type RecordSaleInput = {
  book_id: number;
  qty?: number;
  /** Snapshot at sale time (D65). If omitted, current books.sale_price is used. */
  unit_price?: Prisma.Decimal | number | string;
  simulation_event_id?: number | null;
  note?: string | null;
};

/**
 * Record a customer sale as a treasury credit (D64–D65).
 * Stock decrement stays the caller's responsibility (simulation / future POS).
 */
export async function recordSale(
  input: RecordSaleInput,
  tx: TransactionClient = prisma,
): Promise<{
  account: TreasuryAccountPublic;
  movement: TreasuryMovementPublic;
  unit_price: Prisma.Decimal;
  qty: number;
}> {
  const qty = input.qty ?? 1;
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      'The field "qty" must be a positive integer.',
      400,
    );
  }

  let unitPrice: Prisma.Decimal;
  if (input.unit_price !== undefined && input.unit_price !== null) {
    unitPrice = new Prisma.Decimal(input.unit_price);
  } else {
    const book = await tx.books.findUnique({
      where: { id: input.book_id },
      select: { id: true, sale_price: true },
    });
    if (!book) {
      throw new AppError("NOT_FOUND", "Book not found.", 404);
    }
    unitPrice = book.sale_price;
  }

  if (unitPrice.lessThanOrEqualTo(0)) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Sale unit price must be greater than 0.",
      400,
    );
  }

  const result = await applyCredit(
    {
      type: "customer_sale",
      amount: unitPrice.mul(qty),
      unit_price: unitPrice,
      qty,
      book_id: input.book_id,
      simulation_event_id: input.simulation_event_id ?? null,
      note: input.note ?? null,
    },
    tx,
  );

  return {
    ...result,
    unit_price: unitPrice,
    qty,
  };
}
