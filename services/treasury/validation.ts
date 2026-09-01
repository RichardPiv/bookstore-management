import { AppError } from "@/lib/api/route-errors";
import { Prisma } from "@/lib/generated/prisma/client";

import {
  TREASURY_MOVEMENT_TYPES,
  type AdjustTreasuryInput,
  type ListTreasuryMovementsOptions,
  type TreasuryMovementType,
} from "./types";

const AMOUNT_REGEX = /^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/;
const ADJUST_NOTE_MIN = 3;
const ADJUST_NOTE_MAX = 255;
const LIST_LIMIT_DEFAULT = 50;
const LIST_LIMIT_MAX = 200;

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

function assertMinLength(value: string, field: string, min: number) {
  if (value.length < min) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" must be at least ${min} characters.`,
      400,
    );
  }
}

/** Parse a strictly positive decimal(10,2) amount. */
export function parsePositiveAmount(
  value: unknown,
  field: string,
): Prisma.Decimal {
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

  if (!AMOUNT_REGEX.test(raw)) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" must be a decimal(10,2) greater than 0 (max 99999999.99).`,
      400,
    );
  }

  const amount = new Prisma.Decimal(raw);
  if (amount.lessThanOrEqualTo(0)) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" must be greater than 0.`,
      400,
    );
  }

  return amount;
}

function assertAdjustDirection(
  value: unknown,
): asserts value is "in" | "out" {
  if (value !== "in" && value !== "out") {
    throw new AppError(
      "VALIDATION_ERROR",
      'The field "direction" must be "in" or "out".',
      400,
    );
  }
}

export function assertTreasuryMovementType(
  value: unknown,
): asserts value is TreasuryMovementType {
  if (
    typeof value !== "string" ||
    !(TREASURY_MOVEMENT_TYPES as readonly string[]).includes(value)
  ) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "type" must be one of: ${TREASURY_MOVEMENT_TYPES.join(", ")}.`,
      400,
    );
  }
}

/** Validate POST /api/treasury/adjust body (D66). */
export function validateAdjustTreasuryInput(
  body: unknown,
): AdjustTreasuryInput {
  if (!body || typeof body !== "object") {
    throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
  }

  const { direction, amount, note } = body as Record<string, unknown>;

  assertAdjustDirection(direction);
  assertNonEmptyString(note, "note");

  const trimmedNote = note.trim();
  assertMinLength(trimmedNote, "note", ADJUST_NOTE_MIN);
  assertMaxLength(trimmedNote, "note", ADJUST_NOTE_MAX);

  return {
    direction,
    amount: parsePositiveAmount(amount, "amount"),
    note: trimmedNote,
  };
}

/** Validate optional query filters for GET /api/treasury/movements. */
export function validateListTreasuryMovementsOptions(
  params: URLSearchParams | Record<string, string | null | undefined>,
): ListTreasuryMovementsOptions {
  const get = (key: string): string | null => {
    if (params instanceof URLSearchParams) {
      return params.get(key);
    }
    const value = params[key];
    return value === undefined || value === null || value === ""
      ? null
      : value;
  };

  const options: ListTreasuryMovementsOptions = {};

  const type = get("type");
  if (type !== null) {
    assertTreasuryMovementType(type);
    options.type = type;
  }

  const limitRaw = get("limit");
  if (limitRaw !== null) {
    const limit = Number(limitRaw);
    if (!Number.isInteger(limit) || limit <= 0 || limit > LIST_LIMIT_MAX) {
      throw new AppError(
        "VALIDATION_ERROR",
        `The field "limit" must be an integer between 1 and ${LIST_LIMIT_MAX}.`,
        400,
      );
    }
    options.limit = limit;
  } else {
    options.limit = LIST_LIMIT_DEFAULT;
  }

  return options;
}
