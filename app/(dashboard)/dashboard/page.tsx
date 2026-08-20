import Link from "next/link";

import ReliquaryFrame from "@/components/dashboard/ReliquaryFrame";
import { cn } from "@/lib/utils";
import { getDashboardOverview } from "@/services/dashboard/dashboard-service";
import type {
  DashboardActivityEvent,
  DashboardAlertPreview,
  DashboardLowStock,
  DashboardOverview,
} from "@/services/dashboard/types";

const SHOP_HERO_IMAGE_URL = "/img/home_hero.jpg";

function StatusBar({
  value,
  variant = "default",
}: {
  value: number;
  variant?: "default" | "error";
}) {
  return (
    <div className={cn("status-bar-bg", variant === "error" && "bg-error/10")}>
      <div
        className={cn(
          "status-bar-fill",
          variant === "error" && "bg-error shadow-error/50",
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function formatCycleLabel(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `Cycle ${day} • ${hours}:${minutes}`;
}

function formatUnits(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function alertTypeLabel(name: string | null): string {
  if (!name) return "Alerte";
  const labels: Record<string, string> = {
    rupture_rayon: "Rupture rayon",
    stock_rayon_bas: "Stock rayon bas",
    rupture_stock: "Rupture réserve",
    stock_bas: "Réserve basse",
  };
  return labels[name] ?? name;
}

function LowStocksPanel({ items }: { items: DashboardLowStock[] }) {
  return (
    <ReliquaryFrame parchment className="p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-burnished-gold">
            inventory_2
          </span>
          <h5 className="font-headline-lg text-lg tracking-widest text-primary uppercase">
            Stocks les plus bas
          </h5>
        </div>
        <Link
          href="/stocks"
          className="font-label-sm text-[10px] tracking-widest text-burnished-gold/50 uppercase transition-colors hover:text-primary"
        >
          Voir
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="font-body-md text-sm text-on-surface-variant italic">
          Aucun stock sous le seuil d&apos;alerte pour le moment.
        </p>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.book_id} className="space-y-2">
              <div className="flex justify-between gap-3 font-label-sm text-[10px] uppercase">
                <span className="truncate text-on-surface">{item.title}</span>
                <span
                  className={cn(
                    "shrink-0",
                    item.qty_shelf === 0 ? "text-error" : "text-primary",
                  )}
                >
                  {item.qty_shelf}/{item.alert_threshold}
                </span>
              </div>
              <StatusBar
                value={item.shelf_fill_pct}
                variant={item.qty_shelf === 0 ? "error" : "default"}
              />
            </div>
          ))}
        </div>
      )}
    </ReliquaryFrame>
  );
}

function LogisticsPanel({
  pendingOrders,
  alerts,
}: {
  pendingOrders: number;
  alerts: DashboardAlertPreview[];
}) {
  return (
    <ReliquaryFrame parchment className="p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-burnished-gold">
            local_shipping
          </span>
          <h5 className="font-headline-lg text-lg tracking-widest text-primary uppercase">
            Journal de Logistique
          </h5>
        </div>
        <Link
          href="/orders"
          className="font-label-sm text-[10px] tracking-widest text-burnished-gold/50 uppercase transition-colors hover:text-primary"
        >
          Commandes
        </Link>
      </div>
      <ul className="space-y-4 font-label-sm text-[11px] tracking-wider text-on-surface-variant uppercase">
        <li className="flex items-start gap-3">
          <span className="mt-1 text-primary">▶</span>
          <span>
            Commandes en attente :{" "}
            <span className="text-primary">{pendingOrders}</span>
          </span>
        </li>
        {alerts.length === 0 ? (
          <li className="flex items-start gap-3">
            <span className="mt-1 text-primary">▶</span>
            <span>Aucune alerte active</span>
          </li>
        ) : (
          alerts.slice(0, 3).map((alert) => (
            <li key={alert.id} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-1",
                  alert.is_critical ? "text-error" : "text-primary",
                )}
              >
                ▶
              </span>
              <span className={alert.is_critical ? "text-error/80" : undefined}>
                {alertTypeLabel(alert.type_name)}
                {alert.book_title ? ` — ${alert.book_title}` : ""}
              </span>
            </li>
          ))
        )}
      </ul>
    </ReliquaryFrame>
  );
}

