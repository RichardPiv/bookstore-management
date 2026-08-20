"use client";

import { Button } from "@/components/ui/button";
import OrnamentalFrame from "@/components/ui/OrnamentalFrame";
import { cn } from "@/lib/utils";

import {
  countPurchases,
  formatSimulationTime,
  getEventTypeLabel,
  isWarningEvent,
  type SimulationRun,
} from "./simulation-data";

const SHOP_HERO_IMAGE_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCB5OwyxIz49eLCz1MFMKNcgFIZSK4wXuQBqo1XgvNObFTgraXH5w20Vh5lXayq3FCHVDmJDHSg_d9nwpuzUO-oAkUJ4vtw_tvi6tTqjJRUgdAWVeJgnU0OciXJA3ljwrAKez3vxIcE7ZBNa0dereDb2CdDxRw8Kx_jBW69W80tvo4j-455NOOTsV4rpcyVrlv2oNwlnosaEFnJOn98N5qOQSnmK0gE9QgWIiCrxlqtXXrb6Oq1eQRF-tnYvtj1dHPvXc5BoESA0fgu";

type SimulationRunViewProps = {
  run: SimulationRun;
  onNewSimulation: () => void;
};

function StatCard({
  label,
  icon,
  value,
  unit,
  footerLabel,
  footerValue,
  barPercent,
  tone = "default",
}: {
  label: string;
  icon: string;
  value: string | number;
  unit: string;
  footerLabel: string;
  footerValue: string;
  barPercent: number;
  tone?: "default" | "error";
}) {
  return (
    <OrnamentalFrame className="relative flex h-36 flex-col justify-between bg-surface-container-low p-6">
      <div className="flex items-start justify-between">
        <h3
          className={cn(
            "font-label text-[10px] tracking-widest uppercase",
            tone === "error" ? "text-error/80" : "text-primary/70",
          )}
        >
          {label}
        </h3>
        <span
          className={cn(
            "material-symbols-outlined text-lg",
            tone === "error" ? "text-error/80" : "text-primary/50",
          )}
          aria-hidden
        >
          {icon}
        </span>
      </div>

      <div className="mt-auto">
        <div className="flex items-end gap-2">
          <span className="font-label text-4xl font-light text-primary">
            {value}
          </span>
          <span className="mb-1 font-label text-[10px] text-outline uppercase">
            {unit}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between font-label text-[9px] tracking-wider text-outline uppercase">
          <span>{footerLabel}</span>
          <span className={tone === "error" ? "text-primary" : undefined}>
            {footerValue}
          </span>
        </div>
        <div className="mt-1 h-[2px] w-full bg-surface-container">
          <div
            className="h-full bg-primary"
            style={{ width: `${Math.min(100, Math.max(0, barPercent))}%` }}
          />
        </div>
      </div>
    </OrnamentalFrame>
  );
}

