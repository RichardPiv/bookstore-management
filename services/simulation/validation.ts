import { AppError } from "@/lib/api/route-errors";

import type { RunSimulationInput } from "./types";

const DEFAULT_EVENTS_COUNT = 10;
const MIN_EVENTS_COUNT = 1;
const MAX_EVENTS_COUNT = 50;

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

export function validateRunSimulationInput(body: unknown): RunSimulationInput {
  if (body === undefined || body === null) {
    return { events_count: DEFAULT_EVENTS_COUNT };
  }

  if (typeof body !== "object") {
    throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
  }

  const { events_count } = body as Record<string, unknown>;

  if (events_count === undefined) {
    return { events_count: DEFAULT_EVENTS_COUNT };
  }

  assertPositiveInt(events_count, "events_count");

  if (events_count < MIN_EVENTS_COUNT || events_count > MAX_EVENTS_COUNT) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The field "events_count" must be between ${MIN_EVENTS_COUNT} and ${MAX_EVENTS_COUNT}.`,
      400,
    );
  }

  return { events_count };
}
