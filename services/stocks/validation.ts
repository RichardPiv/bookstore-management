import { AppError } from "@/lib/api/route-errors";

import type { TransferToShelfInput } from "./types";

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

/** Validate POST /api/stocks/transfer body. */
export function validateTransferToShelfInput(
  body: unknown,
): TransferToShelfInput {
  if (!body || typeof body !== "object") {
    throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
  }

  const { book_id, qty } = body as Record<string, unknown>;

  assertPositiveInt(book_id, "book_id");
  assertPositiveInt(qty, "qty");

  return { book_id, qty };
}
