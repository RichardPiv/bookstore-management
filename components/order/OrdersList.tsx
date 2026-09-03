"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import CollectionPagination from "@/components/ui/CollectionPagination";
import EntityDetailOverlay from "@/components/ui/EntityDetailOverlay";
import FilterTabs from "@/components/ui/FilterTabs";

import OrderCard from "./OrderCard";
import OrderDetail from "./OrderDetail";
import {
  matchesOrderFilter,
  type LoadStatus,
  type Order,
  type OrderFilter,
} from "./order-data";

const PAGE_SIZE = 9;

const ORDER_FILTERS: { id: OrderFilter; label: string }[] = [
  { id: "pending", label: "En attente" },
  { id: "received", label: "Reçues" },
  { id: "all", label: "Toutes" },
];

export default function OrdersList() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<OrderFilter>("pending");
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

  const filterTabs = useMemo(
    () =>
      ORDER_FILTERS.map((item) => ({
        ...item,
        count: orders.filter((order) => matchesOrderFilter(order, item.id)).length,
      })),
    [orders],
  );

  const filteredOrders = useMemo(
    () => orders.filter((order) => matchesOrderFilter(order, filter)),
    [orders, filter],
  );

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, page]);

  useEffect(() => {
    setPage(1);
    setSelectedOrder(null);
  }, [filter]);

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
        className="mt-10 border border-outline-variant bg-surface-container-low px-6 py-4 font-body text-sm text-on-surface-variant"
        role="alert"
      >
        {errorMessage ?? "Impossible de joindre les commandes. Réessayez."}
      </p>
    );
  }

  return (
    <div className="mt-10 flex flex-col gap-8">
      <FilterTabs
        items={filterTabs}
        value={filter}
        onChange={setFilter}
        ariaLabel="Filtrer les commandes"
      />

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
      ) : filteredOrders.length === 0 ? (
        <p className="border border-dashed border-outline-variant/50 bg-surface-container-low px-6 py-12 text-center font-body text-sm text-on-surface-variant italic">
          Aucune commande pour ce filtre.
        </p>
      ) : (
        <>
          <div className="entity-grid">
            {paginatedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                variant="grid"
                onSelect={() => setSelectedOrder(order)}
              />
            ))}
          </div>

          <CollectionPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            ariaLabel="Pagination des commandes"
          />
        </>
      )}

      <EntityDetailOverlay
        open={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        ariaLabel="Détail de commande"
      >
        {selectedOrder ? (
          <OrderDetail
            order={selectedOrder}
            embedded
            onOrderUpdated={handleOrderUpdated}
          />
        ) : null}
      </EntityDetailOverlay>
    </div>
  );
}
