import { AppError } from "@/lib/api/route-errors";
import { Prisma } from "@/lib/generated/prisma/client";

import type { TransferToShelfInput } from "./types";

const PRICE_REGEX = /^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/;

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

/** Validate POST /api/stocks/transfer body. */
export function validateTransferToShelfInput(
  body: unknown,
): TransferToShelfInput {
  if (!body || typeof body !== "object") {
    throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
  }

  const { book_id, qty, sale_price } = body as Record<string, unknown>;

  assertPositiveInt(book_id, "book_id");
  assertPositiveInt(qty, "qty");

  const input: TransferToShelfInput = { book_id, qty };

  if (sale_price !== undefined && sale_price !== null && sale_price !== "") {
    input.sale_price = parsePrice(sale_price, "sale_price");
  }

  return input;
}