export default function SimulationRunView({
  run,
  onNewSimulation,
}: SimulationRunViewProps) {
  const purchases = countPurchases(run.events);
  const totalEvents = run.events.length;
  const skipped = totalEvents - purchases;

  return (
    <div className="mt-10 space-y-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <StatCard
          label="Événements / Cycle"
          icon="bolt"
          value={totalEvents}
          unit="Entrées"
          footerLabel="Lot demandé"
          footerValue={`${totalEvents}`}
          barPercent={totalEvents > 0 ? 70 : 0}
        />
        <StatCard
          label="Ventes / Tomes"
          icon="menu_book"
          value={purchases > 0 ? `+${purchases}` : "0"}
          unit="Grimoires"
          footerLabel="Achats simulés"
          footerValue={`${purchases}`}
          barPercent={totalEvents > 0 ? (purchases / totalEvents) * 100 : 0}
        />
        <StatCard
          label="Échecs / Skips"
          icon="report"
          value={skipped}
          unit="Entrées"
          footerLabel="Demandes impossibles"
          footerValue={skipped > 0 ? "Attention" : "Aucun"}
          barPercent={totalEvents > 0 ? (skipped / totalEvents) * 100 : 0}
          tone={skipped > 0 ? "error" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <OrnamentalFrame className="relative overflow-hidden bg-surface-container-low p-1">
            <div className="relative aspect-[1.75] w-full overflow-hidden bg-ink-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SHOP_HERO_IMAGE_URL}
                alt="Simulation visuelle"
                className="pixel-art-filter size-full object-cover opacity-80"
              />
              <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#19120b_100%)]"
                aria-hidden
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/80 to-transparent p-8">
                <p className="mb-2 font-label text-[10px] tracking-widest text-primary/70 uppercase">
                  Cycle #{run.id} terminé
                </p>
                <h3 className="font-headline text-3xl font-semibold tracking-wider text-primary uppercase">
                  L&apos;Échoppe au Crépuscule
                </h3>
                <p className="mt-2 max-w-lg font-body text-sm text-on-surface-variant italic">
                  &ldquo;Le lot est appliqué. Consulte les annales pour chaque
                  vente et demande impossible.&rdquo;
                </p>
              </div>
            </div>
          </OrnamentalFrame>

          <OrnamentalFrame className="relative bg-surface-container-low p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h4 className="font-headline text-xl tracking-wider text-primary uppercase">
                  Résumé du modèle
                </h4>
                <p className="mt-2 font-body text-sm text-on-surface-variant">
                  Simulation par lot — contrôles temps réel (pause /
                  accélération) hors MVP.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={onNewSimulation}>
                <span className="material-symbols-outlined text-sm" aria-hidden>
                  refresh
                </span>
                Nouveau cycle
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="border border-outline-variant/40 bg-surface px-4 py-3">
                <p className="mb-1 font-label text-[9px] tracking-[0.2em] text-outline uppercase">
                  Démarré
                </p>
                <p className="font-body text-sm text-on-surface">
                  {formatSimulationTime(run.started_at)}
                </p>
              </div>
              <div className="border border-outline-variant/40 bg-surface px-4 py-3">
                <p className="mb-1 font-label text-[9px] tracking-[0.2em] text-outline uppercase">
                  Terminé
                </p>
                <p className="font-body text-sm text-on-surface">
                  {run.ended_at ? formatSimulationTime(run.ended_at) : "—"}
                </p>
              </div>
            </div>
          </OrnamentalFrame>
        </div>

        <OrnamentalFrame className="relative flex min-h-[500px] flex-col bg-surface-container-low lg:max-h-[calc(100vh-16rem)]">
          <div className="shrink-0 border-b border-outline-variant/30 p-6">
            <div className="mb-2 flex items-center gap-3">
              <span
                className="material-symbols-outlined text-xl text-primary"
                aria-hidden
              >
                history_edu
              </span>
              <h3 className="font-headline text-xl tracking-widest text-primary uppercase">
                Annales d&apos;Activité
              </h3>
            </div>
            <p className="font-label text-[9px] tracking-widest text-outline uppercase">
              Journal du cycle #{run.id}
            </p>
          </div>

          <div className="relative flex-1 overflow-y-auto p-6">
            <div
              className="absolute top-6 bottom-6 left-8 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent"
              aria-hidden
            />

            {run.events.length === 0 ? (
              <p className="pl-10 font-body text-sm text-on-surface-variant">
                Aucun événement enregistré pour ce cycle.
              </p>
            ) : (
              <div className="relative space-y-8">
                {run.events.map((event) => {
                  const warning = isWarningEvent(event.type);
                  return (
                    <div key={event.id} className="relative pl-10">
                      <div
                        className={cn(
                          "absolute top-1 left-[-5px] size-2.5 rotate-45 border bg-background",
                          warning
                            ? "border-error shadow-[0_0_5px_rgba(255,180,171,0.5)]"
                            : "border-primary shadow-[0_0_5px_rgba(255,237,193,0.8)]",
                        )}
                        aria-hidden
                      />
                      <div
                        className={cn(
                          "mb-1 flex items-center gap-2 font-label text-[9px] tracking-widest uppercase",
                          warning ? "text-error/70" : "text-primary/70",
                        )}
                      >
                        <span>Cycle {run.id}</span>
                        <span
                          className={cn(
                            "size-1 rounded-full",
                            warning ? "bg-error/30" : "bg-primary/30",
                          )}
                          aria-hidden
                        />
                        <span>{formatSimulationTime(event.created_at)}</span>
                        <span
                          className={cn(
                            "border px-1.5 py-0.5",
                            warning
                              ? "border-error/40 text-error"
                              : "border-primary/30 text-primary",
                          )}
                        >
                          {getEventTypeLabel(event.type)}
                        </span>
                      </div>
                      <p className="font-body text-sm leading-relaxed text-on-surface">
                        {event.message}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </OrnamentalFrame>
      </div>
    </div>
  );
}
