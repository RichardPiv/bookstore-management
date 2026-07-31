import { AppError } from "@/lib/api/route-errors";
import { IN_PROGRESS_ORDER_STATUS_NAMES } from "@/lib/order-statuses";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  authorPublicSelect,
  type AuthorPublic,
} from "@/services/authors/types";
import {
  categoriesPublicSelect,
  type CategoryPublic,
} from "@/services/categories/types";
import {
  formatsPublicSelect,
  type FormatPublic,
} from "@/services/formats/types";
import {
  fetchInventoriesByBookIds,
  getInventoryByBookId,
  updateInventoryAlertThreshold,
} from "@/services/inventory/inventory-service";
import type { BookInventoryView } from "@/services/inventory/types";

import {
  BookPublic,
  bookPublicSelect,
  type CreateBookInput,
  type BookWithAuthors,
  type ListBooksOptions,
  type UpdateBookInput,
} from "./types";
import { validateCreateBookInput, validateUpdateBookInput } from "./validation";

type TransactionClient = Prisma.TransactionClient;

type BookStockSnapshot = {
  qty_reserve: number;
  qty_shelf: number;
};

type GeneratedCreateBookFields = {
  lore_code: string;
  cote: string;
};

function parseSequenceFromLoreCode(loreCode: string): number {
  const suffix = loreCode.split("-").pop() ?? "";
  const sequence = parseInt(suffix, 10);
  return Number.isFinite(sequence) ? sequence : 0;
}

async function generateCreateBookFields(
  _input: CreateBookInput,
  _tx: TransactionClient = prisma,
): Promise<GeneratedCreateBookFields> {
  const [category, format, categoryBooks] = await Promise.all([
    _tx.categories.findUnique({
      where: { id: _input.category_id },
      select: { id: true, code: true },
    }),
    _tx.formats.findUnique({
      where: { id: _input.format_id },
      select: { id: true, code: true },
    }),
    _tx.books.findMany({
      where: { category_id: _input.category_id },
      select: { lore_code: true },
    }),
  ]);

  if (!category) {
    throw new AppError("VALIDATION_ERROR", "Category not found.", 400);
  }

  if (!format) {
    throw new AppError("VALIDATION_ERROR", "Format not found.", 400);
  }

  const maxSequence = categoryBooks.reduce(
    (max, book) => Math.max(max, parseSequenceFromLoreCode(book.lore_code)),
    0,
  );
  const nextSequence = maxSequence + 1;
  const sequenceSuffix = nextSequence.toString().padStart(3, "0");

  return {
    lore_code: `${category.code}-${sequenceSuffix}`,
    cote: `${category.code}-${format.code}-${sequenceSuffix}`,
  };
}

async function assertNoPendingSupplierOrderForBook(
  bookId: number,
  tx: TransactionClient = prisma,
) {
  const lines = await tx.orders_lines.findMany({
    where: { book_id: bookId },
    select: { order_id: true },
  });

  if (lines.length === 0) {
    return;
  }

  const orderIds = [...new Set(lines.map((line) => line.order_id))];
  const inProgressStatuses = await tx.order_statuses.findMany({
    where: { name: { in: [...IN_PROGRESS_ORDER_STATUS_NAMES] } },
    select: { id: true },
  });

  if (inProgressStatuses.length === 0) {
    return;
  }

  const pendingOrder = await tx.orders.findFirst({
    where: {
      id: { in: orderIds },
      order_status_id: { in: inProgressStatuses.map((status) => status.id) },
    },
    select: { id: true },
  });

  if (pendingOrder) {
    throw new AppError(
      "BUSINESS_RULE",
      "Cannot deactivate a book with a pending supplier order.",
      409,
    );
  }
}

