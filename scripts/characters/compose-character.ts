import type { CharacterDna } from "./dna";
import {
  IDLE_FRAMES,
  WALK_FRAMES,
  resolveAnim,
  type CharAnim,
} from "./layers-manifest";

/** Taille du rendu canvas procédural (fiches staff + floor). */
export const CHARACTER_SIZE = 96;

const OUTFIT_COLORS: Record<string, string> = {
  archivist_robe: "#3a2e22",
  dock_apron: "#5a4634",
  stocker_tunic: "#4a3a28",
  visitor_cloak: "#2c241c",
  scholar_coat: "#3d332a",
};

const SLEEVE_CREAM = "#d4c4a8";
const SLEEVE_CREAM_DARK = "#b8a888";

const canvasCache = new Map<string, HTMLCanvasElement>();

type Pose = {
  bob: number;
  leftLegX: number;
  leftLegY: number;
  rightLegX: number;
  rightLegY: number;
  leftArmY: number;
  rightArmY: number;
  leftArmX: number;
  rightArmX: number;
};

/** Cycle marche 6 frames — membres opposés + bob. */
const WALK_POSE: Pose[] = [
  { bob: 0, leftLegX: 0, leftLegY: 0, rightLegX: 0, rightLegY: 0, leftArmY: 0, rightArmY: 0, leftArmX: 0, rightArmX: 0 },
  { bob: -1, leftLegX: 2, leftLegY: -1, rightLegX: -2, rightLegY: 1, leftArmY: 2, rightArmY: -2, leftArmX: -1, rightArmX: 1 },
  { bob: -2, leftLegX: 3, leftLegY: -2, rightLegX: -3, rightLegY: 2, leftArmY: 3, rightArmY: -3, leftArmX: -1, rightArmX: 1 },
  { bob: -1, leftLegX: 1, leftLegY: 0, rightLegX: -1, rightLegY: 0, leftArmY: 1, rightArmY: -1, leftArmX: 0, rightArmX: 0 },
  { bob: 0, leftLegX: -2, leftLegY: 1, rightLegX: 2, rightLegY: -1, leftArmY: -2, rightArmY: 2, leftArmX: 1, rightArmX: -1 },
  { bob: -1, leftLegX: -3, leftLegY: 2, rightLegX: 3, rightLegY: -2, leftArmY: -3, rightArmY: 3, leftArmX: 1, rightArmX: -1 },
];

/** Idle : respiration + micro bras. */
const IDLE_POSE: Pose[] = [
  { bob: 0, leftLegX: 0, leftLegY: 0, rightLegX: 0, rightLegY: 0, leftArmY: 0, rightArmY: 0, leftArmX: 0, rightArmX: 0 },
  { bob: -1, leftLegX: 0, leftLegY: 0, rightLegX: 0, rightLegY: 0, leftArmY: 1, rightArmY: -1, leftArmX: 0, rightArmX: 0 },
  { bob: -1, leftLegX: 0, leftLegY: 0, rightLegX: 0, rightLegY: 0, leftArmY: 1, rightArmY: -1, leftArmX: 1, rightArmX: -1 },
  { bob: 0, leftLegX: 0, leftLegY: 0, rightLegX: 0, rightLegY: 0, leftArmY: 0, rightArmY: 0, leftArmX: 0, rightArmX: 0 },
];

function poseFor(anim: CharAnim, frame: number): Pose {
  if (anim === "walk") {
    return WALK_POSE[frame % WALK_FRAMES] ?? WALK_POSE[0]!;
  }
  return IDLE_POSE[frame % IDLE_FRAMES] ?? IDLE_POSE[0]!;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = Number.parseInt(h.length === 3 ? h.repeat(2) : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const t = (c: number) => Math.max(0, Math.min(255, Math.round(c + amount)));
  return `rgb(${t(r)}, ${t(g)}, ${t(b)})`;
}

function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

function applyOutline(ctx: CanvasRenderingContext2D, size: number) {
  const src = ctx.getImageData(0, 0, size, size);
  const data = src.data;
  const solid = new Uint8Array(size * size);
  for (let i = 0; i < size * size; i += 1) {
    if (data[i * 4 + 3]! > 24) solid[i] = 1;
  }
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ] as const;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = y * size + x;
      if (solid[i]) continue;
      let edge = false;
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
        if (solid[ny * size + nx]) {
          edge = true;
          break;
        }
      }
      if (!edge) continue;
      const p = i * 4;
      data[p] = 42;
      data[p + 1] = 28;
      data[p + 2] = 18;
      data[p + 3] = 255;
    }
  }
  ctx.putImageData(src, 0, 0);
}

