"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import OrnamentalFrame from "@/components/ui/OrnamentalFrame";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  formatFlorins,
  formatStockDate,
  getMaxTransferQty,
  isReserveEmpty,
  isShelfLow,
  SHELF_MAX,
  type Stock,
} from "./stock-data";

type StockDetailProps = {
  stock: Stock | null;
  onStockUpdated?: (stock: Stock) => void;
};

export default function StockDetail({
  stock,
  onStockUpdated,
}: StockDetailProps) {
  const [qty, setQty] = useState("1");
  const [salePrice, setSalePrice] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  const maxTransfer = useMemo(
    () => (stock ? getMaxTransferQty(stock) : 0),
    [stock],
  );

  useEffect(() => {
    setTransferError(null);
    setTransferSuccess(null);
    setIsTransferring(false);
    setSalePrice("");
    setQty("1");
  }, [stock?.book_id]);

  useEffect(() => {
    if (!stock) return;
    setQty((current) => {
      const parsed = Number(current);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return maxTransfer > 0 ? "1" : "0";
      }
      if (parsed > maxTransfer) {
        return String(Math.max(maxTransfer, 0));
      }
      return current;
    });
  }, [stock, maxTransfer]);

  if (!stock) {
    return (
      <div className="border border-dashed border-outline-variant/50 bg-surface-container-low px-6 py-10 text-center">
        <span
          className="material-symbols-outlined mb-4 text-4xl text-outline/50"
          aria-hidden
        >
          inventory_2
        </span>
        <p className="font-label text-[10px] tracking-[0.24em] text-outline uppercase">
          Détail
        </p>
        <p className="mt-3 font-body text-sm text-on-surface-variant">
          Sélectionne un titre pour consulter les stocks et remiser en rayon.
        </p>
      </div>
    );
  }

  const shelfLow = isShelfLow(stock);
  const reserveEmpty = isReserveEmpty(stock);
  const canTransfer = maxTransfer > 0 && stock.is_active;

  async function handleTransfer(event: FormEvent) {
    event.preventDefault();
    if (!stock || isTransferring || !canTransfer) return;

    const parsedQty = Number(qty);
    if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
      setTransferError("Indique une quantité entière positive.");
      return;
    }
    if (parsedQty > maxTransfer) {
      setTransferError(
        `Quantité maximale possible : ${maxTransfer} (réserve et plafond rayon ${SHELF_MAX}).`,
      );
      return;
    }

    setIsTransferring(true);
    setTransferError(null);
    setTransferSuccess(null);

    try {
      const payload: { book_id: number; qty: number; sale_price?: number } = {
        book_id: stock.book_id,
        qty: parsedQty,
      };

      const trimmedSale = salePrice.trim();
      if (trimmedSale !== "") {
        const parsedSale = Number(trimmedSale.replace(",", "."));
        if (!Number.isFinite(parsedSale) || parsedSale <= 0) {
          setTransferError("Prix de vente invalide.");
          setIsTransferring(false);
          return;
        }
        payload.sale_price = parsedSale;
      }

      const response = await fetch("/api/stocks/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();

      if (!response.ok) {
        setTransferError(
          body.error?.message ?? "Impossible de remiser en rayon.",
        );
        return;
      }

      if (body.data) {
        onStockUpdated?.(body.data as Stock);
        setTransferSuccess(
          `${parsedQty} exemplaire${parsedQty > 1 ? "s" : ""} remisé${parsedQty > 1 ? "s" : ""} en rayon.`,
        );
      }
    } catch {
      setTransferError("Impossible de joindre les archives. Réessayez.");
    } finally {
      setIsTransferring(false);
    }
  }

  return (
    <OrnamentalFrame className="sticky top-6 bg-surface-container-low p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-outline-variant/40 pb-5">
        <div>
          <p className="mb-2 font-label text-[10px] tracking-[0.24em] text-burnished-gold/70 uppercase">
            Livre #{stock.book_id}
          </p>
          <h3 className="font-headline text-2xl text-primary uppercase">
            {stock.title}
          </h3>
          <p className="mt-2 font-body text-sm text-on-surface-variant">
            En librairie depuis le {formatStockDate(stock.first_received_at)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {shelfLow ? (
            <span className="border border-burnished-gold/40 bg-burnished-gold/10 px-2 py-1 font-label text-[9px] tracking-[0.2em] text-burnished-gold uppercase">
              Rayon bas
            </span>
          ) : (
            <span className="border border-primary/40 bg-primary/10 px-2 py-1 font-label text-[9px] tracking-[0.2em] text-primary uppercase">
              Rayon OK
            </span>
          )}
          {!stock.is_active ? (
            <span className="border border-outline-variant/50 px-2 py-1 font-label text-[9px] tracking-[0.2em] text-outline uppercase">
              Inactif
            </span>
          ) : null}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="border border-outline-variant/40 bg-surface px-4 py-3">
          <p className="mb-1 flex items-center gap-2 font-label text-[9px] tracking-[0.2em] text-outline uppercase">
            <span className="material-symbols-outlined text-sm" aria-hidden>
              inventory_2
            </span>
            Réserve
          </p>
          <p className="font-headline text-2xl text-primary">
            {stock.qty_reserve}
          </p>
        </div>
        <div className="border border-outline-variant/40 bg-surface px-4 py-3">
          <p className="mb-1 flex items-center gap-2 font-label text-[9px] tracking-[0.2em] text-outline uppercase">
            <span className="material-symbols-outlined text-sm" aria-hidden>
              auto_stories
            </span>
            Rayon
          </p>
          <p className="font-headline text-2xl text-primary">
            {stock.qty_shelf}
            <span className="text-base text-on-surface-variant">
              {" "}
              / {SHELF_MAX}
            </span>
          </p>
        </div>
        <div className="border border-outline-variant/40 bg-surface px-4 py-3">
          <p className="mb-1 flex items-center gap-2 font-label text-[9px] tracking-[0.2em] text-outline uppercase">
            <span className="material-symbols-outlined text-sm" aria-hidden>
              notifications_active
            </span>
            Seuil
          </p>
          <p className="font-headline text-2xl text-primary">
            {stock.alert_threshold}
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 border border-outline-variant/30 bg-surface-container p-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 font-label text-[9px] tracking-[0.2em] text-outline uppercase">
            Prix d&apos;achat
          </p>
          <p className="font-body text-sm text-on-surface">
            {formatFlorins(stock.purchase_price)} florins
          </p>
        </div>
        <div>
          <p className="mb-1 font-label text-[9px] tracking-[0.2em] text-outline uppercase">
            Prix de vente
          </p>
          <p className="font-body text-sm text-on-surface">
            {formatFlorins(stock.sale_price)} florins
          </p>
        </div>
      </div>

      <form onSubmit={handleTransfer} className="flex flex-col gap-5">
        <div>
          <h4 className="mb-1 font-headline text-lg text-primary uppercase">
            Remise en rayon
          </h4>
          <p className="font-body text-sm text-on-surface-variant">
            Transfert réserve → rayon (max {SHELF_MAX} en rayon).
          </p>
        </div>

        {!stock.is_active ? (
          <p
            className="border border-outline-variant bg-surface px-4 py-3 font-body text-sm text-on-surface-variant"
            role="status"
          >
            Livre inactif : transfert impossible.
          </p>
        ) : reserveEmpty ? (
          <p
            className="border border-outline-variant bg-surface px-4 py-3 font-body text-sm text-on-surface-variant"
            role="status"
          >
            Réserve vide : passe une commande fournisseur pour réapprovisionner.
          </p>
        ) : maxTransfer <= 0 ? (
          <p
            className="border border-outline-variant bg-surface px-4 py-3 font-body text-sm text-on-surface-variant"
            role="status"
          >
            Rayon plein ({SHELF_MAX}/{SHELF_MAX}) : impossible d&apos;ajouter
            des exemplaires.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="transfer-qty"
                  className="font-label text-[10px] tracking-widest text-outline uppercase"
                >
                  Quantité (max {maxTransfer})
                </label>
                <input
                  id="transfer-qty"
                  type="number"
                  min={1}
                  max={maxTransfer}
                  step={1}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  disabled={isTransferring}
                  className="border border-outline-variant bg-surface px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="transfer-sale-price"
                  className="font-label text-[10px] tracking-widest text-outline uppercase"
                >
                  Prix de vente (optionnel)
                </label>
                <input
                  id="transfer-sale-price"
                  type="text"
                  inputMode="decimal"
                  placeholder={String(stock.sale_price)}
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  disabled={isTransferring}
                  className="border border-outline-variant bg-surface px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isTransferring || !canTransfer}
              className={cn(
                "min-w-48 self-start",
                isTransferring && "opacity-80",
              )}
            >
              {isTransferring ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Remise…
                </>
              ) : (
                <>
                  <span
                    className="material-symbols-outlined text-sm"
                    aria-hidden
                  >
                    move_up
                  </span>
                  Remiser en rayon
                </>
              )}
            </Button>
          </>
        )}

        {transferError ? (
          <p
            className="border border-error/40 bg-error/5 px-4 py-3 font-body text-sm text-error"
            role="alert"
          >
            {transferError}
          </p>
        ) : null}

        {transferSuccess ? (
          <p
            className="border border-primary/40 bg-primary/5 px-4 py-3 font-body text-sm text-primary"
            role="status"
          >
            {transferSuccess}
          </p>
        ) : null}
      </form>
    </OrnamentalFrame>
  );
}