async function assertBookCanBeDeactivated(
  bookId: number,
  stock: BookStockSnapshot,
  tx: TransactionClient = prisma,
) {
  if (stock.qty_reserve > 0 || stock.qty_shelf > 0) {
    throw new AppError(
      "BUSINESS_RULE",
      "Cannot deactivate a book that still has stock.",
      409,
    );
  }

  await assertNoPendingSupplierOrderForBook(bookId, tx);
}

async function getStockSnapshotForBook(
  bookId: number,
  tx: TransactionClient = prisma,
): Promise<BookStockSnapshot> {
  const inventory = await getInventoryByBookId(bookId, tx);
  if (!inventory) {
    return { qty_reserve: 0, qty_shelf: 0 };
  }
  return {
    qty_reserve: inventory.qty_reserve,
    qty_shelf: inventory.qty_shelf,
  };
}

async function assertCategoryExists(
  categoryId: number,
  tx: TransactionClient = prisma,
) {
  const category = await tx.categories.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new AppError("VALIDATION_ERROR", "Category not found.", 400);
  }
}

async function assertFormatExists(
  formatId: number,
  tx: TransactionClient = prisma,
) {
  const format = await tx.formats.findUnique({
    where: { id: formatId },
    select: { id: true },
  });

  if (!format) {
    throw new AppError("VALIDATION_ERROR", "Format not found.", 400);
  }
}

async function assertAuthorsExist(
  authorIds: number[],
  tx: TransactionClient = prisma,
) {
  const uniqueIds = [...new Set(authorIds)];
  const authors = await tx.authors.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true },
  });

  if (authors.length !== uniqueIds.length) {
    throw new AppError(
      "VALIDATION_ERROR",
      "One or more authors do not exist.",
      400,
    );
  }
}

/** Convert the input to the data for the update operation. */
function toBookUpdateData(input: UpdateBookInput): Prisma.booksUpdateInput {
  const data: Prisma.booksUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.lore_code !== undefined) data.lore_code = input.lore_code;
  if (input.cote !== undefined) data.cote = input.cote;
  if (input.summary !== undefined) data.summary = input.summary;
  if (input.editor !== undefined) data.editor = input.editor;
  if (input.publication_date !== undefined) {
    data.publication_date = new Date(input.publication_date);
  }
  if (input.ean !== undefined) data.ean = input.ean;
  if (input.isbn !== undefined) data.isbn = input.isbn;
  if (input.purchase_price !== undefined) {
    data.purchase_price = input.purchase_price;
  }
  if (input.sale_price !== undefined) data.sale_price = input.sale_price;
  if (input.rarity !== undefined) data.rarity = input.rarity;
  if (input.cover_url !== undefined) data.cover_url = input.cover_url;
  if (input.category_id !== undefined) data.category_id = input.category_id;
  if (input.format_id !== undefined) data.format_id = input.format_id;
  if (input.series !== undefined) data.series = input.series;
  if (input.volume !== undefined) data.volume = input.volume;
  if (input.collection !== undefined) data.collection = input.collection;
  if (input.supplier_available !== undefined) {
    data.supplier_available = input.supplier_available;
  }
  if (input.is_active !== undefined) data.is_active = input.is_active;

  return data;
}

/** Fetch the authors by book ids. */
async function fetchAuthorsByBookIds(
  bookIds: number[],
  tx: TransactionClient = prisma,
): Promise<Map<number, AuthorPublic[]>> {
  const result = new Map<number, AuthorPublic[]>();

  if (bookIds.length === 0) {
    return result;
  }

  const links = await tx.books_authors.findMany({
    where: { book_id: { in: bookIds } },
    select: { book_id: true, author_id: true },
  });

  if (links.length === 0) {
    return result;
  }

  const authorIds = [...new Set(links.map((link) => link.author_id))];
  const authors = await tx.authors.findMany({
    where: { id: { in: authorIds } },
    select: authorPublicSelect,
  });

  const authorsById = new Map(authors.map((author) => [author.id, author]));

  for (const link of links) {
    const author = authorsById.get(link.author_id);
    if (!author) continue;

    const bookAuthors = result.get(link.book_id) ?? [];
    bookAuthors.push(author);
    result.set(link.book_id, bookAuthors);
  }

  for (const [bookId, bookAuthors] of result) {
    bookAuthors.sort((a, b) => a.name.localeCompare(b.name));
    result.set(bookId, bookAuthors);
  }

  return result;
}

