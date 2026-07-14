import { prisma } from "@/lib/prisma";
import { DeliveryStatusPublic, deliveryStatusSelect } from "./types";
import {
  validateCreateDeliveryStatusInput,
  validateUpdateDeliveryStatusInput,
} from "./validation";

/** List all delivery statuses. */
export async function listDeliveryStatuses(): Promise<DeliveryStatusPublic[]> {
  return prisma.delivery_statuses.findMany({
    select: deliveryStatusSelect,
    orderBy: { name: "asc" },
  });
}

/** Get a delivery status by id. */
export async function getDeliveryStatusById(
  id: number,
): Promise<DeliveryStatusPublic | null> {
  return prisma.delivery_statuses.findUnique({
    where: { id },
    select: deliveryStatusSelect,
  });
}

/** Create a delivery status. */
export async function createDeliveryStatus(
  body: unknown,
): Promise<DeliveryStatusPublic> {
  const input = validateCreateDeliveryStatusInput(body);
  return prisma.delivery_statuses.create({
    data: { name: input.name },
    select: deliveryStatusSelect,
  });
}

/** Update a delivery status. */
export async function updateDeliveryStatus(
  id: number,
  body: unknown,
): Promise<DeliveryStatusPublic> {
  const input = validateUpdateDeliveryStatusInput(body);

  const data: { name?: string } = {};
  if (input.name !== undefined) {
    data.name = input.name;
  }

  return prisma.delivery_statuses.update({
    where: { id },
    data,
    select: deliveryStatusSelect,
  });
}

/** Delete a delivery status. */
export async function deleteDeliveryStatus(
  id: number,
): Promise<DeliveryStatusPublic> {
  return prisma.delivery_statuses.delete({
    where: { id },
    select: deliveryStatusSelect,
  });
}
