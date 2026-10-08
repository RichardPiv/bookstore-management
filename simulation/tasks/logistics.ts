import type { StaffAgent, WorldTask } from "../types";
import { specialtyMatchesShelf } from "../agents/staff-stats";

export function pickLogisticsTask(
  agent: StaffAgent,
  tasks: WorldTask[],
  shelfForBook: (bookId: number) => string,
): WorldTask | null {
  const wanted =
    agent.role === "stocker"
      ? "RESTOCK_SHELF"
      : agent.role === "receiver"
        ? "RECEIVE_DELIVERY"
        : null;
  if (!wanted) return null;

  const candidates = tasks.filter(
    (row) =>
      row.type === wanted &&
      (row.status === "pending" ||
        (row.status === "in_progress" && row.assignee_id === agent.id)),
  );
  if (candidates.length === 0) return null;

  if (agent.role === "stocker" && agent.stats.specialty_shelf) {
    const specialtyMatch = candidates.find(
      (row) =>
        row.book_id != null &&
        specialtyMatchesShelf(agent, shelfForBook(row.book_id)),
    );
    if (specialtyMatch) return specialtyMatch;
  }
  return candidates[0]!;
}

export function logisticsWorkMinutes(input: {
  speedStat: number;
  specialtyBonus: boolean;
  moraleFatigue: number;
  reliabilityFail: boolean;
}): number {
  let work = 2.5 + (100 - input.speedStat) / 35;
  if (input.specialtyBonus) work *= 0.72;
  work *= input.moraleFatigue;
  if (input.reliabilityFail) work *= 1.4;
  return work;
}
