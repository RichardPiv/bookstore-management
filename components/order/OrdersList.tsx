"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import OrderCard from "./OrderCard";
import OrderDetail from "./OrderDetail";
import { type LoadStatus, type Order } from "./order-data";
import { Button } from "../ui/button";

const PAGE_SIZE = 6;

export default function OrdersList() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const response = await fetch("/api/orders", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const body = await response.json();

        if (cancelled) return;

        if (!response.ok) {
          setErrorMessage(
            body.error?.message ??
              "Impossible de joindre les commandes. Réessayez.",
          );
          setStatus("error");
          return;
        }

        const nextOrders = Array.isArray(body.data) ? body.data : [];
        setOrders(nextOrders);
        setSelectedOrder(null);
        setPage(1);
        setStatus("ready");
      } catch {
        if (cancelled) return;
        setErrorMessage("Impossible de joindre les commandes. Réessayez.");
        setStatus("error");
      }
    }

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return orders.slice(start, start + PAGE_SIZE);
  }, [orders, page]);

  function handleOrderUpdated(updatedOrder: Order) {
    setOrders((current) =>
      current.map((order) =>
        order.id === updatedOrder.id ? updatedOrder : order,
      ),
    );
    setSelectedOrder(updatedOrder);
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
          Consultation des commandes…
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <p
        className="border border-outline-variant bg-surface-container-low px-6 py-4 font-body text-sm text-on-surface-variant"
        role="alert"
      >
        {errorMessage ?? "Impossible de joindre les commandes. Réessayez."}
      </p>
    );
  }

  return (
    <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="flex flex-col gap-6 lg:col-span-6">
        {orders.length === 0 ? (
          <div className="border border-dashed border-outline-variant/50 bg-surface-container-low px-6 py-16 text-center">
            <span
              className="material-symbols-outlined mb-4 text-4xl text-outline/50"
              aria-hidden
            >
              local_shipping
            </span>
            <p className="font-headline text-lg text-primary uppercase">
              Aucune commande
            </p>
            <p className="mt-2 font-body text-sm text-on-surface-variant">
              Les commandes fournisseur apparaîtront ici une fois passées depuis
              le catalogue.
            </p>
          </div>
        ) : (
          <>
            {paginatedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                selected={selectedOrder?.id === order.id}
                onSelect={() => setSelectedOrder(order)}
              />
            ))}

            {totalPages > 1 ? (
              <nav
                className="mt-2 flex flex-wrap items-center justify-center gap-4"
                aria-label="Pagination des commandes"
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
        <OrderDetail
          order={selectedOrder}
          onOrderUpdated={handleOrderUpdated}
        />
      </div>
    </div>
  );
}
