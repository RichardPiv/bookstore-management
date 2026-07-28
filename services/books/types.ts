import { Prisma } from "@/lib/generated/prisma/client";

import type { AuthorPublic } from "@/services/authors/types";
import type { CategoryPublic } from "@/services/categories/types";
import type { FormatPublic } from "@/services/formats/types";

/**
 * Select fields for public books
 */
export const bookPublicSelect = {
  id: true,
  lore_code: true,
  cote: true,
  title: true,
  summary: true,
  editor: true,
  publication_date: true,
  ean: true,
  isbn: true,
  purchase_price: true,
  sale_price: true,
  rarity: true,
  cover_url: true,
  category_id: true,
  format_id: true,
  series: true,
  volume: true,
  collection: true,
  supplier_available: true,
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
  format: FormatPublic | null;
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
  purchase_price: Prisma.Decimal;
  sale_price: Prisma.Decimal;
  rarity: string;
  cover_url: string | null;
  category_id: number;
  format_id: number;
  series: string | null;
  volume: number | null;
  collection: string | null;
  supplier_available: boolean;
  alert_threshold: number;
  is_active: boolean;
  author_ids: number[];
};

/**
 * Update book input type
 */
export type UpdateBookInput = {
  lore_code?: string;
  cote?: string;
  title?: string;
  summary?: string;
  editor?: string;
  publication_date?: string;
  ean?: string;
  isbn?: string;
  purchase_price?: Prisma.Decimal;
  sale_price?: Prisma.Decimal;
  rarity?: string;
  cover_url?: string | null;
  category_id?: number;
  format_id?: number;
  series?: string | null;
  volume?: number | null;
  collection?: string | null;
  supplier_available?: boolean;
  alert_threshold?: number;
  is_active?: boolean;
  author_ids?: number[];
};
