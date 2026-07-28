import Link from "next/link";

import ReliquaryFrame from "@/components/dashboard/ReliquaryFrame";
import { cn } from "@/lib/utils";

const SHOP_HERO_IMAGE_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCB5OwyxIz49eLCz1MFMKNcgFIZSK4wXuQBqo1XgvNObFTgraXH5w20Vh5lXayq3FCHVDmJDHSg_d9nwpuzUO-oAkUJ4vtw_tvi6tTqjJRUgdAWVeJgnU0OciXJA3ljwrAKez3vxIcE7ZBNa0dereDb2CdDxRw8Kx_jBW69W80tvo4j-455NOOTsV4rpcyVrlv2oNwlnosaEFnJOn98N5qOQSnmK0gE9QgWIiCrxlqtXXrb6Oq1eQRF-tnYvtj1dHPvXc5BoESA0fgu";

const ACTIVITY_LOG = [
  {
    cycle: "Cycle 08 • 12:40",
    variant: "default" as const,
    content: (
      <>
        <span className="font-bold text-primary">Eldric le Brave</span> a fait
        l&apos;acquisition du volume{" "}
        <span className="italic">&ldquo;Cryomancie Pratique&rdquo;</span>.
      </>
    ),
  },
  {
    cycle: "Cycle 08 • 09:15",
    variant: "error" as const,
    content: (
      <>
        Rupture de stock critique :{" "}
        <span className="font-bold">Encres de Calamar Noir</span> épuisées.
      </>
    ),
  },
  {
    cycle: "Cycle 07 • 18:30",
    variant: "default" as const,
    content: (
      <>
        Simulation optimisée. Rayonnages réorganisés par l&apos;Automate #04.
      </>
    ),
  },
  {
    cycle: "Cycle 07 • 06:00",
    variant: "default" as const,
    content: (
      <>
        Nouveau lot : 14 manuscrits de la{" "}
        <span className="font-bold text-primary">Dynastie Hornburg</span>{" "}
        indexés.
      </>
    ),
  },
];

