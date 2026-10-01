export type CharacterDna = {
  seed: string;
  body: number;
  skin: string;
  hair: number;
  hairColor: string;
  outfit: string;
  accent: string;
};

const SKINS = ["#c4a07a", "#e0c4a0", "#8d5a3b", "#5c3a28", "#d8b898", "#a67c52"];
const HAIRS = ["#2b1d14", "#5a3a1e", "#c4a059", "#1a1410", "#6b3a4a", "#3d4a3a"];
const ACCENTS = ["#c5a059", "#7a5a32", "#4a3a28", "#8a6a4a", "#3a4a5a"];
const OUTFITS = [
  "archivist_robe",
  "dock_apron",
  "stocker_tunic",
  "visitor_cloak",
  "scholar_coat",
] as const;

export type OutfitId = (typeof OUTFITS)[number];

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function outfitForRole(role: string): OutfitId {
  if (role === "receiver") return "dock_apron";
  if (role === "stocker") return "stocker_tunic";
  if (role === "clerk") return "archivist_robe";
  return "visitor_cloak";
}

export function generateDna(
  seed: string,
  options: { outfit?: OutfitId } = {},
): CharacterDna {
  const rng = mulberry32(hashSeed(seed));
  const pick = <T>(list: readonly T[]): T => list[Math.floor(rng() * list.length)]!;
  return {
    seed,
    body: 1 + Math.floor(rng() * 3),
    skin: pick(SKINS),
    hair: 1 + Math.floor(rng() * 6),
    hairColor: pick(HAIRS),
    outfit: options.outfit ?? pick(OUTFITS),
    accent: pick(ACCENTS),
  };
}

export function parseDna(raw: string | CharacterDna): CharacterDna {
  if (typeof raw !== "string") {
    return raw;
  }
  try {
    const parsed = JSON.parse(raw) as CharacterDna;
    if (parsed && typeof parsed.seed === "string") {
      return parsed;
    }
  } catch {
    /* fallthrough */
  }
  return generateDna(raw);
}

export function serializeDna(dna: CharacterDna): string {
  return JSON.stringify(dna);
}
