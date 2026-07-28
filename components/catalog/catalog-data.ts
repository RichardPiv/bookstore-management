import {
  BOOK_RARITY_LABELS_FR,
  isBookRarity,
  type BookRarity,
} from "@/lib/book-rarities";

export type { BookRarity };

export type CatalogBook = {
  id: string;
  loreCode: string;
  title: string;
  description: string;
  purchasePrice: number;
  rarity: BookRarity;
  category: string;
  imageUrl: string | null;
};

export type CatalogCategory = {
  id: string;
  name: string;
};

export const ALL_CATEGORY: CatalogCategory = {
  id: "all",
  name: "Tous",
};

export const rarityLabels: Record<
  BookRarity,
  { label: string; className: string }
> = {
  common: { label: BOOK_RARITY_LABELS_FR.common, className: "text-outline" },
  uncommon: {
    label: BOOK_RARITY_LABELS_FR.uncommon,
    className: "text-outline",
  },
  rare: {
    label: BOOK_RARITY_LABELS_FR.rare,
    className: "text-primary-fixed-dim",
  },
  legendary: {
    label: BOOK_RARITY_LABELS_FR.legendary,
    className: "text-primary",
  },
  mythic: { label: BOOK_RARITY_LABELS_FR.mythic, className: "text-primary" },
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

/** Mappe un livre API (snake_case) vers le modèle UI catalogue. */
export function mapApiBookToCatalogBook(raw: unknown): CatalogBook | null {
  if (!raw || typeof raw !== "object") return null;

  const book = raw as Record<string, unknown>;
  const id = book.id;
  const title = book.title;
  if (id === undefined || id === null || typeof title !== "string") {
    return null;
  }

  const category =
    book.category && typeof book.category === "object"
      ? (book.category as { name?: unknown }).name
      : undefined;

  const rarityRaw = book.rarity;
  const rarity: BookRarity = isBookRarity(rarityRaw) ? rarityRaw : "common";

  const coverUrl = book.cover_url;
  const loreCode = book.lore_code;

  return {
    id: String(id),
    loreCode: typeof loreCode === "string" ? loreCode : "",
    title,
    description: typeof book.summary === "string" ? book.summary : "",
    purchasePrice: toNumber(book.purchase_price),
    rarity,
    category: typeof category === "string" ? category : "",
    imageUrl: typeof coverUrl === "string" && coverUrl.length > 0 ? coverUrl : null,
  };
}

/** Mappe une catégorie API vers le modèle UI. */
export function mapApiCategoryToCatalogCategory(
  raw: unknown,
): CatalogCategory | null {
  if (!raw || typeof raw !== "object") return null;
  const category = raw as Record<string, unknown>;
  if (category.id === undefined || category.id === null) return null;
  if (typeof category.name !== "string") return null;
  return { id: String(category.id), name: category.name };
}