function outfitColor(dna: CharacterDna): string {
  return OUTFIT_COLORS[dna.outfit] ?? OUTFIT_COLORS.visitor_cloak!;
}

function pantColor(outfit: string): string {
  if (outfit === "dock_apron") return "#3a4a5a";
  if (outfit === "stocker_tunic") return "#3a2a1c";
  return "#241810";
}

function usesCreamSleeves(outfit: string): boolean {
  return outfit === "stocker_tunic" || outfit === "dock_apron";
}

function drawHair(
  ctx: CanvasRenderingContext2D,
  dna: CharacterDna,
  headX: number,
  headY: number,
  headW: number,
  headH: number,
  facing: "down" | "up" | "side",
) {
  const hair = dna.hairColor;
  const hairLight = shade(hair, 36);
  const hairMid = shade(hair, 12);
  const hairDark = shade(hair, -40);
  const style = dna.hair;

  px(ctx, headX - 2, headY - 3, headW + 4, 8, hair);
  px(ctx, headX, headY - 5, headW, 4, hairLight);
  px(ctx, headX + 2, headY - 4, headW - 4, 2, hairMid);
  px(ctx, headX + 1, headY - 2, 3, 2, hairDark);
  px(ctx, headX + headW - 4, headY - 1, 3, 2, hairDark);

  if (style === 5) {
    px(ctx, headX + 3, headY - 1, headW - 6, 4, shade(dna.skin, -18));
    return;
  }

  if (facing === "up") {
    px(ctx, headX - 2, headY, headW + 4, headH - 2, hair);
    px(ctx, headX + 2, headY + 2, headW - 4, headH - 6, hairDark);
    px(ctx, headX + 4, headY + 4, headW - 8, 4, hairLight);
    return;
  }

  if (style % 2 === 0) {
    px(ctx, headX - 4, headY + 2, 5, 18, hair);
    px(ctx, headX + headW - 1, headY + 2, 5, 18, hair);
    px(ctx, headX - 3, headY + 3, 3, 8, hairLight);
    px(ctx, headX + headW, headY + 4, 2, 6, hairMid);
  }

  if (style >= 4) {
    px(ctx, headX + 3, headY - 9, headW - 6, 7, hair);
    px(ctx, headX + 5, headY - 10, headW - 10, 3, hairLight);
    px(ctx, headX + 6, headY - 7, 4, 3, hairDark);
  }

  if (style === 3 || style === 6) {
    px(ctx, headX - 3, headY + 12, 6, 20, hairDark);
    px(ctx, headX + headW - 3, headY + 12, 6, 20, hairDark);
    px(ctx, headX - 2, headY + 14, 3, 10, hairMid);
    px(ctx, headX + headW - 1, headY + 16, 2, 8, hairLight);
  }

  if (facing === "side") {
    px(ctx, headX + headW - 3, headY, 9, headH, hair);
    px(ctx, headX + headW + 1, headY + 2, 4, 10, hairLight);
    px(ctx, headX + headW, headY + 12, 5, 10, hairDark);
  }
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  dna: CharacterDna,
  headX: number,
  headY: number,
  headW: number,
  profile: boolean,
) {
  const skin = dna.skin;
  const skinDark = shade(skin, -28);
  const skinLight = shade(skin, 26);
  px(ctx, headX, headY, headW, 22, skin);
  px(ctx, headX + 2, headY, headW - 4, 5, skinLight);
  px(ctx, headX + 1, headY + 5, 2, 8, skinLight);
  px(ctx, headX + 2, headY + 16, headW - 4, 6, skinDark);
  px(ctx, headX + headW - 4, headY + 8, 2, 6, skinDark);

  if (profile) {
    px(ctx, headX + headW - 3, headY + 7, 5, 5, skin);
    px(ctx, headX + 6, headY + 9, 3, 3, "#1a120c");
    px(ctx, headX + 7, headY + 9, 1, 1, "#f0e0d3");
    px(ctx, headX + headW - 2, headY + 12, 3, 2, skinDark);
    px(ctx, headX + 9, headY + 15, 5, 2, shade(skin, -42));
    return;
  }

  px(ctx, headX - 2, headY + 8, 3, 5, skin);
  px(ctx, headX + headW - 1, headY + 8, 3, 5, skin);
  px(ctx, headX + 5, headY + 9, 3, 3, "#1a120c");
  px(ctx, headX + headW - 8, headY + 9, 3, 3, "#1a120c");
  px(ctx, headX + 6, headY + 9, 1, 1, "#f0e0d3");
  px(ctx, headX + headW - 7, headY + 9, 1, 1, "#f0e0d3");
  px(ctx, headX + 4, headY + 8, 4, 1, shade(dna.hairColor, -20));
  px(ctx, headX + headW - 8, headY + 8, 4, 1, shade(dna.hairColor, -20));
  px(ctx, headX + Math.floor(headW / 2) - 1, headY + 12, 3, 2, skinDark);
  if (dna.hair !== 5) {
    px(ctx, headX + Math.floor(headW / 2) - 2, headY + 16, 5, 2, shade(skin, -44));
  }
}

