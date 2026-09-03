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
import { Prisma } from "@/lib/generated/prisma/client";
import {
  deliveryPublicSelect,
  type DeliveryWithStatus,
} from "@/services/deliveries/types";
import { deliveryStatusSelect } from "@/services/delivery_statuses/types";
import { orderStatusSelect } from "@/services/order_statuses/types";
import {
  fetchInventoriesByBookIds,
  incrementReserveStock,
} from "@/services/inventory/inventory-service";
import type { BookRefPublic } from "@/services/stocks/types";
import { supplierSelect } from "@/services/suppliers/types";
import {
  applyDebit,
  getAccount,
} from "@/services/treasury/treasury-service";

import {
  orderPublicSelect,
  type ListOrdersOptions,
  type OrderLinePublic,
  type OrderPublic,
  type OrderWithDetails,
} from "./types";
import { validateCreateOrderInput } from "./validation";

type TransactionClient = Prisma.TransactionClient;

type PricedOrderLine = {
  id?: number;
  book_id: number;
  supplier_id: number;
  qty: number;
  unit_purchase_price: Prisma.Decimal;
};

function linePurchaseTotal(line: {
  qty: number;
  unit_purchase_price: Prisma.Decimal;
}): Prisma.Decimal {
  return line.unit_purchase_price.mul(line.qty);
}

function sumPurchaseTotal(
  lines: { qty: number; unit_purchase_price: Prisma.Decimal }[],
): Prisma.Decimal {
  return lines.reduce(
    (sum, line) => sum.plus(linePurchaseTotal(line)),
    new Prisma.Decimal(0),
  );
}

/** Debit treasury once per order line (D62–D65). */
async function debitSupplierPurchaseLines(
  userId: number,
  orderId: number,
  lines: {
    id: number;
    book_id: number;
    qty: number;
    unit_purchase_price: Prisma.Decimal;
  }[],
  tx: TransactionClient,
) {
  const total = sumPurchaseTotal(lines);
  const account = await getAccount(userId, tx);

  if (account.balance.lessThan(total)) {
    throw new AppError(
      "BUSINESS_RULE",
      "Insufficient treasury balance.",
      409,
    );
  }

  for (const line of lines) {
    await applyDebit(
      userId,
      {
        type: "supplier_purchase",
        amount: linePurchaseTotal(line),
        unit_price: line.unit_purchase_price,
        qty: line.qty,
        order_id: orderId,
        order_line_id: line.id,
        book_id: line.book_id,
        note: `Commande fournisseur #${orderId} — ligne #${line.id}`,
      },
      tx,
    );
  }
}

async function assertUserExists(userId: number, tx: TransactionClient) {
  const user = await tx.users.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new AppError("VALIDATION_ERROR", "User not found.", 400);
  }
}

