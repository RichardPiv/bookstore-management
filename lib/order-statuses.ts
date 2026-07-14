/** Supplier order statuses that block book deactivation (D35). */
export const IN_PROGRESS_ORDER_STATUS_NAMES = [
  "pending",
  "en_attente",
] as const;

/** Supplier order statuses considered received / completed. */
export const RECEIVED_ORDER_STATUS_NAMES = [
  "received",
  "livrée",
  "livree",
] as const;