function drawOutfitFront(
  ctx: CanvasRenderingContext2D,
  dna: CharacterDna,
  bodyX: number,
  bodyY: number,
  bodyW: number,
  robeH: number,
) {
  const outfit = outfitColor(dna);
  const light = shade(outfit, 28);
  const dark = shade(outfit, -28);
  const mid = shade(outfit, -10);

  px(ctx, bodyX, bodyY, bodyW, robeH, outfit);
  px(ctx, bodyX + 2, bodyY, bodyW - 4, 5, light);
  px(ctx, bodyX + 1, bodyY + 5, 3, robeH - 12, light);
  px(ctx, bodyX + bodyW - 4, bodyY + 8, 2, robeH - 16, dark);
  px(ctx, bodyX, bodyY + robeH - 7, bodyW, 7, dark);
  px(ctx, bodyX + Math.floor(bodyW / 2) - 1, bodyY + 7, 2, robeH - 14, mid);

  // ceinture
  px(ctx, bodyX + 2, bodyY + 18, bodyW - 4, 4, shade(outfit, -40));
  px(ctx, bodyX + Math.floor(bodyW / 2) - 2, bodyY + 18, 5, 4, dna.accent);
  px(ctx, bodyX + Math.floor(bodyW / 2) - 1, bodyY + 19, 3, 2, shade(dna.accent, 30));

  // col / accent
  px(ctx, bodyX + 3, bodyY + 4, bodyW - 6, 3, dna.accent);
  px(ctx, bodyX + 4, bodyY + 6, 2, 10, shade(dna.accent, -18));

  if (dna.outfit === "archivist_robe") {
    px(ctx, bodyX + 2, bodyY + robeH - 9, bodyW - 4, 3, "#c5a059");
    px(ctx, bodyX + 3, bodyY + robeH - 8, bodyW - 6, 1, shade("#c5a059", 40));
    px(ctx, bodyX, bodyY - 3, 7, 14, outfit);
    px(ctx, bodyX + bodyW - 7, bodyY - 3, 7, 14, outfit);
    px(ctx, bodyX + 1, bodyY - 2, 5, 3, light);
    px(ctx, bodyX + bodyW - 6, bodyY - 2, 4, 3, light);
  }
  if (dna.outfit === "dock_apron") {
    px(ctx, bodyX + 5, bodyY + 10, bodyW - 10, robeH - 18, "#8a7358");
    px(ctx, bodyX + 6, bodyY + 11, bodyW - 12, 3, shade("#8a7358", 24));
    px(ctx, bodyX + 6, bodyY + 14, bodyW - 12, 2, shade("#8a7358", -20));
    px(ctx, bodyX + Math.floor(bodyW / 2) - 1, bodyY + 22, 3, 4, "#5a4634");
  }
  if (dna.outfit === "stocker_tunic") {
    px(ctx, bodyX + 2, bodyY + robeH - 8, bodyW - 4, 2, "#c5a059");
    px(ctx, bodyX + 3, bodyY + 3, bodyW - 6, 2, "#c5a059");
  }
  if (dna.outfit === "scholar_coat") {
    px(ctx, bodyX + 2, bodyY + 5, 7, robeH - 12, light);
    px(ctx, bodyX + bodyW - 9, bodyY + 5, 7, robeH - 12, light);
    px(ctx, bodyX + 3, bodyY + 6, 2, robeH - 14, dna.accent);
  }
  if (dna.outfit === "visitor_cloak") {
    px(ctx, bodyX - 2, bodyY + 4, 4, robeH - 8, dark);
    px(ctx, bodyX + bodyW - 2, bodyY + 4, 4, robeH - 8, dark);
    px(ctx, bodyX, bodyY + 2, bodyW, 3, light);
  }
}

