import { AppError } from "@/lib/api/route-errors";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { inventoryPublicSelect } from "@/services/inventory/types";
import type { StockPublic } from "@/services/stocks/types";
import { decrementShelfStock } from "@/services/stocks/stocks-service";
import { recordSale } from "@/services/treasury/treasury-service";
import { ensureRestockTask, completeTaskById } from "@/services/tasks/tasks-service";
import { ensureClock } from "@/services/clock/clock-service";
import {
  listInboundDeliveries,
  promoteArrivedDeliveries,
  receiveOrder,
} from "@/services/orders/orders-service";
import {
  ARCHETYPES,
  NAMED_VISITORS,
  WEIGHT_VALUE,
  anonymousName,
} from "@/simulation/data/visitors";

import {
  simulationEventSelect,
  simulationRunSelect,
  type ListSimulationEventsOptions,
  type SimulationEventPublic,
  type SimulationRunResult,
} from "./types";
import { validateRunSimulationInput } from "./validation";

type TransactionClient = Prisma.TransactionClient;

type WeightedBook = StockPublic & {
  category_code: string;
  rarity: string;
};

function pickWeighted<T>(items: T[], weight: (item: T) => number): T | null {
  if (items.length === 0) return null;
  const total = items.reduce((sum, item) => sum + Math.max(0.01, weight(item)), 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= Math.max(0.01, weight(item));
    if (roll <= 0) return item;
  }
  return items[items.length - 1] ?? null;
}

function pickVisitorVoice(): { name: string; categories: string[]; rarity: string } {
  if (Math.random() < 0.25) {
    const named = pickWeighted(
      NAMED_VISITORS,
      (row) => WEIGHT_VALUE[row.simulation_weight],
    )!;
    return {
      name: named.name,
      categories: named.preferred_categories,
      rarity: named.rarity_preference,
    };
  }
  const arch = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)]!;
  return {
    name: anonymousName(Math.floor(Math.random() * 10_000)),
    categories: [...arch.categories],
    rarity: Math.random() < 0.7 ? "common" : "mixed",
  };
}

