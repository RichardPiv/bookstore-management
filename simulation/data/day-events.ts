/**
 * Événements de journée lore (P2.6) — thème ou auteur invité.
 * Tirage déterministe par sim_day (rejouable).
 */

export type DayEventKind = "quiet" | "theme_day" | "guest_author";

export type DayEvent = {
  id: string;
  kind: DayEventKind;
  title: string;
  blurb: string;
  /** Noms de catégories boostées (utilités / spawn). */
  category_boost: string[];
  spawn_mult: number;
  buy_mult: number;
  guest_name?: string;
};

export const DAY_EVENTS: DayEvent[] = [
  {
    id: "quiet",
    kind: "quiet",
    title: "Journée calme",
    blurb: "Les allées respirent. Affluence modérée.",
    category_boost: [],
    spawn_mult: 0.9,
    buy_mult: 1,
  },
  {
    id: "theme_arcane",
    kind: "theme_day",
    title: "Journée des Arcanes",
    blurb: "Les néophytes cherchent grimoires et rituels.",
    category_boost: ["Arcane", "Rituels", "Enchantements"],
    spawn_mult: 1.25,
    buy_mult: 1.15,
  },
  {
    id: "theme_botanique",
    kind: "theme_day",
    title: "Marché des herbes",
    blurb: "Botanistes et guérisseurs envahissent la salle.",
    category_boost: ["Botanique & Agriculture", "Botanique", "Guérison", "Alchimie"],
    spawn_mult: 1.2,
    buy_mult: 1.12,
  },
  {
    id: "theme_histoire",
    kind: "theme_day",
    title: "Annales ouvertes",
    blurb: "Les archivistes de la Guilde consultent l'Histoire.",
    category_boost: ["Histoire", "Commerce & Droit", "Langues & Sociologie"],
    spawn_mult: 1.15,
    buy_mult: 1.1,
  },
  {
    id: "theme_necromancie",
    kind: "theme_day",
    title: "Veillée des cendres",
    blurb: "Demande discrète mais insistante en Nécromancie.",
    category_boost: ["Nécromancie", "Malédictions"],
    spawn_mult: 1.05,
    buy_mult: 1.2,
  },
  {
    id: "guest_orian",
    kind: "guest_author",
    title: "Auteur invité : Oriane Vell",
    blurb: "Dédicaces discrètes — la foule veut ses traités d'illusion.",
    category_boost: ["Illusions", "Arcane", "Romans"],
    spawn_mult: 1.35,
    buy_mult: 1.22,
    guest_name: "Oriane Vell",
  },
  {
    id: "guest_tham",
    kind: "guest_author",
    title: "Auteur invité : Tham Quill",
    blurb: "Chroniqueur de Port-Aster — files pour ses récits.",
    category_boost: ["Histoire", "Donjons & Voyages", "Romans"],
    spawn_mult: 1.3,
    buy_mult: 1.18,
    guest_name: "Tham Quill",
  },
  {
    id: "guest_sel",
    kind: "guest_author",
    title: "Auteur invité : Selka Myr",
    blurb: "Herboriste célèbre — les tables de lecture débordent.",
    category_boost: ["Botanique & Agriculture", "Botanique", "Médecine"],
    spawn_mult: 1.28,
    buy_mult: 1.16,
    guest_name: "Selka Myr",
  },
];

/** Tirage stable par jour simulé (index 0 = quiet un peu plus fréquent). */
export function pickDayEvent(simDay: number): DayEvent {
  const day = Math.max(1, Math.floor(simDay));
  // J1 souvent calme ; ensuite cycle pondéré
  if (day === 1) return DAY_EVENTS[0]!;
  const seed = (day * 2654435761) >>> 0;
  const roll = seed % 10;
  if (roll < 2) return DAY_EVENTS[0]!;
  const pool = DAY_EVENTS.slice(1);
  return pool[seed % pool.length]!;
}

export function dayEventHudLabel(event: DayEvent): string {
  if (event.kind === "quiet") return event.title;
  if (event.kind === "guest_author" && event.guest_name) {
    return `Invité · ${event.guest_name}`;
  }
  return event.title;
}
