import { AppError } from "@/lib/api/route-errors";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { alertStatusSelect } from "@/services/alert_statuses/types";
import type { AlertStatusPublic } from "@/services/alert_statuses/types";
import { alertTypeSelect } from "@/services/alert_types/types";
import type { AlertTypePublic } from "@/services/alert_types/types";
import { stockPublicSelect, type StockPublic } from "@/services/stocks/types";

import {
  alertPublicSelect,
  type AlertPublic,
  type AlertWithRelations,
  type ListAlertsOptions,
  type UpdateAlertInput,
} from "./types";
import { validateCreateAlertInput, validateUpdateAlertInput } from "./validation";

type TransactionClient = Prisma.TransactionClient;

async function assertBookExists(bookId: number, tx: TransactionClient) {
  const book = await tx.books.findUnique({
    where: { id: bookId },
    select: { id: true },
  });

  if (!book) {
    throw new AppError("VALIDATION_ERROR", "Book not found.", 400);
  }
}

async function assertAlertTypeExists(
  alertTypeId: number,
  tx: TransactionClient,
) {
  const alertType = await tx.alert_types.findUnique({
    where: { id: alertTypeId },
    select: { id: true },
  });

  if (!alertType) {
    throw new AppError("VALIDATION_ERROR", "Alert type not found.", 400);
  }
}

async function assertAlertStatusExists(
  alertStatusId: number,
  tx: TransactionClient,
) {
  const alertStatus = await tx.alert_statuses.findUnique({
    where: { id: alertStatusId },
    select: { id: true },
  });

  if (!alertStatus) {
    throw new AppError("VALIDATION_ERROR", "Alert status not found.", 400);
  }
}

async function fetchBooksByIds(
  bookIds: number[],
  tx: TransactionClient,
): Promise<Map<number, StockPublic>> {
  if (bookIds.length === 0) {
    return new Map();
  }

  const books = await tx.books.findMany({
    where: { id: { in: [...new Set(bookIds)] } },
    select: stockPublicSelect,
  });

  return new Map(books.map((book) => [book.id, book]));
}

async function fetchAlertTypesByIds(
  ids: number[],
  tx: TransactionClient,
): Promise<Map<number, AlertTypePublic>> {
  if (ids.length === 0) {
    return new Map();
  }

  const rows = await tx.alert_types.findMany({
    where: { id: { in: [...new Set(ids)] } },
    select: alertTypeSelect,
  });

  return new Map(rows.map((row) => [row.id, row]));
}

async function fetchAlertStatusesByIds(
  ids: number[],
  tx: TransactionClient,
): Promise<Map<number, AlertStatusPublic>> {
  if (ids.length === 0) {
    return new Map();
  }

  const rows = await tx.alert_statuses.findMany({
    where: { id: { in: [...new Set(ids)] } },
    select: alertStatusSelect,
  });

  return new Map(rows.map((row) => [row.id, row]));
}

function withRelations(
  alert: AlertPublic,
  booksById: Map<number, StockPublic>,
  typesById: Map<number, AlertTypePublic>,
  statusesById: Map<number, AlertStatusPublic>,
): AlertWithRelations {
  return {
    ...alert,
    book: booksById.get(alert.book_id) ?? null,
    alert_type: typesById.get(alert.alert_type_id) ?? null,
    alert_status: statusesById.get(alert.alert_status_id) ?? null,
  };
}

async function enrichAlerts(
  alerts: AlertPublic[],
  tx: TransactionClient = prisma,
): Promise<AlertWithRelations[]> {
  const booksById = await fetchBooksByIds(
    alerts.map((alert) => alert.book_id),
    tx,
  );
  const typesById = await fetchAlertTypesByIds(
    alerts.map((alert) => alert.alert_type_id),
    tx,
  );
  const statusesById = await fetchAlertStatusesByIds(
    alerts.map((alert) => alert.alert_status_id),
    tx,
  );

  return alerts.map((alert) =>
    withRelations(alert, booksById, typesById, statusesById),
  );
}

