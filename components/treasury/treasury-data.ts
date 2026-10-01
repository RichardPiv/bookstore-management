export type TreasuryOverviewData = {
  id: number;
  balance: string | number;
  low_threshold: string | number;
  is_low: boolean;
  updated_at: string;
};

export type TreasuryMovementData = {
  id: number;
  type: string;
  amount: string | number;
  balance_after: string | number;
  unit_price: string | number | null;
  qty: number | null;
  order_id: number | null;
  order_line_id: number | null;
  book_id: number | null;
  simulation_event_id: number | null;
  note: string | null;
  created_at: string;
};

export type LoadStatus = "loading" | "ready" | "error";

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  supplier_purchase: "Achat fournisseur",
  customer_sale: "Vente client",
  adjustment_in: "Ajustement (+)",
  adjustment_out: "Ajustement (−)",
  wage: "Paie des employés",
};

export function formatFlorins(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return n.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  }
  return "—";
}

export function parseFlorins(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export function movementTypeLabel(type: string): string {
  return MOVEMENT_TYPE_LABELS[type] ?? type;
}

export function isDebitMovement(type: string): boolean {
  return type === "supplier_purchase" || type === "adjustment_out";
}

export function formatMovementDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
