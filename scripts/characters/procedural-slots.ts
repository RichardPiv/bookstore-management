import { PixelCanvas } from "./pixel-canvas";
import {
  CHAR_H,
  CHAR_W,
  IDLE_FRAMES,
  WALK_FRAMES,
  type CharAnim,
  type CharDir,
  type LayerSlot,
} from "./layers-manifest";

/**
 * Paper-doll procédural Reliquary — silhouettes connectées 64×96.
 * Masques gris pour skin/hair (multiply DNA) ; outfits en couleurs finales.
 */

const MASK_HI = "#e8e0d8";
const MASK_MID = "#c8b8a8";
const MASK_LO = "#9a8a7a";
const MASK_DK = "#6e5e50";

const OUTFIT_COLORS: Record<string, string> = {
  archivist_robe: "#3a2e22",
  dock_apron: "#5a4634",
  stocker_tunic: "#4a3a28",
  visitor_cloak: "#2c241c",
  scholar_coat: "#3d332a",
};

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

const WALK_POSE: Pose[] = [
  { bob: 0, leftLegX: 0, leftLegY: 0, rightLegX: 0, rightLegY: 0, leftArmY: 0, rightArmY: 0, leftArmX: 0, rightArmX: 0 },
  { bob: -1, leftLegX: 2, leftLegY: -1, rightLegX: -2, rightLegY: 1, leftArmY: 2, rightArmY: -2, leftArmX: -1, rightArmX: 1 },
  { bob: -2, leftLegX: 3, leftLegY: -2, rightLegX: -3, rightLegY: 2, leftArmY: 3, rightArmY: -3, leftArmX: -1, rightArmX: 1 },
  { bob: -1, leftLegX: 1, leftLegY: 0, rightLegX: -1, rightLegY: 0, leftArmY: 1, rightArmY: -1, leftArmX: 0, rightArmX: 0 },
  { bob: 0, leftLegX: -2, leftLegY: 1, rightLegX: 2, rightLegY: -1, leftArmY: -2, rightArmY: 2, leftArmX: 1, rightArmX: -1 },
  { bob: -1, leftLegX: -3, leftLegY: 2, rightLegX: 3, rightLegY: -2, leftArmY: -3, rightArmY: 3, leftArmX: 1, rightArmX: -1 },
];

const IDLE_POSE: Pose[] = [
  { bob: 0, leftLegX: 0, leftLegY: 0, rightLegX: 0, rightLegY: 0, leftArmY: 0, rightArmY: 0, leftArmX: 0, rightArmX: 0 },
  { bob: -1, leftLegX: 0, leftLegY: 0, rightLegX: 0, rightLegY: 0, leftArmY: 1, rightArmY: -1, leftArmX: 0, rightArmX: 0 },
  { bob: -1, leftLegX: 0, leftLegY: 0, rightLegX: 0, rightLegY: 0, leftArmY: 1, rightArmY: -1, leftArmX: 1, rightArmX: -1 },
  { bob: 0, leftLegX: 0, leftLegY: 0, rightLegX: 0, rightLegY: 0, leftArmY: 0, rightArmY: 0, leftArmX: 0, rightArmX: 0 },
];

export type SlotDrawInput = {
  slot: LayerSlot;
  dir: CharDir;
  anim: CharAnim;
  frame: number;
  body: number;
  hair: number;
  outfit: string;
  painted?: boolean;
};

function poseFor(anim: CharAnim, frame: number): Pose {
  if (anim === "walk") {
    return WALK_POSE[frame % WALK_FRAMES] ?? WALK_POSE[0]!;
  }
  return IDLE_POSE[frame % IDLE_FRAMES] ?? IDLE_POSE[0]!;
}

function shade(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = Number.parseInt(full, 16);
  const t = (c: number) => Math.max(0, Math.min(255, Math.round(c + amount)));
  return `rgb(${t((n >> 16) & 255)}, ${t((n >> 8) & 255)}, ${t(n & 255)})`;
}

function bodyW(body: number) {
  return body === 1 ? 18 : body === 2 ? 22 : 20;
}

function outfitColor(outfit: string): string {
  return OUTFIT_COLORS[outfit] ?? OUTFIT_COLORS.visitor_cloak!;
}

function pantOf(outfit: string, mask: boolean): string {
  if (mask) return MASK_DK;
  if (outfit === "dock_apron") return "#3a4a5a";
  if (outfit === "stocker_tunic") return "#3a2a1c";
  return "#241810";
}

