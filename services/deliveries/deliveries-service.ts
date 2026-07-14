import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { deliveryStatusSelect } from "@/services/delivery_statuses/types";
import type { DeliveryStatusPublic } from "@/services/delivery_statuses/types";

import {
  deliveryPublicSelect,
  type DeliveryPublic,
  type DeliveryWithStatus,
} from "./types";

type TransactionClient = Prisma.TransactionClient;

async function fetchDeliveryStatusesByIds(
  ids: number[],
  tx: TransactionClient = prisma,
): Promise<Map<number, DeliveryStatusPublic>> {
  if (ids.length === 0) {
    return new Map();
  }

  const rows = await tx.delivery_statuses.findMany({
    where: { id: { in: [...new Set(ids)] } },
    select: deliveryStatusSelect,
  });

  return new Map(rows.map((row) => [row.id, row]));
}

function withStatus(
  delivery: DeliveryPublic,
  statusesById: Map<number, DeliveryStatusPublic>,
): DeliveryWithStatus {
  return {
    ...delivery,
    delivery_status: statusesById.get(delivery.delivery_status_id) ?? null,
  };
}

async function enrichDeliveries(
  deliveries: DeliveryPublic[],
  tx: TransactionClient = prisma,
): Promise<DeliveryWithStatus[]> {
  const statusesById = await fetchDeliveryStatusesByIds(
    deliveries.map((delivery) => delivery.delivery_status_id),
    tx,
  );

  return deliveries.map((delivery) => withStatus(delivery, statusesById));
}

/** List deliveries. */
export async function listDeliveries(): Promise<DeliveryWithStatus[]> {
  const deliveries = await prisma.deliveries.findMany({
    select: deliveryPublicSelect,
    orderBy: { delivery_datetime: "desc" },
  });

  return enrichDeliveries(deliveries);
}

/** Get a delivery by id. */
export async function getDeliveryById(
  id: number,
): Promise<DeliveryWithStatus | null> {
  const delivery = await prisma.deliveries.findUnique({
    where: { id },
    select: deliveryPublicSelect,
  });

  if (!delivery) {
    return null;
  }

  const [enriched] = await enrichDeliveries([delivery]);
  return enriched;
}
