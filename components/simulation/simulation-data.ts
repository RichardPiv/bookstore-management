/** Types alignés sur l'API simulation. */

export type SimulationEvent = {
  id: number;
  simulation_run_id: number;
  type: string;
  message: string;
  book_id: number | null;
  metadata: string | null;
  created_at: string | Date;
};

export type SimulationRun = {
  id: number;
  started_at: string | Date;
  ended_at: string | Date | null;
  events: SimulationEvent[];
};

export type SimulationPhase = "idle" | "running" | "done";

export const DEFAULT_EVENTS_COUNT = 10;
export const MIN_EVENTS_COUNT = 1;
export const MAX_EVENTS_COUNT = 50;

export const EVENTS_COUNT_PRESETS = [
  { label: "Courte", value: 5 },
  { label: "Normale", value: 10 },
  { label: "Intense", value: 25 },
] as const;

export const SIMULATION_EVENT_LABELS: Record<string, string> = {
  CUSTOMER_PURCHASE: "Achat",
  UNAVAILABLE_REQUEST: "Demande impossible",
  NO_STOCK: "Aucun stock",
};

export function getEventTypeLabel(type: string) {
  return SIMULATION_EVENT_LABELS[type] ?? type;
}

export function isWarningEvent(type: string) {
  return type === "UNAVAILABLE_REQUEST" || type === "NO_STOCK";
}

export function countPurchases(events: SimulationEvent[]) {
  return events.filter((event) => event.type === "CUSTOMER_PURCHASE").length;
}

export function formatSimulationTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
