"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import CollectionPagination from "@/components/ui/CollectionPagination";
import EntityDetailOverlay from "@/components/ui/EntityDetailOverlay";
import FilterTabs from "@/components/ui/FilterTabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import StockCard from "./StockCard";
import StockDetail from "./StockDetail";
import {
  addEmptyReserveStocksToCart,
  navigateToCatalogCart,
} from "./stock-cart-actions";
import {
  canTransferStock,
  getMaxTransferQty,
  isReserveEmpty,
  matchesStockFilter,
  type LoadStatus,
  type Stock,
  type StockFilter,
} from "./stock-data";

const PAGE_SIZE = 9;

const STOCK_FILTERS: { id: StockFilter; label: string }[] = [
  { id: "watch", label: "À surveiller" },
  { id: "transferable", label: "Remise possible" },
  { id: "reserve_empty", label: "Réserve vide" },
  { id: "all", label: "Tous" },
];

export default function StockList() {
  const router = useRouter();
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [filter, setFilter] = useState<StockFilter>("watch");
  const [page, setPage] = useState(1);
  const [isTransferringAll, setIsTransferringAll] = useState(false);
  const [isAddingAllToCart, setIsAddingAllToCart] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStocks() {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const response = await fetch("/api/stocks", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const body = await response.json();

        if (cancelled) return;

        if (!response.ok) {
          setErrorMessage(
            body.error?.message ??
              "Impossible de joindre les stocks. Réessayez.",
          );
          setStatus("error");
          return;
        }

        const nextStocks = Array.isArray(body.data) ? body.data : [];
        setStocks(nextStocks);
        setSelectedStock(null);
        setPage(1);
        setStatus("ready");
      } catch {
        if (cancelled) return;
        setErrorMessage("Impossible de joindre les stocks. Réessayez.");
        setStatus("error");
      }
    }

    void loadStocks();

    return () => {
      cancelled = true;
    };
  }, []);

  const filterTabs = useMemo(
    () =>
      STOCK_FILTERS.map((item) => ({
        ...item,
        count: stocks.filter((stock) => matchesStockFilter(stock, item.id))
          .length,
      })),
    [stocks],
  );

  const filteredStocks = useMemo(
    () => stocks.filter((stock) => matchesStockFilter(stock, filter)),
    [stocks, filter],
  );

  const totalPages = Math.max(1, Math.ceil(filteredStocks.length / PAGE_SIZE));

  const paginatedStocks = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredStocks.slice(start, start + PAGE_SIZE);
  }, [filteredStocks, page]);

  const transferableStocks = useMemo(
    () => stocks.filter(canTransferStock),
    [stocks],
  );

  const emptyReserveStocks = useMemo(
    () => stocks.filter((stock) => stock.is_active && isReserveEmpty(stock)),
    [stocks],
  );

  useEffect(() => {
    setPage(1);
    setSelectedStock(null);
  }, [filter]);

  function handleStockUpdated(updatedStock: Stock) {
    setStocks((current) =>
      current.map((stock) =>
        stock.book_id === updatedStock.book_id ? updatedStock : stock,
      ),
    );
    setSelectedStock(updatedStock);
  }

  async function handleTransferAll() {
    if (isTransferringAll || transferableStocks.length === 0) return;

    setIsTransferringAll(true);
    setBulkMessage(null);
    setBulkError(null);

    let updatedStocks = stocks;
    let successCount = 0;
    let failureCount = 0;

    for (const stock of transferableStocks) {
      const qty = getMaxTransferQty(stock);

      try {
        const response = await fetch("/api/stocks/transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ book_id: stock.book_id, qty }),
        });
        const body = await response.json();

        if (!response.ok || !body.data) {
          failureCount += 1;
          continue;
        }

        const nextStock = body.data as Stock;
        updatedStocks = updatedStocks.map((row) =>
          row.book_id === nextStock.book_id ? nextStock : row,
        );
        successCount += 1;
      } catch {
        failureCount += 1;
      }
    }

    setStocks(updatedStocks);
    setSelectedStock((current) => {
      if (!current) return null;
      return (
        updatedStocks.find((stock) => stock.book_id === current.book_id) ??
        current
      );
    });

    if (successCount > 0) {
      setBulkMessage(
        `${successCount} titre${successCount > 1 ? "s" : ""} remisé${successCount > 1 ? "s" : ""} en rayon.`,
      );
    }
    if (failureCount > 0) {
      setBulkError(
        `${failureCount} transfert${failureCount > 1 ? "s" : ""} impossible${failureCount > 1 ? "s" : ""}.`,
      );
    }

    setIsTransferringAll(false);
  }

  function handleAddAllEmptyToCart() {
    if (isAddingAllToCart || emptyReserveStocks.length === 0) return;

    setIsAddingAllToCart(true);
    setBulkMessage(null);
    setBulkError(null);

    try {
      const cart = addEmptyReserveStocksToCart(stocks);
      if (cart.items.length === 0) {
        setBulkError("Aucun titre à commander.");
        setIsAddingAllToCart(false);
        return;
      }

      navigateToCatalogCart(router);
    } catch {
      setBulkError("Impossible d'ajouter au panier. Réessayez.");
      setIsAddingAllToCart(false);
    }
  }

  if (status === "loading") {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 py-24"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        <p className="font-label text-xs tracking-widest text-on-surface-variant uppercase">
          Consultation des stocks…
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <p
        className="mt-10 border border-outline-variant bg-surface-container-low px-6 py-4 font-body text-sm text-on-surface-variant"
        role="alert"
      >
        {errorMessage ?? "Impossible de joindre les stocks. Réessayez."}
      </p>
    );
  }

  return (
    <div className="mt-10 flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <FilterTabs
          items={filterTabs}
          value={filter}
          onChange={setFilter}
          ariaLabel="Filtrer les stocks"
        />

        {stocks.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {transferableStocks.length > 0 ? (
              <Button
                type="button"
                onClick={() => void handleTransferAll()}
                disabled={isTransferringAll}
                className={cn(isTransferringAll && "opacity-80")}
              >
                {isTransferringAll ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    Remise en rayon…
                  </>
                ) : (
                  <>
                    <span
                      className="material-symbols-outlined text-sm"
                      aria-hidden
                    >
                      move_up
                    </span>
                    Remettre tous en rayon ({transferableStocks.length})
                  </>
                )}
              </Button>
            ) : null}

            {emptyReserveStocks.length > 0 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddAllEmptyToCart}
                disabled={isAddingAllToCart}
                className={cn(isAddingAllToCart && "opacity-80")}
              >
                {isAddingAllToCart ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    Panier…
                  </>
                ) : (
                  <>
                    <span
                      className="material-symbols-outlined text-sm"
                      aria-hidden
                    >
                      shopping_cart
                    </span>
                    Commander réserves vides ({emptyReserveStocks.length})
                  </>
                )}
              </Button>
            ) : null}
          </div>
        ) : null}

        {bulkError ? (
          <p
            className="border border-error/40 bg-error/5 px-4 py-3 font-body text-sm text-error"
            role="alert"
          >
            {bulkError}
          </p>
        ) : null}

        {bulkMessage ? (
          <p
            className="border border-primary/40 bg-primary/5 px-4 py-3 font-body text-sm text-primary"
            role="status"
          >
            {bulkMessage}
          </p>
        ) : null}
      </div>

      {stocks.length === 0 ? (
        <div className="border border-dashed border-outline-variant/50 bg-surface-container-low px-6 py-16 text-center">
          <span
            className="material-symbols-outlined mb-4 text-4xl text-outline/50"
            aria-hidden
          >
            inventory_2
          </span>
          <p className="font-headline text-lg text-primary uppercase">
            Aucun stock
          </p>
          <p className="mt-2 font-body text-sm text-on-surface-variant">
            Les titres apparaîtront ici après leur première réception
            fournisseur.
          </p>
        </div>
      ) : filteredStocks.length === 0 ? (
        <p className="border border-dashed border-outline-variant/50 bg-surface-container-low px-6 py-12 text-center font-body text-sm text-on-surface-variant italic">
          Aucun titre pour ce filtre.
        </p>
      ) : (
        <>
          <div className="entity-grid">
            {paginatedStocks.map((stock) => (
              <StockCard
                key={stock.book_id}
                stock={stock}
                variant="grid"
                onSelect={() => setSelectedStock(stock)}
              />
            ))}
          </div>

          <CollectionPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            ariaLabel="Pagination des stocks"
          />
        </>
      )}

      <EntityDetailOverlay
        open={selectedStock !== null}
        onClose={() => setSelectedStock(null)}
        ariaLabel="Détail de stock"
      >
        {selectedStock ? (
          <StockDetail
            stock={selectedStock}
            embedded
            onStockUpdated={handleStockUpdated}
          />
        ) : null}
      </EntityDetailOverlay>
    </div>
  );
}
