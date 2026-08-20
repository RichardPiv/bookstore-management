import {
  ACTIVE_ALERT_STATUS_NAMES,
  RESERVE_LOW_ALERT_TYPE_NAMES,
  RESERVE_OUT_ALERT_TYPE_NAMES,
  RESOLVED_ALERT_STATUS_NAMES,
  SHELF_LOW_ALERT_TYPE_NAMES,
  SHELF_OUT_ALERT_TYPE_NAMES,
} from "@/lib/alert-references";

export type AlertRef = {
  id: number;
  name: string;
};

export type AlertBook = {
  id: number;
  title: string;
  purchase_price: number | string;
  sale_price: number | string;
  is_active: boolean;
  qty_reserve: number | null;
  qty_shelf: number | null;
  alert_threshold: number | null;
  first_received_at: string | Date | null;
};

export type Alert = {
  id: number;
  description: string;
  alert_datetime: string | Date;
  book_id: number;
  alert_type_id: number;
  alert_status_id: number;
  book: AlertBook | null;
  alert_type: AlertRef | null;
  alert_status: AlertRef | null;
};

export type LoadStatus = "loading" | "ready" | "error";

export type AlertFilter = "active" | "resolved" | "all";

const ACTIVE_SET = new Set<string>(ACTIVE_ALERT_STATUS_NAMES);
const RESOLVED_SET = new Set<string>(RESOLVED_ALERT_STATUS_NAMES);
const SHELF_LOW_SET = new Set<string>(SHELF_LOW_ALERT_TYPE_NAMES);
const SHELF_OUT_SET = new Set<string>(SHELF_OUT_ALERT_TYPE_NAMES);
const RESERVE_LOW_SET = new Set<string>(RESERVE_LOW_ALERT_TYPE_NAMES);
const RESERVE_OUT_SET = new Set<string>(RESERVE_OUT_ALERT_TYPE_NAMES);

export const ALERT_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  ouverte: "Active",
  open: "Active",
  resolved: "Résolue",
  resolue: "Résolue",
  résolue: "Résolue",
  closed: "Résolue",
};

export const ALERT_TYPE_LABELS: Record<string, string> = {
  stock_rayon_bas: "Rayon bas",
  shelf_low: "Rayon bas",
  rupture_rayon: "Rupture rayon",
  shelf_out: "Rupture rayon",
  stockout: "Rupture rayon",
  stock_bas: "Réserve basse",
  reserve_low: "Réserve basse",
  rupture_stock: "Rupture réserve",
  reserve_out: "Rupture réserve",
};

export function getAlertStatusLabel(statusName: string | null | undefined) {
  if (!statusName) return "Inconnu";
  return ALERT_STATUS_LABELS[statusName] ?? statusName;
}

export function getAlertTypeLabel(typeName: string | null | undefined) {
  if (!typeName) return "Alerte";
  return ALERT_TYPE_LABELS[typeName] ?? typeName;
}

export function isAlertActive(statusName: string | null | undefined) {
  if (!statusName) return false;
  return ACTIVE_SET.has(statusName);
}

export function isAlertResolved(statusName: string | null | undefined) {
  if (!statusName) return false;
  return RESOLVED_SET.has(statusName);
}

export function isShelfOutAlert(typeName: string | null | undefined) {
  if (!typeName) return false;
  return SHELF_OUT_SET.has(typeName);
}

export function isShelfLowAlert(typeName: string | null | undefined) {
  if (!typeName) return false;
  return SHELF_LOW_SET.has(typeName);
}

export function isReserveOutAlert(typeName: string | null | undefined) {
  if (!typeName) return false;
  return RESERVE_OUT_SET.has(typeName);
}

export function isReserveLowAlert(typeName: string | null | undefined) {
  if (!typeName) return false;
  return RESERVE_LOW_SET.has(typeName);
}

export function formatAlertDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function matchesAlertFilter(alert: Alert, filter: AlertFilter) {
  const statusName = alert.alert_status?.name;
  if (filter === "all") return true;
  if (filter === "active") return isAlertActive(statusName);
  return isAlertResolved(statusName);
}
