import { AppError } from "@/lib/api/route-errors";

import { CreateFormatInput, UpdateFormatInput } from "./types";

const FORMAT_CODE_REGEX = /^[A-Z]{2,8}$/;

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

function assertMaxLength(value: string, field: string, max: number) {
  if (value.length > max) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" must not exceed ${max} characters.`,
      400,
    );
  }
}

function assertFormatCode(value: string, field: string) {
  if (!FORMAT_CODE_REGEX.test(value)) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" must contain 2 to 8 uppercase letters.`,
      400,
    );
  }
}

export function validateCreateFormatInput(body: unknown): CreateFormatInput {
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
  assertFormatCode(trimmedCode, "code");

  return { name: trimmedName, code: trimmedCode };
}

export function validateUpdateFormatInput(body: unknown): UpdateFormatInput {
  if (!body || typeof body !== "object") {
    throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
  }

  const { name, code } = body as Record<string, unknown>;
  const update: UpdateFormatInput = {};

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
    assertFormatCode(trimmedCode, "code");
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
