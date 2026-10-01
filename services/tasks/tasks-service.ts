import { AppError } from "@/lib/api/route-errors";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { transferToShelf } from "@/services/stocks/stocks-service";
import { receiveOrder } from "@/services/orders/orders-service";

import { taskSelect, type TaskPublic, type TaskStatus, type TaskType } from "./types";

type TransactionClient = Prisma.TransactionClient;

export async function listTasks(
  userId: number,
  status?: TaskStatus,
): Promise<TaskPublic[]> {
  return prisma.tasks.findMany({
    where: {
      user_id: userId,
      ...(status ? { status } : {}),
    },
    select: taskSelect,
    orderBy: [{ status: "asc" }, { priority: "desc" }, { id: "desc" }],
    take: 80,
  });
}

export async function createTask(
  userId: number,
  input: {
    type: TaskType;
    book_id?: number | null;
    order_id?: number | null;
    priority?: number;
  },
  tx: TransactionClient = prisma,
): Promise<TaskPublic> {
  if (input.type === "RESTOCK_SHELF" && input.book_id) {
    const existing = await tx.tasks.findFirst({
      where: {
        user_id: userId,
        type: "RESTOCK_SHELF",
        book_id: input.book_id,
        status: { in: ["pending", "in_progress"] },
      },
      select: taskSelect,
    });
    if (existing) {
      return existing;
    }
  }

  if (input.type === "RECEIVE_DELIVERY" && input.order_id) {
    const existing = await tx.tasks.findFirst({
      where: {
        user_id: userId,
        type: "RECEIVE_DELIVERY",
        order_id: input.order_id,
        status: { in: ["pending", "in_progress"] },
      },
      select: taskSelect,
    });
    if (existing) {
      return existing;
    }
  }

  return tx.tasks.create({
    data: {
      user_id: userId,
      type: input.type,
      book_id: input.book_id ?? null,
      order_id: input.order_id ?? null,
      priority: input.priority ?? 0,
      status: "pending",
    },
    select: taskSelect,
  });
}

export async function ensureRestockTask(
  userId: number,
  bookId: number,
  tx: TransactionClient,
): Promise<TaskPublic | null> {
  const inventory = await tx.book_inventory.findUnique({
    where: { user_id_book_id: { user_id: userId, book_id: bookId } },
    select: { qty_shelf: true, qty_reserve: true, alert_threshold: true },
  });
  if (!inventory) return null;
  if (inventory.qty_reserve <= 0) return null;
  if (inventory.qty_shelf > inventory.alert_threshold) return null;
  return createTask(
    userId,
    {
      type: "RESTOCK_SHELF",
      book_id: bookId,
      priority: inventory.qty_shelf === 0 ? 10 : 5,
    },
    tx,
  );
}

export async function executeTask(
  userId: number,
  taskId: number,
): Promise<TaskPublic> {
  return prisma.$transaction(async (tx) => {
    const task = await tx.tasks.findFirst({
      where: { id: taskId, user_id: userId },
      select: taskSelect,
    });
    if (!task) {
      throw new AppError("NOT_FOUND", "Task not found.", 404);
    }
    if (task.status === "done" || task.status === "cancelled") {
      throw new AppError("BUSINESS_RULE", "Task is no longer active.", 409);
    }

    if (task.type === "RESTOCK_SHELF") {
      if (!task.book_id) {
        throw new AppError("BUSINESS_RULE", "Restock task has no book.", 409);
      }
      const inventory = await tx.book_inventory.findUnique({
        where: { user_id_book_id: { user_id: userId, book_id: task.book_id } },
        select: { qty_shelf: true, qty_reserve: true },
      });
      const qty = Math.min(
        inventory?.qty_reserve ?? 0,
        Math.max(0, 10 - (inventory?.qty_shelf ?? 0)),
        5,
      );
      if (qty > 0) {
        await transferToShelf(userId, { book_id: task.book_id, qty }, tx);
      }
    }

    if (task.type === "RECEIVE_DELIVERY" && task.order_id) {
      await receiveOrder(task.order_id, userId, tx);
    }

    return tx.tasks.update({
      where: { id: task.id },
      data: { status: "done", completed_at: new Date() },
      select: taskSelect,
    });
  });
}

export async function cancelTask(
  userId: number,
  taskId: number,
): Promise<TaskPublic> {
  const task = await prisma.tasks.findFirst({
    where: { id: taskId, user_id: userId },
    select: taskSelect,
  });
  if (!task) {
    throw new AppError("NOT_FOUND", "Task not found.", 404);
  }
  if (task.status === "done") {
    throw new AppError("BUSINESS_RULE", "Completed tasks cannot be cancelled.", 409);
  }
  return prisma.tasks.update({
    where: { id: task.id },
    data: { status: "cancelled", completed_at: new Date() },
    select: taskSelect,
  });
}

export async function completeTaskById(
  userId: number,
  taskId: number,
  tx: TransactionClient,
): Promise<TaskPublic | null> {
  const task = await tx.tasks.findFirst({
    where: { id: taskId, user_id: userId },
    select: { id: true },
  });
  if (!task) return null;
  return tx.tasks.update({
    where: { id: task.id },
    data: { status: "done", completed_at: new Date() },
    select: taskSelect,
  });
}
