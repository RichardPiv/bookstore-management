export type OrderStatus = {
  id: number;
  name: string;
};

export type OrderBook = {
  id: number;
  title: string;
  purchase_price: number | string;
  sale_price: number | string;
  qty_reserve: number | null;
  qty_shelf: number | null;
  alert_threshold: number | null;
  is_active: boolean;
};

export type OrderSupplier = {
  id: number;
  name: string;
};

export type OrderLine = {
  id: number;
  order_id: number;
  book_id: number;
  supplier_id: number;
  qty: number;
  book: OrderBook | null;
  supplier: OrderSupplier | null;
};

export type OrderUser = {
  id: number;
  username: string;
};

export type OrderDelivery = {
  id: number;
  type: string;
  delivery_status_id: number;
  delivery_datetime: string;
  delivery_status: OrderStatus | null;
};

export type Order = {
  id: number;
  order_datetime: string;
  delivery_id: number;
  user_id: number;
  order_status_id: number;
  lines: OrderLine[];
  order_status: OrderStatus | null;
  delivery: OrderDelivery | null;
  user: OrderUser | null;
};

export type LoadStatus = "loading" | "ready" | "error";

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  en_attente: "En attente",
  received: "Reçue",
  livrée: "Reçue",
  livree: "Reçue",
};

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  en_attente: "En attente",
  delivered: "Livrée",
  livrée: "Livrée",
  livree: "Livrée",
};

export function getOrderStatusLabel(statusName: string | null | undefined) {
  if (!statusName) return "Inconnu";
  return ORDER_STATUS_LABELS[statusName] ?? statusName;
}

export function getDeliveryStatusLabel(statusName: string | null | undefined) {
  if (!statusName) return "—";
  return DELIVERY_STATUS_LABELS[statusName] ?? statusName;
}

export function isOrderPending(statusName: string | null | undefined) {
  return statusName === "pending" || statusName === "en_attente";
}

export function formatOrderDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatOrderPrice(value: number | string) {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return "0";
  return amount.toLocaleString("fr-FR");
}

export function getOrderItemsCount(order: Order) {
  return (order.lines ?? []).reduce((total, line) => total + line.qty, 0);
}

export function getOrderLinesCount(order: Order) {
  return (order.lines ?? []).length;
}

export function getOrderTotal(order: Order) {
  return (order.lines ?? []).reduce((total, line) => {
    const unitPrice = Number(line.book?.purchase_price ?? 0);
    return total + unitPrice * line.qty;
  }, 0);
}
