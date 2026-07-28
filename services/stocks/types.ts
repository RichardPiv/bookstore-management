import { Prisma } from "@/lib/generated/prisma/client";

export const stockPublicSelect = {
  id: true,
  title: true,
  purchase_price: true,
  sale_price: true,
  qty_reserve: true,
  qty_shelf: true,
  alert_threshold: true,
  is_active: true,
} satisfies Prisma.booksSelect;

export type StockPublic = Prisma.booksGetPayload<{
  select: typeof stockPublicSelect;
}>;

export type TransferToShelfInput = {
  book_id: number;
  qty: number;
  /** Optional override; defaults to purchase_price when omitted (D58). */
  sale_price?: Prisma.Decimal;
};
