import { Prisma } from "@/lib/generated/prisma/client";

export const stockPublicSelect = {
  id: true,
  title: true,
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
};
