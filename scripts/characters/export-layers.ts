/**
 * Export paper-doll hero set → public/img/characters/layers/
 *
 * Usage: npx tsx scripts/characters/export-layers.ts
 */
import { deflateSync } from "zlib";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

import {
  IDLE_FRAMES,
  WALK_FRAMES,
  bodyVariant,
  hairVariant,
  type CharAnim,
  type CharDir,
  type LayerSlot,
} from "./layers-manifest";
import { drawLayerSlot, layerFileName } from "./procedural-slots";

const ROOT = join(process.cwd(), "public", "img", "characters", "layers");

const DIRS: CharDir[] = ["down", "side", "up"];
const ANIMS: CharAnim[] = ["idle", "walk"];

const BODIES = [1, 2, 3];
const HAIRS = [1, 2, 3, 4, 5, 6];
const OUTFITS = [
  "archivist_robe",
  "dock_apron",
  "stocker_tunic",
  "visitor_cloak",
  "scholar_coat",
];

function writeSlot(
  slot: LayerSlot,
  variant: string,
  dir: CharDir,
  anim: CharAnim,
  frame: number,
  body: number,
  hair: number,
  outfit: string,
) {
  const painted = slot === "outfit" || slot === "shadow" || slot === "accessory";
  const canvas = drawLayerSlot({
    slot,
    dir,
    anim,
    frame,
    body,
    hair,
    outfit,
    painted,
  });
  if (slot !== "shadow") {
    canvas.applyOutline([58, 40, 28]);
  }
  const dirPath = join(ROOT, slot);
  mkdirSync(dirPath, { recursive: true });
  const file = join(dirPath, layerFileName(slot, variant, dir, anim, frame));
  writeFileSync(file, canvas.toPNGBuffer(deflateSync));
}

function framesFor(anim: CharAnim) {
  return anim === "walk" ? WALK_FRAMES : IDLE_FRAMES;
}

function main() {
  let count = 0;
  for (const dir of DIRS) {
    for (const anim of ANIMS) {
      const n = framesFor(anim);
      for (let frame = 0; frame < n; frame += 1) {
        // shadow partagé (variant shadow)
        writeSlot("shadow", "shadow", dir, anim, frame, 1, 1, "archivist_robe");
        count += 1;

        for (const body of BODIES) {
          const bv = bodyVariant(body);
          writeSlot("body", bv, dir, anim, frame, body, 1, "archivist_robe");
          writeSlot("head", bv, dir, anim, frame, body, 1, "archivist_robe");
          count += 2;
        }

        for (const hair of HAIRS) {
          const hv = hairVariant(hair);
          writeSlot("hair", hv, dir, anim, frame, 1, hair, "archivist_robe");
          writeSlot("hair_back", hv, dir, anim, frame, 1, hair, "archivist_robe");
          count += 2;
        }

        for (const outfit of OUTFITS) {
          writeSlot("outfit", outfit, dir, anim, frame, 2, 1, outfit);
          count += 1;
        }
      }
    }
  }
  console.log(`Exported ${count} layer PNGs → ${ROOT}`);
}

main();
