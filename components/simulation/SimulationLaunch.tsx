"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import OrnamentalFrame from "@/components/ui/OrnamentalFrame";
import { cn } from "@/lib/utils";

import {
  DEFAULT_EVENTS_COUNT,
  EVENTS_COUNT_PRESETS,
  MAX_EVENTS_COUNT,
  MIN_EVENTS_COUNT,
} from "./simulation-data";

const SHOP_HERO_IMAGE_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCB5OwyxIz49eLCz1MFMKNcgFIZSK4wXuQBqo1XgvNObFTgraXH5w20Vh5lXayq3FCHVDmJDHSg_d9nwpuzUO-oAkUJ4vtw_tvi6tTqjJRUgdAWVeJgnU0OciXJA3ljwrAKez3vxIcE7ZBNa0dereDb2CdDxRw8Kx_jBW69W80tvo4j-455NOOTsV4rpcyVrlv2oNwlnosaEFnJOn98N5qOQSnmK0gE9QgWIiCrxlqtXXrb6Oq1eQRF-tnYvtj1dHPvXc5BoESA0fgu";

type SimulationLaunchProps = {
  eventsCount: number;
  onEventsCountChange: (value: number) => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onSubmit: () => void;
};

export default function SimulationLaunch({
  eventsCount,
  onEventsCountChange,
  isSubmitting = false,
  errorMessage = null,
  onSubmit,
}: SimulationLaunchProps) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-8">
        <OrnamentalFrame className="relative overflow-hidden bg-surface-container-low">
          <div className="relative aspect-[1.75] w-full bg-ink-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SHOP_HERO_IMAGE_URL}
              alt="L'échoppe au crépuscule"
              className="pixel-art-filter size-full object-cover opacity-80"
            />
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#19120b_100%)]"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/80 to-transparent p-8">
              <p className="mb-2 font-label text-[10px] tracking-widest text-primary/70 uppercase">
                Moteur en veille
              </p>
              <h3 className="font-headline text-3xl font-semibold tracking-wider text-primary uppercase">
                L&apos;Échoppe au Crépuscule
              </h3>
              <p className="mt-2 max-w-lg font-body text-sm text-on-surface-variant italic">
                &ldquo;Prépare un cycle d&apos;activité artificielle. Les ventes
                consommeront le stock rayon et pourront déclencher des
                alertes.&rdquo;
              </p>
            </div>
          </div>
        </OrnamentalFrame>

        <OrnamentalFrame className="relative bg-surface-container-low p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h4 className="font-headline text-xl tracking-wider text-primary uppercase">
                Paramètres du cycle
              </h4>
              <p className="mt-2 font-body text-sm text-on-surface-variant">
                Nombre d&apos;événements à simuler (achats clients sur le
                rayon).
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {EVENTS_COUNT_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => onEventsCountChange(preset.value)}
                className={cn(
                  "border px-4 py-2 font-label text-[10px] tracking-widest uppercase transition-colors",
                  eventsCount === preset.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-outline-variant text-on-surface-variant hover:border-primary/40 hover:text-primary",
                )}
              >
                {preset.label} ({preset.value})
              </button>
            ))}
          </div>

          <div className="mb-8 flex max-w-xs flex-col gap-2">
            <label
              htmlFor="events-count"
              className="font-label text-[10px] tracking-widest text-outline uppercase"
            >
              Événements ({MIN_EVENTS_COUNT}–{MAX_EVENTS_COUNT})
            </label>
            <input
              id="events-count"
              type="number"
              min={MIN_EVENTS_COUNT}
              max={MAX_EVENTS_COUNT}
              step={1}
              value={eventsCount}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isFinite(next)) onEventsCountChange(next);
              }}
              disabled={isSubmitting}
              className="border border-outline-variant bg-surface px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="lg"
              disabled={isSubmitting}
              onClick={onSubmit}
              className="min-w-56"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden>
                play_arrow
              </span>
              {isSubmitting ? "Lancement…" : "Simuler une journée"}
            </Button>
          </div>

          {errorMessage ? (
            <p
              className="mt-5 border border-error/40 bg-error/5 px-4 py-3 font-body text-sm text-error"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <p className="mt-6 font-body text-sm text-on-surface-variant">
            Prérequis : au moins un livre actif avec stock rayon &gt; 0.{" "}
            <Link
              href="/stocks"
              className="text-primary underline-offset-4 hover:underline"
            >
              Voir les stocks
            </Link>
          </p>
        </OrnamentalFrame>
      </div>

      <div className="lg:col-span-4">
        <OrnamentalFrame className="relative flex min-h-[420px] flex-col bg-surface-container-low">
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
              En attente d&apos;un cycle
            </p>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <span
              className="material-symbols-outlined text-4xl text-outline/50"
              aria-hidden
            >
              hourglass_empty
            </span>
            <p className="font-headline text-lg text-primary uppercase">
              Aucun cycle en cours
            </p>
            <p className="max-w-xs font-body text-sm text-on-surface-variant">
              Les événements du prochain run apparaîtront ici après le
              lancement (défaut {DEFAULT_EVENTS_COUNT} événements).
            </p>
          </div>
        </OrnamentalFrame>
      </div>
    </div>
  );
}
