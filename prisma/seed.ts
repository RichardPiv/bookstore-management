/**
 * Seed référentiels + catalogue lore v1.2 :
 * - 27 catégories commerciales
 * - auteurs (auteurs.json + auteurs rencontrés dans le catalogue)
 * - 1 fournisseur MVP
 * - order_statuses / delivery_statuses / alert_statuses / alert_types
 * - ~671 livres (JSON catalogue → books + books_authors)
 *
 * Champs générés (déterministes via lore_code) : ean, isbn, publication_date
 * editor ← collection lore (fallback maison Port-Aster)
 * purchase_price ← price lore ; sale_price = purchase_price par défaut (modifiable ensuite)
 *
 * Usage : npm run db:seed
 * Idempotent : skip référentiels existants (name unique) ;
 * livres : upsert sur lore_code (ean/isbn conservés si déjà présents).
 */
import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Prisma, PrismaClient } from "../lib/generated/prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const loreRoot = join(__dirname, "..", "..", "Lore & univers");
const catalogueDir = join(loreRoot, "Catalogue de Grimoires", "catalogue");

const CATEGORIES = [
  { name: "Arcane", code: "ARC" },
  { name: "Rituels", code: "RIT" },
  { name: "Invocation", code: "INV" },
  { name: "Illusions", code: "ILL" },
  { name: "Destruction", code: "DST" },
  { name: "Malédictions", code: "MAL" },
  { name: "Sacré", code: "SAC" },
  { name: "Guérison", code: "GUE" },
  { name: "Nécromancie", code: "NEC" },
  { name: "Enchantements", code: "ENC" },
  { name: "Divination & Astronomie", code: "DAS" },
  { name: "Alchimie", code: "ALC" },
  { name: "Minéraux & Métaux", code: "MMT" },
  { name: "Botanique & Agriculture", code: "BOT" },
  { name: "Faune & Monstres", code: "FAM" },
  { name: "Guerre", code: "GUR" },
  { name: "Armes et Armures", code: "ARM" },
  { name: "Médecine", code: "MED" },
  { name: "Donjons & Voyages", code: "DOV" },
  { name: "Histoire", code: "HIS" },
  { name: "Commerce & Droit", code: "CMD" },
  { name: "Métiers", code: "MET" },
  { name: "Arts & Musique", code: "AMU" },
  { name: "Langues & Sociologie", code: "LAS" },
  { name: "Philosophie & Psychologie", code: "PHP" },
  { name: "Romans", code: "ROM" },
  { name: "Gastronomie", code: "GAS" },
] as const;

const FORMATS = [
  { name: "Non renseigné", code: "NRG" },
  { name: "album", code: "ALB" },
  { name: "archive", code: "ARC" },
  { name: "archive reliée", code: "ARL" },
  { name: "archive scellée partielle", code: "ASP" },
  { name: "atlas", code: "ATL" },
  { name: "atlas illustré", code: "ATI" },
  { name: "bestiaire", code: "BST" },
  { name: "carnet", code: "CAR" },
  { name: "catalogue", code: "CAT" },
  { name: "chronique", code: "CHR" },
  { name: "codex", code: "CDX" },
  { name: "cours relié", code: "COR" },
  { name: "essai", code: "ESS" },
  { name: "grand atlas illustré", code: "GAI" },
  { name: "grand codex", code: "GCD" },
  { name: "grand herbier", code: "GHB" },
  { name: "grand registre", code: "GRS" },
  { name: "guide", code: "GUI" },
  { name: "herbier", code: "HER" },
  { name: "inventaire", code: "INV" },
  { name: "journal", code: "JNL" },
  { name: "lexique", code: "LEX" },
  { name: "livret", code: "LVT" },
  { name: "manuel", code: "MNL" },
  { name: "manuel illustré", code: "MNI" },
  { name: "manuscrit", code: "MSC" },
  { name: "manuscrit interdit", code: "MSI" },
  { name: "ouvrage illustré", code: "OUI" },
  { name: "partition", code: "PAR" },
  { name: "recettes", code: "REC" },
  { name: "recueil", code: "RCU" },
  { name: "recueil rare", code: "RCR" },
  { name: "registre", code: "REG" },
  { name: "roman", code: "ROM" },
  { name: "traité", code: "TRT" },
  { name: "traité avancé", code: "TRA" },
] as const;

const SUPPLIER_NAME = "Dépôt Central des Copistes de Port-Aster";
const DEFAULT_EDITOR = "Dépôt Central des Copistes de Port-Aster";

