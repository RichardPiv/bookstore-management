import { parseDna } from "@/scripts/characters/dna";

import { homeForStaff, locStaff } from "../locations";
import { parseStats, type EmployeeRole, type StaffAgent, type WorldEmployee } from "../types";

export function toStaffAgent(row: WorldEmployee): StaffAgent {
  const role = (["clerk", "stocker", "receiver"].includes(row.role)
    ? row.role
    : "clerk") as EmployeeRole;
  const stats = parseStats(row.stats_json);
  const home = homeForStaff(role, stats.counter_focus);
  const pos = locStaff(home);
  return {
    id: row.id,
    name: row.name,
    role,
    dna: parseDna(row.appearance_json),
    stats,
    x: pos.x,
    y: pos.y,
    path: [],
    duty: "idle",
    task_id: null,
    work_left: 0,
    home,
    serving_visitor_id: null,
  };
}