function bookWeight(
  book: WeightedBook,
  prefs: { categories: string[]; rarity: string },
): number {
  let score = 2;
  const cat = book.category_code.toUpperCase();
  for (const pref of prefs.categories) {
    const p = pref.toLowerCase();
    if (
      (cat === "ARC" && p.includes("arcane")) ||
      (cat === "HIS" && p.includes("hist")) ||
      (cat === "BOT" && p.includes("botan")) ||
      (cat === "NEC" && p.includes("nécro"))
    ) {
      score += 6;
      break;
    }
  }
  const rarity = book.rarity.toLowerCase();
  if (rarity === "legendary" || rarity === "mythic") {
    score *= prefs.rarity === "rare" ? 0.5 : 0.08;
  } else if (rarity === "rare") {
    score += prefs.rarity === "rare" ? 4 : 0;
  } else if (prefs.rarity === "common") {
    score += 3;
  }
  score += Math.min(3, Math.log2(1 + book.qty_shelf));
  return score;
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

/** List simulation events for a player's runs. */
export async function listSimulationEvents(
  userId: number,
  options: ListSimulationEventsOptions = {},
): Promise<SimulationEventPublic[]> {
  const runFilter =
    options.simulation_run_id !== undefined
      ? { id: options.simulation_run_id, user_id: userId }
      : { user_id: userId };

  const runs = await prisma.simulation_runs.findMany({
    where: runFilter,
    select: { id: true },
  });

  if (runs.length === 0) {
    return [];
  }

  return prisma.simulation_events.findMany({
    where: { simulation_run_id: { in: runs.map((run) => run.id) } },
    select: simulationEventSelect,
    orderBy: { created_at: "desc" },
  });
}

/** Run a batch simulation for one player (Mode 1 enrichi — P1.4). */
export async function runSimulation(
  userId: number,
  body: unknown = null,
): Promise<SimulationRunResult> {
  const input = validateRunSimulationInput(body);

  return prisma.$transaction(async (tx) => {
    const run = await tx.simulation_runs.create({
      data: { user_id: userId, started_at: new Date() },
      select: simulationRunSelect,
    });

    const events: SimulationEventPublic[] = [];
    const clock = await ensureClock(userId, tx);

    const shelfInventories = await tx.book_inventory.findMany({
      where: { user_id: userId, qty_shelf: { gt: 0 } },
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
        is_active: true,
        rarity: true,
        category_id: true,
      },
    });

    const categories = await tx.categories.findMany({
      select: { id: true, code: true },
    });
    const codeById = new Map(categories.map((row) => [row.id, row.code]));

    const inventoryByBookId = new Map(
      shelfInventories.map((row) => [row.book_id, row]),
    );

    const purchasableBooks: WeightedBook[] = [];
    for (const book of books) {
      const inventory = inventoryByBookId.get(book.id);
      if (!inventory || inventory.qty_shelf <= 0) continue;
      purchasableBooks.push({
        id: book.id,
        book_id: book.id,
        title: book.title,
        purchase_price: book.purchase_price,
        sale_price: inventory.sale_price,
        is_active: book.is_active,
        qty_reserve: inventory.qty_reserve,
        qty_shelf: inventory.qty_shelf,
        alert_threshold: inventory.alert_threshold,
        first_received_at: inventory.first_received_at,
        updated_at: inventory.updated_at,
        category_code: codeById.get(book.category_id) ?? "HIS",
        rarity: book.rarity,
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
        const inbound = await listInboundDeliveries(
          userId,
          clock.sim_day,
          clock.sim_minutes,
          tx,
        );
        const awaitingReceive = inbound.filter((row) => row.has_receive_task);
        const enRoute = inbound.filter((row) => !row.has_receive_task);
        const roll = Math.random();

        // ~12 % : livraison fournisseur si commandes en attente (P1.4)
        if (roll < 0.12 && (enRoute.length > 0 || awaitingReceive.length > 0)) {
          if (enRoute.length > 0) {
            const target = enRoute[Math.floor(Math.random() * enRoute.length)]!;
            const promoted = await promoteArrivedDeliveries(
              userId,
              clock.sim_day,
              clock.sim_minutes,
              tx,
              { forceOrderId: target.order_id },
            );
            events.push(
              await logSimulationEvent(
                run.id,
                {
                  type: "SUPPLIER_DELIVERY",
                  message: `Le convoi de la commande #${target.order_id} arrive au quai.`,
                  metadata: JSON.stringify({
                    order_id: target.order_id,
                    task_id: promoted[0]?.task_id ?? null,
                  }),
                },
                tx,
              ),
            );
          } else {
            const target =
              awaitingReceive[Math.floor(Math.random() * awaitingReceive.length)]!;
            try {
              await receiveOrder(target.order_id, userId, tx);
              const task = await tx.tasks.findFirst({
                where: {
                  user_id: userId,
                  type: "RECEIVE_DELIVERY",
                  order_id: target.order_id,
                  status: { in: ["pending", "in_progress"] },
                },
                select: { id: true },
              });
              if (task) {
                await completeTaskById(userId, task.id, tx);
              }
              events.push(
                await logSimulationEvent(
                  run.id,
                  {
                    type: "SUPPLIER_DELIVERY",
                    message: `Réception de la commande #${target.order_id} : les exemplaires rejoignent la réserve.`,
                    metadata: JSON.stringify({ order_id: target.order_id }),
                  },
                  tx,
                ),
              );
            } catch (error) {
              if (error instanceof AppError) {
                events.push(
                  await logSimulationEvent(
                    run.id,
                    {
                      type: "UNAVAILABLE_REQUEST",
                      message: `Réception impossible pour la commande #${target.order_id}.`,
                    },
                    tx,
                  ),
                );
                continue;
              }
              throw error;
            }
          }
          continue;
        }

        // ~10 % : demande introuvable (lore)
        if (roll < 0.22 || purchasableBooks.length === 0) {
          const voice = pickVisitorVoice();
          events.push(
            await logSimulationEvent(
              run.id,
              {
                type: "UNAVAILABLE_REQUEST",
                message: `${voice.name} cherche un ouvrage de ${voice.categories[0] ?? "savoir"} introuvable aujourd'hui.`,
                metadata: JSON.stringify({ visitor: voice.name }),
              },
              tx,
            ),
          );
          continue;
        }

        const voice = pickVisitorVoice();
        const book = pickWeighted(purchasableBooks, (row) =>
          bookWeight(row, voice),
        );
        if (!book) break;

        try {
          const updated = await decrementShelfStock(userId, book.id, 1, tx);
          const unitSalePrice = new Prisma.Decimal(updated.sale_price);

          const bookIndex = purchasableBooks.findIndex(
            (candidate) => candidate.id === book.id,
          );
          if (bookIndex >= 0) {
            purchasableBooks[bookIndex] = {
              ...purchasableBooks[bookIndex]!,
              ...updated,
              category_code: book.category_code,
              rarity: book.rarity,
            };
            if (updated.qty_shelf === 0) {
              purchasableBooks.splice(bookIndex, 1);
            }
          }

          const event = await logSimulationEvent(
            run.id,
            {
              type: "CUSTOMER_PURCHASE",
              message: `${voice.name} acquiert « ${updated.title} » pour ${unitSalePrice.toFixed(2)} florins (rayon : ${updated.qty_shelf}).`,
              book_id: updated.id,
              metadata: JSON.stringify({
                visitor: voice.name,
                qty_shelf_after: updated.qty_shelf,
                unit_sale_price: unitSalePrice.toFixed(2),
                qty: 1,
              }),
            },
            tx,
          );

          await recordSale(
            userId,
            {
              book_id: updated.id,
              qty: 1,
              unit_price: unitSalePrice,
              simulation_event_id: event.id,
              note: `Vente simulation #${run.id} — ${updated.title}`,
            },
            tx,
          );

          const restock = await ensureRestockTask(userId, updated.id, tx);
          events.push(event);

          if (updated.qty_shelf === 0) {
            events.push(
              await logSimulationEvent(
                run.id,
                {
                  type: "STOCKOUT",
                  message: restock
                    ? `Rupture rayon : « ${updated.title} » — réassort demandé.`
                    : `Rupture rayon : « ${updated.title} » — réserve vide.`,
                  book_id: updated.id,
                  metadata: JSON.stringify({
                    restock_task_id: restock?.id ?? null,
                  }),
                },
                tx,
              ),
            );
          }
        } catch (error) {
          if (error instanceof AppError && error.code === "BUSINESS_RULE") {
            events.push(
              await logSimulationEvent(
                run.id,
                {
                  type: "UNAVAILABLE_REQUEST",
                  message: `${voice.name} : achat impossible pour « ${book.title} » (${error.message}).`,
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
