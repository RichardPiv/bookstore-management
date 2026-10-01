/** Manifest personnages — constantes d’anim (rendu canvas procédural). */

export const CHAR_W = 64;
export const CHAR_H = 96;

export const IDLE_FRAMES = 4;
export const WALK_FRAMES = 6;

export type CharDir = "down" | "up" | "side";
export type CharAnim = "idle" | "walk";

export type LayerSlot =
  | "shadow"
  | "body"
  | "outfit"
  | "hair_back"
  | "head"
  | "hair"
  | "accessory";

/** Ordre de composition historique (paper-doll archivé). */
export const LAYER_STACK: LayerSlot[] = [
  "shadow",
  "body",
  "outfit",
  "hair_back",
  "head",
  "hair",
  "accessory",
];

export function facingToDir(
  facing: "down" | "left" | "right" | "up",
): { dir: CharDir; flipX: boolean } {
  if (facing === "up") return { dir: "up", flipX: false };
  if (facing === "left") return { dir: "side", flipX: false };
  if (facing === "right") return { dir: "side", flipX: true };
  return { dir: "down", flipX: false };
}

export function frameCount(anim: CharAnim): number {
  return anim === "walk" ? WALK_FRAMES : IDLE_FRAMES;
}

export function resolveAnim(walking: boolean): CharAnim {
  return walking ? "walk" : "idle";
}

export function resolveFrame(anim: CharAnim, timeSec: number): number {
  if (anim === "walk") {
    // ~12 fps de cycle membres (plus fluide que le slide du sprite)
    return Math.floor(timeSec * 12) % WALK_FRAMES;
  }
  return Math.floor(timeSec * 5) % IDLE_FRAMES;
}

/** Décalage pixel corps (bob léger). */
export function animPixelOffset(
  anim: CharAnim,
  frame: number,
): { dx: number; dy: number } {
  if (anim === "idle") {
    const bob = [0, -1, 0, -1][frame % IDLE_FRAMES] ?? 0;
    return { dx: 0, dy: bob };
  }
  const bob = [0, -1, -2, -1, 0, -1][frame % WALK_FRAMES] ?? 0;
  const sway = [0, 1, 0, 0, -1, 0][frame % WALK_FRAMES] ?? 0;
  return { dx: sway, dy: bob };
}