function drawBoot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facingOut: boolean,
) {
  const boot = "#2a2018";
  const bootLight = "#4a3a2a";
  // Pied compact — pas de large « socle » sous le personnage
  px(ctx, x, y, 6, 3, boot);
  px(ctx, x + 1, y, 4, 1, bootLight);
  if (facingOut) {
    px(ctx, x + 5, y + 1, 2, 2, boot);
  }
}

function drawLegsFront(
  ctx: CanvasRenderingContext2D,
  bodyX: number,
  bodyW: number,
  footY: number,
  pose: Pose,
  outfit: string,
) {
  const pant = pantColor(outfit);
  const pantLight = shade(pant, 22);
  const lx = bodyX + 6 + pose.leftLegX;
  const rx = bodyX + bodyW - 12 + pose.rightLegX;
  const ly = footY - 12 + pose.leftLegY;
  const ry = footY - 12 + pose.rightLegY;

  px(ctx, lx, ly, 6, 12, pant);
  px(ctx, lx + 1, ly, 2, 9, pantLight);
  px(ctx, rx, ry, 6, 12, pant);
  px(ctx, rx + 1, ry, 2, 9, pantLight);
  drawBoot(ctx, lx, footY - 3 + pose.leftLegY, false);
  drawBoot(ctx, rx, footY - 3 + pose.rightLegY, false);
}

function drawArm(
  ctx: CanvasRenderingContext2D,
  dna: CharacterDna,
  x: number,
  y: number,
  flip: boolean,
) {
  const outfit = outfitColor(dna);
  const cream = usesCreamSleeves(dna.outfit);
  const sleeve = cream ? SLEEVE_CREAM : outfit;
  const sleeveDark = cream ? SLEEVE_CREAM_DARK : shade(outfit, -22);
  const sleeveLight = cream ? shade(SLEEVE_CREAM, 20) : shade(outfit, 24);

  // manche courte tunique (stocker) au-dessus de la crème
  if (cream && dna.outfit === "stocker_tunic") {
    px(ctx, x, y, 7, 10, outfit);
    px(ctx, x + (flip ? 4 : 1), y + 1, 2, 7, shade(outfit, 20));
    px(ctx, x, y + 10, 7, 12, sleeve);
    px(ctx, x + (flip ? 4 : 1), y + 11, 2, 8, sleeveLight);
    px(ctx, x + 1, y + 18, 5, 2, sleeveDark);
  } else {
    px(ctx, x, y, 7, 20, sleeve);
    px(ctx, x + (flip ? 4 : 1), y + 2, 2, 14, sleeveLight);
    px(ctx, x + 1, y + 16, 5, 3, sleeveDark);
  }
  px(ctx, x + (flip ? 0 : 1), y + 20, 6, 6, dna.skin);
  px(ctx, x + (flip ? 1 : 2), y + 20, 3, 2, shade(dna.skin, 18));
  px(ctx, x + (flip ? 0 : 2), y + 24, 4, 2, shade(dna.skin, -20));
}

function drawArmsFront(
  ctx: CanvasRenderingContext2D,
  dna: CharacterDna,
  bodyX: number,
  bodyY: number,
  bodyW: number,
  pose: Pose,
) {
  drawArm(
    ctx,
    dna,
    bodyX - 6 + pose.leftArmX,
    bodyY + 6 + pose.leftArmY,
    false,
  );
  drawArm(
    ctx,
    dna,
    bodyX + bodyW - 1 + pose.rightArmX,
    bodyY + 6 + pose.rightArmY,
    true,
  );
}

function drawFront(
  ctx: CanvasRenderingContext2D,
  dna: CharacterDna,
  pose: Pose,
) {
  const bodyW = dna.body === 1 ? 26 : dna.body === 2 ? 32 : 29;
  const bodyX = 48 - Math.floor(bodyW / 2);
  const bodyY = 32 + pose.bob;
  const robeH = 38;
  const headW = 24;
  const headX = 48 - 12;
  const headY = 10 + pose.bob;
  const footY = 86 + pose.bob;

  drawLegsFront(ctx, bodyX, bodyW, footY, pose, dna.outfit);
  drawOutfitFront(ctx, dna, bodyX, bodyY, bodyW, robeH);
  drawArmsFront(ctx, dna, bodyX, bodyY, bodyW, pose);
  px(ctx, 45, 30 + pose.bob, 6, 6, shade(dna.skin, -10));
  drawFace(ctx, dna, headX, headY, headW, false);
  drawHair(ctx, dna, headX, headY, headW, 22, "down");
}

