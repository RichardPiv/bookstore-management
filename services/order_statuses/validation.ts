import { AppError } from "@/lib/api/route-errors";
import { CreateOrderStatusInput, UpdateOrderStatusInput } from "./types";

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

/** Validate the body of a POST /api/order-statuses. */
export function validateCreateOrderStatusInput(
  body: unknown,
): CreateOrderStatusInput {
  if (!body || typeof body !== "object") {
    throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
  }

  const { name } = body as Record<string, unknown>;

  assertNonEmptyString(name, "name");

  const trimmedName = name.trim();
  assertMaxLength(trimmedName, "name", 191);

  return { name: trimmedName };
}

/** Validate the body of a PATCH /api/order-statuses/:id. */
export function validateUpdateOrderStatusInput(
  body: unknown,
): UpdateOrderStatusInput {
  if (!body || typeof body !== "object") {
    throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
  }

  const { name } = body as Record<string, unknown>;
  const update: UpdateOrderStatusInput = {};

  if (name !== undefined) {
    assertNonEmptyString(name, "name");
    const trimmedName = name.trim();
    assertMaxLength(trimmedName, "name", 191);
    update.name = trimmedName;
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
