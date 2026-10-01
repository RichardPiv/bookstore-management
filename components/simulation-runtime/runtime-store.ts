import { SimulationEngine } from "@/simulation/engine";
import type { TickCommit } from "@/simulation/types";

let engine: SimulationEngine | null = null;
let pendingCommits: TickCommit[] = [];
let closedDayFlag = false;

export function getSimulationEngine(): SimulationEngine | null {
  return engine;
}

export function getOrCreateEngine(): SimulationEngine {
  if (!engine) {
    engine = new SimulationEngine();
  }
  return engine;
}

export function enqueueCommits(commits: TickCommit[], closedDay: boolean) {
  pendingCommits.push(...commits);
  if (closedDay) {
    closedDayFlag = true;
  }
}

export function drainPending(): { commits: TickCommit[]; closed_day: boolean } {
  const commits = pendingCommits.splice(0, pendingCommits.length);
  const closed = closedDayFlag;
  closedDayFlag = false;
  return { commits, closed_day: closed };
}

export function hasPendingWork(): boolean {
  return pendingCommits.length > 0 || closedDayFlag;
}
