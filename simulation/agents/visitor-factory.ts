import { generateDna } from "@/scripts/characters/dna";

import {
  anonymousName,
  ARCHETYPES,
  NAMED_VISITORS,
  WEIGHT_VALUE,
} from "../data/visitors";
import type { DayEvent } from "../data/day-events";
import {
  categoryToShelf,
  randomHallPoint,
  shelfCodes,
  spawnPoint,
} from "../map";
import { clampClientWalkable, findClientPath } from "../pathfinding";
import { locClient } from "../locations";
import { pickWeighted } from "../rng";
import type { VisitorAgent, VisitorTemperament } from "../types";

export type ClientInterest = {
  point: { x: number; y: number };
  shelf: string;
  atShelf: boolean;
};

export function pickClientInterest(
  rng: () => number,
  preferredShelf?: string,
): ClientInterest {
  const shelves = shelfCodes();
  const fallback =
    (preferredShelf && shelves.includes(preferredShelf)
      ? preferredShelf
      : shelves[0]) ?? "shelf_his";
  if (rng() < 0.75 && shelves.length > 0) {
    let code = shelves[Math.floor(rng() * shelves.length)]!;
    if (
      preferredShelf &&
      shelves.includes(preferredShelf) &&
      rng() < 0.5
    ) {
      code = preferredShelf;
    }
    return { point: locClient(code), shelf: code, atShelf: true };
  }
  return {
    point: clampClientWalkable(randomHallPoint(rng)),
    shelf: fallback,
    atShelf: false,
  };
}

export function rollTemperament(rng: () => number): VisitorTemperament {
  const temperRoll = rng();
  if (temperRoll < 0.14) return "impatient";
  if (temperRoll < 0.24) return "rare_seeker";
  if (temperRoll < 0.32) return "messy";
  return "calm";
}

export function createVisitorAgent(input: {
  simDay: number;
  visitorSeq: number;
  rng: () => number;
  dayEvent: DayEvent;
}): VisitorAgent {
  const { simDay, visitorSeq, rng, dayEvent } = input;
  const useNamed = rng() < 0.2;
  let name: string;
  let loreCode: string | null = null;
  let archetype: string;
  let categories: string[];
  let rarityPreference: string;
  let dna;

  if (useNamed) {
    const named = pickWeighted(
      NAMED_VISITORS,
      (row) => WEIGHT_VALUE[row.simulation_weight],
      rng,
    );
    name = named.name;
    loreCode = named.id;
    archetype = named.archetype;
    categories = named.preferred_categories;
    rarityPreference = named.rarity_preference;
    dna = generateDna(`visitor-${named.id}`, { outfit: "scholar_coat" });
  } else {
    const arch = ARCHETYPES[Math.floor(rng() * ARCHETYPES.length)]!;
    archetype = arch.name;
    categories = [...arch.categories];
    rarityPreference = rng() < 0.7 ? "common" : "mixed";
    name = anonymousName(Math.floor(rng() * 10_000));
    loreCode = null;
    dna = generateDna(`anon-${visitorSeq}-${name}`, {
      outfit: "visitor_cloak",
    });
  }

  if (dayEvent.category_boost.length > 0 && rng() < 0.55) {
    const boost =
      dayEvent.category_boost[
        Math.floor(rng() * dayEvent.category_boost.length)
      ]!;
    categories = [boost, ...categories.filter((c) => c !== boost)];
  }

  const preferredShelf = categoryToShelf(categories[0] ?? "Histoire");
  const start = clampClientWalkable(spawnPoint());
  const first = pickClientInterest(rng, preferredShelf);

  const temperament = rollTemperament(rng);
  if (temperament === "rare_seeker") {
    rarityPreference = "rare";
  }

  let patience = 10 + rng() * 14;
  if (temperament === "impatient") {
    patience = 3.5 + rng() * 4.5;
  }

  return {
    id: `v-${simDay}-${visitorSeq}`,
    name,
    lore_code: loreCode,
    archetype,
    dna,
    state: "roam",
    x: start.x,
    y: start.y,
    path: findClientPath(start, first.point),
    shelf_code: first.shelf,
    book_id: null,
    book_title: null,
    patience,
    wait: 0,
    browse_left: first.atShelf ? -1 : 0,
    visits_left: 2 + Math.floor(rng() * 4),
    preferred_categories: categories,
    rarity_preference: rarityPreference,
    advise_task_id: null,
    temperament,
  };
}
