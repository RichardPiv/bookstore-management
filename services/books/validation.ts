import { AppError } from "@/lib/api/route-errors";
import { isBookRarity } from "@/lib/book-rarities";
import { CreateBookInput, UpdateBookInput } from "./types";
import { Prisma } from "@/lib/generated/prisma/client";

const PRICE_REGEX = /^\d{1,8}(\.\d{1,2})?$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SUMMARY_MAX_LENGTH = 2000;
const EAN_REGEX = /^[0-9]{13}$/;
const ISBN_REGEX = /^[0-9]{13}$/;
/** Lore catalogue IDs: HIS-001, BOT-008, ARC-040, … */
const LORE_CODE_REGEX = /^[A-Z]{2,8}-\d{3,4}$/;
/** Archive cote: ARC-MAN-001, BOT-HER-008, … */
const COTE_REGEX = /^[A-Z]{2,8}-[A-Z]{2,8}-\d{3,4}$/;
const COVER_URL_MAX_LENGTH = 255;
/** Absolute http(s) URL or app-relative path starting with `/`. */
const COVER_URL_REGEX = /^(https?:\/\/\S+|\/\S*)$/i;

/** Assert that a value is a non-empty string. */
function assertNonEmptyString(
  value: unknown,
  field: string,
): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" is required.`,
      400,
    );
  }
}

/** Assert that a value is an array of no duplicate ids. */
function assertNoDuplicateIds(value: number[], field: string) {
  if (new Set(value).size !== value.length) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" must not contain duplicate values.`,
      400,
    );
  }
}

/** Assert that a value is a string with a maximum length. */
function assertMaxLength(value: string, field: string, max: number) {
  if (value.length > max) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" must not exceed ${max} characters.`,
      400,
    );
  }
}

/** Assert that a value is a positive integer. */
function assertPositiveInt(
  value: unknown,
  field: string,
): asserts value is number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" must be a positive integer.`,
      400,
    );
  }
}

/** Assert that a value is a non-negative integer. */
function assertNonNegativeInt(
  value: unknown,
  field: string,
): asserts value is number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" must be a non-negative integer.`,
      400,
    );
  }
}

/** Assert that a value is under a maximum value. */
function assertUnderMaxValue(
  value: unknown,
  field: string,
  max: number,
): asserts value is number {
  if (typeof value !== "number" || value > max) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" must be under ${max}.`,
      400,
    );
  }
}

/** Assert that a value is a valid date. */
function assertValidDate(
  value: unknown,
  field: string,
): asserts value is string {
  if (typeof value !== "string" || !DATE_REGEX.test(value)) {
    throw new AppError("VALIDATION_ERROR", "Invalid date.", 400);
  }
}

/** Assert that a value is a valid EAN. */
function assertValidEAN(
  value: unknown,
  field: string,
): asserts value is string {
  if (typeof value !== "string" || !EAN_REGEX.test(value)) {
    throw new AppError("VALIDATION_ERROR", "Invalid EAN.", 400);
  }
}

/** Assert that a value is a valid ISBN. */
function assertValidISBN(
  value: unknown,
  field: string,
): asserts value is string {
  if (typeof value !== "string" || !ISBN_REGEX.test(value)) {
    throw new AppError("VALIDATION_ERROR", "Invalid ISBN.", 400);
  }
}

/** Assert that a value is a boolean. */
function assertBoolean(
  value: unknown,
  field: string,
): asserts value is boolean {
  if (typeof value !== "boolean") {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" must be a boolean.`,
      400,
    );
  }
}

/** Parse a price value to a Prisma Decimal. */
function parsePrice(value: unknown, field: string): Prisma.Decimal {
  let raw: string;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) {
      throw new AppError("VALIDATION_ERROR", `Invalid ${field}.`, 400);
    }
    raw = value.toString();
  } else if (typeof value === "string" && value.trim().length > 0) {
    raw = value.trim();
  } else {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" is required.`,
      400,
    );
  }
  if (!PRICE_REGEX.test(raw)) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" must be a decimal(10,2) (max 99999999.99).`,
      400,
    );
  }
  return new Prisma.Decimal(raw);
}

