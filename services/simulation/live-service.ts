import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/api/route-errors";
import { decrementShelfStock, transferToShelf } from "@/services/stocks/stocks-service";
import { recordSale, recordDailyWages } from "@/services/treasury/treasury-service";
import { receiveOrder } from "@/services/orders/orders-service";
import { ensureClock, saveClockSnapshot } from "@/services/clock/clock-service";
import {
  completeTaskById,
  ensureRestockTask,
  listTasks,
} from "@/services/tasks/tasks-service";
import {
  applyMoraleDelta,
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

export async function getSimulationWorld(userId: number) {
  await ensureLocations();
  await ensureStarterStaff(userId);
  const [clock, employees, tasks, locations, inventories] = await Promise.all([
    ensureClock(userId),
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

    for (const commit of commits.slice(0, 40)) {
      try {
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
