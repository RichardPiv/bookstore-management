"use client";

import { useEffect, useState } from "react";

import OrnamentalFrame from "@/components/ui/OrnamentalFrame";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  formatOrderDate,
  formatOrderPrice,
  getDeliveryStatusLabel,
  getOrderItemsCount,
  getOrderStatusLabel,
  getOrderTotal,
  isOrderPending,
  type Order,
} from "./order-data";

type OrderDetailProps = {
  order: Order | null;
  onOrderUpdated?: (order: Order) => void;
};

export default function OrderDetail({
  order,
  onOrderUpdated,
}: OrderDetailProps) {
  const [isReceiving, setIsReceiving] = useState(false);
  const [receiveError, setReceiveError] = useState<string | null>(null);

  useEffect(() => {
    setReceiveError(null);
    setIsReceiving(false);
  }, [order?.id]);

  if (!order) {
    return (
      <div className="border border-dashed border-outline-variant/50 bg-surface-container-low px-6 py-10 text-center">
        <span
          className="material-symbols-outlined mb-4 text-4xl text-outline/50"
          aria-hidden
        >
          receipt_long
        </span>
        <p className="font-label text-[10px] tracking-[0.24em] text-outline uppercase">
          Détail
        </p>
        <p className="mt-3 font-body text-sm text-on-surface-variant">
          Sélectionne une commande pour en afficher le détail.
        </p>
      </div>
    );
  }

  const statusName = order.order_status?.name;
  const pending = isOrderPending(statusName);
  const itemsCount = getOrderItemsCount(order);
  const total = getOrderTotal(order);
  const supplierName =
    order.lines.find((line) => line.supplier?.name)?.supplier?.name ??
    "Fournisseur inconnu";

  async function handleReceive() {
    if (!order || isReceiving) return;

    setIsReceiving(true);
    setReceiveError(null);

    try {
      const response = await fetch(`/api/orders/${order.id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const body = await response.json();

      if (!response.ok) {
        setReceiveError(
          body.error?.message ?? "Impossible de réceptionner la commande.",
        );
        return;
      }

      if (body.data) {
        onOrderUpdated?.(body.data as Order);
      }
    } catch {
      setReceiveError("Impossible de joindre les archives. Réessayez.");
    } finally {
      setIsReceiving(false);
    }
  }

  return (
    <OrnamentalFrame className="sticky top-6 bg-surface-container-low p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-outline-variant/40 pb-5">
        <div>
          <p className="mb-2 font-label text-[10px] tracking-[0.24em] text-burnished-gold/70 uppercase">
            Commande #{order.id}
          </p>
          <h3 className="font-headline text-2xl text-primary uppercase">
            Détail de livraison
          </h3>
          <p className="mt-2 font-body text-sm text-on-surface-variant">
            Passée le {formatOrderDate(order.order_datetime)}
            {order.user?.username ? ` par ${order.user.username}` : ""}
          </p>
        </div>

        <span
          className={cn(
            "border px-2 py-1 font-label text-[9px] tracking-[0.2em] uppercase",
            pending
              ? "border-burnished-gold/40 bg-burnished-gold/10 text-burnished-gold"
              : "border-primary/40 bg-primary/10 text-primary",
          )}
        >
          {getOrderStatusLabel(statusName)}
        </span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="border border-outline-variant/40 bg-surface px-3 py-3">
          <p className="mb-1 font-label text-[9px] tracking-[0.2em] text-outline uppercase">
            Fournisseur
          </p>
          <p className="font-body text-sm text-on-surface">{supplierName}</p>
        </div>
        <div className="border border-outline-variant/40 bg-surface px-3 py-3">
          <p className="mb-1 font-label text-[9px] tracking-[0.2em] text-outline uppercase">
            Exemplaires
          </p>
          <p className="font-body text-sm text-on-surface">{itemsCount}</p>
        </div>
        <div className="border border-outline-variant/40 bg-surface px-3 py-3">
          <p className="mb-1 font-label text-[9px] tracking-[0.2em] text-outline uppercase">
            Livraison
          </p>
          <p className="font-body text-sm text-on-surface">
            {getDeliveryStatusLabel(order.delivery?.delivery_status?.name)}
          </p>
        </div>
        <div className="border border-primary/30 bg-primary/5 px-3 py-3">
          <p className="mb-1 font-label text-[9px] tracking-[0.2em] text-primary/80 uppercase">
            Total achat
          </p>
          <p className="font-body text-sm text-primary">
            {formatOrderPrice(total)} Florins
          </p>
        </div>
      </div>

      <div className="mb-6">
        <p className="mb-3 font-label text-[10px] tracking-[0.24em] text-outline uppercase">
          Lignes de commande
        </p>
        <div className="custom-scroll max-h-[48vh] space-y-3 overflow-y-auto pr-1">
          {(order.lines ?? []).map((line) => {
            const unitPrice = Number(line.book?.purchase_price ?? 0);
            const lineTotal = unitPrice * line.qty;

            return (
              <article
                key={line.id}
                className="border border-outline-variant/40 bg-surface-container px-4 py-4"
              >
                <div className="flex gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center border border-outline-variant/40 bg-surface">
                    <span
                      className="material-symbols-outlined text-2xl text-outline/50"
                      aria-hidden
                    >
                      menu_book
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-headline text-base leading-tight text-primary">
                      {line.book?.title ?? `Livre #${line.book_id}`}
                    </p>
                    <p className="mt-1 font-label text-[9px] tracking-[0.18em] text-on-surface-variant uppercase">
                      {line.supplier?.name ?? "Fournisseur inconnu"}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 font-body text-sm text-on-surface-variant">
                      <span>
                        {formatOrderPrice(unitPrice)} F × {line.qty}
                      </span>
                      <span className="text-primary">
                        {formatOrderPrice(lineTotal)} F
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {receiveError ? (
        <p
          className="mb-4 border border-error/40 bg-error/5 px-4 py-3 font-body text-sm text-error"
          role="alert"
        >
          {receiveError}
        </p>
      ) : null}

      {pending ? (
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={() => void handleReceive()}
          disabled={isReceiving}
        >
          <span className="material-symbols-outlined" aria-hidden>
            {isReceiving ? "progress_activity" : "inventory_2"}
          </span>
          {isReceiving ? "Réception…" : "Réceptionner la commande"}
        </Button>
      ) : (
        <div className="border border-primary/30 bg-primary/5 px-4 py-3 text-center">
          <p className="font-label text-[10px] tracking-[0.2em] text-primary uppercase">
            Commande déjà réceptionnée
          </p>
          <p className="mt-1 font-body text-sm text-on-surface-variant">
            Les exemplaires ont été ajoutés à la réserve.
          </p>
        </div>
      )}
    </OrnamentalFrame>
  );
}