/** Dessine un calque paper-doll 64×96. */
export function drawLayerSlot(input: SlotDrawInput): PixelCanvas {
  const canvas = new PixelCanvas(CHAR_W, CHAR_H);
  const pose = poseFor(input.anim, input.frame);
  const mask = !input.painted;

  switch (input.slot) {
    case "shadow":
      drawShadow(canvas, pose);
      break;
    case "body":
      drawBody(canvas, input, pose, mask);
      break;
    case "outfit":
      drawOutfit(canvas, input, pose);
      break;
    case "head":
      drawHead(canvas, input, pose, mask);
      break;
    case "hair":
      drawHair(canvas, input, pose, mask, false);
      break;
    case "hair_back":
      drawHair(canvas, input, pose, mask, true);
      break;
    default:
      break;
  }
  return canvas;
}

function drawShadow(c: PixelCanvas, pose: Pose) {
  const cy = 91 + Math.min(0, pose.bob);
  for (let dy = -2; dy <= 2; dy += 1) {
    const half = 11 - Math.abs(dy) * 2;
    c.fillRect(32 - half, cy + dy, half * 2, 1, "#1a120c", 55 - Math.abs(dy) * 10);
  }
}

function drawBody(
  c: PixelCanvas,
  input: SlotDrawInput,
  pose: Pose,
  mask: boolean,
) {
  const skin = mask ? MASK_MID : "#c4a07a";
  const skinL = mask ? MASK_HI : shade("#c4a07a", 22);
  const skinD = mask ? MASK_LO : shade("#c4a07a", -24);
  const pant = pantOf(input.outfit, mask);
  const boot = mask ? MASK_DK : "#2a2018";
  const bw = bodyW(input.body);
  const bx = 32 - Math.floor(bw / 2);
  const by = 34 + pose.bob;
  const footY = 88 + pose.bob;

  if (input.dir === "side") {
    // jambe arrière → avant (attachées au bassin)
    const hipY = by + 28;
    c.fillRect(bx + 6 + pose.rightLegX, hipY + pose.rightLegY, 5, footY - hipY - 2, pant);
    c.fillRect(bx + 11 + pose.leftLegX, hipY + pose.leftLegY, 5, footY - hipY - 2, pant);
    c.fillRect(bx + 5 + pose.rightLegX, footY - 3 + pose.rightLegY, 6, 3, boot);
    c.fillRect(bx + 11 + pose.leftLegX, footY - 3 + pose.leftLegY, 7, 3, boot);
    // bassin / torse sous robe
    c.fillRect(bx + 5, by + 22, 12, 8, skinD);
    // cou
    c.fillRect(bx + 8, by - 2, 5, 5, skin);
    // main
    c.fillRect(
      bx + 16 + pose.leftArmX,
      by + 8 + pose.leftArmY + 16,
      5,
      5,
      skin,
    );
    c.fillRect(
      bx + 17 + pose.leftArmX,
      by + 8 + pose.leftArmY + 16,
      2,
      2,
      skinL,
    );
    return;
  }

  // face / dos — jambes liées au bassin
  const hipY = by + 30;
  const lx = bx + 3 + pose.leftLegX;
  const rx = bx + bw - 8 + pose.rightLegX;
  c.fillRect(lx, hipY + pose.leftLegY, 6, footY - hipY - 2, pant);
  c.fillRect(rx, hipY + pose.rightLegY, 6, footY - hipY - 2, pant);
  c.fillRect(lx + 1, hipY + 2 + pose.leftLegY, 2, 8, shade(pant, 18));
  c.fillRect(rx + 1, hipY + 2 + pose.rightLegY, 2, 8, shade(pant, 18));
  c.fillRect(lx, footY - 3 + pose.leftLegY, 6, 3, boot);
  c.fillRect(rx, footY - 3 + pose.rightLegY, 6, 3, boot);
  // bassin
  c.fillRect(bx + 2, hipY - 4, bw - 4, 6, skinD);
  // cou
  c.fillRect(29, by - 2, 6, 5, skin);
  c.fillRect(30, by - 1, 2, 2, skinL);
  // mains
  c.fillRect(bx - 5 + pose.leftArmX, by + 6 + pose.leftArmY + 17, 5, 5, skin);
  c.fillRect(bx + bw + pose.rightArmX, by + 6 + pose.rightArmY + 17, 5, 5, skin);
  c.fillRect(bx - 4 + pose.leftArmX, by + 6 + pose.leftArmY + 17, 2, 2, skinL);
}

