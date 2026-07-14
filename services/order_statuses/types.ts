import { Prisma } from "@/lib/generated/prisma/client";

/**
 * Select fields for public order statuses
 */
export const orderStatusSelect = {
  id: true,
  name: true,
} satisfies Prisma.order_statusesSelect;

/**
 * Order status type
 */
export type OrderStatusPublic = Prisma.order_statusesGetPayload<{
  select: typeof orderStatusSelect;
}>;

/**
 * Create order status input type
 */
export type CreateOrderStatusInput = {
  name: string;
};

/**
 * Update order status input type
 */
export type UpdateOrderStatusInput = {
  name?: string;
};
