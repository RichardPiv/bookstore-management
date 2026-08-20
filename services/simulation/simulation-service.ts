import { AppError } from "@/lib/api/route-errors";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { inventoryPublicSelect } from "@/services/inventory/types";
import type { StockPublic } from "@/services/stocks/types";
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

    // Only books already in library inventory with shelf stock can be sold.
    const shelfInventories = await tx.book_inventory.findMany({
      where: { qty_shelf: { gt: 0 } },
      select: inventoryPublicSelect,
    });

    const books = await tx.books.findMany({
      where: {
        id: { in: shelfInventories.map((row) => row.book_id) },
        is_active: true,
      },
      select: {
        id: true,
        title: true,
        purchase_price: true,
        sale_price: true,
        is_active: true,
      },
    });

    const inventoryByBookId = new Map(
      shelfInventories.map((row) => [row.book_id, row]),
    );

    const purchasableBooks: StockPublic[] = [];
    for (const book of books) {
      const inventory = inventoryByBookId.get(book.id);
      if (!inventory || inventory.qty_shelf <= 0) continue;
      purchasableBooks.push({
        id: book.id,
        book_id: book.id,
        title: book.title,
        purchase_price: book.purchase_price,
        sale_price: book.sale_price,
        is_active: book.is_active,
        qty_reserve: inventory.qty_reserve,
        qty_shelf: inventory.qty_shelf,
        alert_threshold: inventory.alert_threshold,
        first_received_at: inventory.first_received_at,
        updated_at: inventory.updated_at,
      });
    }

    if (purchasableBooks.length === 0) {
      events.push(
        await logSimulationEvent(
          run.id,
          {
            type: "NO_STOCK",
            message: "Aucun livre actif avec stock disponible à simuler.",
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
                message: `Un client a acheté un "${updated.title}" (stock restant : ${updated.qty_shelf}).`,
                book_id: updated.id,
                metadata: JSON.stringify({
                  qty_shelf_after: updated.qty_shelf,
                }),
              },
              tx,
            ),
          );
        } catch (error) {
          if (error instanceof AppError && error.code === "BUSINESS_RULE") {
            events.push(
              await logSimulationEvent(
                run.id,
                {
                  type: "UNAVAILABLE_REQUEST",
                  message: `Achat impossible pour "${book.title}" (${error.message}).`,
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
