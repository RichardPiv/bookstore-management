import {
  ACTIVE_ALERT_STATUS_NAMES,
  RESERVE_LOW_ALERT_TYPE_NAMES,
  RESERVE_OUT_ALERT_TYPE_NAMES,
  RESOLVED_ALERT_STATUS_NAMES,
  SHELF_LOW_ALERT_TYPE_NAMES,
  SHELF_OUT_ALERT_TYPE_NAMES,
} from "@/lib/alert-references";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  resolveAlertStatusId,
  resolveAlertTypeId,
} from "@/lib/resolve-reference-status";
import { createAlertInTransaction } from "@/services/alerts/alerts-service";
import { inventoryPublicSelect } from "@/services/inventory/types";

type TransactionClient = Prisma.TransactionClient;

async function setAlertActive(
  bookId: number,
  typeNames: readonly string[],
  description: string,
  active: boolean,
  activeStatusId: number,
  resolvedStatusId: number,
  tx: TransactionClient,
): Promise<void> {
  const typeId = await resolveAlertTypeId(typeNames, tx);

  if (active) {
    const existing = await tx.alerts.findFirst({
      where: {
        book_id: bookId,
        alert_type_id: typeId,
        alert_status_id: activeStatusId,
      },
      select: { id: true },
    });

    if (!existing) {
      await createAlertInTransaction(
        {
          description,
          alert_datetime: new Date(),
          book_id: bookId,
          alert_type_id: typeId,
          alert_status_id: activeStatusId,
        },
        tx,
      );
    }
    return;
  }

  await tx.alerts.updateMany({
    where: {
      book_id: bookId,
      alert_type_id: typeId,
      alert_status_id: activeStatusId,
    },
    data: { alert_status_id: resolvedStatusId },
  });
}

/**
 * Create or resolve stock alerts after inventory changes (D15, D16, D30, D59).
 * No-op when the book has no book_inventory row yet.
 */
export async function syncStockAlertsForBook(
  bookId: number,
  tx: TransactionClient,
): Promise<void> {
  const inventory = await tx.book_inventory.findUnique({
    where: { book_id: bookId },
    select: inventoryPublicSelect,
  });

  if (!inventory) {
    return;
  }

  const book = await tx.books.findUnique({
    where: { id: bookId },
    select: { title: true },
  });
  const title = book?.title ?? `Livre #${bookId}`;
  const { qty_reserve, qty_shelf, alert_threshold } = inventory;

  const [activeStatusId, resolvedStatusId] = await Promise.all([
    resolveAlertStatusId(ACTIVE_ALERT_STATUS_NAMES, tx),
    resolveAlertStatusId(RESOLVED_ALERT_STATUS_NAMES, tx),
  ]);

  const reserveOut = qty_reserve === 0;
  const reserveLow =
    !reserveOut && qty_reserve > 0 && qty_reserve <= alert_threshold;
  const shelfOut = qty_shelf === 0;
  const shelfLow = !shelfOut && qty_shelf > 0 && qty_shelf <= alert_threshold;

  await setAlertActive(
    bookId,
    RESERVE_OUT_ALERT_TYPE_NAMES,
    `Rupture de réserve pour « ${title} ».`,
    reserveOut,
    activeStatusId,
    resolvedStatusId,
    tx,
  );

  await setAlertActive(
    bookId,
    RESERVE_LOW_ALERT_TYPE_NAMES,
    `Réserve basse pour « ${title} » (${qty_reserve} restant${qty_reserve > 1 ? "s" : ""}).`,
    reserveLow,
    activeStatusId,
    resolvedStatusId,
    tx,
  );

  await setAlertActive(
    bookId,
    SHELF_OUT_ALERT_TYPE_NAMES,
    `Rupture de rayon pour « ${title} ».`,
    shelfOut,
    activeStatusId,
    resolvedStatusId,
    tx,
  );

  await setAlertActive(
    bookId,
    SHELF_LOW_ALERT_TYPE_NAMES,
    `Rayon bas pour « ${title} » (${qty_shelf} restant${qty_shelf > 1 ? "s" : ""}).`,
    shelfLow,
    activeStatusId,
    resolvedStatusId,
    tx,
  );
}
