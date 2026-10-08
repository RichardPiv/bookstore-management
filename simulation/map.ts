import {
  SHELF_CATEGORIES,
  shelfLocationCode,
  shelfLocationFromCategoryCode,
  shelfLocationFromCategoryName,
} from "./categories";

/** Largeur salle de vente (coords historiques). */
export const HALL_W = 54;
/** Largeur aile droite (réception / réserve). */
export const ANNEX_W = 28;
/** Emprise totale = salle + annexe. */
export const GRID_W = HALL_W + ANNEX_W;
export const GRID_H = 32;

export type LocationKind =
  | "entrance"
  | "counter"
  | "shelf"
  | "room"
  | "reserve"
  | "dock";

export type LocationDef = {
  code: string;
  name: string;
  kind: LocationKind;
  x: number;
  y: number;
};

const SHELF_W = 5;
/** Profondeur collision rayons (2 ≈ mesh 3D, sans pad latéral). */
const SHELF_D = 2;
const MID_X = Math.floor(HALL_W / 2);
/** Les clients ne franchissent jamais le mitoyen (annexe interdite). */
export const CLIENT_MAX_X = 52;

/** Passage mitoyen salle ↔ annexe (porte mur droit). */
const DOOR_X_MIN = 52;
const DOOR_X_MAX = 55;
const DOOR_Y_MIN = 20;
const DOOR_Y_MAX = 25;

type ShelfFacing = "south" | "east";
type ShelfSlot = { x: number; y: number; facing: ShelfFacing };

function ewBlock(x0: number, y: number, count: number): ShelfSlot[] {
  return Array.from({ length: count }, (_, i) => ({
    x: x0 + i * SHELF_W,
    y,
    facing: "south" as const,
  }));
}

function nsBlock(x: number, y0: number, count: number): ShelfSlot[] {
  return Array.from({ length: count }, (_, i) => ({
    x,
    y: y0 + i * SHELF_W,
    facing: "east" as const,
  }));
}

/**
 * 27 rayons — allées larges, aile gauche N–S, rangée bas-gauche (entrée).
 * Rangées E–O à y 5 / 12 / 19 (écart 7, allée ~6) ; colonne x=3 ; bas y=25.
 */
const SHELF_SLOTS: ShelfSlot[] = [
  ...nsBlock(3, 3, 4),
  ...ewBlock(10, 5, 4),
  ...ewBlock(34, 5, 3),
  ...ewBlock(10, 12, 3),
  ...ewBlock(34, 12, 3),
  ...ewBlock(10, 19, 3),
  ...ewBlock(34, 19, 3),
  ...ewBlock(3, 25, 4),
];

function shelfRect(slot: ShelfSlot): { x: number; y: number; w: number; h: number } {
  if (slot.facing === "east") {
    return { x: slot.x, y: slot.y, w: SHELF_D, h: SHELF_W };
  }
  return { x: slot.x, y: slot.y, w: SHELF_W, h: SHELF_D };
}

function shelfApproach(slot: ShelfSlot): { x: number; y: number } {
  const rect = shelfRect(slot);
  if (slot.facing === "east") {
    return {
      x: rect.x + rect.w,
      y: rect.y + Math.floor((rect.h - 1) / 2),
    };
  }
  return {
    x: rect.x + Math.floor((rect.w - 1) / 2),
    y: rect.y + rect.h,
  };
}

function buildShelfLocations(): LocationDef[] {
  return SHELF_CATEGORIES.map((category, index) => {
    const slot = SHELF_SLOTS[index] ?? SHELF_SLOTS[SHELF_SLOTS.length - 1]!;
    const ap = shelfApproach(slot);
    return {
      code: shelfLocationCode(category.code),
      name: `Rayon ${category.name}`,
      kind: "shelf" as const,
      x: ap.x,
      y: ap.y,
    };
  });
}

function buildShelfFurniture(): GridRect[] {
  return SHELF_CATEGORIES.map((category, index) => {
    const slot = SHELF_SLOTS[index] ?? SHELF_SLOTS[SHELF_SLOTS.length - 1]!;
    const rect = shelfRect(slot);
    return {
      code: shelfLocationCode(category.code),
      ...rect,
    };
  });
}

/** Walk targets — caisse horizontale près du tapis / entrée (D83). */
export const LOCATION_DEFS: LocationDef[] = [
  { code: "entrance", name: "Entrée", kind: "entrance", x: MID_X, y: 29 },
  { code: "counter", name: "Comptoir", kind: "counter", x: 42, y: 30 },
  /** Coin ouest — tables de lecture (P2.4 / L4). */
  { code: "reading_room", name: "Salle de lecture", kind: "room", x: 8, y: 27 },
  ...buildShelfLocations(),
  { code: "reserve", name: "Réserve", kind: "reserve", x: 78, y: 7 },
  { code: "dock", name: "Quai des Convoyeurs", kind: "dock", x: 74, y: 30 },
];

