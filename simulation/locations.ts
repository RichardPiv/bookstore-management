import {
  approachPoint,
  staffStand,
} from "./map";
import {
  clampClientWalkable,
  clampWalkable,
} from "./pathfinding";
import type { EmployeeRole } from "./types";

/** Helpers de positions logiques (salle / annexe). */

export function loc(code: string) {
  return clampWalkable(approachPoint(code));
}

export function locClient(code: string) {
  return clampClientWalkable(approachPoint(code));
}

export function locStaff(code: string) {
  return clampWalkable(staffStand(code));
}

export function homeForStaff(role: EmployeeRole, _counterFocus: boolean): string {
  if (role === "stocker") return "reserve";
  if (role === "receiver") return "dock";
  return "counter";
}
