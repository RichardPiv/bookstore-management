import { Prisma } from "@/lib/generated/prisma/client";

/**
 * Select fields for public delivery statuses
 */
export const deliveryStatusSelect = {
  id: true,
  name: true,
} satisfies Prisma.delivery_statusesSelect;

/**
 * Delivery status type
 */
export type DeliveryStatusPublic = Prisma.delivery_statusesGetPayload<{
  select: typeof deliveryStatusSelect;
}>;

/**
 * Create delivery status input type
 */
export type CreateDeliveryStatusInput = {
  name: string;
};

/**
 * Update delivery status input type
 */
export type UpdateDeliveryStatusInput = {
  name?: string;
};