/** Fetch the categories by book ids. */
async function fetchCategoriesByIds(
  categoryIds: number[],
  tx: TransactionClient = prisma,
): Promise<Map<number, CategoryPublic>> {
  if (categoryIds.length === 0) {
    return new Map();
  }

  const uniqueIds = [...new Set(categoryIds)];
  const categories = await tx.categories.findMany({
    where: { id: { in: uniqueIds } },
    select: categoriesPublicSelect,
  });

  return new Map(categories.map((category) => [category.id, category]));
}

async function fetchFormatsByIds(
  formatIds: number[],
  tx: TransactionClient = prisma,
): Promise<Map<number, FormatPublic>> {
  if (formatIds.length === 0) {
    return new Map();
  }

  const uniqueIds = [...new Set(formatIds)];
  const formats = await tx.formats.findMany({
    where: { id: { in: uniqueIds } },
    select: formatsPublicSelect,
  });

  return new Map(formats.map((format) => [format.id, format]));
}

/** Add the authors, category, format and inventory to the book. */
function withRelations(
  book: BookPublic,
  authorsByBookId: Map<number, AuthorPublic[]>,
  categoriesById: Map<number, CategoryPublic>,
  formatsById: Map<number, FormatPublic>,
  inventoriesByBookId: Map<number, BookInventoryView>,
): BookWithAuthors {
  return {
    ...book,
    authors: authorsByBookId.get(book.id) ?? [],
    category: categoriesById.get(book.category_id) ?? null,
    format: formatsById.get(book.format_id) ?? null,
    inventory: inventoriesByBookId.get(book.id) ?? null,
  };
}

/** Add the authors, category, format and inventory to the books. */
function withRelationsMany(
  books: BookPublic[],
  authorsByBookId: Map<number, AuthorPublic[]>,
  categoriesById: Map<number, CategoryPublic>,
  formatsById: Map<number, FormatPublic>,
  inventoriesByBookId: Map<number, BookInventoryView>,
): BookWithAuthors[] {
  return books.map((book) =>
    withRelations(
      book,
      authorsByBookId,
      categoriesById,
      formatsById,
      inventoriesByBookId,
    ),
  );
}

/** Enrich the books with their authors, category, format and inventory. */
async function enrichBooks(
  books: BookPublic[],
  tx: TransactionClient = prisma,
): Promise<BookWithAuthors[]> {
  const bookIds = books.map((book) => book.id);
  const [authorsByBookId, categoriesById, formatsById, inventoriesByBookId] =
    await Promise.all([
      fetchAuthorsByBookIds(bookIds, tx),
      fetchCategoriesByIds(
        books.map((book) => book.category_id),
        tx,
      ),
      fetchFormatsByIds(
        books.map((book) => book.format_id),
        tx,
      ),
      fetchInventoriesByBookIds(bookIds, tx),
    ]);

  return withRelationsMany(
    books,
    authorsByBookId,
    categoriesById,
    formatsById,
    inventoriesByBookId,
  );
}

/** Enrich the book with its authors, category, format and inventory. */
async function enrichBook(
  book: BookPublic,
  tx: TransactionClient = prisma,
): Promise<BookWithAuthors> {
  const [enriched] = await enrichBooks([book], tx);
  return enriched;
}

/** List books with their authors and category. */
export async function listBooks(
  options: ListBooksOptions = {},
): Promise<BookWithAuthors[]> {
  const books = await prisma.books.findMany({
    where:
      options.active !== undefined ? { is_active: options.active } : undefined,
    select: bookPublicSelect,
    orderBy: { title: "asc" },
  });

  return enrichBooks(books);
}