function StatusBar({
  value,
  variant = "default",
}: {
  value: number;
  variant?: "default" | "error";
}) {
  return (
    <div
      className={cn("status-bar-bg", variant === "error" && "bg-error/10")}
    >
      <div
        className={cn(
          "status-bar-fill",
          variant === "error" && "bg-error shadow-error/50",
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function DashboardPage() {
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
            <h3 className="font-headline-xl text-5xl text-primary">1,284</h3>
            <span className="font-label-sm text-xs text-burnished-gold/40">
              Unités
            </span>
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex justify-between font-label-sm text-[10px] text-on-surface-variant uppercase">
              <span>Capacité Rayonnage</span>
              <span>82%</span>
            </div>
            <StatusBar value={82} />
          </div>
        </ReliquaryFrame>

        <ReliquaryFrame
          parchment
          className="group p-8 transition-all duration-300 hover:scale-[1.01]"
        >
          <div className="mb-6 flex items-center justify-between">
            <p className="font-label-sm text-[10px] tracking-widest text-burnished-gold/60 uppercase">
              Revenus / Florins
            </p>
            <span
              className="material-symbols-outlined text-xl text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              payments
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline-xl text-5xl text-primary">+12.4%</h3>
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex justify-between font-label-sm text-[10px] text-on-surface-variant uppercase">
              <span>Objectif Mensuel</span>
              <span>65%</span>
            </div>
            <StatusBar value={65} />
          </div>
        </ReliquaryFrame>

        <ReliquaryFrame
          parchment
          variant="error"
          className="group p-8 transition-all duration-300 hover:scale-[1.01]"
        >
          <div className="mb-6 flex items-center justify-between">
            <p className="font-label-sm text-[10px] tracking-widest text-error/60 uppercase">
              Instabilité / Codex
            </p>
            <span
              className="material-symbols-outlined text-xl text-error"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              report
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline-xl text-5xl text-error">07</h3>
            <span className="font-label-sm text-xs text-error/40">
              Critiques
            </span>
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex justify-between font-label-sm text-[10px] text-error/60 uppercase">
              <span>Risque de Perte</span>
              <span>14%</span>
            </div>
            <StatusBar value={14} variant="error" />
          </div>
        </ReliquaryFrame>
      </div>

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
                Simulation Visuelle
              </p>
              <h4 className="mb-4 font-headline-xl text-3xl tracking-wider text-primary uppercase">
                L&apos;Échoppe au Crépuscule
              </h4>
              <p className="mb-8 max-w-xl font-body-md text-on-surface/80 italic">
                &ldquo;Le calme avant la tempête marchande. Les lanternes
                s&apos;éveillent alors que les derniers rayons du soleil
                caressent les vieux toits de chaume.&rdquo;
              </p>
              <div className="rpg-window inline-block">
                <Link
                  href="/orders"
                  className="rpg-window-inner inline-flex bg-burnished-gold px-10 py-3 font-headline-lg text-lg tracking-widest text-ink-black uppercase transition-colors hover:bg-primary"
                >
                  Prendre les commandes
                </Link>
              </div>
            </div>
          </ReliquaryFrame>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <ReliquaryFrame parchment className="p-6">
              <div className="mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-burnished-gold">
                  auto_fix
                </span>
                <h5 className="font-headline-lg text-lg tracking-widest text-primary uppercase">
                  Restauration des Codex
                </h5>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between font-label-sm text-[10px] uppercase">
                    <span>Manuscrits d&apos;Orun</span>
                    <span className="text-primary">85%</span>
                  </div>
                  <StatusBar value={85} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between font-label-sm text-[10px] uppercase">
                    <span>Grimoires Interdits</span>
                    <span className="text-primary">42%</span>
                  </div>
                  <StatusBar value={42} />
                </div>
              </div>
            </ReliquaryFrame>

            <ReliquaryFrame parchment className="p-6">
              <div className="mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-burnished-gold">
                  local_shipping
                </span>
                <h5 className="font-headline-lg text-lg tracking-widest text-primary uppercase">
                  Journal de Logistique
                </h5>
              </div>
              <ul className="space-y-4 font-label-sm text-[11px] tracking-wider text-on-surface-variant uppercase">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary">▶</span>
                  <span>Caravane d&apos;Orewell en approche (2.4 km)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary">▶</span>
                  <span>Stock de Parchemins : Stable</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-error">▶</span>
                  <span className="text-error/80">
                    Alerte : Encres de seiche en pénurie
                  </span>
                </li>
              </ul>
            </ReliquaryFrame>
          </div>
        </div>

        <div className="h-full lg:col-span-4">
          <ReliquaryFrame
            parchment
            className="flex h-full flex-col p-8"
          >
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
              {ACTIVITY_LOG.map((entry) => (
                <div key={entry.cycle} className="relative pl-8">
                  <div
                    className={`absolute top-1.5 left-0 z-10 size-3 rotate-45 bg-ink-black ${
                      entry.variant === "error"
                        ? "border border-error"
                        : "border border-burnished-gold"
                    }`}
                  />
                  <span
                    className={`font-label-sm text-[9px] tracking-widest uppercase ${
                      entry.variant === "error"
                        ? "text-error/60"
                        : "text-burnished-gold/60"
                    }`}
                  >
                    {entry.cycle}
                  </span>
                  <p
                    className={`mt-2 font-body-md text-sm leading-relaxed ${
                      entry.variant === "error" ? "text-error/80" : ""
                    }`}
                  >
                    {entry.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="cisellated-divider my-8" />
            <button
              type="button"
              className="w-full text-center font-label-sm text-[10px] tracking-[0.4em] text-burnished-gold/50 uppercase transition-colors hover:text-primary"
            >
              Consulter les Annales Complètes
            </button>
          </ReliquaryFrame>
        </div>
      </div>
    </div>
  );
}
