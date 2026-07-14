import { AppError } from "@/lib/api/route-errors";
import type { Prisma } from "@/lib/generated/prisma/client";

type TransactionClient = Prisma.TransactionClient;

async function resolveReferenceId(
  label: string,
  names: readonly string[],
  find: () => Promise<{ id: number } | null>,
): Promise<number> {
  const row = await find();
  if (!row) {
    throw new AppError(
      "CONFIG_ERROR",
      `Missing ${label}. Expected one of: ${names.join(", ")}.`,
      500,
    );
  }
  return row.id;
}

export async function resolveOrderStatusId(
  names: readonly string[],
  tx: TransactionClient,
): Promise<number> {
  return resolveReferenceId("order status", names, () =>
    tx.order_statuses.findFirst({
      where: { name: { in: [...names] } },
      select: { id: true },
    }),
  );
}

export async function resolveDeliveryStatusId(
  names: readonly string[],
  tx: TransactionClient,
): Promise<number> {
  return resolveReferenceId("delivery status", names, () =>
    tx.delivery_statuses.findFirst({
      where: { name: { in: [...names] } },
      select: { id: true },
    }),
  );
}

export async function resolveAlertTypeId(
  names: readonly string[],
  tx: TransactionClient,
): Promise<number> {
  return resolveReferenceId("alert type", names, () =>
    tx.alert_types.findFirst({
      where: { name: { in: [...names] } },
      select: { id: true },
    }),
  );
}

export async function resolveAlertStatusId(
  names: readonly string[],
  tx: TransactionClient,
): Promise<number> {
  return resolveReferenceId("alert status", names, () =>
    tx.alert_statuses.findFirst({
      where: { name: { in: [...names] } },
      select: { id: true },
    }),
  );
}
