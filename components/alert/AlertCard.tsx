"use client";

import OrnamentalFrame from "@/components/ui/OrnamentalFrame";
import { cn } from "@/lib/utils";

import {
  formatAlertDate,
  getAlertStatusLabel,
  getAlertTypeLabel,
  isAlertActive,
  isReserveOutAlert,
  isShelfOutAlert,
  type Alert,
} from "./alert-data";

type AlertCardProps = {
  alert: Alert;
  onSelect: () => void;
  selected?: boolean;
};

export default function AlertCard({
  alert,
  onSelect,
  selected = false,
}: AlertCardProps) {
  const statusName = alert.alert_status?.name;
  const typeName = alert.alert_type?.name;
  const active = isAlertActive(statusName);
  const shelfOut = isShelfOutAlert(typeName);
  const reserveOut = isReserveOutAlert(typeName);
  const bookTitle = alert.book?.title ?? `Livre #${alert.book_id}`;

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
              Alerte #{alert.id}
            </p>
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
                shelfOut || reserveOut
                  ? "border-error/40 bg-error/5 text-error"
                  : "border-outline-variant/50 text-on-surface-variant",
              )}
            >
              {getAlertTypeLabel(typeName)}
            </span>
          </div>

          <h3 className="mb-2 font-headline text-xl text-primary transition-colors group-hover:text-primary-fixed-dim">
            {bookTitle}
          </h3>

          <p className="line-clamp-2 font-body text-sm text-on-surface-variant">
            {alert.description}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:items-end">
          <div className="border border-outline-variant/40 bg-surface px-3 py-2">
            <p className="mb-1 font-label text-[9px] tracking-[0.2em] text-outline uppercase">
              Déclenchée
            </p>
            <p className="font-body text-sm text-on-surface">
              {formatAlertDate(alert.alert_datetime)}
            </p>
          </div>

          <span className="inline-flex items-center gap-1 font-label text-[10px] tracking-widest text-primary uppercase transition-colors group-hover:text-primary-fixed-dim">
            Consulter
            <span className="material-symbols-outlined text-sm" aria-hidden>
              chevron_right
            </span>
          </span>
        </div>
      </div>
    </OrnamentalFrame>
  );
}
