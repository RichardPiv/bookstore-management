import { AppError } from "@/lib/api/route-errors";
import { CreateCategoryInput, UpdateCategoryInput } from "./types";

const CATEGORY_CODE_REGEX = /^[A-Z]{2,8}$/;

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

function assertCategoryCode(value: string, field: string) {
  if (!CATEGORY_CODE_REGEX.test(value)) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" must contain 2 to 8 uppercase letters.`,
      400,
    );
  }
}

/** Validate the body of a POST /api/categories. */
export function validateCreateCategoryInput(
  body: unknown,
): CreateCategoryInput {
  if (!body || typeof body !== "object") {
    throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
  }

  const { name, code } = body as Record<string, unknown>;

  assertNonEmptyString(name, "name");
  assertNonEmptyString(code, "code");

  const trimmedName = name.trim();
  const trimmedCode = code.trim().toUpperCase();
  assertMaxLength(trimmedName, "name", 191);
  assertMaxLength(trimmedCode, "code", 8);
  assertCategoryCode(trimmedCode, "code");

  return { name: trimmedName, code: trimmedCode };
}

/** Validate the body of a PATCH /api/categories/:id (optional fields). */
export function validateUpdateCategoryInput(
  body: unknown,
): UpdateCategoryInput {
  if (!body || typeof body !== "object") {
    throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
  }

  const { name, code } = body as Record<string, unknown>;
  const update: UpdateCategoryInput = {};

  if (name !== undefined) {
    assertNonEmptyString(name, "name");
    const trimmedName = name.trim();
    assertMaxLength(trimmedName, "name", 191);
    update.name = trimmedName;
  }

  if (code !== undefined) {
    assertNonEmptyString(code, "code");
    const trimmedCode = code.trim().toUpperCase();
    assertMaxLength(trimmedCode, "code", 8);
    assertCategoryCode(trimmedCode, "code");
    update.code = trimmedCode;
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
