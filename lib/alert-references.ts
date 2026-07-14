/** Alert statuses considered open / unresolved. */
export const ACTIVE_ALERT_STATUS_NAMES = [
  "active",
  "ouverte",
  "open",
] as const;

/** Alert statuses considered closed / resolved. */
export const RESOLVED_ALERT_STATUS_NAMES = [
  "resolved",
  "resolue",
  "résolue",
  "closed",
] as const;

/** Alert types for low shelf stock. */
export const SHELF_LOW_ALERT_TYPE_NAMES = [
  "stock_rayon_bas",
  "shelf_low",
] as const;

/** Alert types for shelf stockout. */
export const SHELF_OUT_ALERT_TYPE_NAMES = [
  "rupture_rayon",
  "shelf_out",
  "stockout",
] as const;
