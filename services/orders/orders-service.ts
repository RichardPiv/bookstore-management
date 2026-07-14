import { AppError } from "@/lib/api/route-errors";
import {
  DELIVERED_DELIVERY_STATUS_NAMES,
  PENDING_DELIVERY_STATUS_NAMES,
} from "@/lib/delivery-statuses";
import {
  IN_PROGRESS_ORDER_STATUS_NAMES,
  RECEIVED_ORDER_STATUS_NAMES,
} from "@/lib/order-statuses";
import { prisma } from "@/lib/prisma";
import {
  resolveDeliveryStatusId,
  resolveOrderStatusId,
} from "@/lib/resolve-reference-status";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  deliveryPublicSelect,
  type DeliveryWithStatus,
} from "@/services/deliveries/types";
import { deliveryStatusSelect } from "@/services/delivery_statuses/types";
import type { DeliveryStatusPublic } from "@/services/delivery_statuses/types";
import { orderStatusSelect } from "@/services/order_statuses/types";
import type { OrderStatusPublic } from "@/services/order_statuses/types";
import { stockPublicSelect, type StockPublic } from "@/services/stocks/types";
import { supplierSelect, type SupplierPublic } from "@/services/suppliers/types";

import {
  orderPublicSelect,
  type ListOrdersOptions,
  type OrderLinePublic,
  type OrderPublic,
  type OrderWithDetails,
} from "./types";
import { validateCreateOrderInput } from "./validation";

type TransactionClient = Prisma.TransactionClient;

async function assertUserExists(userId: number, tx: TransactionClient) {
  const user = await tx.users.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new AppError("VALIDATION_ERROR", "User not found.", 400);
  }
}

async function assertBookOrderable(bookId: number, tx: TransactionClient) {
  const book = await tx.books.findUnique({
    where: { id: bookId },
    select: { id: true, is_active: true },
  });

  if (!book) {
    throw new AppError("VALIDATION_ERROR", "Book not found.", 400);
  }

  if (!book.is_active) {
    throw new AppError(
      "BUSINESS_RULE",
      "Cannot order an inactive book.",
      409,
    );
  }
}

async function assertSupplierExists(
  supplierId: number,
  tx: TransactionClient,
) {
  const supplier = await tx.suppliers.findUnique({
    where: { id: supplierId },
    select: { id: true },
  });

  if (!supplier) {
    throw new AppError("VALIDATION_ERROR", "Supplier not found.", 400);
  }
}

async function incrementBookReserve(
  bookId: number,
  qty: number,
  tx: TransactionClient,
) {
  await tx.books.update({
    where: { id: bookId },
    data: {
      qty_reserve: { increment: qty },
      updated_at: new Date(),
    },
  });
}

async function isOrderStatusPending(
  orderStatusId: number,
  tx: TransactionClient,
): Promise<boolean> {
  const status = await tx.order_statuses.findUnique({
    where: { id: orderStatusId },
    select: { name: true },
  });

  if (!status) {
    return false;
  }

  return (IN_PROGRESS_ORDER_STATUS_NAMES as readonly string[]).includes(
    status.name,
  );
}

async function enrichOrder(
  order: OrderPublic,
  tx: TransactionClient = prisma,
): Promise<OrderWithDetails> {
  const lines = await tx.orders_lines.findMany({
    where: { order_id: order.id },
    orderBy: { id: "asc" },
  });

  const bookIds = lines.map((line) => line.book_id);
  const supplierIds = lines.map((line) => line.supplier_id);

  const [books, suppliers, orderStatus, delivery, user] = await Promise.all([
    tx.books.findMany({
      where: { id: { in: bookIds } },
      select: stockPublicSelect,
    }),
    tx.suppliers.findMany({
      where: { id: { in: supplierIds } },
      select: supplierSelect,
    }),
    tx.order_statuses.findUnique({
      where: { id: order.order_status_id },
      select: orderStatusSelect,
    }),
    tx.deliveries.findUnique({
      where: { id: order.delivery_id },
      select: deliveryPublicSelect,
    }),
    tx.users.findUnique({
      where: { id: order.user_id },
      select: { id: true, username: true },
    }),
  ]);

  const booksById = new Map(books.map((book) => [book.id, book]));
  const suppliersById = new Map(
    suppliers.map((supplier) => [supplier.id, supplier]),
  );

  let deliveryWithStatus: DeliveryWithStatus | null = null;
  if (delivery) {
    const deliveryStatus = await tx.delivery_statuses.findUnique({
      where: { id: delivery.delivery_status_id },
      select: deliveryStatusSelect,
    });

    deliveryWithStatus = {
      ...delivery,
      delivery_status: deliveryStatus,
    };
  }

  const enrichedLines: OrderLinePublic[] = lines.map((line) => ({
    id: line.id,
    order_id: line.order_id,
    book_id: line.book_id,
    supplier_id: line.supplier_id,
    qty: line.qty,
    book: booksById.get(line.book_id) ?? null,
    supplier: suppliersById.get(line.supplier_id) ?? null,
  }));

  return {
    ...order,
    lines: enrichedLines,
    order_status: orderStatus,
    delivery: deliveryWithStatus,
    user,
  };
}

