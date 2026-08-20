export type DashboardLowStock = {
  book_id: number;
  title: string;
  qty_shelf: number;
  qty_reserve: number;
  alert_threshold: number;
  /** Remplissage rayon 0–100 (plafond 10). */
  shelf_fill_pct: number;
};

export type DashboardAlertPreview = {
  id: number;
  description: string;
  alert_datetime: Date;
  type_name: string | null;
  book_title: string | null;
  is_critical: boolean;
};

export type DashboardActivityEvent = {
  id: number;
  type: string;
  message: string;
  created_at: Date;
  is_error: boolean;
};

export type DashboardOverview = {
  catalog: {
    active_books: number;
    inventoried_books: number;
    total_units: number;
    shelf_units: number;
    reserve_units: number;
    /** Occupancy rayon vs plafond 10 × livres inventoriés. */
    shelf_capacity_pct: number;
  };
  sales: {
    purchases_today: number;
  };
  alerts: {
    active_count: number;
    critical_count: number;
  };
  orders: {
    pending_count: number;
  };
  low_stocks: DashboardLowStock[];
  recent_alerts: DashboardAlertPreview[];
  recent_events: DashboardActivityEvent[];
};