function drawBack(
  ctx: CanvasRenderingContext2D,
  dna: CharacterDna,
  pose: Pose,
) {
  const bodyW = dna.body === 1 ? 26 : dna.body === 2 ? 32 : 29;
  const bodyX = 48 - Math.floor(bodyW / 2);
  const bodyY = 32 + pose.bob;
  const outfit = outfitColor(dna);
  const footY = 86 + pose.bob;

  drawLegsFront(ctx, bodyX, bodyW, footY, pose, dna.outfit);
  px(ctx, bodyX, bodyY, bodyW, 38, outfit);
  px(ctx, bodyX + 2, bodyY, bodyW - 4, 5, shade(outfit, 22));
  px(ctx, bodyX, bodyY + 31, bodyW, 7, shade(outfit, -26));
  px(ctx, bodyX + 2, bodyY + 18, bodyW - 4, 4, shade(outfit, -36));
  drawArm(ctx, dna, bodyX - 6 + pose.rightArmX, bodyY + 6 + pose.rightArmY, false);
  drawArm(ctx, dna, bodyX + bodyW - 1 + pose.leftArmX, bodyY + 6 + pose.leftArmY, true);
  const headW = 24;
  const headX = 36;
  const headY = 10 + pose.bob;
  px(ctx, headX, headY, headW, 22, dna.skin);
  drawHair(ctx, dna, headX, headY, headW, 22, "up");
}

function drawProfile(
  ctx: CanvasRenderingContext2D,
  dna: CharacterDna,
  pose: Pose,
) {
  const outfit = outfitColor(dna);
  const bodyW = 24;
  const bodyX = 38;
  const bodyY = 32 + pose.bob;
  const footY = 86 + pose.bob;
  const pant = pantColor(dna.outfit);

  // jambe arrière puis avant
  const backX = bodyX + 4 + pose.rightLegX;
  const frontX = bodyX + 13 + pose.leftLegX;
  px(ctx, backX, footY - 12 + pose.rightLegY, 6, 12, pant);
  px(ctx, frontX, footY - 12 + pose.leftLegY, 6, 12, pant);
  drawBoot(ctx, backX, footY - 3 + pose.rightLegY, false);
  drawBoot(ctx, frontX, footY - 3 + pose.leftLegY, true);

  px(ctx, bodyX, bodyY, bodyW, 38, outfit);
  px(ctx, bodyX + 2, bodyY, bodyW - 4, 5, shade(outfit, 24));
  px(ctx, bodyX + 5, bodyY + 8, 4, 16, dna.accent);
  px(ctx, bodyX + 2, bodyY + 18, bodyW - 4, 4, shade(outfit, -36));
  px(ctx, bodyX + Math.floor(bodyW / 2) - 2, bodyY + 18, 5, 4, dna.accent);
  if (dna.outfit === "archivist_robe") {
    px(ctx, bodyX + 2, bodyY + 30, bodyW - 4, 3, "#c5a059");
  }
  if (dna.outfit === "stocker_tunic") {
    px(ctx, bodyX + 2, bodyY + 30, bodyW - 4, 2, "#c5a059");
  }

  // bras visible (avant)
  const armX = bodyX + 18 + pose.leftArmX;
  const armY = bodyY + 8 + pose.leftArmY;
  drawArm(ctx, dna, armX, armY, true);

  const headW = 20;
  const headX = 42;
  const headY = 10 + pose.bob;
  px(ctx, 48, 30 + pose.bob, 6, 6, shade(dna.skin, -10));
  drawFace(ctx, dna, headX, headY, headW, true);
  drawHair(ctx, dna, headX, headY, headW, 22, "side");
}

function cacheKey(
  dna: CharacterDna,
  facing: string,
  anim: string,
  frame: number,
  mode: string,
): string {
  return `${dna.seed}|${dna.outfit}|${dna.hair}|${dna.skin}|${dna.hairColor}|${facing}|${anim}|${frame}|${mode}`;
}

