"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  formatFlorins,
  formatMovementDate,
  isDebitMovement,
  movementTypeLabel,
  type LoadStatus,
  type TreasuryMovementData,
} from "./treasury-data";

type TreasuryMovementsListProps = {
  refreshKey?: number;
  /** Optional player id for admin view. */
  userId?: number;
};

export default function TreasuryMovementsList({
  refreshKey = 0,
  userId,
}: TreasuryMovementsListProps) {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [movements, setMovements] = useState<TreasuryMovementData[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("");

  const loadMovements = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);

    const params = new URLSearchParams({ limit: "50" });
    if (typeFilter) {
      params.set("type", typeFilter);
    }
    if (userId !== undefined) {
      params.set("user_id", String(userId));
    }

    try {
      const response = await fetch(`/api/treasury/movements?${params}`);
      const body = await response.json();

      if (!response.ok) {
        setErrorMessage(
          body.error?.message ?? "Impossible de charger les mouvements.",
        );
        setStatus("error");
        return;
      }

      setMovements(Array.isArray(body.data) ? body.data : []);
      setStatus("ready");
    } catch {
      setErrorMessage("Impossible de charger les mouvements. Réessayez.");
      setStatus("error");
    }
  }, [typeFilter, userId]);

  useEffect(() => {
    void loadMovements();
  }, [loadMovements, refreshKey]);

  if (status === "loading") {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 py-16"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        <p className="font-label text-xs tracking-widest text-on-surface-variant uppercase">
          Consultation du journal…
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
        {errorMessage}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-label text-[10px] tracking-[0.24em] text-burnished-gold/70 uppercase">
          Journal des mouvements
        </p>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-outline-variant/50 bg-surface px-3 py-1.5 font-label text-[10px] tracking-widest text-on-surface-variant uppercase outline-none focus:border-primary"
          aria-label="Filtrer par type"
        >
          <option value="">Tous les types</option>
          <option value="supplier_purchase">Achats fournisseur</option>
          <option value="customer_sale">Ventes client</option>
          <option value="adjustment_in">Ajustements (+)</option>
          <option value="adjustment_out">Ajustements (−)</option>
        </select>
      </div>

      {movements.length === 0 ? (
        <p className="border border-dashed border-outline-variant/50 px-6 py-10 text-center font-body text-sm text-on-surface-variant italic">
          Aucun mouvement pour ce filtre.
        </p>
      ) : (
        <ul className="space-y-3">
          {movements.map((movement) => {
            const debit = isDebitMovement(movement.type);
            return (
              <li
                key={movement.id}
                className="border border-outline-variant/40 bg-surface-container px-4 py-4 sm:px-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-headline text-base text-primary">
                      {movementTypeLabel(movement.type)}
                    </p>
                    <p className="mt-1 font-label text-[10px] tracking-wider text-on-surface-variant uppercase">
                      {formatMovementDate(movement.created_at)}
                    </p>
                    {movement.note ? (
                      <p className="mt-2 font-body text-sm text-on-surface-variant">
                        {movement.note}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-3 font-label text-[9px] tracking-wider text-outline uppercase">
                      {movement.order_id != null ? (
                        <span>Commande #{movement.order_id}</span>
                      ) : null}
                      {movement.book_id != null ? (
                        <span>Livre #{movement.book_id}</span>
                      ) : null}
                      {movement.simulation_event_id != null ? (
                        <span>Événement #{movement.simulation_event_id}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right sm:shrink-0">
                    <p
                      className={cn(
                        "font-headline text-lg",
                        debit ? "text-error" : "text-primary",
                      )}
                    >
                      {debit ? "−" : "+"}
                      {formatFlorins(movement.amount)} F
                    </p>
                    <p className="mt-1 font-label text-[10px] text-on-surface-variant uppercase">
                      Solde {formatFlorins(movement.balance_after)} F
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
