import { AppError } from "@/lib/api/route-errors";

import type { CreateAlertInput, UpdateAlertInput } from "./types";

const DATETIME_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?$/;

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

function parseAlertDatetime(value: unknown, field: string): Date {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "${field}" is required.`,
      400,
    );
  }

  const raw = value.trim();
  if (!DATETIME_REGEX.test(raw) && !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new AppError("VALIDATION_ERROR", "Invalid alert datetime.", 400);
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("VALIDATION_ERROR", "Invalid alert datetime.", 400);
  }

  return date;
}

export function validateCreateAlertInput(body: unknown): CreateAlertInput {
  if (!body || typeof body !== "object") {
    throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
  }

  const {
    description,
    alert_datetime,
    book_id,
    alert_type_id,
    alert_status_id,
  } = body as Record<string, unknown>;

  assertNonEmptyString(description, "description");
  const trimmedDescription = description.trim();
  assertMaxLength(trimmedDescription, "description", 2000);
  assertPositiveInt(book_id, "book_id");
  assertPositiveInt(alert_type_id, "alert_type_id");
  assertPositiveInt(alert_status_id, "alert_status_id");

  return {
    description: trimmedDescription,
    alert_datetime: parseAlertDatetime(alert_datetime, "alert_datetime"),
    book_id,
    alert_type_id,
    alert_status_id,
  };
}

export function validateUpdateAlertInput(body: unknown): UpdateAlertInput {
  if (!body || typeof body !== "object") {
    throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
  }

  const {
    description,
    alert_datetime,
    book_id,
    alert_type_id,
    alert_status_id,
  } = body as Record<string, unknown>;
  const update: UpdateAlertInput = {};

  if (description !== undefined) {
    assertNonEmptyString(description, "description");
    const trimmedDescription = description.trim();
    assertMaxLength(trimmedDescription, "description", 2000);
    update.description = trimmedDescription;
  }

  if (alert_datetime !== undefined) {
    update.alert_datetime = parseAlertDatetime(
      alert_datetime,
      "alert_datetime",
    );
  }

  if (book_id !== undefined) {
    assertPositiveInt(book_id, "book_id");
    update.book_id = book_id;
  }

  if (alert_type_id !== undefined) {
    assertPositiveInt(alert_type_id, "alert_type_id");
    update.alert_type_id = alert_type_id;
  }

  if (alert_status_id !== undefined) {
    assertPositiveInt(alert_status_id, "alert_status_id");
    update.alert_status_id = alert_status_id;
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
