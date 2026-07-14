import { Prisma } from "@/lib/generated/prisma/client";

import type { AuthorPublic } from "@/services/authors/types";
import type { CategoryPublic } from "@/services/categories/types";

/**
 * Select fields for public books
 */
export const bookPublicSelect = {
  id: true,
  title: true,
  summary: true,
  editor: true,
  publication_date: true,
  ean: true,
  isbn: true,
  price: true,
  category_id: true,
  qty_reserve: true,
  qty_shelf: true,
  alert_threshold: true,
  is_active: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.booksSelect;

/**
 * Public books type
 */
export type BookPublic = Prisma.booksGetPayload<{
  select: typeof bookPublicSelect;
}>;

/** Book with linked authors and category for API responses. */
export type BookWithAuthors = BookPublic & {
  authors: AuthorPublic[];
  category: CategoryPublic | null;
};

export type ListBooksOptions = {
  active?: boolean;
};

/**
 * Create book input type
 */
export type CreateBookInput = {
  title: string;
  summary: string;
  editor: string;
  publication_date: string;
  ean: string;
  isbn: string;
  price: Prisma.Decimal;
  category_id: number;
  qty_reserve: number;
  qty_shelf: number;
  alert_threshold: number;
  is_active: boolean;
  author_ids: number[];
};

/**
 * Update book input type
 */
export type UpdateBookInput = {
  title?: string;
  summary?: string;
  editor?: string;
  publication_date?: string;
  ean?: string;
  isbn?: string;
  price?: Prisma.Decimal;
  category_id?: number;
  alert_threshold?: number;
  is_active?: boolean;
  author_ids?: number[];
};