/** Assert that a value is a valid lore catalogue code. */
function assertValidLoreCode(
  value: unknown,
  field: string,
): asserts value is string {
  if (typeof value !== "string" || !LORE_CODE_REGEX.test(value.trim())) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" must match pattern PREFIX-NNN (e.g. HIS-001).`,
      400,
    );
  }
}

/** Assert that a value is a valid archive cote. */
function assertValidCote(
  value: unknown,
  field: string,
): asserts value is string {
  if (typeof value !== "string" || !COTE_REGEX.test(value.trim())) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" must match pattern PREFIX-CODE-NNN (e.g. ARC-MAN-001).`,
      400,
    );
  }
}

/**
 * Optional string: omit / null / "" → null ; otherwise trimmed non-empty.
 */
function parseOptionalNullableString(
  value: unknown,
  field: string,
  maxLength: number,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" must be a string or null.`,
      400,
    );
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  assertMaxLength(trimmed, field, maxLength);
  return trimmed;
}

/** series and volume must both be null or both set. */
function assertSeriesVolumeCoherence(
  series: string | null,
  volume: number | null,
) {
  const seriesSet = series !== null;
  const volumeSet = volume !== null;
  if (seriesSet !== volumeSet) {
    throw new AppError(
      "VALIDATION_ERROR",
      'Fields "series" and "volume" must both be null or both be set.',
      400,
    );
  }
}

/**
 * Optional volume: omit / null → null ; otherwise positive integer.
 */
function parseOptionalVolume(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new AppError(
      "VALIDATION_ERROR",
      'The field "volume" must be a positive integer or null.',
      400,
    );
  }
  return value;
}

/** Assert that a value is a commercial book rarity. */
function assertBookRarity(
  value: unknown,
  field: string,
): asserts value is string {
  if (!isBookRarity(value)) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" must be one of: common, uncommon, rare, legendary, mythic, sealed.`,
      400,
    );
  }
}

/**
 * Optional cover URL: omit / null / "" → null ;
 * otherwise http(s) URL or path starting with `/`, max 255.
 */
function parseOptionalCoverUrl(value: unknown, field: string): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" must be a string or null.`,
      400,
    );
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  assertMaxLength(trimmed, field, COVER_URL_MAX_LENGTH);
  if (!COVER_URL_REGEX.test(trimmed)) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" must be an http(s) URL or a path starting with "/".`,
      400,
    );
  }
  return trimmed;
}

/** Assert that a value is a non-empty array of positive integers. */
function assertPositiveIntArray(
  value: unknown,
  field: string,
): asserts value is number[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" must be a non-empty array.`,
      400,
    );
  }
  for (const id of value) {
    if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
      throw new AppError(
        "VALIDATION_ERROR",
        `The field "${field}" must contain only positive integers.`,
        400,
      );
    }
  }
}

