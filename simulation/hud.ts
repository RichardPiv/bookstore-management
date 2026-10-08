import { dayEventHudLabel, type DayEvent } from "./data/day-events";
import type {
  HudAlert,
  StaffAgent,
  WorldBook,
  WorldInbound,
  WorldTask,
} from "./types";

export type HudAlertInput = {
  catchUpBanner: string | null;
  queueLength: number;
  books: WorldBook[];
  tasks: WorldTask[];
  staff: StaffAgent[];
  inbound: WorldInbound[];
  unpaidWages: boolean;
  dayEvent: DayEvent;
};

export function buildHudAlerts(input: HudAlertInput): HudAlert[] {
  const alerts: HudAlert[] = [];
  if (input.catchUpBanner) {
    alerts.push({
      id: "catch_up",
      kind: "catch_up",
      label: input.catchUpBanner,
      severity: "info",
    });
  }
  if (input.queueLength >= 4) {
    alerts.push({
      id: "long_queue",
      kind: "long_queue",
      label: `File longue (${input.queueLength}) — renfort vendeur utile`,
      severity: input.queueLength >= 6 ? "urgent" : "warn",
    });
  }
  const emptyWithReserve = input.books.filter(
    (book) => book.qty_shelf <= 0 && book.qty_reserve > 0,
  );
  if (emptyWithReserve.length > 0) {
    const sample = emptyWithReserve[0]!;
    alerts.push({
      id: "empty_shelf",
      kind: "empty_shelf",
      label:
        emptyWithReserve.length === 1
          ? `Rayon vide : « ${sample.title} » (réserve OK)`
          : `${emptyWithReserve.length} titres en rupture rayon (réserve OK)`,
      severity: emptyWithReserve.length >= 3 ? "urgent" : "warn",
    });
  }
  const deliveryPending = input.tasks.some(
    (task) =>
      task.type === "RECEIVE_DELIVERY" &&
      (task.status === "pending" || task.status === "in_progress"),
  );
  const receiverBusy = input.staff.some(
    (agent) => agent.role === "receiver" && agent.duty === "working",
  );
  if (deliveryPending && !receiverBusy) {
    alerts.push({
      id: "delivery_waiting",
      kind: "delivery_waiting",
      label: "Convoi en attente — pas de réceptionnaire actif",
      severity: "warn",
    });
  }
  const enRoute = input.inbound.filter(
    (row) => !row.arrived && !row.has_receive_task,
  );
  if (enRoute.length > 0) {
    const next = enRoute[0]!;
    alerts.push({
      id: "inbound_convoy",
      kind: "inbound_convoy",
      label:
        enRoute.length === 1
          ? `Convoi en route · ETA ${next.eta_label}`
          : `${enRoute.length} convois en route · prochain ${next.eta_label}`,
      severity: "info",
    });
  }
  if (input.unpaidWages) {
    alerts.push({
      id: "unpaid_wages",
      kind: "unpaid_wages",
      label: "Paie partielle hier — moral en berne, renflouez la caisse",
      severity: "urgent",
    });
  }
  if (input.dayEvent.kind !== "quiet") {
    alerts.push({
      id: "day_event",
      kind: "day_event",
      label: `${input.dayEvent.title} — ${input.dayEvent.blurb}`,
      severity: "info",
    });
  }
  return alerts;
}

export function dayEventLabel(event: DayEvent): string {
  return dayEventHudLabel(event);
}