/** Dessine un personnage 96×96 Reliquary (canvas procédural). */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  dna: CharacterDna,
  options: {
    facing?: "down" | "left" | "right" | "up";
    walkFrame?: number;
    anim?: CharAnim;
    frame?: number;
  } = {},
) {
  const facing = options.facing ?? "down";
  const anim =
    options.anim ??
    (options.walkFrame != null && options.walkFrame > 0 ? "walk" : "idle");
  const frame =
    options.frame ??
    (anim === "walk" ? (options.walkFrame ?? 0) % WALK_FRAMES : 0);
  const pose = poseFor(anim, frame);

  ctx.clearRect(0, 0, CHARACTER_SIZE, CHARACTER_SIZE);

  if (facing === "right") {
    ctx.save();
    ctx.translate(CHARACTER_SIZE, 0);
    ctx.scale(-1, 1);
    drawProfile(ctx, dna, pose);
    ctx.restore();
  } else if (facing === "left") {
    drawProfile(ctx, dna, pose);
  } else if (facing === "up") {
    drawBack(ctx, dna, pose);
  } else {
    drawFront(ctx, dna, pose);
  }

  applyOutline(ctx, CHARACTER_SIZE);
}

function normalizePose(options?: {
  facing?: "down" | "left" | "right" | "up";
  walkFrame?: number;
  anim?: CharAnim;
  frame?: number;
  walking?: boolean;
}): {
  facing: "down" | "left" | "right" | "up";
  anim: CharAnim;
  frame: number;
} {
  const facing = options?.facing ?? "down";
  const anim =
    options?.anim ??
    (options?.walking != null
      ? resolveAnim(options.walking)
      : options?.walkFrame != null && options.walkFrame > 0
        ? "walk"
        : "idle");
  const frame =
    options?.frame ??
    (anim === "walk"
      ? (options?.walkFrame ?? 0) % WALK_FRAMES
      : (options?.walkFrame ?? 0) % IDLE_FRAMES);
  return { facing, anim, frame };
}

function composeProcedural(
  dna: CharacterDna,
  facing: "down" | "left" | "right" | "up",
  anim: CharAnim,
  frame: number,
): HTMLCanvasElement {
  const source = document.createElement("canvas");
  source.width = CHARACTER_SIZE;
  source.height = CHARACTER_SIZE;
  const srcCtx = source.getContext("2d");
  if (!srcCtx) {
    throw new Error("Canvas 2D indisponible.");
  }
  srcCtx.imageSmoothingEnabled = false;
  drawCharacter(srcCtx, dna, { facing, anim, frame });
  return source;
}

export function composeCharacterCanvas(
  dna: CharacterDna,
  options?: {
    facing?: "down" | "left" | "right" | "up";
    walkFrame?: number;
    anim?: CharAnim;
    frame?: number;
    walking?: boolean;
    scale?: number;
  },
): HTMLCanvasElement {
  const { facing, anim, frame } = normalizePose(options);
  const scale = options?.scale ?? 1;
  const key = `${cacheKey(dna, facing, anim, frame, "proc")}|${scale}`;
  const cached = canvasCache.get(key);
  if (cached) {
    return cached;
  }

  const source = composeProcedural(dna, facing, anim, frame);
  if (scale === 1) {
    canvasCache.set(key, source);
    return source;
  }

  const out = document.createElement("canvas");
  out.width = source.width * scale;
  out.height = source.height * scale;
  const outCtx = out.getContext("2d");
  if (!outCtx) {
    canvasCache.set(key, source);
    return source;
  }
  outCtx.imageSmoothingEnabled = false;
  outCtx.drawImage(source, 0, 0, out.width, out.height);
  canvasCache.set(key, out);
  return out;
}

export function composeCharacterDataUrl(
  dna: CharacterDna,
  options?: {
    facing?: "down" | "left" | "right" | "up";
    walkFrame?: number;
    anim?: CharAnim;
    frame?: number;
    scale?: number;
  },
): string {
  return composeCharacterCanvas(dna, options).toDataURL("image/png");
}

export {
  CHAR_W,
  CHAR_H,
  IDLE_FRAMES,
  WALK_FRAMES,
  resolveAnim,
  resolveFrame,
  facingToDir,
} from "./layers-manifest";
export type { CharAnim, CharDir } from "./layers-manifest";
