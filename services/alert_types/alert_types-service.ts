import { prisma } from "@/lib/prisma";
import { AlertTypePublic, alertTypeSelect } from "./types";
import {
  validateCreateAlertTypeInput,
  validateUpdateAlertTypeInput,
} from "./validation";

/** List all alert types. */
export async function listAlertTypes(): Promise<AlertTypePublic[]> {
  return prisma.alert_types.findMany({
    select: alertTypeSelect,
    orderBy: { name: "asc" },
  });
}

/** Get an alert type by id. */
export async function getAlertTypeById(
  id: number,
): Promise<AlertTypePublic | null> {
  return prisma.alert_types.findUnique({
    where: { id },
    select: alertTypeSelect,
  });
}

/** Create an alert type. */
export async function createAlertType(body: unknown): Promise<AlertTypePublic> {
  const input = validateCreateAlertTypeInput(body);
  return prisma.alert_types.create({
    data: { name: input.name },
    select: alertTypeSelect,
  });
}

/** Update an alert type. */
export async function updateAlertType(
  id: number,
  body: unknown,
): Promise<AlertTypePublic> {
  const input = validateUpdateAlertTypeInput(body);

  const data: { name?: string } = {};
  if (input.name !== undefined) {
    data.name = input.name;
  }

  return prisma.alert_types.update({
    where: { id },
    data,
    select: alertTypeSelect,
  });
}

/** Delete an alert type. */
export async function deleteAlertType(id: number): Promise<AlertTypePublic> {
  return prisma.alert_types.delete({
    where: { id },
    select: alertTypeSelect,
  });
}
