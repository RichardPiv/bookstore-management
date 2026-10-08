export const OPEN_MINUTES = 9 * 60;
export const CLOSE_MINUTES = 18 * 60;
export const CELLS_PER_SIM_MINUTE = 2.5;
export const TICK_MS = 200;
export const MAX_VISITORS = 12;
export const MAX_AGENTS = 25;
/** Plafond rattrapage après onglet gelé (L5 / P0.5), en minutes simulées. */
export const CATCH_UP_CAP_MINUTES = 30;

export type EmployeeRole = "clerk" | "stocker" | "receiver";
export type EmployeeDutyStatus = "idle" | "working" | "paused";
export type VisitorState =
  | "enter"
  | "roam"
  | "consult"
  | "read"
  | "browse" // legacy snapshot
  | "ask_staff"
  | "queue"
  | "checkout"
  | "exit"
  | "leave_empty";

/** Profil comportemental client (P2.7). */
export type VisitorTemperament =
  | "calm"
  | "impatient"
  | "rare_seeker"
  | "messy";

export type WorldBook = {
  book_id: number;
  title: string;
  category_code: string;
  rarity: string;
  qty_shelf: number;
  qty_reserve: number;
  sale_price: string;
};

export type WorldTask = {
  id: number;
  type: "RESTOCK_SHELF" | "RECEIVE_DELIVERY" | "ADVISE_CUSTOMER";
  book_id: number | null;
  order_id: number | null;
  status: "pending" | "in_progress" | "done" | "cancelled";
  assignee_id: number | null;
  priority: number;
};

export type WorldEmployee = {
  id: number;
  name: string;
  role: EmployeeRole;
  status: string;
  wage_daily: string;
  appearance_json: string;
  stats_json: string;
  lore_code: string | null;
  is_dismissible: boolean;
};

export type EmployeeStats = {
  morale: number;
  fatigue: number;
  reliability: number;
  checkout_speed: number;
  advice: number;
  restock_speed: number;
  carry: number;
  receive_speed: number;
  specialty_shelf: string | null;
  /** Ancienneté / formation légère (P1.5). */
  xp: number;
  /** Clerk : prioritaire à l’encaissement (P1.6). */
  counter_focus: boolean;
};

export type VisitorAgent = {
  id: string;
  name: string;
  lore_code: string | null;
  archetype: string;
  dna: import("@/scripts/characters/dna").CharacterDna;
  state: VisitorState;
  x: number;
  y: number;
  path: Array<{ x: number; y: number }>;
  shelf_code: string;
  book_id: number | null;
  book_title: string | null;
  patience: number;
  wait: number;
  /** Temps restant à consulter un rayon (immobile). */
  browse_left: number;
  /** Nombre d’arrêts / rayons encore à faire avant de décider départ/achat. */
  visits_left: number;
  /** Catégories lore (noms) pour utilités d’achat D78. */
  preferred_categories: string[];
  /** common | mixed | rare */
  rarity_preference: string;
  /** Tâche runtime ADVISE_CUSTOMER (id négatif). */
  advise_task_id: number | null;
  temperament: VisitorTemperament;
};

export type StaffAgent = {
  id: number;
  name: string;
  role: EmployeeRole;
  dna: import("@/scripts/characters/dna").CharacterDna;
  stats: EmployeeStats;
  x: number;
  y: number;
  path: Array<{ x: number; y: number }>;
  duty: EmployeeDutyStatus;
  task_id: number | null;
  work_left: number;
  home: string;
  /** Visiteur en cours d’encaissement (évite double clerk). */
  serving_visitor_id: string | null;
};

export type EngineSnapshot = {
  version: 1;
  sim_day: number;
  sim_minutes: number;
  speed: number;
  paused: boolean;
  visitors: VisitorAgent[];
  staff: StaffAgent[];
  queue: string[];
  rng: number;
};

export type TickCommit = {
  type:
    | "sale"
    | "restock"
    | "receive"
    | "advise"
    | "delivery_arrive"
    | "staff_xp"
    | "event";
  book_id?: number | null;
  qty?: number;
  task_id?: number | null;
  order_id?: number | null;
  visitor_id?: string;
  employee_id?: number;
  xp_kind?: "checkout" | "advise" | "restock" | "receive";
  event_type?: string;
  message?: string;
};