async function enrichAlert(
  alert: AlertPublic,
  tx: TransactionClient = prisma,
): Promise<AlertWithRelations> {
  const [enriched] = await enrichAlerts([alert], tx);
  return enriched;
}

/** List alerts with optional filters. */
export async function listAlerts(
  options: ListAlertsOptions = {},
): Promise<AlertWithRelations[]> {
  const alerts = await prisma.alerts.findMany({
    where: {
      book_id: options.book_id,
      alert_status_id: options.alert_status_id,
    },
    select: alertPublicSelect,
    orderBy: { alert_datetime: "desc" },
  });

  return enrichAlerts(alerts);
}

/** Get an alert by id. */
export async function getAlertById(
  id: number,
): Promise<AlertWithRelations | null> {
  const alert = await prisma.alerts.findUnique({
    where: { id },
    select: alertPublicSelect,
  });

  if (!alert) {
    return null;
  }

  return enrichAlert(alert);
}

/** Create an alert. */
export async function createAlert(body: unknown): Promise<AlertWithRelations> {
  const input = validateCreateAlertInput(body);

  return prisma.$transaction(async (tx) => {
    await assertBookExists(input.book_id, tx);
    await assertAlertTypeExists(input.alert_type_id, tx);
    await assertAlertStatusExists(input.alert_status_id, tx);

    const alert = await tx.alerts.create({
      data: input,
      select: alertPublicSelect,
    });

    return enrichAlert(alert, tx);
  });
}

/** Create an alert inside an existing transaction. */
export async function createAlertInTransaction(
  input: {
    description: string;
    alert_datetime: Date;
    book_id: number;
    alert_type_id: number;
    alert_status_id: number;
  },
  tx: TransactionClient,
): Promise<AlertPublic> {
  await assertBookExists(input.book_id, tx);
  await assertAlertTypeExists(input.alert_type_id, tx);
  await assertAlertStatusExists(input.alert_status_id, tx);

  return tx.alerts.create({
    data: input,
    select: alertPublicSelect,
  });
}

function toAlertUpdateData(input: UpdateAlertInput): Prisma.alertsUpdateInput {
  const data: Prisma.alertsUpdateInput = {};

  if (input.description !== undefined) data.description = input.description;
  if (input.alert_datetime !== undefined) {
    data.alert_datetime = input.alert_datetime;
  }
  if (input.book_id !== undefined) data.book_id = input.book_id;
  if (input.alert_type_id !== undefined) {
    data.alert_type_id = input.alert_type_id;
  }
  if (input.alert_status_id !== undefined) {
    data.alert_status_id = input.alert_status_id;
  }

  return data;
}

/** Update an alert. */
export async function updateAlert(
  id: number,
  body: unknown,
): Promise<AlertWithRelations> {
  const input = validateUpdateAlertInput(body);
  const data = toAlertUpdateData(input);

  return prisma.$transaction(async (tx) => {
    const current = await tx.alerts.findUnique({
      where: { id },
      select: alertPublicSelect,
    });

    if (!current) {
      throw new AppError("NOT_FOUND", "Alert not found.", 404);
    }

    if (input.book_id !== undefined) {
      await assertBookExists(input.book_id, tx);
    }
    if (input.alert_type_id !== undefined) {
      await assertAlertTypeExists(input.alert_type_id, tx);
    }
    if (input.alert_status_id !== undefined) {
      await assertAlertStatusExists(input.alert_status_id, tx);
    }

    const alert = await tx.alerts.update({
      where: { id },
      data,
      select: alertPublicSelect,
    });

    return enrichAlert(alert, tx);
  });
}

/** Delete an alert. */
export async function deleteAlert(id: number): Promise<AlertWithRelations> {
  const alert = await prisma.alerts.findUnique({
    where: { id },
    select: alertPublicSelect,
  });

  if (!alert) {
    throw new AppError("NOT_FOUND", "Alert not found.", 404);
  }

  await prisma.alerts.delete({ where: { id } });
  return enrichAlert(alert);
}
