import { categoryToShelf } from "../map";
import type { StaffAgent, VisitorAgent } from "../types";

/** Stats runtime staff — purs (P2.8 / agents). */

export function moraleFatigueFactor(agent: StaffAgent): number {
  const fatigueSlow = 1 - agent.stats.fatigue / 220;
  const moraleBoost = 0.75 + agent.stats.morale / 400;
  return Math.max(0.4, Math.min(1.25, fatigueSlow * moraleBoost));
}

export function workPace(agent: StaffAgent): number {
  return Math.max(0.4, moraleFatigueFactor(agent));
}

/** Tirage fiabilité (échecs plus fréquents si moral bas). */
export function reliabilityOk(agent: StaffAgent, rng: () => number): boolean {
  const threshold =
    agent.stats.reliability / 100 - (100 - agent.stats.morale) / 400;
  return rng() < Math.max(0.25, Math.min(0.98, threshold));
}

export function specialtyMatchesVisitor(
  agent: StaffAgent,
  visitor: VisitorAgent,
): boolean {
  const spec = agent.stats.specialty_shelf;
  if (!spec) return false;
  if (spec === visitor.shelf_code) return true;
  return visitor.preferred_categories.some(
    (cat) => categoryToShelf(cat) === spec,
  );
}

export function specialtyMatchesShelf(
  agent: StaffAgent,
  shelfCode: string,
): boolean {
  const spec = agent.stats.specialty_shelf;
  if (!spec) return false;
  return spec === shelfCode;
}

export function preferredCashierId(staff: StaffAgent[]): number | null {
  const clerks = staff.filter((row) => row.role === "clerk");
  if (clerks.length === 0) return null;
  const focused = clerks.filter((row) => row.stats.counter_focus);
  const pool = focused.length > 0 ? focused : clerks;
  return [...pool].sort(
    (a, b) => b.stats.checkout_speed - a.stats.checkout_speed,
  )[0]!.id;
}

export function counterCodeForHome(
  _home: string,
): "counter" | "counter_b" {
  return "counter";
}
