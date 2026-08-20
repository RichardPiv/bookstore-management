import { prisma } from "@/lib/prisma";
import {
  ACTIVE_ALERT_STATUS_NAMES,
  RESERVE_OUT_ALERT_TYPE_NAMES,
  SHELF_OUT_ALERT_TYPE_NAMES,
} from "@/lib/alert-references";
import { IN_PROGRESS_ORDER_STATUS_NAMES } from "@/lib/order-statuses";

import type {
  DashboardActivityEvent,
  DashboardAlertPreview,
  DashboardLowStock,
  DashboardOverview,
} from "./types";

const SHELF_MAX_QTY = 10;
const LOW_STOCK_LIMIT = 5;
const ACTIVITY_LIMIT = 8;
const ALERT_PREVIEW_LIMIT = 5;

const CRITICAL_ALERT_TYPE_NAMES = [
  ...SHELF_OUT_ALERT_TYPE_NAMES,
  ...RESERVE_OUT_ALERT_TYPE_NAMES,
] as const;

const ERROR_EVENT_TYPES = new Set([
  "NO_STOCK",
  "UNAVAILABLE_REQUEST",
]);

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function clampPct(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

/** Aggregated bookstore overview for the dashboard. */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  const todayStart = startOfToday();

  const [
    activeBooks,
    inventoriedBooks,
    stockAgg,
    activeAlertStatuses,
    criticalAlertTypes,
    pendingOrderStatuses,
    purchasesToday,
    lowStockRows,
    recentEvents,
  ] = await Promise.all([
    prisma.books.count({ where: { is_active: true } }),
    prisma.book_inventory.count(),
    prisma.book_inventory.aggregate({
      _sum: { qty_shelf: true, qty_reserve: true },
    }),
    prisma.alert_statuses.findMany({
      where: { name: { in: [...ACTIVE_ALERT_STATUS_NAMES] } },
      select: { id: true },
    }),
    prisma.alert_types.findMany({
      where: { name: { in: [...CRITICAL_ALERT_TYPE_NAMES] } },
      select: { id: true },
    }),
    prisma.order_statuses.findMany({
      where: { name: { in: [...IN_PROGRESS_ORDER_STATUS_NAMES] } },
      select: { id: true },
    }),
    prisma.simulation_events.count({
      where: {
        type: "CUSTOMER_PURCHASE",
        created_at: { gte: todayStart },
      },
    }),
    prisma.book_inventory.findMany({
      orderBy: [{ qty_shelf: "asc" }, { updated_at: "desc" }],
      take: 40,
      select: {
        book_id: true,
        qty_shelf: true,
        qty_reserve: true,
        alert_threshold: true,
      },
    }),
    prisma.simulation_events.findMany({
      orderBy: { created_at: "desc" },
      take: ACTIVITY_LIMIT,
      select: {
        id: true,
        type: true,
        message: true,
        created_at: true,
      },
    }),
  ]);

  const shelfUnits = stockAgg._sum.qty_shelf ?? 0;
  const reserveUnits = stockAgg._sum.qty_reserve ?? 0;
  const shelfCapacityPct =
    inventoriedBooks === 0
      ? 0
      : clampPct((shelfUnits / (inventoriedBooks * SHELF_MAX_QTY)) * 100);

  const activeStatusIds = activeAlertStatuses.map((s) => s.id);
  const criticalTypeIds = criticalAlertTypes.map((t) => t.id);
  const pendingStatusIds = pendingOrderStatuses.map((s) => s.id);

  const [activeCount, criticalCount, pendingCount, recentAlertRows] =
    await Promise.all([
      activeStatusIds.length === 0
        ? Promise.resolve(0)
        : prisma.alerts.count({
            where: { alert_status_id: { in: activeStatusIds } },
          }),
      activeStatusIds.length === 0 || criticalTypeIds.length === 0
        ? Promise.resolve(0)
        : prisma.alerts.count({
            where: {
              alert_status_id: { in: activeStatusIds },
              alert_type_id: { in: criticalTypeIds },
            },
          }),
      pendingStatusIds.length === 0
        ? Promise.resolve(0)
        : prisma.orders.count({
            where: { order_status_id: { in: pendingStatusIds } },
          }),
      activeStatusIds.length === 0
        ? Promise.resolve([])
        : prisma.alerts.findMany({
            where: { alert_status_id: { in: activeStatusIds } },
            orderBy: { alert_datetime: "desc" },
            take: ALERT_PREVIEW_LIMIT,
            select: {
              id: true,
              description: true,
              alert_datetime: true,
              book_id: true,
              alert_type_id: true,
            },
          }),
    ]);

  const lowStockCandidates = lowStockRows
    .filter((row) => row.qty_shelf <= row.alert_threshold)
    .slice(0, LOW_STOCK_LIMIT);

  const bookIds = [
    ...new Set([
      ...lowStockCandidates.map((r) => r.book_id),
      ...recentAlertRows.map((r) => r.book_id),
    ]),
  ];

  const [books, alertTypes] = await Promise.all([
    bookIds.length === 0
      ? Promise.resolve([])
      : prisma.books.findMany({
          where: { id: { in: bookIds } },
          select: { id: true, title: true },
        }),
    recentAlertRows.length === 0
      ? Promise.resolve([])
      : prisma.alert_types.findMany({
          where: {
            id: { in: [...new Set(recentAlertRows.map((a) => a.alert_type_id))] },
          },
          select: { id: true, name: true },
        }),
  ]);

  const titleById = new Map(books.map((b) => [b.id, b.title]));
  const typeNameById = new Map(alertTypes.map((t) => [t.id, t.name]));
  const criticalTypeIdSet = new Set(criticalTypeIds);

  const low_stocks: DashboardLowStock[] = lowStockCandidates.map((row) => ({
    book_id: row.book_id,
    title: titleById.get(row.book_id) ?? `Livre #${row.book_id}`,
    qty_shelf: row.qty_shelf,
    qty_reserve: row.qty_reserve,
    alert_threshold: row.alert_threshold,
    shelf_fill_pct: clampPct((row.qty_shelf / SHELF_MAX_QTY) * 100),
  }));

  const recent_alerts: DashboardAlertPreview[] = recentAlertRows.map((row) => ({
    id: row.id,
    description: row.description,
    alert_datetime: row.alert_datetime,
    type_name: typeNameById.get(row.alert_type_id) ?? null,
    book_title: titleById.get(row.book_id) ?? null,
    is_critical: criticalTypeIdSet.has(row.alert_type_id),
  }));

  const recent_events: DashboardActivityEvent[] = recentEvents.map((event) => ({
    id: event.id,
    type: event.type,
    message: event.message,
    created_at: event.created_at,
    is_error: ERROR_EVENT_TYPES.has(event.type),
  }));

  return {
    catalog: {
      active_books: activeBooks,
      inventoried_books: inventoriedBooks,
      total_units: shelfUnits + reserveUnits,
      shelf_units: shelfUnits,
      reserve_units: reserveUnits,
      shelf_capacity_pct: shelfCapacityPct,
    },
    sales: {
      purchases_today: purchasesToday,
    },
    alerts: {
      active_count: activeCount,
      critical_count: criticalCount,
    },
    orders: {
      pending_count: pendingCount,
    },
    low_stocks,
    recent_alerts,
    recent_events,
  };
}
