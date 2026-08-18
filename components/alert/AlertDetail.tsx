"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  formatAlertDate,
  getAlertStatusLabel,
  getAlertTypeLabel,
  isAlertActive,
  isShelfLowAlert,
  isShelfOutAlert,
  type Alert,
  type AlertRef,
} from "./alert-data";

type AlertDetailProps = {
  alert: Alert | null;
  resolvedStatus: AlertRef | null;
  onAlertUpdated?: (alert: Alert) => void;
};

export default function AlertDetail({
  alert,
  resolvedStatus,
  onAlertUpdated,
}: AlertDetailProps) {
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolveSuccess, setResolveSuccess] = useState<string | null>(null);

  useEffect(() => {
    setResolveError(null);
    setResolveSuccess(null);
    setIsResolving(false);
  }, [alert?.id]);

  if (!alert) {
    return (
      <div className="border border-dashed border-outline-variant/50 bg-surface-container-low px-6 py-10 text-center">
        <span
          className="material-symbols-outlined mb-4 text-4xl text-outline/50"
          aria-hidden
        >
          notifications_active
        </span>
        <p className="font-label text-[10px] tracking-[0.24em] text-outline uppercase">
          Détail
        </p>
        <p className="mt-3 font-body text-sm text-on-surface-variant">
          Sélectionne une alerte pour en afficher le détail.
        </p>
      </div>
    );
  }

  const statusName = alert.alert_status?.name;
  const typeName = alert.alert_type?.name;
  const active = isAlertActive(statusName);
  const shelfOut = isShelfOutAlert(typeName);
  const shelfLow = isShelfLowAlert(typeName);
  const bookTitle = alert.book?.title ?? `Livre #${alert.book_id}`;
  const qtyShelf = alert.book?.qty_shelf;
  const qtyReserve = alert.book?.qty_reserve;
  const threshold = alert.book?.alert_threshold;

  async function handleResolve() {
    if (!alert || !resolvedStatus || isResolving || !active) return;

    setIsResolving(true);
    setResolveError(null);
    setResolveSuccess(null);

    try {
      const response = await fetch(`/api/alerts/${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alert_status_id: resolvedStatus.id }),
      });
      const body = await response.json();

      if (!response.ok) {
        setResolveError(
          body.error?.message ?? "Impossible de résoudre l'alerte.",
        );
        return;
      }

      if (body.data) {
        onAlertUpdated?.(body.data as Alert);
        setResolveSuccess("Alerte marquée comme résolue.");
      }
    } catch {
      setResolveError("Impossible de joindre les archives. Réessayez.");
    } finally {
      setIsResolving(false);
    }
  }

  return (
    <div className="border-ornamental sticky top-6 bg-surface-container-low p-6">
      <div className="catalog-corner catalog-corner-tl" aria-hidden />
      <div className="catalog-corner catalog-corner-tr" aria-hidden />
      <div className="catalog-corner catalog-corner-bl" aria-hidden />
      <div className="catalog-corner catalog-corner-br" aria-hidden />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-outline-variant/40 pb-5">
        <div>
          <p className="mb-2 font-label text-[10px] tracking-[0.24em] text-burnished-gold/70 uppercase">
            Alerte #{alert.id}
          </p>
          <h3 className="font-headline text-2xl text-primary uppercase">
            {bookTitle}
          </h3>
          <p className="mt-2 font-body text-sm text-on-surface-variant">
            Déclenchée le {formatAlertDate(alert.alert_datetime)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              "border px-2 py-1 font-label text-[9px] tracking-[0.2em] uppercase",
              active
                ? "border-burnished-gold/40 bg-burnished-gold/10 text-burnished-gold"
                : "border-primary/40 bg-primary/10 text-primary",
            )}
          >
            {getAlertStatusLabel(statusName)}
          </span>
          <span
            className={cn(
              "border px-2 py-1 font-label text-[9px] tracking-[0.2em] uppercase",
              shelfOut
                ? "border-error/40 bg-error/5 text-error"
                : "border-outline-variant/50 text-on-surface-variant",
            )}
          >
            {getAlertTypeLabel(typeName)}
          </span>
        </div>
      </div>

      <div className="mb-8 border border-outline-variant/30 bg-surface-container p-4">
        <p className="mb-2 font-label text-[9px] tracking-[0.2em] text-outline uppercase">
          Description
        </p>
        <p className="font-body text-sm text-on-surface">{alert.description}</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="border border-outline-variant/40 bg-surface px-4 py-3">
          <p className="mb-1 font-label text-[9px] tracking-[0.2em] text-outline uppercase">
            Réserve
          </p>
          <p className="font-headline text-2xl text-primary">
            {qtyReserve ?? "—"}
          </p>
        </div>
        <div className="border border-outline-variant/40 bg-surface px-4 py-3">
          <p className="mb-1 font-label text-[9px] tracking-[0.2em] text-outline uppercase">
            Rayon
          </p>
          <p className="font-headline text-2xl text-primary">
            {qtyShelf ?? "—"}
          </p>
        </div>
        <div className="border border-outline-variant/40 bg-surface px-4 py-3">
          <p className="mb-1 font-label text-[9px] tracking-[0.2em] text-outline uppercase">
            Seuil
          </p>
          <p className="font-headline text-2xl text-primary">
            {threshold ?? "—"}
          </p>
        </div>
      </div>

      {(shelfLow || shelfOut) && active ? (
        <p className="mb-6 font-body text-sm text-on-surface-variant">
          Remise en rayon manuelle depuis la page Stocks (D16). L&apos;alerte
          peut aussi se résoudre automatiquement une fois le stock corrigé
          (D30).
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" className="min-w-40">
          <Link href="/stocks">
            <span className="material-symbols-outlined text-sm" aria-hidden>
              inventory_2
            </span>
            Voir les stocks
          </Link>
        </Button>

        {active && resolvedStatus ? (
          <Button
            type="button"
            onClick={() => void handleResolve()}
            disabled={isResolving}
            className={cn("min-w-48", isResolving && "opacity-80")}
          >
            {isResolving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Résolution…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm" aria-hidden>
                  check_circle
                </span>
                Marquer résolue
              </>
            )}
          </Button>
        ) : null}
      </div>

      {resolveError ? (
        <p
          className="mt-5 border border-error/40 bg-error/5 px-4 py-3 font-body text-sm text-error"
          role="alert"
        >
          {resolveError}
        </p>
      ) : null}

      {resolveSuccess ? (
        <p
          className="mt-5 border border-primary/40 bg-primary/5 px-4 py-3 font-body text-sm text-primary"
          role="status"
        >
          {resolveSuccess}
        </p>
      ) : null}
    </div>
  );
}
