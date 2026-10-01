export type NamedVisitor = {
  id: string;
  name: string;
  archetype: string;
  preferred_categories: string[];
  rarity_preference: string;
  simulation_weight: "high" | "medium" | "low";
};

export const NAMED_VISITORS: NamedVisitor[] = [
  {
    id: "CLI-001",
    name: "Lorian Veyr",
    archetype: "Apprenti mage",
    preferred_categories: ["Arcane", "Histoire"],
    rarity_preference: "common",
    simulation_weight: "high",
  },
  {
    id: "CLI-002",
    name: "Maëra Solven",
    archetype: "Apprenti mage",
    preferred_categories: ["Arcane"],
    rarity_preference: "mixed",
    simulation_weight: "medium",
  },
  {
    id: "CLI-003",
    name: "Teren Alvior",
    archetype: "Étudiant des écoles archivistiques",
    preferred_categories: ["Histoire", "Arcane"],
    rarity_preference: "common",
    simulation_weight: "high",
  },
  {
    id: "CLI-004",
    name: "Yselle Marovan",
    archetype: "Étudiant des écoles archivistiques",
    preferred_categories: ["Histoire"],
    rarity_preference: "mixed",
    simulation_weight: "medium",
  },
  {
    id: "CLI-005",
    name: "Calien Rhovar",
    archetype: "Botaniste",
    preferred_categories: ["Botanique"],
    rarity_preference: "common",
    simulation_weight: "high",
  },
  {
    id: "CLI-006",
    name: "Nalia Verdan",
    archetype: "Botaniste",
    preferred_categories: ["Botanique", "Arcane"],
    rarity_preference: "rare",
    simulation_weight: "medium",
  },
  {
    id: "CLI-007",
    name: "Oren Caldrys",
    archetype: "Érudit",
    preferred_categories: ["Histoire"],
    rarity_preference: "mixed",
    simulation_weight: "medium",
  },
  {
    id: "CLI-008",
    name: "Selma Orvane",
    archetype: "Érudit",
    preferred_categories: ["Histoire", "Nécromancie"],
    rarity_preference: "mixed",
    simulation_weight: "low",
  },
  {
    id: "CLI-009",
    name: "Darel Voskan",
    archetype: "Fonctionnaire de la Guilde",
    preferred_categories: ["Histoire"],
    rarity_preference: "common",
    simulation_weight: "high",
  },
  {
    id: "CLI-010",
    name: "Elira Montess",
    archetype: "Marchand",
    preferred_categories: ["Histoire", "Botanique"],
    rarity_preference: "common",
    simulation_weight: "medium",
  },
  {
    id: "CLI-011",
    name: "Kael Ruvian",
    archetype: "Voyageur",
    preferred_categories: ["Histoire", "Botanique"],
    rarity_preference: "common",
    simulation_weight: "medium",
  },
  {
    id: "CLI-012",
    name: "Arwen Lysorel",
    archetype: "Représentant d'institution",
    preferred_categories: ["Histoire", "Arcane"],
    rarity_preference: "mixed",
    simulation_weight: "low",
  },
];

export const ARCHETYPES = [
  { name: "Apprenti mage", categories: ["Arcane"] },
  { name: "Étudiant des écoles archivistiques", categories: ["Histoire"] },
  { name: "Botaniste", categories: ["Botanique"] },
  { name: "Érudit", categories: ["Histoire"] },
  { name: "Fonctionnaire de la Guilde", categories: ["Histoire"] },
  { name: "Marchand", categories: ["Histoire", "Botanique"] },
  { name: "Voyageur", categories: ["Histoire"] },
  { name: "Représentant d'institution", categories: ["Histoire", "Arcane"] },
] as const;

const ANON_FIRST = [
  "Rin",
  "Vala",
  "Torin",
  "Mira",
  "Soren",
  "Elda",
  "Bram",
  "Neris",
  "Joss",
  "Cale",
];
const ANON_LAST = [
  "Dusk",
  "Halden",
  "Parch",
  "Quill",
  "Vellum",
  "Ashen",
  "Morrow",
  "Fen",
];

export const WEIGHT_VALUE = { high: 3, medium: 2, low: 1 } as const;

export function anonymousName(seed: number): string {
  const first = ANON_FIRST[seed % ANON_FIRST.length]!;
  const last = ANON_LAST[Math.floor(seed / 10) % ANON_LAST.length]!;
  return `${first} ${last}`;
}