async function assertBookOrderable(
  bookId: number,
  tx: TransactionClient,
): Promise<{ id: number; purchase_price: Prisma.Decimal }> {
  const book = await tx.books.findUnique({
    where: { id: bookId },
    select: { id: true, is_active: true, purchase_price: true },
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

  return { id: book.id, purchase_price: book.purchase_price };
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
  userId: number,
  bookId: number,
  qty: number,
  tx: TransactionClient,
) {
  await incrementReserveStock(userId, bookId, qty, tx);
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

  const [books, suppliers, orderStatus, delivery, user, inventoriesByBookId] =
    await Promise.all([
      tx.books.findMany({
        where: { id: { in: bookIds } },
        select: {
          id: true,
          title: true,
          purchase_price: true,
          is_active: true,
        },
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
      fetchInventoriesByBookIds(order.user_id, bookIds, tx),
    ]);

  const booksById = new Map(
    books.map((book) => {
      const inventory = inventoriesByBookId.get(book.id) ?? null;
      const ref: BookRefPublic = {
        id: book.id,
        title: book.title,
        purchase_price: book.purchase_price,
        sale_price: inventory?.sale_price ?? null,
        is_active: book.is_active,
        qty_reserve: inventory?.qty_reserve ?? null,
        qty_shelf: inventory?.qty_shelf ?? null,
        alert_threshold: inventory?.alert_threshold ?? null,
        first_received_at: inventory?.first_received_at ?? null,
      };
      return [book.id, ref] as const;
    }),
  );
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
    unit_purchase_price: line.unit_purchase_price,
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

/** List supplier orders for one player. */
export async function listOrders(
  options: ListOrdersOptions,
): Promise<OrderWithDetails[]> {
  const orders = await prisma.orders.findMany({
    where: {
      user_id: options.user_id,
      ...(options.order_status_id !== undefined
        ? { order_status_id: options.order_status_id }
        : {}),
    },
    select: orderPublicSelect,
    orderBy: { order_datetime: "desc" },
  });

  return Promise.all(orders.map((order) => enrichOrder(order)));
}

/** Get an order by id (optionally scoped to a player). */
export async function getOrderById(
  id: number,
  userId?: number,
): Promise<OrderWithDetails | null> {
  const order = await prisma.orders.findFirst({
    where: {
      id,
      ...(userId !== undefined ? { user_id: userId } : {}),
    },
    select: orderPublicSelect,
  });

  if (!order) {
    return null;
  }

  return enrichOrder(order);
}

/** Create a supplier order for the authenticated player. */
export async function createOrder(
  userId: number,
  body: unknown,
): Promise<OrderWithDetails> {
  const input = validateCreateOrderInput(body);
  const ownerId = userId;

  return prisma.$transaction(async (tx) => {
    await assertUserExists(ownerId, tx);

    const pricedLines: PricedOrderLine[] = [];

    for (const line of input.lines) {
      const book = await assertBookOrderable(line.book_id, tx);
      await assertSupplierExists(line.supplier_id, tx);
      pricedLines.push({
        book_id: line.book_id,
        supplier_id: line.supplier_id,
        qty: line.qty,
        unit_purchase_price: book.purchase_price,
      });
    }

    const total = sumPurchaseTotal(pricedLines);
    const account = await getAccount(ownerId, tx);
    if (account.balance.lessThan(total)) {
      throw new AppError(
        "BUSINESS_RULE",
        "Insufficient treasury balance.",
        409,
      );
    }

    const deliveryStatusId = await resolveDeliveryStatusId(
      PENDING_DELIVERY_STATUS_NAMES,
      tx,
    );
    const orderStatusId = await resolveOrderStatusId(
      IN_PROGRESS_ORDER_STATUS_NAMES,
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
        user_id: ownerId,
        order_status_id: orderStatusId,
      },
      select: orderPublicSelect,
    });

    await tx.orders_lines.createMany({
      data: pricedLines.map((line) => ({
        order_id: order.id,
        book_id: line.book_id,
        supplier_id: line.supplier_id,
        qty: line.qty,
        unit_purchase_price: line.unit_purchase_price,
      })),
    });

    const createdLines = await tx.orders_lines.findMany({
      where: { order_id: order.id },
      orderBy: { id: "asc" },
      select: {
        id: true,
        book_id: true,
        qty: true,
        unit_purchase_price: true,
      },
    });

    await debitSupplierPurchaseLines(ownerId, order.id, createdLines, tx);

    return enrichOrder(order, tx);
  });
}

/** Receive a pending supplier order (D32 — full reception only). */
export async function receiveOrder(
  id: number,
  userId: number,
): Promise<OrderWithDetails> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.orders.findFirst({
      where: { id, user_id: userId },
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
      orderBy: { id: "asc" },
      select: {
        id: true,
        book_id: true,
        qty: true,
        unit_purchase_price: true,
      },
    });

    for (const line of lines) {
      await assertBookOrderable(line.book_id, tx);
    }

    for (const line of lines) {
      await incrementBookReserve(userId, line.book_id, line.qty, tx);
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
