export const SHELF_MAX = 10;

export type Stock = {
  id: number;
  book_id: number;
  title: string;
  purchase_price: number | string;
  sale_price: number | string;
  is_active: boolean;
  qty_reserve: number;
  qty_shelf: number;
  alert_threshold: number;
  first_received_at: string | Date;
  updated_at: string | Date;
};

export type LoadStatus = "loading" | "ready" | "error";

export function formatFlorins(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString("fr-FR");
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n.toLocaleString("fr-FR");
  }
  return "—";
}

export function formatStockDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Max qty that can still be moved reserve → shelf (D29). */
export function getMaxTransferQty(stock: Stock): number {
  const shelfRoom = Math.max(0, SHELF_MAX - stock.qty_shelf);
  return Math.min(stock.qty_reserve, shelfRoom);
}

export function isShelfLow(stock: Stock): boolean {
  return stock.qty_shelf <= stock.alert_threshold;
}

export function isReserveEmpty(stock: Stock): boolean {
  return stock.qty_reserve <= 0;
}
