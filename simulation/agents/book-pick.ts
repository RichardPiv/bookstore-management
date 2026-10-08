import { shelfLocationFromCategoryCode, SHELF_CATEGORIES } from "../categories";
import { categoryCodeToShelf } from "../map";
import { pickWeighted } from "../rng";
import type { VisitorAgent, WorldBook } from "../types";

export function shelfForBook(
  books: WorldBook[],
  bookId: number,
): string {
  const book = books.find((row) => row.book_id === bookId);
  if (!book) return shelfLocationFromCategoryCode("HIS");
  return categoryCodeToShelf(book.category_code);
}

export function bookUtility(book: WorldBook, visitor: VisitorAgent): number {
  let score = 2;
  const shelf = categoryCodeToShelf(book.category_code);
  if (shelf === visitor.shelf_code) score += 4;

  const catName =
    SHELF_CATEGORIES.find(
      (row) => row.code === book.category_code.trim().toUpperCase(),
    )?.name ?? "";
  const prefs = visitor.preferred_categories ?? [];
  for (const pref of prefs) {
    const prefLower = pref.toLowerCase();
    if (
      catName.toLowerCase().includes(prefLower.slice(0, 5)) ||
      prefLower.includes(catName.toLowerCase().slice(0, 5))
    ) {
      score += 6;
      break;
    }
  }

  const rarity = book.rarity.toLowerCase();
  const pref = (visitor.rarity_preference ?? "common").toLowerCase();
  if (rarity === "legendary" || rarity === "mythic") {
    score *= pref === "rare" ? 0.55 : 0.08;
  } else if (rarity === "rare" || rarity === "uncommon") {
    if (pref === "rare") score += 4;
    else if (pref === "common") score *= 0.55;
    else score += 1;
  } else if (pref === "common") {
    score += 3;
  } else if (pref === "rare") {
    score *= 0.7;
  } else {
    score += 1;
  }

  score += Math.min(3, Math.log2(1 + book.qty_shelf));

  const price = Number.parseFloat(book.sale_price);
  if (Number.isFinite(price)) {
    if (price < 12) score += 1.5;
    else if (price > 40) score *= 0.75;
  }

  return score;
}

export function pickBookForVisitor(
  books: WorldBook[],
  visitor: VisitorAgent,
  rng: () => number,
  opts?: { anyShelf?: boolean; boostAdvice?: number },
): WorldBook | null {
  const shelfCode = opts?.anyShelf ? null : visitor.shelf_code;
  const eligible = books.filter((book) => {
    if (book.qty_shelf <= 0) return false;
    if (!shelfCode) return true;
    return categoryCodeToShelf(book.category_code) === shelfCode;
  });
  if (eligible.length === 0) return null;

  const adviceBoost = (opts?.boostAdvice ?? 0) / 100;
  return pickWeighted(
    eligible,
    (book) =>
      Math.max(0.05, bookUtility(book, visitor) * (1 + adviceBoost * 0.5)),
    rng,
  );
}
