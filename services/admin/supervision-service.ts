import { ACTIVE_ALERT_STATUS_NAMES } from "@/lib/alert-references";
import { IN_PROGRESS_ORDER_STATUS_NAMES } from "@/lib/order-statuses";
import { prisma } from "@/lib/prisma";
import { toTreasuryOverview } from "@/services/treasury/types";
import { treasuryAccountSelect } from "@/services/treasury/types";

export type SupervisionPlayerRow = {
  id: number;
  username: string;
  email: string;
  balance: string | null;
  low_threshold: string | null;
  is_low: boolean;
  active_alerts: number;
  pending_orders: number;
  last_simulation_at: string | null;
};

/** Admin overview of all players and their bookstore health. */
export async function listSupervisionPlayers(): Promise<SupervisionPlayerRow[]> {
  const [players, activeStatuses, pendingStatuses] = await Promise.all([
    prisma.users.findMany({
      where: { role: "user" },
      select: { id: true, username: true, email: true },
      orderBy: { username: "asc" },
    }),
    prisma.alert_statuses.findMany({
      where: { name: { in: [...ACTIVE_ALERT_STATUS_NAMES] } },
      select: { id: true },
    }),
    prisma.order_statuses.findMany({
      where: { name: { in: [...IN_PROGRESS_ORDER_STATUS_NAMES] } },
      select: { id: true },
    }),
  ]);

  if (players.length === 0) {
    return [];
  }

  const playerIds = players.map((player) => player.id);
  const activeStatusIds = activeStatuses.map((s) => s.id);
  const pendingStatusIds = pendingStatuses.map((s) => s.id);

  const [accounts, alerts, orders, lastRuns] = await Promise.all([
    prisma.treasury_account.findMany({
      where: { user_id: { in: playerIds } },
      select: treasuryAccountSelect,
    }),
    activeStatusIds.length === 0
      ? Promise.resolve([])
      : prisma.alerts.groupBy({
          by: ["user_id"],
          where: {
            user_id: { in: playerIds },
            alert_status_id: { in: activeStatusIds },
          },
          _count: { _all: true },
        }),
    pendingStatusIds.length === 0
      ? Promise.resolve([])
      : prisma.orders.groupBy({
          by: ["user_id"],
          where: {
            user_id: { in: playerIds },
            order_status_id: { in: pendingStatusIds },
          },
          _count: { _all: true },
        }),
    prisma.simulation_runs.findMany({
      where: { user_id: { in: playerIds } },
      orderBy: { started_at: "desc" },
      select: { user_id: true, started_at: true },
    }),
  ]);

  const accountByUser = new Map(accounts.map((row) => [row.user_id, row]));
  const alertsByUser = new Map(
    alerts.map((row) => [row.user_id, row._count._all]),
  );
  const ordersByUser = new Map(
    orders.map((row) => [row.user_id, row._count._all]),
  );
  const lastSimByUser = new Map<number, Date>();
  for (const run of lastRuns) {
    if (!lastSimByUser.has(run.user_id)) {
      lastSimByUser.set(run.user_id, run.started_at);
    }
  }

  return players.map((player) => {
    const account = accountByUser.get(player.id);
    const overview = account ? toTreasuryOverview(account) : null;

    return {
      id: player.id,
      username: player.username,
      email: player.email,
      balance: overview ? overview.balance.toFixed(2) : null,
      low_threshold: overview ? overview.low_threshold.toFixed(2) : null,
      is_low: overview?.is_low ?? false,
      active_alerts: alertsByUser.get(player.id) ?? 0,
      pending_orders: ordersByUser.get(player.id) ?? 0,
      last_simulation_at: lastSimByUser.get(player.id)?.toISOString() ?? null,
    };
  });
}
