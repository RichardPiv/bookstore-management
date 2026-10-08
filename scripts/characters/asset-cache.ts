import {
  IDLE_FRAMES,
  LAYER_STACK,
  WALK_FRAMES,
  bodyVariant,
  facingToDir,
  fullSpritePath,
  hairVariant,
  hasFullSpriteOutfit,
  layerSpritePath,
  type CharAnim,
  type CharDir,
  type LayerSlot,
} from "./layers-manifest";
import type { CharacterDna } from "./dna";

type CacheEntry = HTMLImageElement | "missing" | "loading";

const imageCache = new Map<string, CacheEntry>();
const waiters = new Map<string, Array<(img: HTMLImageElement | null) => void>>();
const readyListeners = new Set<() => void>();

function notify(url: string, img: HTMLImageElement | null) {
  const list = waiters.get(url);
  if (!list) return;
  waiters.delete(url);
  for (const cb of list) cb(img);
}

function notifyReady() {
  for (const cb of readyListeners) cb();
}

/** Abonne un callback quand une image finit de charger (succès ou erreur). */
export function onCharacterAssetReady(cb: () => void): () => void {
  readyListeners.add(cb);
  return () => {
    readyListeners.delete(cb);
  };
}

/** Charge une image (idempotent). Retourne le bitmap si déjà prêt. */
export function ensureImage(url: string): HTMLImageElement | null {
  const cached = imageCache.get(url);
  if (cached instanceof HTMLImageElement) return cached;
  if (cached === "missing") return null;
  if (cached === "loading") return null;

  if (typeof Image === "undefined") {
    imageCache.set(url, "missing");
    return null;
  }

  imageCache.set(url, "loading");
  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    imageCache.set(url, img);
    notify(url, img);
    notifyReady();
  };
  img.onerror = () => {
    imageCache.set(url, "missing");
    notify(url, null);
    notifyReady();
  };
  img.src = url;
  return null;
}

export function getCachedImage(url: string): HTMLImageElement | null {
  const cached = imageCache.get(url);
  return cached instanceof HTMLImageElement ? cached : null;
}

export function isImageMissing(url: string): boolean {
  return imageCache.get(url) === "missing";
}

export function isImageLoading(url: string): boolean {
  return imageCache.get(url) === "loading";
}

export function whenImageReady(
  url: string,
): Promise<HTMLImageElement | null> {
  const ready = getCachedImage(url);
  if (ready) return Promise.resolve(ready);
  if (isImageMissing(url)) return Promise.resolve(null);
  ensureImage(url);
  return new Promise((resolve) => {
    const list = waiters.get(url) ?? [];
    list.push(resolve);
    waiters.set(url, list);
  });
}

function layerUrlsForPose(
  dna: CharacterDna,
  dir: CharDir,
  anim: CharAnim,
  frame: number,
): string[] {
  const urls: string[] = [];
  for (const slot of LAYER_STACK) {
    if (slot === "accessory") continue;
    let variant: string | null = null;
    if (slot === "shadow") variant = "shadow";
    else if (slot === "body" || slot === "head") variant = bodyVariant(dna.body);
    else if (slot === "outfit") variant = dna.outfit;
    else if (slot === "hair" || slot === "hair_back") {
      variant = hairVariant(dna.hair);
    }
    if (!variant) continue;
    urls.push(layerSpritePath(slot as LayerSlot, variant, dir, anim, frame));
  }
  return urls;
}

/** URLs nécessaires pour une pose (full ou layers). */
export function urlsForDnaPose(
  dna: CharacterDna,
  facing: "down" | "left" | "right" | "up",
  anim: CharAnim,
  frame: number,
): string[] {
  const { dir } = facingToDir(facing);
  if (hasFullSpriteOutfit(dna.outfit)) {
    return [fullSpritePath(dna.outfit, dir, anim, frame)];
  }
  return layerUrlsForPose(dna, dir, anim, frame);
}

/**
 * Lazy warm : démarre le chargement des frames utiles pour un agent
 * (pose courante + frame walk suivante), sans tout le catalogue.
 */
export function warmDnaPose(
  dna: CharacterDna,
  facing: "down" | "left" | "right" | "up",
  anim: CharAnim,
  frame: number,
  opts?: { prefetchNeighbors?: boolean },
): void {
  for (const url of urlsForDnaPose(dna, facing, anim, frame)) {
    ensureImage(url);
  }
  if (!opts?.prefetchNeighbors) return;

  if (anim === "walk") {
    const next = (frame + 1) % WALK_FRAMES;
    for (const url of urlsForDnaPose(dna, facing, anim, next)) {
      ensureImage(url);
    }
  } else {
    const next = (frame + 1) % IDLE_FRAMES;
    for (const url of urlsForDnaPose(dna, facing, anim, next)) {
      ensureImage(url);
    }
  }
}

/** Attend uniquement les assets d’une pose (fiche staff / 1 frame). */
export async function warmDnaPoseAsync(
  dna: CharacterDna,
  facing: "down" | "left" | "right" | "up",
  anim: CharAnim,
  frame: number,
): Promise<void> {
  const urls = urlsForDnaPose(dna, facing, anim, frame);
  await Promise.all(urls.map((url) => whenImageReady(url)));
}

/** @deprecated Utiliser warmDnaPose — conservé pour imports existants. */
export async function preloadCharacterAssets(
  outfits?: readonly string[],
): Promise<void> {
  if (!outfits || outfits.length === 0) return;
  const dirs: CharDir[] = ["down", "side", "up"];
  const anims: CharAnim[] = ["idle", "walk"];
  const urls: string[] = [];
  for (const outfit of outfits) {
    if (!hasFullSpriteOutfit(outfit)) continue;
    for (const dir of dirs) {
      for (const anim of anims) {
        const count = anim === "walk" ? WALK_FRAMES : IDLE_FRAMES;
        // Lazy : seulement frame 0 de chaque combo (warm léger)
        urls.push(fullSpritePath(outfit, dir, anim, 0));
        if (count > 1) {
          urls.push(fullSpritePath(outfit, dir, anim, 1));
        }
      }
    }
  }
  await Promise.all(urls.map((url) => whenImageReady(url)));
}

/** @deprecated No-op — les layers se chargent à la demande. */
export async function preloadPaperDollLayers(): Promise<void> {
  return;
}

export function clearCharacterImageCache() {
  imageCache.clear();
  waiters.clear();
}
