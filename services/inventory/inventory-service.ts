import { AppError } from "@/lib/api/route-errors";
import type { Prisma } from "@/lib/generated/prisma/client";

import {
  inventoryPublicSelect,
  toBookInventoryView,
  type BookInventoryView,
  type InventoryPublic,
} from "./types";
import { syncStockAlertsForBook } from "@/services/alerts/stock-alerts-sync";

type TransactionClient = Prisma.TransactionClient;

const DEFAULT_ALERT_THRESHOLD = 2;

/** Fetch inventory rows for many books. */
export async function fetchInventoriesByBookIds(
  bookIds: number[],
  tx: TransactionClient,
): Promise<Map<number, BookInventoryView>> {
  const result = new Map<number, BookInventoryView>();
  if (bookIds.length === 0) {
    return result;
  }

  const rows = await tx.book_inventory.findMany({
    where: { book_id: { in: [...new Set(bookIds)] } },
    select: inventoryPublicSelect,
  });

  for (const row of rows) {
    result.set(row.book_id, toBookInventoryView(row));
  }

  return result;
}

/** Get inventory for one book, or null if not in the library yet. */
export async function getInventoryByBookId(
  bookId: number,
  tx: TransactionClient,
): Promise<BookInventoryView | null> {
  const row = await tx.book_inventory.findUnique({
    where: { book_id: bookId },
    select: inventoryPublicSelect,
  });
  return row ? toBookInventoryView(row) : null;
}

/**
 * Increment reserve stock on supplier reception.
 * Creates the inventory row on first reception (enters the library).
 */
export async function incrementReserveStock(
  bookId: number,
  qty: number,
  tx: TransactionClient,
): Promise<InventoryPublic> {
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Reserve increment quantity must be a positive integer.",
      400,
    );
  }

  const existing = await tx.book_inventory.findUnique({
    where: { book_id: bookId },
    select: inventoryPublicSelect,
  });

  if (!existing) {
    const created = await tx.book_inventory.create({
      data: {
        book_id: bookId,
        qty_reserve: qty,
        qty_shelf: 0,
        alert_threshold: DEFAULT_ALERT_THRESHOLD,
        first_received_at: new Date(),
        updated_at: new Date(),
      },
      select: inventoryPublicSelect,
    });
    await syncStockAlertsForBook(bookId, tx);
    return created;
  }

  const updated = await tx.book_inventory.update({
    where: { book_id: bookId },
    data: {
      qty_reserve: { increment: qty },
      updated_at: new Date(),
    },
    select: inventoryPublicSelect,
  });
  await syncStockAlertsForBook(bookId, tx);
  return updated;
}

/** Update alert threshold for a book already in inventory. */
export async function updateInventoryAlertThreshold(
  bookId: number,
  alertThreshold: number,
  tx: TransactionClient,
): Promise<InventoryPublic> {
  const existing = await tx.book_inventory.findUnique({
    where: { book_id: bookId },
    select: { book_id: true },
  });

  if (!existing) {
    throw new AppError(
      "BUSINESS_RULE",
      "Cannot update alert threshold: book is not in library inventory yet.",
      409,
    );
  }

  const updated = await tx.book_inventory.update({
    where: { book_id: bookId },
    data: {
      alert_threshold: alertThreshold,
      updated_at: new Date(),
    },
    select: inventoryPublicSelect,
  });
  await syncStockAlertsForBook(bookId, tx);
  return updated;
}
