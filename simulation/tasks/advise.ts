import type { WorldTask } from "../types";

/** Création d’une tâche runtime ADVISE_CUSTOMER (id négatif). */
export function createAdviseRuntimeTask(taskId: number): WorldTask {
  return {
    id: taskId,
    type: "ADVISE_CUSTOMER",
    book_id: null,
    order_id: null,
    status: "pending",
    assignee_id: null,
    priority: 8,
  };
}

export function adviseWorkMinutes(
  adviceStat: number,
  specialtyBonus: boolean,
  moraleFatigue: number,
): number {
  const advice = Math.max(15, adviceStat);
  let work = 1.5 + (100 - advice) / 45;
  if (specialtyBonus) work *= 0.78;
  work *= moraleFatigue;
  return work;
}

export function adviseSuccessChance(input: {
  advice: number;
  specialtyBonus: boolean;
  morale: number;
}): number {
  const adviceScore = Math.max(10, input.advice);
  const specialty = input.specialtyBonus ? 12 : 0;
  const moraleBoost = (input.morale - 50) / 10;
  return Math.min(
    0.92,
    0.35 + adviceScore / 140 + specialty / 100 + moraleBoost / 100,
  );
}
