"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  formatHudClock,
  useSimulationRuntimeOptional,
} from "@/components/simulation-runtime/SimulationRuntimeProvider";

export default function HeaderSimulationStatus() {
  const runtime = useSimulationRuntimeOptional();
  if (!runtime?.ready) {
    return null;
  }
  const { hud } = runtime;

  return (
    <Link
      href="/simulation"
      className={cn(
        "hidden items-center gap-2 border px-3 py-1.5 transition-colors md:flex",
        hud.paused
          ? "border-outline-variant/50 text-on-surface-variant hover:border-primary hover:text-primary"
          : "border-burnished-gold/40 text-burnished-gold hover:border-primary hover:text-primary",
      )}
    >
      <span className="material-symbols-outlined text-base" aria-hidden>
        {hud.paused ? "pause_circle" : "storefront"}
      </span>
      <span className="font-label-sm text-[10px] tracking-widest uppercase">
        {formatHudClock(hud)}
      </span>
      <span className="font-label-sm text-[9px] tracking-wider opacity-70 uppercase">
        ×{hud.speed} · {hud.visitor_count} vis. · file {hud.queue_length}
      </span>
    </Link>
  );
}