/** Alignés sur lib/order-statuses.ts + insomnia-tests. */
const ORDER_STATUSES = ["pending", "received"] as const;
/** Alignés sur lib/delivery-statuses.ts + insomnia-tests. */
const DELIVERY_STATUSES = ["pending", "delivered"] as const;
/** Alignés sur lib/alert-references.ts + insomnia-tests. */
const ALERT_STATUSES = ["active", "resolved"] as const;
const ALERT_TYPES = ["rupture_rayon", "stock_rayon_bas"] as const;

const COMMERCIAL_RARITIES = new Set([
  "common",
  "uncommon",
  "rare",
  "legendary",
  "mythic",
]);

type LoreAuthorFile = { name: string };

type LoreBook = {
  id: string;
  title: string;
  description: string;
  price: number;
  rarity: string;
  category: string;
  author: string;
  collection?: string | null;
  series?: string | null;
  volume?: number | null;
  cote?: string | null;
  format?: string | null;
  copy_cycle?: string | null;
  supplier_available?: boolean;
};

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not defined.");
  }
  return new PrismaClient({ adapter: new PrismaMariaDb(url) });
}

function stableHash(input: string, seed = 0): number {
  let hash = 2166136261 ^ seed;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function digitsFromHash(key: string, length: number, salt: number): string {
  let h = stableHash(key, salt);
  let out = "";
  while (out.length < length) {
    out += String(h % 10);
    h = Math.imul(h ^ (h >>> 16), 2246822507) >>> 0;
  }
  return out.slice(0, length);
}

/** ISBN-13 / EAN-13 check digit on first 12 digits. */
function checkDigit13(body12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    const d = Number(body12[i]);
    sum += i % 2 === 0 ? d : d * 3;
  }
  return String((10 - (sum % 10)) % 10);
}

function eanFromLoreCode(loreCode: string): string {
  const body = `978${digitsFromHash(loreCode, 9, 1)}`;
  return body + checkDigit13(body);
}

function isbnFromLoreCode(loreCode: string): string {
  const body = `979${digitsFromHash(loreCode, 9, 2)}`;
  return body + checkDigit13(body);
}

function publicationDateFromCycle(copyCycle: string | null | undefined): Date {
  const match = (copyCycle ?? "Cycle 08").match(/Cycle\s*0*(\d+)/i);
  const n = match?.[1] ? Number.parseInt(match[1], 10) : 8;
  const year = 1950 + n * 5;
  const month = ((n * 3) % 12) + 1;
  const day = ((n * 7) % 27) + 1;
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return new Date(`${year}-${mm}-${dd}`);
}

function loadAuthorNamesFromAnnex(): string[] {
  const path = join(
    loreRoot,
    "Catalogue de Grimoires",
    "annexes",
    "auteurs.json",
  );
  const raw = readFileSync(path, "utf-8");
  const authors = JSON.parse(raw) as LoreAuthorFile[];
  return authors.map((a) => a.name.trim()).filter(Boolean);
}

function loadCatalogueBooks(): LoreBook[] {
  const files = readdirSync(catalogueDir).filter((f) => f.endsWith(".json"));
  const books: LoreBook[] = [];
  for (const file of files) {
    const raw = readFileSync(join(catalogueDir, file), "utf-8");
    const entries = JSON.parse(raw) as LoreBook[];
    if (!Array.isArray(entries)) {
      throw new Error(`Catalogue invalide (attendu: tableau) : ${file}`);
    }
    books.push(...entries);
  }
  return books;
}

async function seedCategories(prisma: PrismaClient) {
  let created = 0;
  for (const category of CATEGORIES) {
    const existing = await prisma.categories.findUnique({
      where: { name: category.name },
    });
    if (existing) {
      if (existing.code !== category.code) {
        await prisma.categories.update({
          where: { id: existing.id },
          data: { code: category.code },
        });
      }
      continue;
    }
    await prisma.categories.create({ data: category });
    created += 1;
  }
  console.log(`categories: ${created} créées / ${CATEGORIES.length} cibles`);
}

async function seedFormats(prisma: PrismaClient) {
  let created = 0;
  for (const format of FORMATS) {
    const existing = await prisma.formats.findUnique({
      where: { name: format.name },
    });
    if (existing) {
      if (existing.code !== format.code) {
        await prisma.formats.update({
          where: { id: existing.id },
          data: { code: format.code },
        });
      }
      continue;
    }
    await prisma.formats.create({ data: format });
    created += 1;
  }
  console.log(`formats: ${created} créés / ${FORMATS.length} cibles`);
}

async function ensureAuthor(
  prisma: PrismaClient,
  name: string,
  cache: Map<string, number>,
): Promise<number> {
  const key = name.trim();
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const existing = await prisma.authors.findFirst({ where: { name: key } });
  if (existing) {
    cache.set(key, existing.id);
    return existing.id;
  }

  const created = await prisma.authors.create({ data: { name: key } });
  cache.set(key, created.id);
  return created.id;
}

