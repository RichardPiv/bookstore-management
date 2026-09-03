import { AppError } from "@/lib/api/route-errors";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

import {
  inventoryPublicSelect,
  type InventoryPublic,
} from "@/services/inventory/types";
import { syncStockAlertsForBook } from "@/services/alerts/stock-alerts-sync";
import { updateInventorySalePrice } from "@/services/inventory/inventory-service";

import type { StockPublic } from "./types";
import {
  validateTransferToShelfInput,
  validateUpdateSalePriceInput,
} from "./validation";

const SHELF_MAX_QTY = 10;

type TransactionClient = Prisma.TransactionClient;

function inventoryKey(userId: number, bookId: number) {
  return { user_id_book_id: { user_id: userId, book_id: bookId } };
}

function toStockPublic(
  book: {
    id: number;
    title: string;
    purchase_price: Prisma.Decimal;
    is_active: boolean;
  },
  inventory: InventoryPublic,
): StockPublic {
  return {
    id: book.id,
    book_id: book.id,
    title: book.title,
    purchase_price: book.purchase_price,
    sale_price: inventory.sale_price,
    is_active: book.is_active,
    qty_reserve: inventory.qty_reserve,
    qty_shelf: inventory.qty_shelf,
    alert_threshold: inventory.alert_threshold,
    first_received_at: inventory.first_received_at,
    updated_at: inventory.updated_at,
  };
}

const bookStockSelect = {
  id: true,
  title: true,
  purchase_price: true,
  is_active: true,
} as const;

/** List stock levels for books already in a player's library. */
export async function listStocks(userId: number): Promise<StockPublic[]> {
  const inventories = await prisma.book_inventory.findMany({
    where: { user_id: userId },
    select: inventoryPublicSelect,
    orderBy: { book_id: "asc" },
  });

  if (inventories.length === 0) {
    return [];
  }

  const books = await prisma.books.findMany({
    where: { id: { in: inventories.map((row) => row.book_id) } },
    select: bookStockSelect,
    orderBy: { title: "asc" },
  });

  const inventoryByBookId = new Map(
    inventories.map((row) => [row.book_id, row]),
  );

  const stocks: StockPublic[] = [];
  for (const book of books) {
    const inventory = inventoryByBookId.get(book.id);
    if (!inventory) continue;
    stocks.push(toStockPublic(book, inventory));
  }

  return stocks;
}

/** Get stock levels for one book in a player's library. */
export async function getStockByBookId(
  userId: number,
  bookId: number,
): Promise<StockPublic | null> {
  const [book, inventory] = await Promise.all([
    prisma.books.findUnique({
      where: { id: bookId },
      select: bookStockSelect,
    }),
    prisma.book_inventory.findUnique({
      where: inventoryKey(userId, bookId),
      select: inventoryPublicSelect,
    }),
  ]);

  if (!book || !inventory) {
    return null;
  }

  return toStockPublic(book, inventory);
}

/** Transfer quantity from reserve to shelf (D28, D29). */
export async function transferToShelf(
  userId: number,
  body: unknown,
  tx: TransactionClient = prisma,
): Promise<StockPublic> {
  const input = validateTransferToShelfInput(body);

  const run = async (client: TransactionClient) => {
    const book = await client.books.findUnique({
      where: { id: input.book_id },
      select: bookStockSelect,
    });

    if (!book) {
      throw new AppError("NOT_FOUND", "Book not found.", 404);
    }

    if (!book.is_active) {
      throw new AppError(
        "BUSINESS_RULE",
        "Cannot transfer stock for an inactive book.",
        409,
      );
    }

    const inventory = await client.book_inventory.findUnique({
      where: inventoryKey(userId, input.book_id),
      select: inventoryPublicSelect,
    });

    if (!inventory) {
      throw new AppError(
        "BUSINESS_RULE",
        "Book is not in library inventory yet. Receive a supplier order first.",
        409,
      );
    }

    if (inventory.qty_reserve < input.qty) {
      throw new AppError(
        "BUSINESS_RULE",
        "Insufficient reserve stock for this transfer.",
        409,
      );
    }

    if (inventory.qty_shelf + input.qty > SHELF_MAX_QTY) {
      throw new AppError(
        "BUSINESS_RULE",
        "Shelf capacity exceeded (max 10 per book).",
        409,
      );
    }

    const updatedInventory = await client.book_inventory.update({
      where: inventoryKey(userId, input.book_id),
      data: {
        qty_reserve: inventory.qty_reserve - input.qty,
        qty_shelf: inventory.qty_shelf + input.qty,
        ...(input.sale_price !== undefined
          ? { sale_price: input.sale_price }
          : {}),
        updated_at: new Date(),
      },
      select: inventoryPublicSelect,
    });

    await syncStockAlertsForBook(userId, input.book_id, client);

    return toStockPublic(book, updatedInventory);
  };

  if (tx === prisma) {
    return prisma.$transaction(run);
  }

  return run(tx);
}

/** Update only the player's sale price for a stocked book. */
export async function updateStockSalePrice(
  userId: number,
  body: unknown,
): Promise<StockPublic> {
  const input = validateUpdateSalePriceInput(body);

  return prisma.$transaction(async (tx) => {
    const book = await tx.books.findUnique({
      where: { id: input.book_id },
      select: bookStockSelect,
    });

    if (!book) {
      throw new AppError("NOT_FOUND", "Book not found.", 404);
    }

    const inventory = await updateInventorySalePrice(
      userId,
      input.book_id,
      input.sale_price,
      tx,
    );

    return toStockPublic(book, inventory);
  });
}

/** Decrement shelf stock for a simulated customer purchase. */
export async function decrementShelfStock(
  userId: number,
  bookId: number,
  qty: number,
  tx: TransactionClient,
): Promise<StockPublic> {
  const book = await tx.books.findUnique({
    where: { id: bookId },
    select: bookStockSelect,
  });

  const inventory = await tx.book_inventory.findUnique({
    where: inventoryKey(userId, bookId),
    select: inventoryPublicSelect,
  });

  if (!book || !book.is_active || !inventory || inventory.qty_shelf < qty) {
    throw new AppError(
      "BUSINESS_RULE",
      "Insufficient shelf stock for purchase.",
      409,
    );
  }

  const updatedInventory = await tx.book_inventory.update({
    where: inventoryKey(userId, bookId),
    data: {
      qty_shelf: inventory.qty_shelf - qty,
      updated_at: new Date(),
    },
    select: inventoryPublicSelect,
  });

  await syncStockAlertsForBook(userId, bookId, tx);

  return toStockPublic(book, updatedInventory);
}
