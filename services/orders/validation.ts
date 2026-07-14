import { AppError } from "@/lib/api/route-errors";

import type { CreateOrderInput, CreateOrderLineInput } from "./types";

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

function assertNoDuplicateBookIds(lines: CreateOrderLineInput[]) {
  const bookIds = lines.map((line) => line.book_id);
  if (new Set(bookIds).size !== bookIds.length) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Order lines must not contain duplicate book_id values.",
      400,
    );
  }
}

function assertOrderLines(value: unknown): CreateOrderLineInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      'The field "lines" must be a non-empty array.',
      400,
    );
  }

  const lines: CreateOrderLineInput[] = [];

  for (const line of value) {
    if (!line || typeof line !== "object") {
      throw new AppError("VALIDATION_ERROR", "Invalid order line.", 400);
    }

    const { book_id, supplier_id, qty } = line as Record<string, unknown>;
    assertPositiveInt(book_id, "lines.book_id");
    assertPositiveInt(supplier_id, "lines.supplier_id");
    assertPositiveInt(qty, "lines.qty");

    lines.push({
      book_id,
      supplier_id,
      qty,
    });
  }

  assertNoDuplicateBookIds(lines);
  return lines;
}

export function validateCreateOrderInput(body: unknown): CreateOrderInput {
  if (!body || typeof body !== "object") {
    throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
  }

  const { user_id, immediate, lines } = body as Record<string, unknown>;

  assertPositiveInt(user_id, "user_id");

  let immediateValue = true;
  if (immediate !== undefined) {
    assertBoolean(immediate, "immediate");
    immediateValue = immediate;
  }

  return {
    user_id,
    immediate: immediateValue,
    lines: assertOrderLines(lines),
  };
}
