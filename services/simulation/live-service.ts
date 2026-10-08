import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/api/route-errors";
import { decrementShelfStock, transferToShelf } from "@/services/stocks/stocks-service";
import { recordSale, recordDailyWages } from "@/services/treasury/treasury-service";
import {
  listInboundDeliveries,
  promoteArrivedDeliveries,
  receiveOrder,
} from "@/services/orders/orders-service";
import { ensureClock, saveClockSnapshot } from "@/services/clock/clock-service";
import {
  completeTaskById,
  ensureRestockTask,
  listTasks,
} from "@/services/tasks/tasks-service";
import {
  applyMoraleDelta,
  applyTaskXp,
  ensureStarterStaff,
  listEmployees,
} from "@/services/staff/staff-service";
import { ensureLocations, listLocations } from "@/services/locations/locations-service";
import { simulationEventSelect } from "@/services/simulation/types";
import { Prisma } from "@/lib/generated/prisma/client";

type LiveCommit = {
  type: string;
  book_id?: number | null;
  qty?: number;
  task_id?: number | null;
  order_id?: number | null;
  visitor_id?: string;
  employee_id?: number;
  xp_kind?: "checkout" | "advise" | "restock" | "receive";
  event_type?: string;
  message?: string;
};

type LiveCommitBody = {
  commits?: LiveCommit[];
  closed_day?: boolean;
  clock?: {
    sim_day: number;
    sim_minutes: number;
    speed: number;
    paused: boolean;
  };
  snapshot?: unknown;
};

async function latestUnpaidWages(userId: number): Promise<boolean> {
  const run = await prisma.simulation_runs.findFirst({
    where: { user_id: userId },
    orderBy: { id: "desc" },
    select: { id: true },
  });
  if (!run) return false;
  const event = await prisma.simulation_events.findFirst({
    where: { simulation_run_id: run.id, type: "DAY_CLOSED" },
    orderBy: { id: "desc" },
    select: { message: true },
  });
  return Boolean(event?.message?.includes("paie partielle"));
}

export async function getSimulationWorld(userId: number) {
  await ensureLocations();
  await ensureStarterStaff(userId);
  const clock = await ensureClock(userId);

  // Promouvoir les convois dont l’ETA est atteinte (P1.1)
  await prisma.$transaction(async (tx) => {
    const promoted = await promoteArrivedDeliveries(
      userId,
      clock.sim_day,
      clock.sim_minutes,
      tx,
    );
    if (promoted.length === 0) return;
    const runOpen = await tx.simulation_runs.findFirst({
      where: { user_id: userId, ended_at: null },
      orderBy: { id: "desc" },
      select: { id: true },
    });
    if (!runOpen) return;
    for (const row of promoted) {
      await tx.simulation_events.create({
        data: {
          simulation_run_id: runOpen.id,
          type: "SUPPLIER_DELIVERY",
          message: `Un convoi pour la commande #${row.order_id} arrive au quai.`,
          metadata: JSON.stringify({ order_id: row.order_id, task_id: row.task_id }),
        },
      });
    }
  });

  const [employees, tasks, locations, inventories, inbound, unpaid_wages] =
    await Promise.all([
      listEmployees(userId),
      listTasks(userId),
      listLocations(),
      prisma.book_inventory.findMany({
        where: { user_id: userId },
        select: {
          book_id: true,
          qty_shelf: true,
          qty_reserve: true,
          sale_price: true,
        },
      }),
      listInboundDeliveries(userId, clock.sim_day, clock.sim_minutes),
      latestUnpaidWages(userId),
    ]);

  const books =
    inventories.length === 0
      ? []
      : await prisma.books.findMany({
          where: {
            id: { in: inventories.map((row) => row.book_id) },
            is_active: true,
          },
          select: {
            id: true,
            title: true,
            rarity: true,
            category_id: true,
          },
        });

  const categories = await prisma.categories.findMany({
    select: { id: true, code: true },
  });
  const codeById = new Map(categories.map((row) => [row.id, row.code]));
  const inventoryByBook = new Map(inventories.map((row) => [row.book_id, row]));

  return {
    clock: {
      ...clock,
      snapshot_json: clock.snapshot_json,
    },
    employees,
    tasks,
    locations,
    inbound,
    unpaid_wages,
    books: books.map((book) => {
      const inventory = inventoryByBook.get(book.id);
      return {
        book_id: book.id,
        title: book.title,
        category_code: codeById.get(book.category_id) ?? "HIS",
        rarity: book.rarity,
        qty_shelf: inventory?.qty_shelf ?? 0,
        qty_reserve: inventory?.qty_reserve ?? 0,
        sale_price: inventory?.sale_price.toFixed(2) ?? "0.00",
      };
    }),
  };
}