function drawOutfit(c: PixelCanvas, input: SlotDrawInput, pose: Pose) {
  const outfit = outfitColor(input.outfit);
  const light = shade(outfit, 26);
  const dark = shade(outfit, -26);
  const accent = "#c5a059";
  const bw = bodyW(input.body);
  const bx = 32 - Math.floor(bw / 2);
  const by = 34 + pose.bob;
  const robeH = 32;
  const cream = input.outfit === "stocker_tunic" || input.outfit === "dock_apron";
  const sleeve = cream ? "#d4c4a8" : outfit;

  if (input.dir === "side") {
    c.fillRect(bx + 4, by, 14, robeH, outfit);
    c.fillRect(bx + 5, by, 12, 4, light);
    c.fillRect(bx + 8, by + 6, 3, 12, accent);
    c.fillRect(bx + 5, by + 14, 12, 3, shade(outfit, -34));
    c.fillRect(bx + 5, by + robeH - 5, 12, 4, dark);
    // manche avant
    c.fillRect(bx + 14 + pose.leftArmX, by + 5 + pose.leftArmY, 6, 16, sleeve);
    c.fillRect(bx + 15 + pose.leftArmX, by + 6 + pose.leftArmY, 2, 10, shade(sleeve, 18));
    if (input.outfit === "archivist_robe") {
      c.fillRect(bx + 5, by + robeH - 7, 12, 2, accent);
      c.fillRect(bx + 3, by - 1, 5, 8, outfit);
    }
    if (input.outfit === "dock_apron") {
      c.fillRect(bx + 6, by + 8, 10, 14, "#8a7358");
    }
    if (input.outfit === "stocker_tunic") {
      c.fillRect(bx + 5, by + 2, 12, 2, accent);
      c.fillRect(bx + 5, by + robeH - 6, 12, 2, accent);
    }
    return;
  }

  if (input.dir === "up") {
    c.fillRect(bx, by, bw, robeH, outfit);
    c.fillRect(bx + 1, by, bw - 2, 4, light);
    c.fillRect(bx, by + robeH - 5, bw, 5, dark);
    c.fillRect(bx + 2, by + 14, bw - 4, 3, shade(outfit, -34));
    c.fillRect(bx - 5 + pose.rightArmX, by + 5 + pose.rightArmY, 6, 16, sleeve);
    c.fillRect(bx + bw - 1 + pose.leftArmX, by + 5 + pose.leftArmY, 6, 16, sleeve);
    return;
  }

  // down — robe connectée
  c.fillRect(bx, by, bw, robeH, outfit);
  c.fillRect(bx + 1, by, bw - 2, 4, light);
  c.fillRect(bx + 1, by + 4, 2, robeH - 10, light);
  c.fillRect(bx + bw - 3, by + 6, 2, robeH - 12, dark);
  c.fillRect(bx, by + robeH - 5, bw, 5, dark);
  c.fillRect(bx + 2, by + 14, bw - 4, 3, shade(outfit, -38));
  c.fillRect(bx + Math.floor(bw / 2) - 2, by + 14, 4, 3, accent);
  c.fillRect(bx + 3, by + 3, bw - 6, 2, accent);

  if (input.outfit === "archivist_robe") {
    c.fillRect(bx + 1, by + robeH - 7, bw - 2, 2, accent);
    c.fillRect(bx - 1, by - 1, 5, 10, outfit);
    c.fillRect(bx + bw - 4, by - 1, 5, 10, outfit);
    c.fillRect(bx, by, 3, 3, light);
  }
  if (input.outfit === "dock_apron") {
    c.fillRect(bx + 3, by + 8, bw - 6, robeH - 14, "#8a7358");
    c.fillRect(bx + 4, by + 9, bw - 8, 2, shade("#8a7358", 20));
  }
  if (input.outfit === "stocker_tunic") {
    c.fillRect(bx + 1, by + 2, bw - 2, 2, accent);
    c.fillRect(bx + 1, by + robeH - 6, bw - 2, 2, accent);
  }
  if (input.outfit === "scholar_coat") {
    c.fillRect(bx + 1, by + 5, 5, robeH - 12, light);
    c.fillRect(bx + bw - 6, by + 5, 5, robeH - 12, light);
    c.fillRect(bx + 2, by + 6, 2, robeH - 14, accent);
  }
  if (input.outfit === "visitor_cloak") {
    c.fillRect(bx - 2, by + 2, 4, robeH - 8, dark);
    c.fillRect(bx + bw - 2, by + 2, 4, robeH - 8, dark);
  }

  // manches attachées aux épaules
  c.fillRect(bx - 5 + pose.leftArmX, by + 4 + pose.leftArmY, 6, 16, sleeve);
  c.fillRect(bx + bw - 1 + pose.rightArmX, by + 4 + pose.rightArmY, 6, 16, sleeve);
  c.fillRect(bx - 4 + pose.leftArmX, by + 5 + pose.leftArmY, 2, 10, shade(sleeve, 16));
  c.fillRect(bx + bw + pose.rightArmX, by + 5 + pose.rightArmY, 2, 10, shade(sleeve, 16));
  if (cream && input.outfit === "stocker_tunic") {
    c.fillRect(bx - 5 + pose.leftArmX, by + 4 + pose.leftArmY, 6, 7, outfit);
    c.fillRect(bx + bw - 1 + pose.rightArmX, by + 4 + pose.rightArmY, 6, 7, outfit);
  }
}

