import { AppError } from "@/lib/api/route-errors";

import { CLOCK_SPEEDS, type PatchClockInput } from "./types";

export function validatePatchClockInput(body: unknown): PatchClockInput {
  if (!body || typeof body !== "object") {
    throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
  }
  const raw = body as Record<string, unknown>;
  const input: PatchClockInput = {};

  if (raw.status !== undefined) {
    if (raw.status !== "running" && raw.status !== "paused") {
      throw new AppError(
        "VALIDATION_ERROR",
        'The field "status" must be "running" or "paused".',
        400,
      );
    }
    input.status = raw.status;
  }

  if (raw.speed !== undefined) {
    if (typeof raw.speed !== "number" || !(CLOCK_SPEEDS as readonly number[]).includes(raw.speed)) {
      throw new AppError(
        "VALIDATION_ERROR",
        'The field "speed" must be 1, 2 or 5.',
        400,
      );
    }
    input.speed = raw.speed as (typeof CLOCK_SPEEDS)[number];
  }

  if (raw.snapshot_json !== undefined) {
    if (raw.snapshot_json !== null && typeof raw.snapshot_json !== "string") {
      throw new AppError(
        "VALIDATION_ERROR",
        'The field "snapshot_json" must be a string or null.',
        400,
      );
    }
    input.snapshot_json = raw.snapshot_json;
  }

  if (raw.sim_day !== undefined) {
    if (typeof raw.sim_day !== "number" || !Number.isInteger(raw.sim_day) || raw.sim_day < 1) {
      throw new AppError(
        "VALIDATION_ERROR",
        'The field "sim_day" must be a positive integer.',
        400,
      );
    }
    input.sim_day = raw.sim_day;
  }

  if (raw.sim_minutes !== undefined) {
    if (
      typeof raw.sim_minutes !== "number" ||
      !Number.isInteger(raw.sim_minutes) ||
      raw.sim_minutes < 0
    ) {
      throw new AppError(
        "VALIDATION_ERROR",
        'The field "sim_minutes" must be a non-negative integer.',
        400,
      );
    }
    input.sim_minutes = raw.sim_minutes;
  }

  return input;
}