async function getOrCreateLiveRun(userId: number, tx: Prisma.TransactionClient) {
  const open = await tx.simulation_runs.findFirst({
    where: { user_id: userId, ended_at: null },
    orderBy: { id: "desc" },
    select: { id: true },
  });
  if (open) return open.id;
  const created = await tx.simulation_runs.create({
    data: { user_id: userId, started_at: new Date() },
    select: { id: true },
  });
  return created.id;
}

export async function applyLiveCommits(userId: number, body: unknown) {
  if (!body || typeof body !== "object") {
    throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
  }
  const input = body as LiveCommitBody;
  const commits = Array.isArray(input.commits) ? input.commits : [];

  return prisma.$transaction(async (tx) => {
    const runId = await getOrCreateLiveRun(userId, tx);
    const events = [];
    let unpaidWages = false;

    const clockHint = input.clock;
    if (clockHint) {
      const promoted = await promoteArrivedDeliveries(
        userId,
        clockHint.sim_day,
        clockHint.sim_minutes,
        tx,
      );
      for (const row of promoted) {
        const event = await tx.simulation_events.create({
          data: {
            simulation_run_id: runId,
            type: "SUPPLIER_DELIVERY",
            message: `Un convoi pour la commande #${row.order_id} arrive au quai.`,
            metadata: JSON.stringify({
              order_id: row.order_id,
              task_id: row.task_id,
            }),
          },
          select: simulationEventSelect,
        });
        events.push(event);
      }
    }

    for (const commit of commits.slice(0, 40)) {
      try {
      if (commit.type === "delivery_arrive" && commit.order_id) {
        const clock = clockHint ?? (await ensureClock(userId, tx));
        const promoted = await promoteArrivedDeliveries(
          userId,
          clock.sim_day,
          clock.sim_minutes,
          tx,
          { forceOrderId: commit.order_id },
        );
        for (const row of promoted) {
          const event = await tx.simulation_events.create({
            data: {
              simulation_run_id: runId,
              type: "SUPPLIER_DELIVERY",
              message:
                commit.message ??
                `Un convoi pour la commande #${row.order_id} arrive au quai.`,
              metadata: JSON.stringify({ order_id: row.order_id }),
            },
            select: simulationEventSelect,
          });
          events.push(event);
        }
      }

      if (commit.type === "sale" && commit.book_id) {
        const qty = commit.qty && commit.qty > 0 ? commit.qty : 1;
        const updated = await decrementShelfStock(userId, commit.book_id, qty, tx);
        const event = await tx.simulation_events.create({
          data: {
            simulation_run_id: runId,
            type: "CUSTOMER_PURCHASE",
            message:
              commit.message ??
              `Un visiteur a acquis « ${updated.title} » (rayon ${updated.qty_shelf}).`,
            book_id: commit.book_id,
            metadata: JSON.stringify({ visitor_id: commit.visitor_id ?? null }),
          },
          select: simulationEventSelect,
        });
        await recordSale(
          userId,
          {
            book_id: commit.book_id,
            qty,
            unit_price: updated.sale_price,
            simulation_event_id: event.id,
            note: `Vente live — ${updated.title}`,
          },
          tx,
        );
        await ensureRestockTask(userId, commit.book_id, tx);
        events.push(event);

        if (updated.qty_shelf === 0) {
          const restock = await ensureRestockTask(userId, commit.book_id, tx);
          const stockout = await tx.simulation_events.create({
            data: {
              simulation_run_id: runId,
              type: "STOCKOUT",
              message: restock
                ? `Rupture rayon : « ${updated.title} » — tâche de remise en rayon ouverte.`
                : `Rupture rayon : « ${updated.title} » — réserve vide, commande fournisseur nécessaire.`,
              book_id: commit.book_id,
              metadata: JSON.stringify({
                qty_reserve: updated.qty_reserve,
                restock_task_id: restock?.id ?? null,
              }),
            },
            select: simulationEventSelect,
          });
          events.push(stockout);
        }
      }

      if (commit.type === "restock" && commit.book_id && commit.qty && commit.qty > 0) {
        await transferToShelf(
          userId,
          { book_id: commit.book_id, qty: commit.qty },
          tx,
        );
        if (commit.task_id) {
          await completeTaskById(userId, commit.task_id, tx);
        }
        const event = await tx.simulation_events.create({
          data: {
            simulation_run_id: runId,
            type: "TASK_COMPLETED",
            message: commit.message ?? `Remise en rayon de « livre #${commit.book_id} ».`,
            book_id: commit.book_id,
          },
          select: simulationEventSelect,
        });
        events.push(event);
      }

      if (commit.type === "receive" && commit.order_id) {
        await receiveOrder(commit.order_id, userId, tx);
        if (commit.task_id) {
          await completeTaskById(userId, commit.task_id, tx);
        }
      }

      if (commit.type === "advise") {
        if (commit.task_id && commit.task_id > 0) {
          await completeTaskById(userId, commit.task_id, tx);
        }
      }

      if (
        commit.type === "staff_xp" &&
        commit.employee_id &&
        commit.xp_kind
      ) {
        await applyTaskXp(userId, commit.employee_id, commit.xp_kind, tx);
      }

      if (commit.type === "event" && commit.message) {
        const event = await tx.simulation_events.create({
          data: {
            simulation_run_id: runId,
            type: commit.event_type ?? "LIVE_EVENT",
            message: commit.message,
            book_id: commit.book_id ?? null,
          },
          select: simulationEventSelect,
        });
        events.push(event);
      }
      } catch (error) {
        if (error instanceof AppError) {
          continue;
        }
        throw error;
      }
    }

    if (input.closed_day) {
      const staff = await listEmployees(userId);
      const result = await recordDailyWages(
        userId,
        staff.map((row) => ({
          id: row.id,
          name: row.name,
          wage_daily: row.wage_daily,
        })),
        tx,
      );
      if (result.unpaid.greaterThan(0)) {
        unpaidWages = true;
        await applyMoraleDelta(userId, -12, tx);
      }
      await tx.simulation_runs.update({
        where: { id: runId },
        data: { ended_at: new Date() },
      });
      await tx.simulation_events.create({
        data: {
          simulation_run_id: runId,
          type: "DAY_CLOSED",
          message: unpaidWages
            ? `Fermeture : paie partielle (${result.paid.toFixed(2)} F). Le moral de l'équipe en pâtit.`
            : `Fermeture : paie versée (${result.paid.toFixed(2)} F).`,
        },
      });
    }

    if (input.clock) {
      await saveClockSnapshot(
        userId,
        {
          sim_day: input.clock.sim_day,
          sim_minutes: input.clock.sim_minutes,
          speed: input.clock.speed,
          status: input.clock.paused ? "paused" : "running",
          snapshot_json: input.snapshot ? JSON.stringify(input.snapshot) : "",
        },
        tx,
      );
    }

    return { events, unpaid_wages: unpaidWages };
  });
}

export async function snapshotOnly(
  userId: number,
  body: {
    clock: {
      sim_day: number;
      sim_minutes: number;
      speed: number;
      paused: boolean;
    };
    snapshot: unknown;
  },
) {
  return saveClockSnapshot(userId, {
    sim_day: body.clock.sim_day,
    sim_minutes: body.clock.sim_minutes,
    speed: body.clock.speed,
    status: body.clock.paused ? "paused" : "running",
    snapshot_json: JSON.stringify(body.snapshot),
  });
}
