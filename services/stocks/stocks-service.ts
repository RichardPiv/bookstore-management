import { AppError } from "@/lib/api/route-errors";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

import { stockPublicSelect, type StockPublic } from "./types";
import { validateTransferToShelfInput } from "./validation";

const SHELF_MAX_QTY = 10;

type TransactionClient = Prisma.TransactionClient;

/** List stock levels for all books. */
export async function listStocks(): Promise<StockPublic[]> {
  return prisma.books.findMany({
    select: stockPublicSelect,
    orderBy: { title: "asc" },
  });
}

/** Get stock levels for one book. */
export async function getStockByBookId(
  bookId: number,
): Promise<StockPublic | null> {
  return prisma.books.findUnique({
    where: { id: bookId },
    select: stockPublicSelect,
  });
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
      select: stockPublicSelect,
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

    if (book.qty_reserve < input.qty) {
      throw new AppError(
        "BUSINESS_RULE",
        "Insufficient reserve stock for this transfer.",
        409,
      );
    }

    if (book.qty_shelf + input.qty > SHELF_MAX_QTY) {
      throw new AppError(
        "BUSINESS_RULE",
        "Shelf capacity exceeded (max 10 per book).",
        409,
      );
    }

    return client.books.update({
      where: { id: input.book_id },
      data: {
        qty_reserve: book.qty_reserve - input.qty,
        qty_shelf: book.qty_shelf + input.qty,
        updated_at: new Date(),
      },
      select: stockPublicSelect,
    });
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
    select: stockPublicSelect,
  });

  if (!book || !book.is_active || book.qty_shelf < qty) {
    throw new AppError(
      "BUSINESS_RULE",
      "Insufficient shelf stock for purchase.",
      409,
    );
  }

  return tx.books.update({
    where: { id: bookId },
    data: {
      qty_shelf: book.qty_shelf - qty,
      updated_at: new Date(),
    },
    select: stockPublicSelect,
  });
}
