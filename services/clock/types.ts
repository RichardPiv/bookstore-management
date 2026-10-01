import { Prisma } from "@/lib/generated/prisma/client";

export const CLOCK_SPEEDS = [1, 2, 5] as const;
export type ClockSpeed = (typeof CLOCK_SPEEDS)[number];
export type ClockStatus = "running" | "paused";

export const simulationClockSelect = {
  id: true,
  user_id: true,
  sim_day: true,
  sim_minutes: true,
  speed: true,
  status: true,
  snapshot_json: true,
  updated_at: true,
} satisfies Prisma.simulation_clockSelect;

export type SimulationClockPublic = Prisma.simulation_clockGetPayload<{
  select: typeof simulationClockSelect;
}>;

export type PatchClockInput = {
  status?: ClockStatus;
  speed?: ClockSpeed;
  snapshot_json?: string | null;
  sim_day?: number;
  sim_minutes?: number;
};
