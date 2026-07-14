import { Prisma } from "@/lib/generated/prisma/client";

import type { DeliveryWithStatus } from "@/services/deliveries/types";
import type { OrderStatusPublic } from "@/services/order_statuses/types";
import type { StockPublic } from "@/services/stocks/types";
import type { SupplierPublic } from "@/services/suppliers/types";
import type { UserPublic } from "@/services/users/types";

export const orderPublicSelect = {
  id: true,
  order_datetime: true,
  delivery_id: true,
  user_id: true,
  order_status_id: true,
} satisfies Prisma.ordersSelect;

export type OrderPublic = Prisma.ordersGetPayload<{
  select: typeof orderPublicSelect;
}>;

export type OrderLinePublic = {
  id: number;
  order_id: number;
  book_id: number;
  supplier_id: number;
  qty: number;
  book: StockPublic | null;
  supplier: SupplierPublic | null;
};

export type OrderWithDetails = OrderPublic & {
  lines: OrderLinePublic[];
  order_status: OrderStatusPublic | null;
  delivery: DeliveryWithStatus | null;
  user: Pick<UserPublic, "id" | "username"> | null;
};

export type CreateOrderLineInput = {
  book_id: number;
  supplier_id: number;
  qty: number;
};

export type CreateOrderInput = {
  user_id: number;
  immediate: boolean;
  lines: CreateOrderLineInput[];
};

export type ListOrdersOptions = {
  order_status_id?: number;
};
