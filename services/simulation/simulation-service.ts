import {
  ACTIVE_ALERT_STATUS_NAMES,
  SHELF_LOW_ALERT_TYPE_NAMES,
  SHELF_OUT_ALERT_TYPE_NAMES,
} from "@/lib/alert-references";
import { AppError } from "@/lib/api/route-errors";
import { prisma } from "@/lib/prisma";
import {
  resolveAlertStatusId,
  resolveAlertTypeId,
} from "@/lib/resolve-reference-status";
import type { Prisma } from "@/lib/generated/prisma/client";
import { createAlertInTransaction } from "@/services/alerts/alerts-service";
import { stockPublicSelect } from "@/services/stocks/types";
import { decrementShelfStock } from "@/services/stocks/stocks-service";

import {
  simulationEventSelect,
  simulationRunSelect,
  type ListSimulationEventsOptions,
  type SimulationEventPublic,
  type SimulationRunResult,
} from "./types";
import { validateRunSimulationInput } from "./validation";

type TransactionClient = Prisma.TransactionClient;

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) {
    return null;
  }

  return items[Math.floor(Math.random() * items.length)] ?? null;
}

async function logSimulationEvent(
  runId: number,
  event: {
    type: string;
    message: string;
    book_id?: number | null;
    metadata?: string | null;
  },
  tx: TransactionClient,
): Promise<SimulationEventPublic> {
  return tx.simulation_events.create({
    data: {
      simulation_run_id: runId,
      type: event.type,
      message: event.message,
      book_id: event.book_id ?? null,
      metadata: event.metadata ?? null,
    },
    select: simulationEventSelect,
  });
}

async function maybeCreateShelfAlert(
  book: {
    id: number;
    title: string;
    qty_shelf: number;
    alert_threshold: number;
  },
  tx: TransactionClient,
) {
  const activeStatusId = await resolveAlertStatusId(
    ACTIVE_ALERT_STATUS_NAMES,
    tx,
  );

  if (book.qty_shelf === 0) {
    const typeId = await resolveAlertTypeId(SHELF_OUT_ALERT_TYPE_NAMES, tx);
    await createAlertInTransaction(
      {
        description: `Shelf stockout for "${book.title}".`,
        alert_datetime: new Date(),
        book_id: book.id,
        alert_type_id: typeId,
        alert_status_id: activeStatusId,
      },
      tx,
    );
    return;
  }

  if (book.qty_shelf <= book.alert_threshold) {
    const typeId = await resolveAlertTypeId(SHELF_LOW_ALERT_TYPE_NAMES, tx);
    await createAlertInTransaction(
      {
        description: `Low shelf stock for "${book.title}" (${book.qty_shelf} left).`,
        alert_datetime: new Date(),
        book_id: book.id,
        alert_type_id: typeId,
        alert_status_id: activeStatusId,
      },
      tx,
    );
  }
}

/** List simulation events. */
export async function listSimulationEvents(
  options: ListSimulationEventsOptions = {},
): Promise<SimulationEventPublic[]> {
  return prisma.simulation_events.findMany({
    where:
      options.simulation_run_id !== undefined
        ? { simulation_run_id: options.simulation_run_id }
        : undefined,
    select: simulationEventSelect,
    orderBy: { created_at: "desc" },
  });
}

/** Run a batch simulation (customer purchases). */
export async function runSimulation(
  body: unknown = null,
): Promise<SimulationRunResult> {
  const input = validateRunSimulationInput(body);

  return prisma.$transaction(async (tx) => {
    const run = await tx.simulation_runs.create({
      data: { started_at: new Date() },
      select: simulationRunSelect,
    });

    const events: SimulationEventPublic[] = [];
    const purchasableBooks = await tx.books.findMany({
      where: { is_active: true, qty_shelf: { gt: 0 } },
      select: stockPublicSelect,
    });

    if (purchasableBooks.length === 0) {
      events.push(
        await logSimulationEvent(
          run.id,
          {
            type: "NO_STOCK",
            message: "No active books with shelf stock available to simulate.",
          },
          tx,
        ),
      );
    } else {
      for (let i = 0; i < input.events_count; i += 1) {
        const book = pickRandom(purchasableBooks);
        if (!book) {
          break;
        }

        try {
          const updated = await decrementShelfStock(book.id, 1, tx);
          const bookIndex = purchasableBooks.findIndex(
            (candidate) => candidate.id === book.id,
          );
          if (bookIndex >= 0) {
            purchasableBooks[bookIndex] = updated;
            if (updated.qty_shelf === 0) {
              purchasableBooks.splice(bookIndex, 1);
            }
          }

          events.push(
            await logSimulationEvent(
              run.id,
              {
                type: "CUSTOMER_PURCHASE",
                message: `Customer purchased "${updated.title}" (shelf -1).`,
                book_id: updated.id,
                metadata: JSON.stringify({
                  qty_shelf_after: updated.qty_shelf,
                }),
              },
              tx,
            ),
          );

          await maybeCreateShelfAlert(updated, tx);
        } catch (error) {
          if (
            error instanceof AppError &&
            error.code === "BUSINESS_RULE"
          ) {
            events.push(
              await logSimulationEvent(
                run.id,
                {
                  type: "UNAVAILABLE_REQUEST",
                  message: `Purchase skipped for "${book.title}" (${error.message}).`,
                  book_id: book.id,
                },
                tx,
              ),
            );
            continue;
          }

          throw error;
        }
      }
    }

    const completedRun = await tx.simulation_runs.update({
      where: { id: run.id },
      data: { ended_at: new Date() },
      select: simulationRunSelect,
    });

    return {
      ...completedRun,
      events,
    };
  });
}
