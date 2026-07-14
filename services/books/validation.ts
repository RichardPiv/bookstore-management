import { AppError } from "@/lib/api/route-errors";
import { CreateBookInput, UpdateBookInput } from "./types";
import { Prisma } from "@/lib/generated/prisma/client";

const PRICE_REGEX = /^\d{1,8}(\.\d{1,2})?$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SUMMARY_MAX_LENGTH = 1000;
const EAN_REGEX = /^[0-9]{13}$/;
const ISBN_REGEX = /^[0-9]{13}$/;

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
    price,
    category_id,
    qty_reserve,
    qty_shelf,
    alert_threshold,
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
  assertPositiveInt(category_id, "category_id");
  assertNonNegativeInt(qty_reserve, "qty_reserve");
  assertNonNegativeInt(qty_shelf, "qty_shelf");
  assertUnderMaxValue(qty_shelf, "qty_shelf", 10);
  assertNonNegativeInt(alert_threshold, "alert_threshold");
  assertBoolean(is_active, "is_active");
  assertPositiveIntArray(author_ids, "author_ids");
  assertNoDuplicateIds(author_ids, "author_ids");
  assertValidDate(trimmedPublicationDate, "publication_date");

  const priceDecimal = parsePrice(price, "price");

  return {
    title: trimmedTitle,
    summary: trimmedSummary,
    editor: trimmedEditor,
    publication_date: trimmedPublicationDate,
    ean: trimmedEan,
    isbn: trimmedIsbn,
    price: priceDecimal,
    category_id,
    qty_reserve,
    qty_shelf,
    alert_threshold,
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
    title,
    summary,
    editor,
    publication_date,
    ean,
    isbn,
    price,
    category_id,
    qty_reserve,
    qty_shelf,
    alert_threshold,
    is_active,
    author_ids,
  } = body as Record<string, unknown>;
  const update: UpdateBookInput = {};

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

  if (price !== undefined) {
    const priceDecimal = parsePrice(price, "price");
    update.price = priceDecimal;
  }

  if (category_id !== undefined) {
    assertPositiveInt(category_id, "category_id");
    update.category_id = category_id;
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