function ActivityPanel({ events }: { events: DashboardActivityEvent[] }) {
  return (
    <ReliquaryFrame parchment className="flex h-full flex-col p-8">
      <div className="mb-8 flex items-center gap-3">
        <span
          className="material-symbols-outlined text-2xl text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          history_edu
        </span>
        <h4 className="font-headline-xl text-2xl tracking-widest text-primary uppercase">
          Annales d&apos;Activité
        </h4>
      </div>

      <div className="relative flex-1 space-y-10">
        <div className="absolute top-2 bottom-2 left-1.5 w-px bg-burnished-gold/20" />
        {events.length === 0 ? (
          <p className="relative pl-8 font-body-md text-sm text-on-surface-variant italic">
            Aucun événement de simulation pour l&apos;instant. Lancez une
            journée depuis la salle de simulation.
          </p>
        ) : (
          events.map((entry) => (
            <div key={entry.id} className="relative pl-8">
              <div
                className={`absolute top-1.5 left-0 z-10 size-3 rotate-45 bg-ink-black ${
                  entry.is_error
                    ? "border border-error"
                    : "border border-burnished-gold"
                }`}
              />
              <span
                className={`font-label-sm text-[9px] tracking-widest uppercase ${
                  entry.is_error ? "text-error/60" : "text-burnished-gold/60"
                }`}
              >
                {formatCycleLabel(new Date(entry.created_at))}
              </span>
              <p
                className={`mt-2 font-body-md text-sm leading-relaxed ${
                  entry.is_error ? "text-error/80" : ""
                }`}
              >
                {entry.message}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="cisellated-divider my-8" />
      <Link
        href="/simulation"
        className="w-full text-center font-label-sm text-[10px] tracking-[0.4em] text-burnished-gold/50 uppercase transition-colors hover:text-primary"
      >
        Consulter la Simulation
      </Link>
    </ReliquaryFrame>
  );
}

function KpiCards({ overview }: { overview: DashboardOverview }) {
  const { catalog, sales, alerts } = overview;
  const criticalRatio =
    alerts.active_count === 0
      ? 0
      : Math.round((alerts.critical_count / alerts.active_count) * 100);

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <ReliquaryFrame
        parchment
        className="group p-8 transition-all duration-300 hover:scale-[1.01]"
      >
        <div className="mb-6 flex items-center justify-between">
          <p className="font-label-sm text-[10px] tracking-widest text-burnished-gold/60 uppercase">
            Inventaire / Grimoires
          </p>
          <span
            className="material-symbols-outlined text-xl text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_stories
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="font-headline-xl text-5xl text-primary">
            {formatUnits(catalog.total_units)}
          </h3>
          <span className="font-label-sm text-xs text-burnished-gold/40">
            Unités
          </span>
        </div>
        <p className="mt-2 font-label-sm text-[10px] text-on-surface-variant">
          {formatUnits(catalog.active_books)} titres actifs ·{" "}
          {formatUnits(catalog.inventoried_books)} en bibliothèque
        </p>
        <div className="mt-6 space-y-2">
          <div className="flex justify-between font-label-sm text-[10px] text-on-surface-variant uppercase">
            <span>Capacité Rayonnage</span>
            <span>{catalog.shelf_capacity_pct}%</span>
          </div>
          <StatusBar value={catalog.shelf_capacity_pct} />
        </div>
      </ReliquaryFrame>

      <ReliquaryFrame
        parchment
        className="group p-8 transition-all duration-300 hover:scale-[1.01]"
      >
        <div className="mb-6 flex items-center justify-between">
          <p className="font-label-sm text-[10px] tracking-widest text-burnished-gold/60 uppercase">
            Ventes / Simulation
          </p>
          <span
            className="material-symbols-outlined text-xl text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            storefront
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="font-headline-xl text-5xl text-primary">
            {formatUnits(sales.purchases_today)}
          </h3>
          <span className="font-label-sm text-xs text-burnished-gold/40">
            Achats du jour
          </span>
        </div>
        <p className="mt-2 font-label-sm text-[10px] text-on-surface-variant">
          Commandes fournisseur en attente :{" "}
          {formatUnits(overview.orders.pending_count)}
        </p>
        <div className="mt-6 space-y-2">
          <div className="flex justify-between font-label-sm text-[10px] text-on-surface-variant uppercase">
            <span>Rayon / Réserve</span>
            <span>
              {formatUnits(catalog.shelf_units)} /{" "}
              {formatUnits(catalog.reserve_units)}
            </span>
          </div>
          <StatusBar
            value={
              catalog.total_units === 0
                ? 0
                : Math.round((catalog.shelf_units / catalog.total_units) * 100)
            }
          />
        </div>
      </ReliquaryFrame>

      <ReliquaryFrame
        parchment
        variant={alerts.active_count > 0 ? "error" : "default"}
        className="group p-8 transition-all duration-300 hover:scale-[1.01]"
      >
        <div className="mb-6 flex items-center justify-between">
          <p
            className={cn(
              "font-label-sm text-[10px] tracking-widest uppercase",
              alerts.active_count > 0
                ? "text-error/60"
                : "text-burnished-gold/60",
            )}
          >
            Alertes / Codex
          </p>
          <span
            className={cn(
              "material-symbols-outlined text-xl",
              alerts.active_count > 0 ? "text-error" : "text-primary",
            )}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            report
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <h3
            className={cn(
              "font-headline-xl text-5xl",
              alerts.active_count > 0 ? "text-error" : "text-primary",
            )}
          >
            {String(alerts.active_count).padStart(2, "0")}
          </h3>
          <span
            className={cn(
              "font-label-sm text-xs",
              alerts.active_count > 0 ? "text-error/40" : "text-burnished-gold/40",
            )}
          >
            Actives
          </span>
        </div>
        <p
          className={cn(
            "mt-2 font-label-sm text-[10px]",
            alerts.active_count > 0 ? "text-error/70" : "text-on-surface-variant",
          )}
        >
          Dont {alerts.critical_count} rupture
          {alerts.critical_count > 1 ? "s" : ""}
        </p>
        <div className="mt-6 space-y-2">
          <div
            className={cn(
              "flex justify-between font-label-sm text-[10px] uppercase",
              alerts.active_count > 0
                ? "text-error/60"
                : "text-on-surface-variant",
            )}
          >
            <span>Part critiques</span>
            <span>{criticalRatio}%</span>
          </div>
          <StatusBar
            value={criticalRatio}
            variant={alerts.active_count > 0 ? "error" : "default"}
          />
        </div>
      </ReliquaryFrame>
    </div>
  );
}

export default async function DashboardPage() {
  const overview = await getDashboardOverview();

  return (
    <div className="flex-1 space-y-12 overflow-y-auto p-12">
      <section className="flex flex-col gap-1 border-l-4 border-burnished-gold pl-6">
        <h2 className="font-headline-xl text-4xl tracking-widest text-ethereal-glow uppercase">
          Salle des Archives
        </h2>
        <p className="font-body-md text-on-surface-variant italic opacity-80">
          &ldquo;Le savoir est une flamme qu&apos;il faut entretenir avec
          rigueur.&rdquo;
        </p>
      </section>

      <KpiCards overview={overview} />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <ReliquaryFrame
            showCorners
            className="group relative h-[450px] overflow-hidden"
          >
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-ink-black/90 via-ink-black/20 to-transparent" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SHOP_HERO_IMAGE_URL}
              alt="L'échoppe au crépuscule"
              className="pixel-art-filter size-full object-cover opacity-80 transition-transform duration-[3s] group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 z-20 p-10">
              <p className="mb-2 font-label-sm text-xs tracking-[0.3em] text-burnished-gold/60 uppercase">
                Pilotage
              </p>
              <h4 className="mb-4 font-headline-xl text-3xl tracking-wider text-primary uppercase">
                L&apos;Échoppe au Crépuscule
              </h4>
              <p className="mb-8 max-w-xl font-body-md text-on-surface/80 italic">
                &ldquo;Le calme avant la tempête marchande. Les lanternes
                s&apos;éveillent alors que les derniers rayons du soleil
                caressent les vieux toits de chaume.&rdquo;
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="rpg-window inline-block">
                  <Link
                    href="/orders"
                    className="rpg-window-inner inline-flex bg-burnished-gold px-10 py-3 font-headline-lg text-lg tracking-widest text-ink-black uppercase transition-colors hover:bg-primary"
                  >
                    Prendre les commandes
                  </Link>
                </div>
                <div className="rpg-window inline-block">
                  <Link
                    href="/alerts"
                    className="rpg-window-inner inline-flex bg-surface-container-high px-10 py-3 font-headline-lg text-lg tracking-widest text-primary uppercase transition-colors hover:bg-burnished-gold hover:text-ink-black"
                  >
                    Voir les alertes
                  </Link>
                </div>
              </div>
            </div>
          </ReliquaryFrame>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <LowStocksPanel items={overview.low_stocks} />
            <LogisticsPanel
              pendingOrders={overview.orders.pending_count}
              alerts={overview.recent_alerts}
            />
          </div>
        </div>

        <div className="h-full lg:col-span-4">
          <ActivityPanel events={overview.recent_events} />
        </div>
      </div>
    </div>
  );
}
