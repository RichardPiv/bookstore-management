"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import CollectionPagination from "@/components/ui/CollectionPagination";
import EntityDetailOverlay from "@/components/ui/EntityDetailOverlay";
import FilterTabs from "@/components/ui/FilterTabs";
import { RESOLVED_ALERT_STATUS_NAMES } from "@/lib/alert-references";

import AlertCard from "./AlertCard";
import AlertDetail from "./AlertDetail";
import {
  matchesAlertFilter,
  type Alert,
  type AlertFilter,
  type AlertRef,
  type LoadStatus,
} from "./alert-data";

const PAGE_SIZE = 9;

const ALERT_FILTERS: { id: AlertFilter; label: string }[] = [
  { id: "active", label: "Actives" },
  { id: "resolved", label: "Résolues" },
  { id: "all", label: "Toutes" },
];

const RESOLVED_SET = new Set<string>(RESOLVED_ALERT_STATUS_NAMES);

export default function AlertsList() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [resolvedStatus, setResolvedStatus] = useState<AlertRef | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filter, setFilter] = useState<AlertFilter>("active");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const [alertsRes, statusesRes] = await Promise.all([
          fetch("/api/alerts", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }),
          fetch("/api/alert_statuses", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }),
        ]);

        const [alertsBody, statusesBody] = await Promise.all([
          alertsRes.json(),
          statusesRes.json(),
        ]);

        if (cancelled) return;

        if (!alertsRes.ok) {
          setErrorMessage(
            alertsBody.error?.message ??
              "Impossible de joindre les alertes. Réessayez.",
          );
          setStatus("error");
          return;
        }

        const nextAlerts = Array.isArray(alertsBody.data)
          ? (alertsBody.data as Alert[])
          : [];
        setAlerts(nextAlerts);
        setSelectedAlert(null);
        setPage(1);
        setStatus("ready");

        if (statusesRes.ok && Array.isArray(statusesBody.data)) {
          const statuses = statusesBody.data as AlertRef[];
          const resolved =
            statuses.find((row) => RESOLVED_SET.has(row.name)) ?? null;
          setResolvedStatus(resolved);
        }
      } catch {
        if (cancelled) return;
        setErrorMessage("Impossible de joindre les alertes. Réessayez.");
        setStatus("error");
      }
    }

    void loadAlerts();

    return () => {
      cancelled = true;
    };
  }, []);

  const filterTabs = useMemo(
    () =>
      ALERT_FILTERS.map((item) => ({
        ...item,
        count: alerts.filter((alert) => matchesAlertFilter(alert, item.id))
          .length,
      })),
    [alerts],
  );

  const filteredAlerts = useMemo(
    () => alerts.filter((alert) => matchesAlertFilter(alert, filter)),
    [alerts, filter],
  );

  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / PAGE_SIZE));

  const paginatedAlerts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredAlerts.slice(start, start + PAGE_SIZE);
  }, [filteredAlerts, page]);

  useEffect(() => {
    setPage(1);
    setSelectedAlert(null);
  }, [filter]);

  function handleAlertUpdated(updatedAlert: Alert) {
    setAlerts((current) =>
      current.map((alert) =>
        alert.id === updatedAlert.id ? updatedAlert : alert,
      ),
    );
    setSelectedAlert(updatedAlert);
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
          Consultation des alertes…
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
        {errorMessage ?? "Impossible de joindre les alertes. Réessayez."}
      </p>
    );
  }

  return (
    <div className="mt-10 flex flex-col gap-8">
      <FilterTabs
        items={filterTabs}
        value={filter}
        onChange={setFilter}
        ariaLabel="Filtrer les alertes"
      />

      {alerts.length === 0 ? (
        <div className="border border-dashed border-outline-variant/50 bg-surface-container-low px-6 py-16 text-center">
          <span
            className="material-symbols-outlined mb-4 text-4xl text-outline/50"
            aria-hidden
          >
            notifications_active
          </span>
          <p className="font-headline text-lg text-primary uppercase">
            Aucune alerte
          </p>
          <p className="mt-2 font-body text-sm text-on-surface-variant">
            Les alertes de stock apparaîtront ici (simulation, rupture, rayon
            bas).
          </p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <p className="border border-dashed border-outline-variant/50 bg-surface-container-low px-6 py-12 text-center font-body text-sm text-on-surface-variant italic">
          {filter === "active"
            ? "Aucune alerte active pour le moment."
            : filter === "resolved"
              ? "Aucune alerte résolue dans l'historique."
              : "Aucune alerte pour ce filtre."}
        </p>
      ) : (
        <>
          <div className="entity-grid">
            {paginatedAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                variant="grid"
                onSelect={() => setSelectedAlert(alert)}
              />
            ))}
          </div>

          <CollectionPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            ariaLabel="Pagination des alertes"
          />
        </>
      )}

      <EntityDetailOverlay
        open={selectedAlert !== null}
        onClose={() => setSelectedAlert(null)}
        ariaLabel="Détail d'alerte"
      >
        {selectedAlert ? (
          <AlertDetail
            alert={selectedAlert}
            embedded
            resolvedStatus={resolvedStatus}
            onAlertUpdated={handleAlertUpdated}
          />
        ) : null}
      </EntityDetailOverlay>
    </div>
  );
}
