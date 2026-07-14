import { prisma } from "@/lib/prisma";
import { AlertStatusPublic, alertStatusSelect } from "./types";
import {
  validateCreateAlertStatusInput,
  validateUpdateAlertStatusInput,
} from "./validation";

/** List all alert statuses. */
export async function listAlertStatuses(): Promise<AlertStatusPublic[]> {
  return prisma.alert_statuses.findMany({
    select: alertStatusSelect,
    orderBy: { name: "asc" },
  });
}

/** Get an alert status by id. */
export async function getAlertStatusById(
  id: number,
): Promise<AlertStatusPublic | null> {
  return prisma.alert_statuses.findUnique({
    where: { id },
    select: alertStatusSelect,
  });
}

/** Create an alert status. */
export async function createAlertStatus(
  body: unknown,
): Promise<AlertStatusPublic> {
  const input = validateCreateAlertStatusInput(body);
  return prisma.alert_statuses.create({
    data: { name: input.name },
    select: alertStatusSelect,
  });
}

/** Update an alert status. */
export async function updateAlertStatus(
  id: number,
  body: unknown,
): Promise<AlertStatusPublic> {
  const input = validateUpdateAlertStatusInput(body);

  const data: { name?: string } = {};
  if (input.name !== undefined) {
    data.name = input.name;
  }

  return prisma.alert_statuses.update({
    where: { id },
    data,
    select: alertStatusSelect,
  });
}

/** Delete an alert status. */
export async function deleteAlertStatus(
  id: number,
): Promise<AlertStatusPublic> {
  return prisma.alert_statuses.delete({
    where: { id },
    select: alertStatusSelect,
  });
}
