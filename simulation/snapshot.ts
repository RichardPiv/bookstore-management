import { defaultStats, type EngineSnapshot, type StaffAgent, type VisitorAgent } from "./types";
import { clampClientWalkable, clampWalkable } from "./pathfinding";

export function restoreVisitorsFromSnapshot(
  snapshot: EngineSnapshot,
): { visitors: VisitorAgent[]; adviseByTask: Map<number, string> } {
  const adviseByTask = new Map<number, string>();
  const visitors = snapshot.visitors.map((visitor) => {
    const pos = clampClientWalkable({
      x: Math.round(visitor.x),
      y: Math.round(visitor.y),
    });
    const visits =
      typeof (visitor as VisitorAgent).visits_left === "number"
        ? (visitor as VisitorAgent).visits_left
        : 2 + Math.floor(Math.random() * 3);
    let state = visitor.state;
    if (state === "browse") state = "roam";
    const prefs =
      Array.isArray((visitor as VisitorAgent).preferred_categories) &&
      (visitor as VisitorAgent).preferred_categories.length > 0
        ? (visitor as VisitorAgent).preferred_categories
        : [visitor.archetype.includes("Botan") ? "Botanique" : "Histoire"];
    const restored: VisitorAgent = {
      ...visitor,
      state,
      x: pos.x,
      y: pos.y,
      visits_left: visits,
      preferred_categories: prefs,
      rarity_preference:
        (visitor as VisitorAgent).rarity_preference ?? "common",
      advise_task_id: (visitor as VisitorAgent).advise_task_id ?? null,
      temperament: (visitor as VisitorAgent).temperament ?? "calm",
      path: [],
    };
    if (restored.advise_task_id != null) {
      adviseByTask.set(restored.advise_task_id, restored.id);
    }
    return restored;
  });
  return { visitors, adviseByTask };
}

export function restoreStaffFromSnapshot(
  snapshot: EngineSnapshot,
): StaffAgent[] {
  return snapshot.staff.map((agent) => {
    const pos = clampWalkable({
      x: Math.round(agent.x),
      y: Math.round(agent.y),
    });
    const home = agent.home === "counter_b" ? "counter" : agent.home;
    return {
      ...agent,
      home,
      x: pos.x,
      y: pos.y,
      serving_visitor_id: agent.serving_visitor_id ?? null,
      stats: { ...defaultStats(agent.role), ...agent.stats },
    };
  });
}
