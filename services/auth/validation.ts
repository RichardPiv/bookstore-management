import { AppError } from "@/lib/api/route-errors";

import type { LoginInput } from "./types";

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

/** Validate POST /api/auth/login body. */
export function validateLoginInput(body: unknown): LoginInput {
  if (!body || typeof body !== "object") {
    throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
  }

  const { username, password } = body as Record<string, unknown>;

  assertNonEmptyString(username, "username");
  assertNonEmptyString(password, "password");

  return {
    username: username.trim(),
    password,
  };
}
