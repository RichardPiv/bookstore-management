import { Prisma } from "@/lib/generated/prisma/client";

/** MVP movement types (D60–D66). Sense is encoded in the type. */
export const TREASURY_MOVEMENT_TYPES = [
  "supplier_purchase",
  "customer_sale",
  "adjustment_in",
  "adjustment_out",
] as const;

export type TreasuryMovementType = (typeof TREASURY_MOVEMENT_TYPES)[number];

export const TREASURY_DEBIT_TYPES = [
  "supplier_purchase",
  "adjustment_out",
] as const satisfies readonly TreasuryMovementType[];

export const TREASURY_CREDIT_TYPES = [
  "customer_sale",
  "adjustment_in",
] as const satisfies readonly TreasuryMovementType[];

/**
 * Select fields for public treasury accounts.
 */
export const treasuryAccountSelect = {
  id: true,
  user_id: true,
  balance: true,
  low_threshold: true,
  updated_at: true,
} satisfies Prisma.treasury_accountSelect;

/**
 * Treasury account type.
 */
export type TreasuryAccountPublic = Prisma.treasury_accountGetPayload<{
  select: typeof treasuryAccountSelect;
}>;

/**
 * Account + derived low-balance flag (D67).
 */
export type TreasuryOverview = TreasuryAccountPublic & {
  is_low: boolean;
};

/**
 * Select fields for public treasury movements.
 */
export const treasuryMovementSelect = {
  id: true,
  user_id: true,
  type: true,
  amount: true,
  balance_after: true,
  unit_price: true,
  qty: true,
  order_id: true,
  order_line_id: true,
  book_id: true,
  simulation_event_id: true,
  note: true,
  created_at: true,
} satisfies Prisma.treasury_movementsSelect;

/**
 * Treasury movement type.
 */
export type TreasuryMovementPublic = Prisma.treasury_movementsGetPayload<{
  select: typeof treasuryMovementSelect;
}>;

/**
 * Internal apply-movement payload (orders / simulation / adjust).
 */
export type ApplyTreasuryMovementInput = {
  type: TreasuryMovementType;
  amount: Prisma.Decimal;
  unit_price?: Prisma.Decimal | null;
  qty?: number | null;
  order_id?: number | null;
  order_line_id?: number | null;
  book_id?: number | null;
  simulation_event_id?: number | null;
  note?: string | null;
};

/**
 * POST /api/treasury/adjust body (D66).
 */
export type AdjustTreasuryInput = {
  direction: "in" | "out";
  amount: Prisma.Decimal;
  note: string;
};

/**
 * Optional filters for listing movements.
 */
export type ListTreasuryMovementsOptions = {
  type?: TreasuryMovementType;
  limit?: number;
};

export function isTreasuryDebitType(
  type: TreasuryMovementType,
): boolean {
  return (TREASURY_DEBIT_TYPES as readonly string[]).includes(type);
}

export function isTreasuryCreditType(
  type: TreasuryMovementType,
): boolean {
  return (TREASURY_CREDIT_TYPES as readonly string[]).includes(type);
}

export function toTreasuryOverview(
  account: TreasuryAccountPublic,
): TreasuryOverview {
  return {
    ...account,
    is_low: account.balance.lessThanOrEqualTo(account.low_threshold),
  };
}