export const LOCATION_BY_CODE = new Map(
  LOCATION_DEFS.map((loc) => [loc.code, loc]),
);

export type GridRect = {
  code: string;
  x: number;
  y: number;
  w: number;
  h: number;
  facing?: "south" | "east" | "west";
};

function annexWallShelves(): GridRect[] {
  /** Profondeur 1 contre les murs — le SHELF_D=2 est pour les îlots salle. */
  const WALL_D = 1;
  const east = (y: number, h: number, i: number): GridRect => ({
    code: `annex_shelf_l${i}`,
    x: 54,
    y,
    w: WALL_D,
    h,
    facing: "east",
  });
  const south = (x: number, w: number, i: number): GridRect => ({
    code: `annex_shelf_b${i}`,
    x,
    y: 0,
    w,
    h: WALL_D,
    facing: "south",
  });
  const west = (y: number, h: number, i: number): GridRect => ({
    code: `annex_shelf_r${i}`,
    x: 81,
    y,
    w: WALL_D,
    h,
    facing: "west",
  });
  /**
   * Travées des textures (bougies = piliers). Un vide de 1–2 cases
   * entre chaque bib, calé sur le pilier — pas des meubles collés.
   * Fond U 0.227 / 0.432 / 0.627 / 0.833 → x≈60, 66, 72, 77.
   * Gauche U 0.340 / 0.594 / 0.843 → y≈21 (porte), 12, 3.
   * Est U 0.143 / 0.376 / 0.624 / 0.852 → y≈3, 11, 21, 29 ; baie 0.38–0.62 = vitre.
   */
  return [
    /** Gauche : pas de bib collée dans l’angle du fond. */
    east(7, SHELF_W, 0),
    east(15, SHELF_W, 1),
    /** Fond : travées de largeur 1 bib, vide sur les piliers. Pas d’angle gauche. */
    south(60, SHELF_W, 0),
    south(66, SHELF_W, 1),
    south(72, SHELF_W, 2),
    /** Est : pas de bib dans l’angle du fond ; hors vitre. */
    west(4, SHELF_W, 0),
    west(23, SHELF_W, 1),
    /** Bibs d’angle en L (collision = 2 bras). */
    {
      code: "annex_corner_nw_s",
      x: 54,
      y: 0,
      w: 4,
      h: 1,
      facing: "south",
    },
    {
      code: "annex_corner_nw_e",
      x: 54,
      y: 0,
      w: 1,
      h: 4,
      facing: "east",
    },
    {
      code: "annex_corner_ne_s",
      x: 78,
      y: 0,
      w: 4,
      h: 1,
      facing: "south",
    },
    {
      code: "annex_corner_ne_w",
      x: 81,
      y: 0,
      w: 1,
      h: 4,
      facing: "west",
    },
  ];
}

export const FURNITURE: GridRect[] = [
  ...buildShelfFurniture(),
  ...annexWallShelves(),
  /** Caisse principale — près de l’entrée / centre-droit (D83). */
  { code: "counter", x: 39, y: 25, w: 8, h: 3 },
  /** Quai : horizontal, bas de l’annexe. */
  { code: "dock", x: 69, y: 25, w: 12, h: 3 },
  /** Réserve : devant les bibs du mur est. */
  { code: "reserve", x: 74, y: 3, w: 3, h: 10 },
];

export const FURNITURE_BY_CODE = new Map(FURNITURE.map((row) => [row.code, row]));

/** True si la case est dans le masque de collision meuble (hitbox exacte). */
export function inFurniture(x: number, y: number): boolean {
  return FURNITURE.some(
    (block) =>
      x >= block.x &&
      x < block.x + block.w &&
      y >= block.y &&
      y < block.y + block.h,
  );
}

function inDoorPassage(x: number, y: number): boolean {
  return (
    x >= DOOR_X_MIN &&
    x <= DOOR_X_MAX &&
    y >= DOOR_Y_MIN &&
    y <= DOOR_Y_MAX
  );
}

/** Mur mitoyen salle ↔ annexe hors bande porte. */
function inPartitionWall(x: number, y: number): boolean {
  if (inDoorPassage(x, y)) return false;
  return x === 53 || x === 54;
}

export function isWalkable(x: number, y: number): boolean {
  const entranceDoor =
    y === GRID_H - 1 && x >= MID_X - 3 && x <= MID_X + 3;
  if (
    !entranceDoor &&
    (x < 1 || y < 1 || x >= GRID_W - 1 || y >= GRID_H - 1)
  ) {
    return false;
  }
  if (inPartitionWall(x, y)) {
    return false;
  }
  if (inFurniture(x, y)) {
    return false;
  }
  return true;
}

/** Walkable salle de vente uniquement — annexe interdite aux clients. */
export function isClientWalkable(x: number, y: number): boolean {
  if (x > CLIENT_MAX_X) return false;
  return isWalkable(x, y);
}