async function seedAuthors(
  prisma: PrismaClient,
  extraNames: string[],
): Promise<Map<string, number>> {
  const names = [...new Set([...loadAuthorNamesFromAnnex(), ...extraNames])];
  const cache = new Map<string, number>();
  let created = 0;

  for (const name of names) {
    const existing = await prisma.authors.findFirst({ where: { name } });
    if (existing) {
      cache.set(name, existing.id);
      continue;
    }
    const row = await prisma.authors.create({ data: { name } });
    cache.set(name, row.id);
    created += 1;
  }

  console.log(`authors: ${created} créés / ${names.length} noms uniques`);
  return cache;
}

async function seedSupplier(prisma: PrismaClient) {
  const existing = await prisma.suppliers.findUnique({
    where: { name: SUPPLIER_NAME },
  });
  if (existing) {
    console.log(`suppliers: déjà présent — ${SUPPLIER_NAME}`);
    return;
  }
  await prisma.suppliers.create({ data: { name: SUPPLIER_NAME } });
  console.log(`suppliers: 1 créé — ${SUPPLIER_NAME}`);
}

async function seedNamedTable(
  label: string,
  names: readonly string[],
  findUnique: (name: string) => Promise<{ id: number } | null>,
  create: (name: string) => Promise<unknown>,
) {
  let created = 0;
  for (const name of names) {
    const existing = await findUnique(name);
    if (existing) continue;
    await create(name);
    created += 1;
  }
  console.log(`${label}: ${created} créés / ${names.length} cibles`);
}

async function seedReferenceStatuses(prisma: PrismaClient) {
  await seedNamedTable(
    "order_statuses",
    ORDER_STATUSES,
    (name) => prisma.order_statuses.findUnique({ where: { name } }),
    (name) => prisma.order_statuses.create({ data: { name } }),
  );
  await seedNamedTable(
    "delivery_statuses",
    DELIVERY_STATUSES,
    (name) => prisma.delivery_statuses.findUnique({ where: { name } }),
    (name) => prisma.delivery_statuses.create({ data: { name } }),
  );
  await seedNamedTable(
    "alert_statuses",
    ALERT_STATUSES,
    (name) => prisma.alert_statuses.findUnique({ where: { name } }),
    (name) => prisma.alert_statuses.create({ data: { name } }),
  );
  await seedNamedTable(
    "alert_types",
    ALERT_TYPES,
    (name) => prisma.alert_types.findUnique({ where: { name } }),
    (name) => prisma.alert_types.create({ data: { name } }),
  );
}