/** List supplier orders. */
export async function listOrders(
  options: ListOrdersOptions = {},
): Promise<OrderWithDetails[]> {
  const orders = await prisma.orders.findMany({
    where:
      options.order_status_id !== undefined
        ? { order_status_id: options.order_status_id }
        : undefined,
    select: orderPublicSelect,
    orderBy: { order_datetime: "desc" },
  });

  return Promise.all(orders.map((order) => enrichOrder(order)));
}

/** Get an order by id. */
export async function getOrderById(
  id: number,
): Promise<OrderWithDetails | null> {
  const order = await prisma.orders.findUnique({
    where: { id },
    select: orderPublicSelect,
  });

  if (!order) {
    return null;
  }

  return enrichOrder(order);
}

/** Create a supplier order (immediate reception by default — D31). */
export async function createOrder(body: unknown): Promise<OrderWithDetails> {
  const input = validateCreateOrderInput(body);

  return prisma.$transaction(async (tx) => {
    await assertUserExists(input.user_id, tx);

    for (const line of input.lines) {
      await assertBookOrderable(line.book_id, tx);
      await assertSupplierExists(line.supplier_id, tx);
    }

    const deliveryStatusId = await resolveDeliveryStatusId(
      input.immediate
        ? DELIVERED_DELIVERY_STATUS_NAMES
        : PENDING_DELIVERY_STATUS_NAMES,
      tx,
    );
    const orderStatusId = await resolveOrderStatusId(
      input.immediate
        ? RECEIVED_ORDER_STATUS_NAMES
        : IN_PROGRESS_ORDER_STATUS_NAMES,
      tx,
    );

    const delivery = await tx.deliveries.create({
      data: {
        type: "supplier",
        delivery_status_id: deliveryStatusId,
        delivery_datetime: new Date(),
      },
      select: deliveryPublicSelect,
    });

    const order = await tx.orders.create({
      data: {
        order_datetime: new Date(),
        delivery_id: delivery.id,
        user_id: input.user_id,
        order_status_id: orderStatusId,
      },
      select: orderPublicSelect,
    });

    await tx.orders_lines.createMany({
      data: input.lines.map((line) => ({
        order_id: order.id,
        book_id: line.book_id,
        supplier_id: line.supplier_id,
        qty: line.qty,
      })),
    });

    if (input.immediate) {
      for (const line of input.lines) {
        await incrementBookReserve(line.book_id, line.qty, tx);
      }
    }

    return enrichOrder(order, tx);
  });
}

/** Receive a pending supplier order (D32 — full reception only). */
export async function receiveOrder(id: number): Promise<OrderWithDetails> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.orders.findUnique({
      where: { id },
      select: orderPublicSelect,
    });

    if (!order) {
      throw new AppError("NOT_FOUND", "Order not found.", 404);
    }

    const pending = await isOrderStatusPending(order.order_status_id, tx);
    if (!pending) {
      throw new AppError(
        "BUSINESS_RULE",
        "Order is not pending reception.",
        409,
      );
    }

    const lines = await tx.orders_lines.findMany({
      where: { order_id: id },
    });

    for (const line of lines) {
      await assertBookOrderable(line.book_id, tx);
      await incrementBookReserve(line.book_id, line.qty, tx);
    }

    const receivedStatusId = await resolveOrderStatusId(
      RECEIVED_ORDER_STATUS_NAMES,
      tx,
    );
    const deliveredStatusId = await resolveDeliveryStatusId(
      DELIVERED_DELIVERY_STATUS_NAMES,
      tx,
    );

    const updatedOrder = await tx.orders.update({
      where: { id },
      data: { order_status_id: receivedStatusId },
      select: orderPublicSelect,
    });

    await tx.deliveries.update({
      where: { id: order.delivery_id },
      data: {
        delivery_status_id: deliveredStatusId,
        delivery_datetime: new Date(),
      },
    });

    return enrichOrder(updatedOrder, tx);
  });
}