/** Validate the body of a POST /api/books. */
export function validateCreateBookInput(body: unknown): CreateBookInput {
  if (!body || typeof body !== "object") {
    throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
  }

  const {
    title,
    summary,
    editor,
    publication_date,
    ean,
    isbn,
    purchase_price,
    sale_price,
    rarity,
    cover_url,
    category_id,
    format_id,
    series,
    volume,
    collection,
    supplier_available,
    is_active,
    author_ids,
  } = body as Record<string, unknown>;

  assertNonEmptyString(title, "title");
  assertNonEmptyString(summary, "summary");
  assertNonEmptyString(editor, "editor");
  assertNonEmptyString(publication_date, "publication_date");
  assertNonEmptyString(ean, "ean");
  assertNonEmptyString(isbn, "isbn");

  const trimmedTitle = title.trim();
  const trimmedSummary = summary.trim();
  const trimmedEditor = editor.trim();
  const trimmedPublicationDate = publication_date.trim();
  const trimmedEan = ean.trim();
  const trimmedIsbn = isbn.trim();

  assertMaxLength(trimmedTitle, "title", 191);
  assertMaxLength(trimmedSummary, "summary", SUMMARY_MAX_LENGTH);
  assertMaxLength(trimmedEditor, "editor", 191);
  assertValidEAN(trimmedEan, "ean");
  assertValidISBN(trimmedIsbn, "isbn");
  assertBookRarity(rarity, "rarity");
  const parsedCoverUrl = parseOptionalCoverUrl(cover_url, "cover_url");
  assertPositiveInt(category_id, "category_id");
  assertPositiveInt(format_id, "format_id");
  assertBoolean(is_active, "is_active");
  assertPositiveIntArray(author_ids, "author_ids");
  assertNoDuplicateIds(author_ids, "author_ids");
  assertValidDate(trimmedPublicationDate, "publication_date");

  const parsedSeries = parseOptionalNullableString(series, "series", 255);
  const parsedVolume = parseOptionalVolume(volume);
  assertSeriesVolumeCoherence(parsedSeries, parsedVolume);
  const parsedCollection = parseOptionalNullableString(
    collection,
    "collection",
    255,
  );
  let parsedSupplierAvailable = true;
  if (supplier_available !== undefined) {
    assertBoolean(supplier_available, "supplier_available");
    parsedSupplierAvailable = supplier_available;
  }

  const purchasePriceDecimal = parsePrice(purchase_price, "purchase_price");

  let salePriceDecimal = purchasePriceDecimal;
  if (sale_price !== undefined && sale_price !== null && sale_price !== "") {
    salePriceDecimal = parsePrice(sale_price, "sale_price");
  }

  return {
    title: trimmedTitle,
    summary: trimmedSummary,
    editor: trimmedEditor,
    publication_date: trimmedPublicationDate,
    ean: trimmedEan,
    isbn: trimmedIsbn,
    purchase_price: purchasePriceDecimal,
    sale_price: salePriceDecimal,
    rarity,
    cover_url: parsedCoverUrl,
    category_id,
    format_id,
    series: parsedSeries,
    volume: parsedVolume,
    collection: parsedCollection,
    supplier_available: parsedSupplierAvailable,
    is_active,
    author_ids,
  };
}