async function seedBooks(
  prisma: PrismaClient,
  authorCache: Map<string, number>,
) {
  const loreBooks = loadCatalogueBooks();
  const categories = await prisma.categories.findMany();
  const categoryByName = new Map(categories.map((c) => [c.name, c.id]));
  const formats = await prisma.formats.findMany();
  const formatByName = new Map(formats.map((f) => [f.name, f.id]));
  const fallbackFormatId = formatByName.get("Non renseigné");

  if (!fallbackFormatId) {
    throw new Error('Format de secours introuvable: "Non renseigné".');
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  const usedEan = new Set<string>();
  const usedIsbn = new Set<string>();
  const usedCote = new Set<string>();

  for (const book of loreBooks) {
    const loreCode = book.id?.trim().toUpperCase();
    if (!loreCode) {
      errors.push(`Livre sans id: ${book.title}`);
      skipped += 1;
      continue;
    }

    const categoryId = categoryByName.get(book.category);
    if (!categoryId) {
      errors.push(`${loreCode}: catégorie inconnue « ${book.category} »`);
      skipped += 1;
      continue;
    }

    if (!COMMERCIAL_RARITIES.has(book.rarity)) {
      errors.push(`${loreCode}: rareté invalide « ${book.rarity} »`);
      skipped += 1;
      continue;
    }

    const authorName = (book.author ?? "Auteur inconnu").trim() || "Auteur inconnu";
    const authorId = await ensureAuthor(prisma, authorName, authorCache);

    const series =
      book.series === undefined || book.series === null || book.series === ""
        ? null
        : book.series;
    const volume =
      book.volume === undefined || book.volume === null ? null : book.volume;
    if ((series === null) !== (volume === null)) {
      errors.push(`${loreCode}: series/volume incohérents`);
      skipped += 1;
      continue;
    }

    const coteRaw = book.cote?.trim().toUpperCase() || null;
    if (!coteRaw) {
      errors.push(`${loreCode}: cote manquante`);
      skipped += 1;
      continue;
    }
    if (usedCote.has(coteRaw)) {
      errors.push(`${loreCode}: cote dupliquée ${coteRaw}`);
      skipped += 1;
      continue;
    }

    const editor =
      (book.collection && book.collection.trim()) || DEFAULT_EDITOR;
    const summary = (book.description ?? "").trim() || book.title;
    const publicationDate = publicationDateFromCycle(book.copy_cycle);
    const purchasePrice = new Prisma.Decimal(Number(book.price));
    const formatName = book.format?.trim() || "Non renseigné";
    const formatId = formatByName.get(formatName);
    if (!formatId) {
      errors.push(`${loreCode}: format inconnu « ${formatName} »`);
      skipped += 1;
      continue;
    }
    const collection =
      book.collection === undefined ||
      book.collection === null ||
      book.collection === ""
        ? null
        : book.collection.trim();
    const supplierAvailable = book.supplier_available !== false;

    const existing = await prisma.books.findUnique({
      where: { lore_code: loreCode },
    });

    if (existing) {
      await prisma.books.update({
        where: { id: existing.id },
        data: {
          cote: coteRaw,
          title: book.title,
          summary,
          editor,
          publication_date: publicationDate,
          purchase_price: purchasePrice,
          rarity: book.rarity,
          category_id: categoryId,
          format_id: formatId,
          series,
          volume,
          collection,
          supplier_available: supplierAvailable,
          updated_at: new Date(),
        },
      });

      await prisma.books_authors.deleteMany({ where: { book_id: existing.id } });
      await prisma.books_authors.create({
        data: { book_id: existing.id, author_id: authorId },
      });

      usedCote.add(coteRaw);
      if (existing.ean) usedEan.add(existing.ean);
      if (existing.isbn) usedIsbn.add(existing.isbn);
      updated += 1;
      continue;
    }

    let ean = eanFromLoreCode(loreCode);
    let isbn = isbnFromLoreCode(loreCode);
    // Collision safety (extremely unlikely)
    let guard = 0;
    while (usedEan.has(ean) && guard < 20) {
      ean = eanFromLoreCode(`${loreCode}:e${guard}`);
      guard += 1;
    }
    guard = 0;
    while ((usedIsbn.has(isbn) || isbn === ean) && guard < 20) {
      isbn = isbnFromLoreCode(`${loreCode}:i${guard}`);
      guard += 1;
    }

    // DB unique: also check existing ean/isbn from other books
    const eanClash = await prisma.books.findFirst({ where: { ean } });
    const isbnClash = await prisma.books.findFirst({ where: { isbn } });
    if (eanClash || isbnClash) {
      ean = eanFromLoreCode(`${loreCode}:retry`);
      isbn = isbnFromLoreCode(`${loreCode}:retry`);
    }

    const coteClash = await prisma.books.findFirst({
      where: { cote: coteRaw },
    });
    if (coteClash) {
      errors.push(`${loreCode}: cote déjà en base ${coteRaw}`);
      skipped += 1;
      continue;
    }

    const createdBook = await prisma.books.create({
      data: {
        lore_code: loreCode,
        cote: coteRaw,
        title: book.title,
        summary,
        editor,
        publication_date: publicationDate,
        ean,
        isbn,
        purchase_price: purchasePrice,
        sale_price: purchasePrice,
        rarity: book.rarity,
        cover_url: null,
        category_id: categoryId,
        format_id: formatId ?? fallbackFormatId,
        series,
        volume,
        collection,
        supplier_available: supplierAvailable,
        qty_reserve: 0,
        qty_shelf: 0,
        alert_threshold: 2,
        is_active: true,
      },
    });

    await prisma.books_authors.create({
      data: { book_id: createdBook.id, author_id: authorId },
    });

    usedEan.add(ean);
    usedIsbn.add(isbn);
    usedCote.add(coteRaw);
    created += 1;
  }

  console.log(
    `books: ${created} créés, ${updated} mis à jour, ${skipped} ignorés / ${loreBooks.length} lore`,
  );
  if (errors.length > 0) {
    console.warn(`books warnings (${errors.length}):`);
    for (const err of errors.slice(0, 20)) {
      console.warn(`  - ${err}`);
    }
    if (errors.length > 20) {
      console.warn(`  … +${errors.length - 20} autres`);
    }
  }
}

async function main() {
  const prisma = createClient();
  try {
    await seedCategories(prisma);
    await seedFormats(prisma);

    const loreBooks = loadCatalogueBooks();
    const authorNamesFromBooks = loreBooks.map(
      (b) => (b.author ?? "Auteur inconnu").trim() || "Auteur inconnu",
    );

    const authorCache = await seedAuthors(prisma, authorNamesFromBooks);
    await seedSupplier(prisma);
    await seedReferenceStatuses(prisma);
    await seedBooks(prisma, authorCache);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
