import type { Prisma } from "@/lib/generated/prisma/client";

/** Stock snapshot for a book already in library inventory. */
export type StockPublic = {
  id: number;
  book_id: number;
  title: string;
  purchase_price: Prisma.Decimal | number | string;
  sale_price: Prisma.Decimal | number | string;
  is_active: boolean;
  qty_reserve: number;
  qty_shelf: number;
  alert_threshold: number;
  first_received_at: Date;
  updated_at: Date;
};

/** Lightweight book payload for order/alert enrichment. */
export type BookRefPublic = {
  id: number;
  title: string;
  purchase_price: Prisma.Decimal | number | string;
  sale_price: Prisma.Decimal | number | string;
  is_active: boolean;
  qty_reserve: number | null;
  qty_shelf: number | null;
  alert_threshold: number | null;
  first_received_at: Date | null;
};

export type TransferToShelfInput = {
  book_id: number;
  qty: number;
  /** Optional override; defaults to purchase_price when omitted (D58). */
  sale_price?: Prisma.Decimal;
};
