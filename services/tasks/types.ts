import { Prisma } from "@/lib/generated/prisma/client";

export const TASK_TYPES = [
  "RESTOCK_SHELF",
  "RECEIVE_DELIVERY",
  "ADVISE_CUSTOMER",
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_STATUSES = [
  "pending",
  "in_progress",
  "done",
  "cancelled",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const taskSelect = {
  id: true,
  user_id: true,
  type: true,
  book_id: true,
  order_id: true,
  status: true,
  assignee_id: true,
  priority: true,
  created_at: true,
  completed_at: true,
} satisfies Prisma.tasksSelect;

export type TaskPublic = Prisma.tasksGetPayload<{
  select: typeof taskSelect;
}>;
