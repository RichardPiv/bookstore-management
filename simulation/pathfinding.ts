import {
  GRID_H,
  GRID_W,
  isClientWalkable,
  isWalkable,
  spawnPoint,
} from "./map";

export type GridPoint = { x: number; y: number };
export type WalkFn = (x: number, y: number) => boolean;

const DIRS: GridPoint[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

function key(p: GridPoint): string {
  return `${p.x},${p.y}`;
}

function heuristic(a: GridPoint, b: GridPoint): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * A* 4-directions. `walk` = masque (staff = tout, client = salle seule).
 */
export function findPath(
  from: GridPoint,
  to: GridPoint,
  walk: WalkFn = isWalkable,
): GridPoint[] {
  const start = clampWalkable(from, walk);
  const goal = clampWalkable(to, walk);
  if (start.x === goal.x && start.y === goal.y) {
    return [];
  }

  const open: GridPoint[] = [start];
  const came = new Map<string, GridPoint>();
  const gScore = new Map<string, number>([[key(start), 0]]);
  const fScore = new Map<string, number>([[key(start), heuristic(start, goal)]]);
  const inOpen = new Set<string>([key(start)]);

  while (open.length > 0) {
    let best = 0;
    let bestF = fScore.get(key(open[0]!)) ?? Infinity;
    for (let i = 1; i < open.length; i += 1) {
      const f = fScore.get(key(open[i]!)) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        best = i;
      }
    }
    const current = open.splice(best, 1)[0]!;
    inOpen.delete(key(current));
    if (current.x === goal.x && current.y === goal.y) {
      return reconstruct(came, current);
    }

    for (const dir of DIRS) {
      const next = { x: current.x + dir.x, y: current.y + dir.y };
      if (!walk(next.x, next.y)) continue;
      const tentative = (gScore.get(key(current)) ?? Infinity) + 1;
      if (tentative >= (gScore.get(key(next)) ?? Infinity)) continue;
      came.set(key(next), current);
      gScore.set(key(next), tentative);
      fScore.set(key(next), tentative + heuristic(next, goal));
      const nk = key(next);
      if (!inOpen.has(nk)) {
        open.push(next);
        inOpen.add(nk);
      }
    }
  }

  return [];
}

/** Chemin client : salle de vente uniquement (annexe interdite). */
export function findClientPath(from: GridPoint, to: GridPoint): GridPoint[] {
  return findPath(from, to, isClientWalkable);
}

function reconstruct(came: Map<string, GridPoint>, current: GridPoint): GridPoint[] {
  const path = [current];
  let node: GridPoint | undefined = current;
  while (node) {
    const prev = came.get(key(node));
    if (!prev) break;
    path.unshift(prev);
    node = prev;
  }
  path.shift();
  return path;
}

export function clampWalkable(
  point: GridPoint,
  walk: WalkFn = isWalkable,
): GridPoint {
  if (walk(point.x, point.y)) {
    return { x: point.x, y: point.y };
  }
  for (let radius = 1; radius < 12; radius += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      for (let dy = -radius; dy <= radius; dy += 1) {
        const x = point.x + dx;
        const y = point.y + dy;
        if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) continue;
        if (walk(x, y)) {
          return { x, y };
        }
      }
    }
  }
  return spawnPoint();
}

export function clampClientWalkable(point: GridPoint): GridPoint {
  return clampWalkable(point, isClientWalkable);
}
