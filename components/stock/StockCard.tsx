"use client";

import OrnamentalFrame from "@/components/ui/OrnamentalFrame";
import { cn } from "@/lib/utils";

import {
  formatFlorins,
  getMaxTransferQty,
  isShelfLow,
  SHELF_MAX,
  type Stock,
} from "./stock-data";

type StockCardProps = {
  stock: Stock;
  onSelect: () => void;
  selected?: boolean;
};

export default function StockCard({
  stock,
  onSelect,
  selected = false,
}: StockCardProps) {
  const shelfLow = isShelfLow(stock);
  const canTransfer = getMaxTransferQty(stock) > 0;

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
              Livre #{stock.book_id}
            </p>
            {!stock.is_active ? (
              <span className="border border-outline-variant/50 px-2 py-1 font-label text-[9px] tracking-[0.2em] text-outline uppercase">
                Inactif
              </span>
            ) : null}
            {shelfLow ? (
              <span className="border border-burnished-gold/40 bg-burnished-gold/10 px-2 py-1 font-label text-[9px] tracking-[0.2em] text-burnished-gold uppercase">
                Rayon bas
              </span>
            ) : null}
            {canTransfer ? (
              <span className="border border-primary/40 bg-primary/10 px-2 py-1 font-label text-[9px] tracking-[0.2em] text-primary uppercase">
                Remise possible
              </span>
            ) : null}
          </div>

          <h3 className="mb-2 font-headline text-xl text-primary transition-colors group-hover:text-primary-fixed-dim">
            {stock.title}
          </h3>

          <p className="font-body text-sm text-on-surface-variant">
            Achat {formatFlorins(stock.purchase_price)} · Vente{" "}
            {formatFlorins(stock.sale_price)} florins
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:items-end">
          <div className="grid grid-cols-2 gap-2 sm:min-w-44">
            <div className="border border-outline-variant/40 bg-surface px-3 py-2">
              <p className="mb-1 font-label text-[9px] tracking-[0.2em] text-outline uppercase">
                Réserve
              </p>
              <p className="font-headline text-lg text-on-surface">
                {stock.qty_reserve}
              </p>
            </div>
            <div className="border border-outline-variant/40 bg-surface px-3 py-2">
              <p className="mb-1 font-label text-[9px] tracking-[0.2em] text-outline uppercase">
                Rayon
              </p>
              <p className="font-headline text-lg text-on-surface">
                {stock.qty_shelf}
                <span className="text-sm text-on-surface-variant">
                  {" "}
                  / {SHELF_MAX}
                </span>
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 font-label text-[10px] tracking-widest text-primary uppercase transition-colors group-hover:text-primary-fixed-dim">
            Gérer
            <span className="material-symbols-outlined text-sm" aria-hidden>
              chevron_right
            </span>
          </span>
        </div>
      </div>
    </OrnamentalFrame>
  );
}
