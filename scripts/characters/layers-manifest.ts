/** Manifest personnages — chemins assets + constantes d’anim (doc 14). */

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

/** Ordre de composition paper-doll (calques). */
export const LAYER_STACK: LayerSlot[] = [
  "shadow",
  "body",
  "outfit",
  "hair_back",
  "head",
  "hair",
  "accessory",
];

/** Outfits du hero set interim (`public/img/characters/full/`). */
export const FULL_SPRITE_OUTFITS = [
  "archivist_robe",
  "dock_apron",
  "stocker_tunic",
] as const;

export type FullSpriteOutfit = (typeof FULL_SPRITE_OUTFITS)[number];

export function hasFullSpriteOutfit(outfit: string): outfit is FullSpriteOutfit {
  return (FULL_SPRITE_OUTFITS as readonly string[]).includes(outfit);
}

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

/** Idle ~5.5 fps (4 frames) · walk ~9 fps (6 frames) — doc 14 §5. */
export function resolveFrame(anim: CharAnim, timeSec: number): number {
  if (anim === "walk") {
    return Math.floor(timeSec * 9) % WALK_FRAMES;
  }
  return Math.floor(timeSec * 5.5) % IDLE_FRAMES;
}

/** Décalage pixel corps (bob léger) — utile aux calques. */
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

export function fullSpritePath(
  outfit: string,
  dir: CharDir,
  anim: CharAnim,
  frame: number,
): string {
  return `/img/characters/full/${outfit}_${dir}_${anim}_${frame}.png`;
}

export function layerSpritePath(
  slot: LayerSlot,
  variant: string,
  dir: CharDir,
  anim: CharAnim,
  frame: number,
): string {
  return `/img/characters/layers/${slot}/${variant}_${dir}_${anim}_${frame}.png`;
}

export function bodyVariant(body: number): string {
  return `body0${Math.max(1, Math.min(3, body))}`;
}

export function hairVariant(hair: number): string {
  return `hair0${Math.max(1, Math.min(6, hair))}`;
}
