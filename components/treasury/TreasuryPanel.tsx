"use client";

import { useState } from "react";

import ReliquaryFrame from "@/components/dashboard/ReliquaryFrame";
import { cn } from "@/lib/utils";

import TreasuryMovementsList from "./TreasuryMovementsList";
import {
  formatFlorins,
  type TreasuryOverviewData,
} from "./treasury-data";

type TreasuryPanelProps = {
  initialOverview: TreasuryOverviewData;
};

export default function TreasuryPanel({ initialOverview }: TreasuryPanelProps) {
  const [overview] = useState(initialOverview);

  return (
    <div className="mt-10 space-y-8">
      <ReliquaryFrame
        parchment
        variant={overview.is_low ? "error" : "default"}
        className="p-8"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className={cn(
                "font-label text-[10px] tracking-widest uppercase",
                overview.is_low ? "text-error/70" : "text-burnished-gold/60",
              )}
            >
              Solde de la caisse
            </p>
            <p
              className={cn(
                "mt-2 font-headline-xl text-5xl",
                overview.is_low ? "text-error" : "text-primary",
              )}
            >
              {formatFlorins(overview.balance)} F
            </p>
            <p className="mt-2 font-body text-sm text-on-surface-variant">
              Seuil d&apos;alerte : {formatFlorins(overview.low_threshold)} florins
            </p>
          </div>
          {overview.is_low ? (
            <div className="border border-error/40 bg-error/10 px-4 py-3">
              <p className="font-label text-[10px] tracking-widest text-error uppercase">
                Solde bas
              </p>
              <p className="mt-1 font-body text-sm text-error/80">
                La trésorerie est sous le seuil configuré.
              </p>
            </div>
          ) : null}
        </div>
      </ReliquaryFrame>

      <ReliquaryFrame parchment className="p-6">
        <TreasuryMovementsList />
      </ReliquaryFrame>
    </div>
  );
}
