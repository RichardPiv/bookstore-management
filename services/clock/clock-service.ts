import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

import {
  simulationClockSelect,
  type PatchClockInput,
  type SimulationClockPublic,
} from "./types";
import { validatePatchClockInput } from "./validation";

type TransactionClient = Prisma.TransactionClient;

const OPEN_MINUTES = 9 * 60;

export async function ensureClock(
  userId: number,
  tx: TransactionClient = prisma,
): Promise<SimulationClockPublic> {
  const existing = await tx.simulation_clock.findUnique({
    where: { user_id: userId },
    select: simulationClockSelect,
  });
  if (existing) {
    return existing;
  }
  return tx.simulation_clock.create({
    data: {
      user_id: userId,
      sim_day: 1,
      sim_minutes: OPEN_MINUTES,
      speed: 1,
      status: "paused",
      updated_at: new Date(),
    },
    select: simulationClockSelect,
  });
}

export async function getClock(userId: number): Promise<SimulationClockPublic> {
  return ensureClock(userId);
}

export async function patchClock(
  userId: number,
  body: unknown,
): Promise<SimulationClockPublic> {
  const input = validatePatchClockInput(body);
  await ensureClock(userId);
  return prisma.simulation_clock.update({
    where: { user_id: userId },
    data: {
      ...input,
      updated_at: new Date(),
    },
    select: simulationClockSelect,
  });
}

export async function saveClockSnapshot(
  userId: number,
  input: {
    sim_day: number;
    sim_minutes: number;
    speed: number;
    status: "running" | "paused";
    snapshot_json: string;
  },
  tx: TransactionClient = prisma,
): Promise<SimulationClockPublic> {
  await ensureClock(userId, tx);
  return tx.simulation_clock.update({
    where: { user_id: userId },
    data: {
      sim_day: input.sim_day,
      sim_minutes: input.sim_minutes,
      speed: input.speed,
      status: input.status,
      snapshot_json: input.snapshot_json,
      updated_at: new Date(),
    },
    select: simulationClockSelect,
  });
}