/** Get a book by id with its authors and category. */
export async function getBookById(id: number): Promise<BookWithAuthors | null> {
  const book = await prisma.books.findUnique({
    where: { id },
    select: bookPublicSelect,
  });

  if (!book) {
    return null;
  }

  return enrichBook(book);
}

/** Create a book. */
export async function createBook(body: unknown): Promise<BookWithAuthors> {
  const input = validateCreateBookInput(body);

  return prisma.$transaction(async (tx) => {
    await assertCategoryExists(input.category_id, tx);
    await assertFormatExists(input.format_id, tx);
    await assertAuthorsExist(input.author_ids, tx);
    const generatedFields = await generateCreateBookFields(input, tx);

    const book = await tx.books.create({
      data: {
        lore_code: generatedFields.lore_code,
        cote: generatedFields.cote,
        title: input.title,
        summary: input.summary,
        editor: input.editor,
        publication_date: new Date(input.publication_date),
        ean: input.ean,
        isbn: input.isbn,
        purchase_price: input.purchase_price,
        sale_price: input.sale_price,
        rarity: input.rarity,
        cover_url: input.cover_url,
        category_id: input.category_id,
        format_id: input.format_id,
        series: input.series,
        volume: input.volume,
        collection: input.collection,
        supplier_available: input.supplier_available,
        is_active: input.is_active,
      },
      select: bookPublicSelect,
    });

    await tx.books_authors.createMany({
      data: input.author_ids.map((author_id) => ({
        book_id: book.id,
        author_id,
      })),
    });

    return enrichBook(book, tx);
  });
}

/** Update a book. */
export async function updateBook(
  id: number,
  body: unknown,
): Promise<BookWithAuthors> {
  const input = validateUpdateBookInput(body);
  const data = toBookUpdateData(input);

  return prisma.$transaction(async (tx) => {
    const current = await tx.books.findUnique({
      where: { id },
      select: bookPublicSelect,
    });

    if (!current) {
      throw new AppError("NOT_FOUND", "Book not found.", 404);
    }

    if (input.category_id !== undefined) {
      await assertCategoryExists(input.category_id, tx);
    }

    if (input.format_id !== undefined) {
      await assertFormatExists(input.format_id, tx);
    }

    if (input.author_ids !== undefined) {
      await assertAuthorsExist(input.author_ids, tx);
    }

    if (input.is_active === false) {
      const stock = await getStockSnapshotForBook(id, tx);
      await assertBookCanBeDeactivated(id, stock, tx);
    }

    if (input.alert_threshold !== undefined) {
      await updateInventoryAlertThreshold(id, input.alert_threshold, tx);
    }

    const book = await tx.books.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
      select: bookPublicSelect,
    });

    if (input.author_ids !== undefined) {
      await tx.books_authors.deleteMany({
        where: { book_id: id },
      });

      await tx.books_authors.createMany({
        data: input.author_ids.map((author_id) => ({
          book_id: id,
          author_id,
        })),
      });
    }

    return enrichBook(book, tx);
  });
}

/** Soft-delete a book (is_active = false). */
export async function deleteBook(id: number): Promise<BookWithAuthors> {
  return prisma.$transaction(async (tx) => {
    const book = await tx.books.findUnique({
      where: { id },
      select: bookPublicSelect,
    });

    if (!book) {
      throw new AppError("NOT_FOUND", "Book not found.", 404);
    }

    if (!book.is_active) {
      throw new AppError("BUSINESS_RULE", "Book is already inactive.", 409);
    }

    const stock = await getStockSnapshotForBook(id, tx);
    await assertBookCanBeDeactivated(id, stock, tx);

    const deactivated = await tx.books.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
      select: bookPublicSelect,
    });

    return enrichBook(deactivated, tx);
  });
}
