import { AppError } from "@/lib/api/route-errors";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  INITIAL_TREASURY_BALANCE,
  INITIAL_TREASURY_LOW_THRESHOLD,
} from "@/lib/roles";

import {
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
  userId: number,
  tx: TransactionClient,
): Promise<TreasuryAccountPublic> {
  const account = await tx.treasury_account.findUnique({
    where: { user_id: userId },
    select: treasuryAccountSelect,
  });

  if (!account) {
    throw new AppError(
      "NOT_FOUND",
      "Treasury account not found for this user.",
      404,
    );
  }

  return account;
}

/** Create a treasury account for a player (idempotent). */
export async function ensureTreasuryAccount(
  userId: number,
  options: {
    balance?: Prisma.Decimal | number | string;
    low_threshold?: Prisma.Decimal | number | string;
  } = {},
  tx: TransactionClient = prisma,
): Promise<TreasuryAccountPublic> {
  const existing = await tx.treasury_account.findUnique({
    where: { user_id: userId },
    select: treasuryAccountSelect,
  });

  if (existing) {
    return existing;
  }

  return tx.treasury_account.create({
    data: {
      user_id: userId,
      balance: options.balance ?? INITIAL_TREASURY_BALANCE,
      low_threshold: options.low_threshold ?? INITIAL_TREASURY_LOW_THRESHOLD,
      updated_at: new Date(),
    },
    select: treasuryAccountSelect,
  });
}

/** Read the treasury account for a player. */
export async function getAccount(
  userId: number,
  tx: TransactionClient = prisma,
): Promise<TreasuryAccountPublic> {
  return getAccountOrThrow(userId, tx);
}

/** Read account + `is_low` (D67). */
export async function getTreasuryOverview(
  userId: number,
  tx: TransactionClient = prisma,
): Promise<TreasuryOverview> {
  const account = await getAccountOrThrow(userId, tx);
  return toTreasuryOverview(account);
}

/** List movements for a player, newest first. */
export async function listMovements(
  userId: number,
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
    where: {
      user_id: userId,
      ...(parsed.type ? { type: parsed.type } : {}),
    },
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
  userId: number,
  input: ApplyTreasuryMovementInput,
  tx: TransactionClient = prisma,
): Promise<{
  account: TreasuryAccountPublic;
  movement: TreasuryMovementPublic;
}> {
  const run = async (client: TransactionClient) => {
    const account = await getAccountOrThrow(userId, client);
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
        user_id: userId,
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
  userId: number,
  input: Omit<ApplyTreasuryMovementInput, "type"> & {
    type: "supplier_purchase" | "adjustment_out";
  },
  tx: TransactionClient = prisma,
) {
  return applyMovement(userId, input, tx);
}

/** Credit helper (customer sale / adjustment in). */
export async function applyCredit(
  userId: number,
  input: Omit<ApplyTreasuryMovementInput, "type"> & {
    type: "customer_sale" | "adjustment_in";
  },
  tx: TransactionClient = prisma,
) {
  return applyMovement(userId, input, tx);
}

/** Manual admin adjustment for a player's treasury (D66). */
export async function adjustTreasury(
  userId: number,
  body: unknown,
): Promise<{
  account: TreasuryOverview;
  movement: TreasuryMovementPublic;
}> {
  const input = validateAdjustTreasuryInput(body);

  const result = await applyMovement(userId, {
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
  unit_price?: Prisma.Decimal | number | string;
  simulation_event_id?: number | null;
  note?: string | null;
};

/**
 * Record a customer sale as a treasury credit (D64–D65).
 */
export async function recordSale(
  userId: number,
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
    const inventory = await tx.book_inventory.findUnique({
      where: {
        user_id_book_id: { user_id: userId, book_id: input.book_id },
      },
      select: { sale_price: true },
    });
    if (!inventory) {
      throw new AppError(
        "NOT_FOUND",
        "Book is not in library inventory.",
        404,
      );
    }
    unitPrice = inventory.sale_price;
  }

  if (unitPrice.lessThanOrEqualTo(0)) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Sale unit price must be greater than 0.",
      400,
    );
  }

  const result = await applyCredit(
    userId,
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

export type RecordWageResult = {
  paid: Prisma.Decimal;
  unpaid: Prisma.Decimal;
  movements: TreasuryMovementPublic[];
};

/**
 * Pay daily wages at simulated closing (D72).
 * Never drives the balance negative (L2 / D63). Unpaid remainder lowers morale.
 */
export async function recordDailyWages(
  userId: number,
  employees: Array<{ id: number; name: string; wage_daily: Prisma.Decimal | string | number }>,
  tx: TransactionClient = prisma,
): Promise<RecordWageResult> {
  const run = async (client: TransactionClient) => {
    let remaining = (await getAccountOrThrow(userId, client)).balance;
    let paid = new Prisma.Decimal(0);
    let unpaid = new Prisma.Decimal(0);
    const movements: TreasuryMovementPublic[] = [];

    for (const employee of employees) {
      const wage = new Prisma.Decimal(employee.wage_daily);
      if (wage.lessThanOrEqualTo(0)) continue;
      const portion = remaining.lessThan(wage) ? remaining : wage;
      if (portion.lessThanOrEqualTo(0)) {
        unpaid = unpaid.plus(wage);
        continue;
      }
      const result = await applyMovement(
        userId,
        {
          type: "wage",
          amount: portion,
          note: `Paie du jour — ${employee.name}`,
        },
        client,
      );
      movements.push(result.movement);
      remaining = result.account.balance;
      paid = paid.plus(portion);
      if (portion.lessThan(wage)) {
        unpaid = unpaid.plus(wage.minus(portion));
      }
    }

    return { paid, unpaid, movements };
  };

  if (tx === prisma) {
    return prisma.$transaction((client) => run(client));
  }
  return run(tx);
}
