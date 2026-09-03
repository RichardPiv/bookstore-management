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

function inventoryKey(userId: number, bookId: number) {
  return { user_id_book_id: { user_id: userId, book_id: bookId } };
}

/** Fetch inventory rows for many books belonging to one user. */
export async function fetchInventoriesByBookIds(
  userId: number,
  bookIds: number[],
  tx: TransactionClient,
): Promise<Map<number, BookInventoryView>> {
  const result = new Map<number, BookInventoryView>();
  if (bookIds.length === 0) {
    return result;
  }

  const rows = await tx.book_inventory.findMany({
    where: {
      user_id: userId,
      book_id: { in: [...new Set(bookIds)] },
    },
    select: inventoryPublicSelect,
  });

  for (const row of rows) {
    result.set(row.book_id, toBookInventoryView(row));
  }

  return result;
}

/** Get inventory for one book for a user, or null if not in their library yet. */
export async function getInventoryByBookId(
  userId: number,
  bookId: number,
  tx: TransactionClient,
): Promise<BookInventoryView | null> {
  const row = await tx.book_inventory.findUnique({
    where: inventoryKey(userId, bookId),
    select: inventoryPublicSelect,
  });
  return row ? toBookInventoryView(row) : null;
}

/**
 * Sum stock across all players for a catalog book (admin deactivation checks).
 */
export async function getGlobalStockSnapshotForBook(
  bookId: number,
  tx: TransactionClient,
): Promise<{ qty_reserve: number; qty_shelf: number }> {
  const agg = await tx.book_inventory.aggregate({
    where: { book_id: bookId },
    _sum: { qty_reserve: true, qty_shelf: true },
  });

  return {
    qty_reserve: agg._sum.qty_reserve ?? 0,
    qty_shelf: agg._sum.qty_shelf ?? 0,
  };
}

/**
 * Increment reserve stock on supplier reception for a player's library.
 * Creates the inventory row on first reception (sale_price defaults to purchase_price).
 */
export async function incrementReserveStock(
  userId: number,
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
    where: inventoryKey(userId, bookId),
    select: inventoryPublicSelect,
  });

  if (!existing) {
    const book = await tx.books.findUnique({
      where: { id: bookId },
      select: { purchase_price: true },
    });

    if (!book) {
      throw new AppError("NOT_FOUND", "Book not found.", 404);
    }

    const created = await tx.book_inventory.create({
      data: {
        user_id: userId,
        book_id: bookId,
        qty_reserve: qty,
        qty_shelf: 0,
        alert_threshold: DEFAULT_ALERT_THRESHOLD,
        sale_price: book.purchase_price,
        first_received_at: new Date(),
        updated_at: new Date(),
      },
      select: inventoryPublicSelect,
    });
    await syncStockAlertsForBook(userId, bookId, tx);
    return created;
  }

  const updated = await tx.book_inventory.update({
    where: inventoryKey(userId, bookId),
    data: {
      qty_reserve: { increment: qty },
      updated_at: new Date(),
    },
    select: inventoryPublicSelect,
  });
  await syncStockAlertsForBook(userId, bookId, tx);
  return updated;
}

/** Update alert threshold for a book already in a player's inventory. */
export async function updateInventoryAlertThreshold(
  userId: number,
  bookId: number,
  alertThreshold: number,
  tx: TransactionClient,
): Promise<InventoryPublic> {
  const existing = await tx.book_inventory.findUnique({
    where: inventoryKey(userId, bookId),
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
    where: inventoryKey(userId, bookId),
    data: {
      alert_threshold: alertThreshold,
      updated_at: new Date(),
    },
    select: inventoryPublicSelect,
  });
  await syncStockAlertsForBook(userId, bookId, tx);
  return updated;
}

/** Update the player's sale price for a book in their inventory. */
export async function updateInventorySalePrice(
  userId: number,
  bookId: number,
  salePrice: Prisma.Decimal,
  tx: TransactionClient,
): Promise<InventoryPublic> {
  const existing = await tx.book_inventory.findUnique({
    where: inventoryKey(userId, bookId),
    select: { book_id: true },
  });

  if (!existing) {
    throw new AppError(
      "BUSINESS_RULE",
      "Cannot update sale price: book is not in library inventory yet.",
      409,
    );
  }

  return tx.book_inventory.update({
    where: inventoryKey(userId, bookId),
    data: {
      sale_price: salePrice,
      updated_at: new Date(),
    },
    select: inventoryPublicSelect,
  });
}
