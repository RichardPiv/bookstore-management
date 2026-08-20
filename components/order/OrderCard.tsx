"use client";

import OrnamentalFrame from "@/components/ui/OrnamentalFrame";
import { cn } from "@/lib/utils";

import {
  formatOrderDate,
  getOrderItemsCount,
  getOrderLinesCount,
  getOrderStatusLabel,
  isOrderPending,
  type Order,
} from "./order-data";

type OrderCardProps = {
  order: Order;
  onSelect: () => void;
  selected?: boolean;
};

export default function OrderCard({
  order,
  onSelect,
  selected = false,
}: OrderCardProps) {
  const statusName = order.order_status?.name;
  const pending = isOrderPending(statusName);
  const itemsCount = getOrderItemsCount(order);
  const linesCount = getOrderLinesCount(order);
  const supplierName =
    order.lines.find((line) => line.supplier?.name)?.supplier?.name ??
    "Fournisseur inconnu";

  return (
    <OrnamentalFrame
      as="button"
      type="button"
      onClick={onSelect}
      className={cn(
        "group w-full cursor-pointer bg-surface-container-low p-6 text-left transition-colors",
        selected
          ? "border-primary/60 bg-primary/5"
          : "hover:border-primary/40 hover:bg-surface-container",
      )}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <p className="font-label text-[10px] tracking-[0.24em] text-burnished-gold/70 uppercase">
              Commande #{order.id}
            </p>
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

          <h3 className="mb-2 font-headline text-xl text-primary transition-colors group-hover:text-primary-fixed-dim">
            {linesCount} titre{linesCount > 1 ? "s" : ""} · {itemsCount}{" "}
            exemplaire{itemsCount > 1 ? "s" : ""}
          </h3>

          <p className="font-body text-sm text-on-surface-variant">
            Passée le {formatOrderDate(order.order_datetime)}
            {order.user?.username ? ` par ${order.user.username}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:items-end">
          <div className="border border-outline-variant/40 bg-surface px-3 py-2">
            <p className="mb-1 font-label text-[9px] tracking-[0.2em] text-outline uppercase">
              Fournisseur
            </p>
            <p className="font-body text-sm text-on-surface">{supplierName}</p>
          </div>

          <span className="inline-flex items-center gap-1 font-label text-[10px] tracking-widest text-primary uppercase transition-colors group-hover:text-primary-fixed-dim">
            Consulter
            <span className="material-symbols-outlined text-sm" aria-hidden>
              chevron_right
            </span>
          </span>
        </div>
      </div>
    </OrnamentalFrame>
  );
}
