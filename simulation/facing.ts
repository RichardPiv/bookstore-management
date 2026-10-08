import type { EmployeeRole, RenderAgent } from "./types";

/** Helpers d’orientation sprites (extrait P2.8). */

export function facingFromDelta(
  dx: number,
  dy: number,
): RenderAgent["facing"] {
  if (dx === 0 && dy === 0) return "down";
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? "left" : "right";
  }
  return dy < 0 ? "up" : "down";
}

/** Regard vers le personnage le plus proche (clients à l’arrêt). */
export function facingTowardNearest(
  x: number,
  y: number,
  others: Array<{ x: number; y: number }>,
  fallback: RenderAgent["facing"] = "down",
): RenderAgent["facing"] {
  let bestDx = 0;
  let bestDy = 0;
  let bestDist = 10;
  for (const other of others) {
    const dx = other.x - x;
    const dy = other.y - y;
    const dist = Math.abs(dx) + Math.abs(dy);
    if (dist <= 0 || dist > bestDist) continue;
    bestDist = dist;
    bestDx = dx;
    bestDy = dy;
  }
  if (bestDist >= 10) return fallback;
  return facingFromDelta(bestDx, bestDy);
}

/** Regard idle du staff selon le poste (vers la salle, pas vers la caméra). */
export function staffPostFacing(
  role: EmployeeRole,
  x: number,
): RenderAgent["facing"] {
  if (role === "clerk") {
    return "up";
  }
  if (role === "receiver") {
    return "left";
  }
  if (x < 70) return "left";
  return "right";
}