function drawHead(
  c: PixelCanvas,
  input: SlotDrawInput,
  pose: Pose,
  mask: boolean,
) {
  const skin = mask ? MASK_MID : "#c4a07a";
  const skinL = mask ? MASK_HI : shade("#c4a07a", 22);
  const skinD = mask ? MASK_LO : shade("#c4a07a", -22);
  const eye = mask ? MASK_DK : "#1a120c";
  const headY = 10 + pose.bob;

  if (input.dir === "side") {
    c.fillRect(24, headY, 16, 18, skin);
    c.fillRect(25, headY, 14, 4, skinL);
    c.fillRect(25, headY + 13, 14, 4, skinD);
    c.fillRect(36, headY + 6, 4, 4, skin); // nez
    c.fillRect(30, headY + 8, 2, 2, eye);
    if (!mask) {
      c.fillRect(31, headY + 8, 1, 1, "#f0e0d3");
      c.fillRect(33, headY + 13, 4, 1, shade("#c4a07a", -40));
    }
    return;
  }

  if (input.dir === "up") {
    c.fillRect(22, headY, 20, 18, skin);
    c.fillRect(23, headY, 18, 4, skinL);
    return;
  }

  c.fillRect(22, headY, 20, 18, skin);
  c.fillRect(23, headY, 18, 4, skinL);
  c.fillRect(23, headY + 13, 18, 4, skinD);
  // oreilles
  c.fillRect(20, headY + 6, 3, 4, skin);
  c.fillRect(41, headY + 6, 3, 4, skin);
  // yeux
  c.fillRect(26, headY + 7, 3, 3, eye);
  c.fillRect(35, headY + 7, 3, 3, eye);
  if (!mask) {
    c.fillRect(27, headY + 7, 1, 1, "#f0e0d3");
    c.fillRect(36, headY + 7, 1, 1, "#f0e0d3");
    c.fillRect(30, headY + 11, 4, 2, skinD);
    c.fillRect(29, headY + 14, 6, 1, shade("#c4a07a", -40));
  } else {
    c.fillRect(30, headY + 11, 4, 2, MASK_LO);
    c.fillRect(29, headY + 14, 6, 1, MASK_DK);
  }
}

function drawHair(
  c: PixelCanvas,
  input: SlotDrawInput,
  pose: Pose,
  mask: boolean,
  backOnly: boolean,
) {
  const hair = mask ? MASK_MID : "#2b1d14";
  const hairL = mask ? MASK_HI : shade("#2b1d14", 32);
  const hairD = mask ? MASK_LO : shade("#2b1d14", -36);
  const style = input.hair;
  const headY = 10 + pose.bob;
  const hx = input.dir === "side" ? 24 : 22;
  const hw = input.dir === "side" ? 16 : 20;

  if (backOnly) {
    if (input.dir === "up" || style === 3 || style === 6 || style % 2 === 0) {
      c.fillRect(hx - 1, headY + 2, hw + 2, 14, hair);
      c.fillRect(hx + 2, headY + 4, hw - 4, 10, hairD);
    }
    return;
  }

  // calotte
  c.fillRect(hx - 1, headY - 3, hw + 2, 7, hair);
  c.fillRect(hx, headY - 4, hw, 3, hairL);
  c.fillRect(hx + 2, headY - 2, 3, 2, hairD);

  if (style === 5) {
    // tonsure
    c.fillRect(hx + 4, headY - 1, hw - 8, 4, mask ? MASK_HI : "#c4a07a");
    return;
  }

  if (input.dir === "up") {
    c.fillRect(hx - 1, headY, hw + 2, 16, hair);
    c.fillRect(hx + 2, headY + 2, hw - 4, 12, hairD);
    return;
  }

  // mèches latérales
  if (style % 2 === 0) {
    c.fillRect(hx - 2, headY + 1, 4, 14, hair);
    c.fillRect(hx + hw - 2, headY + 1, 4, 14, hair);
    c.fillRect(hx - 1, headY + 2, 2, 6, hairL);
  }
  if (style >= 4) {
    c.fillRect(hx + 3, headY - 7, hw - 6, 5, hair);
    c.fillRect(hx + 5, headY - 8, hw - 10, 2, hairL);
  }
  if (style === 3 || style === 6) {
    c.fillRect(hx - 1, headY + 10, 4, 12, hairD);
    c.fillRect(hx + hw - 3, headY + 10, 4, 12, hairD);
  }
  if (input.dir === "side") {
    c.fillRect(hx + hw - 1, headY, 7, 16, hair);
    c.fillRect(hx + hw + 1, headY + 2, 3, 8, hairL);
  }
}

export function layerFileName(
  slot: LayerSlot,
  variant: string,
  dir: CharDir,
  anim: CharAnim,
  frame: number,
): string {
  return `${variant}_${dir}_${anim}_${frame}.png`;
}