/** Validate the body of a PATCH /api/books/:id (optional fields). */
export function validateUpdateBookInput(body: unknown): UpdateBookInput {
  if (!body || typeof body !== "object") {
    throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
  }

  const {
    lore_code,
    cote,
    title,
    summary,
    editor,
    publication_date,
    ean,
    isbn,
    purchase_price,
    sale_price,
    rarity,
    cover_url,
    category_id,
    format_id,
    series,
    volume,
    collection,
    supplier_available,
    qty_reserve,
    qty_shelf,
    alert_threshold,
    is_active,
    author_ids,
  } = body as Record<string, unknown>;
  const update: UpdateBookInput = {};

  if (lore_code !== undefined) {
    assertNonEmptyString(lore_code, "lore_code");
    const trimmedLoreCode = lore_code.trim().toUpperCase();
    assertValidLoreCode(trimmedLoreCode, "lore_code");
    assertMaxLength(trimmedLoreCode, "lore_code", 32);
    update.lore_code = trimmedLoreCode;
  }

  if (cote !== undefined) {
    assertNonEmptyString(cote, "cote");
    const trimmedCote = cote.trim().toUpperCase();
    assertValidCote(trimmedCote, "cote");
    assertMaxLength(trimmedCote, "cote", 64);
    update.cote = trimmedCote;
  }

  if (title !== undefined) {
    assertNonEmptyString(title, "title");
    const trimmedTitle = title.trim();
    assertMaxLength(trimmedTitle, "title", 191);
    update.title = trimmedTitle;
  }

  if (summary !== undefined) {
    assertNonEmptyString(summary, "summary");
    const trimmedSummary = summary.trim();
    assertMaxLength(trimmedSummary, "summary", SUMMARY_MAX_LENGTH);
    update.summary = trimmedSummary;
  }

  if (editor !== undefined) {
    assertNonEmptyString(editor, "editor");
    const trimmedEditor = editor.trim();
    assertMaxLength(trimmedEditor, "editor", 191);
    update.editor = trimmedEditor;
  }

  if (publication_date !== undefined) {
    assertNonEmptyString(publication_date, "publication_date");
    const trimmedPublicationDate = publication_date.trim();
    assertValidDate(trimmedPublicationDate, "publication_date");
    update.publication_date = trimmedPublicationDate;
  }

  if (ean !== undefined) {
    assertNonEmptyString(ean, "ean");
    const trimmedEan = ean.trim();
    assertValidEAN(trimmedEan, "ean");
    update.ean = trimmedEan;
  }

  if (isbn !== undefined) {
    assertNonEmptyString(isbn, "isbn");
    const trimmedIsbn = isbn.trim();
    assertValidISBN(trimmedIsbn, "isbn");
    update.isbn = trimmedIsbn;
  }

  if (purchase_price !== undefined) {
    const purchasePriceDecimal = parsePrice(purchase_price, "purchase_price");
    update.purchase_price = purchasePriceDecimal;
  }

  if (sale_price !== undefined) {
    const salePriceDecimal = parsePrice(sale_price, "sale_price");
    update.sale_price = salePriceDecimal;
  }

  if (rarity !== undefined) {
    assertBookRarity(rarity, "rarity");
    update.rarity = rarity;
  }

  if (cover_url !== undefined) {
    update.cover_url = parseOptionalCoverUrl(cover_url, "cover_url");
  }

  if (category_id !== undefined) {
    assertPositiveInt(category_id, "category_id");
    update.category_id = category_id;
  }

  if (format_id !== undefined) {
    assertPositiveInt(format_id, "format_id");
    update.format_id = format_id;
  }

  if (series !== undefined || volume !== undefined) {
    if (series === undefined || volume === undefined) {
      throw new AppError(
        "VALIDATION_ERROR",
        'Fields "series" and "volume" must be updated together.',
        400,
      );
    }
    const parsedSeries = parseOptionalNullableString(series, "series", 255);
    const parsedVolume = parseOptionalVolume(volume);
    assertSeriesVolumeCoherence(parsedSeries, parsedVolume);
    update.series = parsedSeries;
    update.volume = parsedVolume;
  }

  if (collection !== undefined) {
    update.collection = parseOptionalNullableString(
      collection,
      "collection",
      255,
    );
  }

  if (supplier_available !== undefined) {
    assertBoolean(supplier_available, "supplier_available");
    update.supplier_available = supplier_available;
  }

  if (qty_reserve !== undefined || qty_shelf !== undefined) {
    throw new AppError(
      "BUSINESS_RULE",
      "Stock quantities cannot be updated via PATCH. Use /api/stocks/transfer or /api/orders.",
      400,
    );
  }

  if (alert_threshold !== undefined) {
    assertNonNegativeInt(alert_threshold, "alert_threshold");
    update.alert_threshold = alert_threshold;
  }

  if (is_active !== undefined) {
    assertBoolean(is_active, "is_active");
    update.is_active = is_active;
  }

  if (author_ids !== undefined) {
    assertPositiveIntArray(author_ids, "author_ids");
    assertNoDuplicateIds(author_ids, "author_ids");
    update.author_ids = author_ids;
  }

  if (Object.keys(update).length === 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      "No fields to update have been provided.",
      400,
    );
  }

  return update;
}
