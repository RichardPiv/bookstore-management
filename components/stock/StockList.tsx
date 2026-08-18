"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

import StockCard from "./StockCard";
import StockDetail from "./StockDetail";
import { type LoadStatus, type Stock } from "./stock-data";

const PAGE_SIZE = 12;

export default function StockList() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [page, setPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(stocks.length / PAGE_SIZE));

  const paginatedStocks = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return stocks.slice(start, start + PAGE_SIZE);
  }, [stocks, page]);

  function handleStockUpdated(updatedStock: Stock) {
    setStocks((current) =>
      current.map((stock) =>
        stock.book_id === updatedStock.book_id ? updatedStock : stock,
      ),
    );
    setSelectedStock(updatedStock);
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
    <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="flex flex-col gap-6 lg:col-span-6">
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
        ) : (
          <>
            {paginatedStocks.map((stock) => (
              <StockCard
                key={stock.book_id}
                stock={stock}
                selected={selectedStock?.book_id === stock.book_id}
                onSelect={() => setSelectedStock(stock)}
              />
            ))}

            {totalPages > 1 ? (
              <nav
                className="mt-2 flex flex-wrap items-center justify-center gap-4"
                aria-label="Pagination des stocks"
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="min-w-32"
                >
                  <ChevronLeft className="size-3.5" aria-hidden />
                  Précédent
                </Button>

                <p className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase">
                  Page <span className="text-primary">{page}</span>
                  {" / "}
                  {totalPages}
                </p>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={page >= totalPages}
                  className="min-w-32"
                >
                  Suivant
                  <ChevronRight className="size-3.5" aria-hidden />
                </Button>
              </nav>
            ) : null}
          </>
        )}
      </div>

      <div className="flex flex-col gap-8 lg:col-span-6">
        <StockDetail
          stock={selectedStock}
          onStockUpdated={handleStockUpdated}
        />
      </div>
    </div>
  );
}
