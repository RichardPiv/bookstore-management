import { Prisma } from "@/lib/generated/prisma/client";

export const simulationEventSelect = {
  id: true,
  simulation_run_id: true,
  type: true,
  message: true,
  book_id: true,
  metadata: true,
  created_at: true,
} satisfies Prisma.simulation_eventsSelect;

export type SimulationEventPublic = Prisma.simulation_eventsGetPayload<{
  select: typeof simulationEventSelect;
}>;

export const simulationRunSelect = {
  id: true,
  started_at: true,
  ended_at: true,
} satisfies Prisma.simulation_runsSelect;

export type SimulationRunPublic = Prisma.simulation_runsGetPayload<{
  select: typeof simulationRunSelect;
}>;

export type SimulationRunResult = SimulationRunPublic & {
  events: SimulationEventPublic[];
};

export type ListSimulationEventsOptions = {
  simulation_run_id?: number;
};

export type RunSimulationInput = {
  events_count: number;
};
