/**
 * Commercial book rarities (taxonomie v1.2).
 * `sealed` is out of commerce — not stored on sellable books.
 */
export const BOOK_RARITIES = [
  "common",
  "uncommon",
  "rare",
  "legendary",
  "mythic",
] as const;

export type BookRarity = (typeof BOOK_RARITIES)[number];

export const BOOK_RARITY_LABELS_FR: Record<BookRarity, string> = {
  common: "Commun",
  uncommon: "Peu commun",
  rare: "Rare",
  legendary: "Légendaire",
  mythic: "Mythique",
};

export function isBookRarity(value: unknown): value is BookRarity {
  return (
    typeof value === "string" &&
    (BOOK_RARITIES as readonly string[]).includes(value)
  );
}
