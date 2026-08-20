import { AppError } from "@/lib/api/route-errors";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

import {
  inventoryPublicSelect,
  type InventoryPublic,
} from "@/services/inventory/types";
import { syncStockAlertsForBook } from "@/services/alerts/stock-alerts-sync";

import type { StockPublic } from "./types";
import { validateTransferToShelfInput } from "./validation";

const SHELF_MAX_QTY = 10;

type TransactionClient = Prisma.TransactionClient;

function toStockPublic(
  book: {
    id: number;
    title: string;
    purchase_price: Prisma.Decimal;
    sale_price: Prisma.Decimal;
    is_active: boolean;
  },
  inventory: InventoryPublic,
): StockPublic {
  return {
    id: book.id,
    book_id: book.id,
    title: book.title,
    purchase_price: book.purchase_price,
    sale_price: book.sale_price,
    is_active: book.is_active,
    qty_reserve: inventory.qty_reserve,
    qty_shelf: inventory.qty_shelf,
    alert_threshold: inventory.alert_threshold,
    first_received_at: inventory.first_received_at,
    updated_at: inventory.updated_at,
  };
}

/** List stock levels for books already in the library. */
export async function listStocks(): Promise<StockPublic[]> {
  const inventories = await prisma.book_inventory.findMany({
    select: inventoryPublicSelect,
    orderBy: { book_id: "asc" },
  });

  if (inventories.length === 0) {
    return [];
  }

  const books = await prisma.books.findMany({
    where: { id: { in: inventories.map((row) => row.book_id) } },
    select: {
      id: true,
      title: true,
      purchase_price: true,
      sale_price: true,
      is_active: true,
    },
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

/** Get stock levels for one book (null if not in library inventory). */
export async function getStockByBookId(
  bookId: number,
): Promise<StockPublic | null> {
  const [book, inventory] = await Promise.all([
    prisma.books.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        purchase_price: true,
        sale_price: true,
        is_active: true,
      },
    }),
    prisma.book_inventory.findUnique({
      where: { book_id: bookId },
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
  body: unknown,
  tx: TransactionClient = prisma,
): Promise<StockPublic> {
  const input = validateTransferToShelfInput(body);

  const run = async (client: TransactionClient) => {
    const book = await client.books.findUnique({
      where: { id: input.book_id },
      select: {
        id: true,
        title: true,
        purchase_price: true,
        sale_price: true,
        is_active: true,
      },
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
      where: { book_id: input.book_id },
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

    const [updatedInventory] = await Promise.all([
      client.book_inventory.update({
        where: { book_id: input.book_id },
        data: {
          qty_reserve: inventory.qty_reserve - input.qty,
          qty_shelf: inventory.qty_shelf + input.qty,
          updated_at: new Date(),
        },
        select: inventoryPublicSelect,
      }),
      input.sale_price !== undefined
        ? client.books.update({
            where: { id: input.book_id },
            data: {
              sale_price: input.sale_price,
              updated_at: new Date(),
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    const refreshedBook =
      input.sale_price !== undefined
        ? await client.books.findUniqueOrThrow({
            where: { id: input.book_id },
            select: {
              id: true,
              title: true,
              purchase_price: true,
              sale_price: true,
              is_active: true,
            },
          })
        : book;

    await syncStockAlertsForBook(input.book_id, client);

    return toStockPublic(refreshedBook, updatedInventory);
  };

  if (tx === prisma) {
    return prisma.$transaction(run);
  }

  return run(tx);
}

/** Decrement shelf stock for a simulated customer purchase. */
export async function decrementShelfStock(
  bookId: number,
  qty: number,
  tx: TransactionClient,
): Promise<StockPublic> {
  const book = await tx.books.findUnique({
    where: { id: bookId },
    select: {
      id: true,
      title: true,
      purchase_price: true,
      sale_price: true,
      is_active: true,
    },
  });

  const inventory = await tx.book_inventory.findUnique({
    where: { book_id: bookId },
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
    where: { book_id: bookId },
    data: {
      qty_shelf: inventory.qty_shelf - qty,
      updated_at: new Date(),
    },
    select: inventoryPublicSelect,
  });

  await syncStockAlertsForBook(bookId, tx);

  return toStockPublic(book, updatedInventory);
}
