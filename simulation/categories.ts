/** 27 catégories commerciales (taxonomie v1.2) — un rayon chacune. */
export const SHELF_CATEGORIES = [
  { code: "ARC", name: "Arcane" },
  { code: "RIT", name: "Rituels" },
  { code: "INV", name: "Invocation" },
  { code: "ILL", name: "Illusions" },
  { code: "DST", name: "Destruction" },
  { code: "MAL", name: "Malédictions" },
  { code: "SAC", name: "Sacré" },
  { code: "GUE", name: "Guérison" },
  { code: "NEC", name: "Nécromancie" },
  { code: "ENC", name: "Enchantements" },
  { code: "DAS", name: "Divination & Astronomie" },
  { code: "ALC", name: "Alchimie" },
  { code: "MMT", name: "Minéraux & Métaux" },
  { code: "BOT", name: "Botanique & Agriculture" },
  { code: "FAM", name: "Faune & Monstres" },
  { code: "GUR", name: "Guerre" },
  { code: "ARM", name: "Armes et Armures" },
  { code: "MED", name: "Médecine" },
  { code: "DOV", name: "Donjons & Voyages" },
  { code: "HIS", name: "Histoire" },
  { code: "CMD", name: "Commerce & Droit" },
  { code: "MET", name: "Métiers" },
  { code: "AMU", name: "Arts & Musique" },
  { code: "LAS", name: "Langues & Sociologie" },
  { code: "PHP", name: "Philosophie & Psychologie" },
  { code: "ROM", name: "Romans" },
  { code: "GAS", name: "Gastronomie" },
] as const;

export type ShelfCategoryCode = (typeof SHELF_CATEGORIES)[number]["code"];

export function shelfLocationCode(categoryCode: string): string {
  return `shelf_${categoryCode.trim().toLowerCase()}`;
}

const BY_CODE = new Map<string, (typeof SHELF_CATEGORIES)[number]>(
  SHELF_CATEGORIES.map((row) => [row.code, row]),
);

const BY_NAME = new Map(
  SHELF_CATEGORIES.map((row) => [row.name.toLowerCase(), row]),
);

export function shelfLocationFromCategoryCode(code: string): string {
  const c = code.trim().toUpperCase();
  if (BY_CODE.has(c)) {
    return shelfLocationCode(c);
  }
  return shelfLocationCode("HIS");
}

export function shelfLocationFromCategoryName(label: string): string {
  const normalized = label.trim().toLowerCase();
  const exact = BY_NAME.get(normalized);
  if (exact) {
    return shelfLocationCode(exact.code);
  }
  const partial = SHELF_CATEGORIES.find(
    (row) =>
      normalized.startsWith(row.name.toLowerCase().slice(0, 5)) ||
      row.name.toLowerCase().startsWith(normalized.slice(0, 5)),
  );
  if (partial) {
    return shelfLocationCode(partial.code);
  }
  return shelfLocationCode("HIS");
}