let hallCellsCache: Array<{ x: number; y: number }> | null = null;

/** Cases librement praticables par un client (salle hors meubles). */
export function hallWalkableCells(): Array<{ x: number; y: number }> {
  if (!hallCellsCache) {
    hallCellsCache = [];
    for (let y = 1; y < GRID_H - 1; y += 1) {
      for (let x = 1; x <= CLIENT_MAX_X; x += 1) {
        if (isClientWalkable(x, y)) {
          hallCellsCache.push({ x, y });
        }
      }
    }
  }
  return hallCellsCache;
}

export function randomHallPoint(rng: () => number): { x: number; y: number } {
  const cells = hallWalkableCells();
  if (cells.length === 0) return spawnPoint();
  return cells[Math.floor(rng() * cells.length)]!;
}

export function shelfCodes(): string[] {
  return LOCATION_DEFS.filter((loc) => loc.kind === "shelf").map((loc) => loc.code);
}

export function spawnPoint(): { x: number; y: number } {
  return { x: MID_X, y: 29 };
}

function rectFront(rect: GridRect): { x: number; y: number } {
  const def = LOCATION_BY_CODE.get(rect.code);
  return {
    x: def?.x ?? rect.x + Math.floor((rect.w - 1) / 2),
    y: rect.y + rect.h,
  };
}

function rectWest(rect: GridRect, gap = 1): { x: number; y: number } {
  return {
    x: rect.x - gap,
    y: rect.y + Math.floor((rect.h - 1) / 2),
  };
}

function rectEast(rect: GridRect, gap = 1): { x: number; y: number } {
  return {
    x: rect.x + rect.w + (gap - 1),
    y: rect.y + Math.floor((rect.h - 1) / 2),
  };
}

function rectNorth(rect: GridRect, gap = 1): { x: number; y: number } {
  return {
    x: rect.x + Math.floor((rect.w - 1) / 2),
    y: rect.y - gap,
  };
}

function rectSouth(rect: GridRect, gap = 1): { x: number; y: number } {
  return {
    x: rect.x + Math.floor((rect.w - 1) / 2),
    y: rect.y + rect.h + (gap - 1),
  };
}

/**
 * Dégagement postes / approches : sprites ~2 u de large.
 * gap 2 = pieds hors du volume 3D du bureau / rayon.
 */
const DESK_STAND_GAP = 3;
const SHELF_STAND_GAP = 1;

export function approachPoint(code: string): { x: number; y: number } {
  if (code === "entrance") {
    return spawnPoint();
  }
  const rect = FURNITURE_BY_CODE.get(code);
  if (!rect) {
    const def = LOCATION_BY_CODE.get(code);
    return def ? { x: def.x, y: def.y } : spawnPoint();
  }
  if (code === "counter") {
    /** Horizontal : clients au nord (vers la salle) ; vertical : à l’ouest. */
    return rect.w >= rect.h
      ? rectNorth(rect, DESK_STAND_GAP)
      : rectWest(rect, DESK_STAND_GAP);
  }
  if (code.startsWith("shelf_")) {
    return rect.h > rect.w
      ? rectEast(rect, SHELF_STAND_GAP)
      : rectSouth(rect, SHELF_STAND_GAP);
  }
  if (code === "dock" || code === "reserve") {
    return rect.h > rect.w
      ? rectWest(rect, DESK_STAND_GAP)
      : rectNorth(rect, DESK_STAND_GAP);
  }
  return rectFront(rect);
}

export function staffStand(code: string): { x: number; y: number } {
  const rect = FURNITURE_BY_CODE.get(code);
  if (!rect) {
    return approachPoint(code);
  }
  if (code === "counter") {
    /** Horizontal : clerk au sud (derrière le bureau) ; vertical : à l’est. */
    return rect.w >= rect.h
      ? rectSouth(rect, DESK_STAND_GAP)
      : rectEast(rect, DESK_STAND_GAP);
  }
  if (code === "dock" || code === "reserve") {
    /** Derrière le meuble, contre le mur — gap pour ne pas entrer dans le mesh. */
    return rect.h > rect.w
      ? rectEast(rect, DESK_STAND_GAP)
      : rectSouth(rect, DESK_STAND_GAP);
  }
  return rectFront(rect);
}

export function queueStand(
  index: number,
  _counterCode: "counter" | "counter_b" = "counter",
): { x: number; y: number } {
  const spots = [
    { x: 42, y: 23 },
    { x: 43, y: 23 },
    { x: 41, y: 23 },
    { x: 44, y: 23 },
    { x: MID_X, y: 24 },
    { x: MID_X - 1, y: 24 },
  ];
  return spots[Math.max(0, Math.min(index, spots.length - 1))]!;
}

export function categoryToShelf(label: string): string {
  return shelfLocationFromCategoryName(label);
}

export function categoryCodeToShelf(code: string): string {
  return shelfLocationFromCategoryCode(code);
}
