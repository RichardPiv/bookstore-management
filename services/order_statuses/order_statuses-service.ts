import { prisma } from "@/lib/prisma";
import { OrderStatusPublic, orderStatusSelect } from "./types";
import {
  validateCreateOrderStatusInput,
  validateUpdateOrderStatusInput,
} from "./validation";

/** List all order statuses. */
export async function listOrderStatuses(): Promise<OrderStatusPublic[]> {
  return prisma.order_statuses.findMany({
    select: orderStatusSelect,
    orderBy: { name: "asc" },
  });
}

/** Get an order status by id. */
export async function getOrderStatusById(
  id: number,
): Promise<OrderStatusPublic | null> {
  return prisma.order_statuses.findUnique({
    where: { id },
    select: orderStatusSelect,
  });
}

/** Create an order status. */
export async function createOrderStatus(
  body: unknown,
): Promise<OrderStatusPublic> {
  const input = validateCreateOrderStatusInput(body);
  return prisma.order_statuses.create({
    data: { name: input.name },
    select: orderStatusSelect,
  });
}

/** Update an order status. */
export async function updateOrderStatus(
  id: number,
  body: unknown,
): Promise<OrderStatusPublic> {
  const input = validateUpdateOrderStatusInput(body);

  const data: { name?: string } = {};
  if (input.name !== undefined) {
    data.name = input.name;
  }

  return prisma.order_statuses.update({
    where: { id },
    data,
    select: orderStatusSelect,
  });
}

/** Delete an order status. */
export async function deleteOrderStatus(
  id: number,
): Promise<OrderStatusPublic> {
  return prisma.order_statuses.delete({
    where: { id },
    select: orderStatusSelect,
  });
}