export type HudAlertKind =
  | "long_queue"
  | "empty_shelf"
  | "delivery_waiting"
  | "inbound_convoy"
  | "unpaid_wages"
  | "day_event"
  | "catch_up";

export type HudAlert = {
  id: string;
  kind: HudAlertKind;
  label: string;
  severity: "info" | "warn" | "urgent";
};

export type WorldInbound = {
  order_id: number;
  eta_sim_day: number;
  eta_sim_minutes: number;
  eta_label: string;
  arrived: boolean;
  has_receive_task: boolean;
};

export type TickResult = {
  commits: TickCommit[];
  closed_day: boolean;
  clock: {
    sim_day: number;
    sim_minutes: number;
    speed: number;
    paused: boolean;
  };
};

export type HudState = {
  sim_day: number;
  sim_minutes: number;
  speed: number;
  paused: boolean;
  visitor_count: number;
  queue_length: number;
  staff_busy: number;
  last_event: string | null;
  alerts: HudAlert[];
  advise_pending: number;
  unpaid_wages: boolean;
  /** Titre court de l’événement du jour (P2.6). */
  day_event: string | null;
};

export type RenderAgent = {
  id: string;
  kind: "visitor" | "staff";
  name: string;
  role?: EmployeeRole;
  employee_id?: number;
  dna: import("@/scripts/characters/dna").CharacterDna;
  x: number;
  y: number;
  facing: "down" | "left" | "right" | "up";
  walking: boolean;
  state: string;
};

export function defaultStats(role: EmployeeRole): EmployeeStats {
  const base: EmployeeStats = {
    morale: 70,
    fatigue: 10,
    reliability: 65,
    checkout_speed: 50,
    advice: 50,
    restock_speed: 50,
    carry: 50,
    receive_speed: 50,
    specialty_shelf: null,
    xp: 0,
    counter_focus: role === "clerk",
  };
  if (role === "clerk") {
    base.checkout_speed = 68;
    base.advice = 62;
    base.counter_focus = true;
  }
  if (role === "stocker") {
    base.restock_speed = 70;
    base.carry = 64;
    base.counter_focus = false;
  }
  if (role === "receiver") {
    base.receive_speed = 72;
    base.counter_focus = false;
  }
  return base;
}

/** Soft-cap formation (P1.5) — progression ralentit près de 92. */
export const STAT_SOFT_CAP = 92;

export function bumpStat(current: number, amount: number): number {
  const value = Number.isFinite(current) ? current : 50;
  if (value >= STAT_SOFT_CAP) {
    return Math.min(100, value + amount * 0.15);
  }
  const room = STAT_SOFT_CAP - value;
  return Math.min(STAT_SOFT_CAP, value + amount * (0.45 + room / STAT_SOFT_CAP));
}

export type StaffXpKind = "checkout" | "advise" | "restock" | "receive";

export function applyXpGains(
  stats: EmployeeStats,
  kind: StaffXpKind,
): EmployeeStats {
  const next = { ...stats, xp: Math.min(9999, (stats.xp ?? 0) + 2) };
  if (kind === "checkout") {
    next.checkout_speed = bumpStat(next.checkout_speed, 1.1);
    next.reliability = bumpStat(next.reliability, 0.35);
  } else if (kind === "advise") {
    next.advice = bumpStat(next.advice, 1.2);
    next.reliability = bumpStat(next.reliability, 0.25);
  } else if (kind === "restock") {
    next.restock_speed = bumpStat(next.restock_speed, 1.1);
    next.carry = bumpStat(next.carry, 0.6);
  } else if (kind === "receive") {
    next.receive_speed = bumpStat(next.receive_speed, 1.15);
  }
  return next;
}

export function parseStats(raw: string): EmployeeStats {
  try {
    return { ...defaultStats("clerk"), ...(JSON.parse(raw) as EmployeeStats) };
  } catch {
    return defaultStats("clerk");
  }
}

export function formatSimClock(day: number, minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `J${day} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function spawnRate(simMinutes: number): number {
  const hour = simMinutes / 60;
  if (hour < 9.5 || hour >= 17.5) return 0.08;
  if (hour >= 12 && hour <= 15) return 0.35;
  return 0.18;
}
