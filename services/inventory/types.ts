import type { Prisma } from "@/lib/generated/prisma/client";

export const inventoryPublicSelect = {
  book_id: true,
  qty_reserve: true,
  qty_shelf: true,
  alert_threshold: true,
  first_received_at: true,
  updated_at: true,
} satisfies Prisma.book_inventorySelect;

export type InventoryPublic = Prisma.book_inventoryGetPayload<{
  select: typeof inventoryPublicSelect;
}>;

export type BookInventoryView = {
  qty_reserve: number;
  qty_shelf: number;
  alert_threshold: number;
  first_received_at: Date;
  updated_at: Date;
};

export function toBookInventoryView(
  inventory: InventoryPublic,
): BookInventoryView {
  return {
    qty_reserve: inventory.qty_reserve,
    qty_shelf: inventory.qty_shelf,
    alert_threshold: inventory.alert_threshold,
    first_received_at: inventory.first_received_at,
    updated_at: inventory.updated_at,
  };
}
