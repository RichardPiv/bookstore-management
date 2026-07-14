import { AppError } from "@/lib/api/route-errors";

import type { CreateUserInput, UpdateUserInput } from "./types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

/** Validate the body of a POST /api/users. */
export function validateCreateUserInput(body: unknown): CreateUserInput {
  if (!body || typeof body !== "object") {
    throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
  }

  const { username, email, password } = body as Record<string, unknown>;

  assertNonEmptyString(username, "username");
  assertNonEmptyString(email, "email");
  assertNonEmptyString(password, "password");

  const trimmedUsername = username.trim();
  const trimmedEmail = email.trim().toLowerCase();

  assertMaxLength(trimmedUsername, "username", 100);
  assertMaxLength(trimmedEmail, "email", 100);

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    throw new AppError("VALIDATION_ERROR", "Invalid email address.", 400);
  }

  if (password.length < 8) {
    throw new AppError(
      "VALIDATION_ERROR",
      "The password must contain at least 8 characters.",
      400,
    );
  }

  return {
    username: trimmedUsername,
    email: trimmedEmail,
    password,
  };
}

/** Validate the body of a PATCH /api/users/:id (optional fields). */
export function validateUpdateUserInput(body: unknown): UpdateUserInput {
  if (!body || typeof body !== "object") {
    throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
  }

  const { username, email, password } = body as Record<string, unknown>;
  const update: UpdateUserInput = {};

  if (username !== undefined) {
    assertNonEmptyString(username, "username");
    const trimmedUsername = username.trim();
    assertMaxLength(trimmedUsername, "username", 100);
    update.username = trimmedUsername;
  }

  if (email !== undefined) {
    assertNonEmptyString(email, "email");
    const trimmedEmail = email.trim().toLowerCase();
    assertMaxLength(trimmedEmail, "email", 100);

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      throw new AppError("VALIDATION_ERROR", "Invalid email address.", 400);
    }

    update.email = trimmedEmail;
  }

  if (password !== undefined) {
    assertNonEmptyString(password, "password");

    if (password.length < 8) {
      throw new AppError(
        "VALIDATION_ERROR",
        "The password must contain at least 8 characters.",
        400,
      );
    }

    update.password = password;
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
