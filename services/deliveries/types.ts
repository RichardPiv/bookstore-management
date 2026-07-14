import { Prisma } from "@/lib/generated/prisma/client";

import type { DeliveryStatusPublic } from "@/services/delivery_statuses/types";

export const deliveryPublicSelect = {
  id: true,
  type: true,
  delivery_status_id: true,
  delivery_datetime: true,
} satisfies Prisma.deliveriesSelect;

export type DeliveryPublic = Prisma.deliveriesGetPayload<{
  select: typeof deliveryPublicSelect;
}>;

export type DeliveryWithStatus = DeliveryPublic & {
  delivery_status: DeliveryStatusPublic | null;
};
