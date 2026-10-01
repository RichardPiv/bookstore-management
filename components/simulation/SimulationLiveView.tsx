"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import FloorView from "@/components/floor/FloorView";
import TasksPanel from "@/components/tasks/TasksPanel";
import SimulationPanel from "@/components/simulation/SimulationPanel";
import {
  formatHudClock,
  useSimulationRuntime,
} from "@/components/simulation-runtime/SimulationRuntimeProvider";
import type { RenderAgent } from "@/simulation/types";
import { cn } from "@/lib/utils";

const SPEEDS = [1, 2, 5] as const;

export default function SimulationLiveView() {
  const { hud, setPaused, setSpeed, ready } = useSimulationRuntime();
  const [journalOpen, setJournalOpen] = useState(true);
  const [archivesOpen, setArchivesOpen] = useState(false);
  const [selected, setSelected] = useState<RenderAgent | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-burnished-gold/20 px-6 py-3">
        <div>
          <p className="font-label text-[10px] tracking-widest text-burnished-gold/70 uppercase">
            Caméra · La Réserve
          </p>
          <h2 className="font-headline text-2xl tracking-widest text-ethereal-glow uppercase">
            {ready ? formatHudClock(hud) : "Calage de l'horloge…"}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={hud.paused ? "default" : "outline"}
            onClick={() => setPaused(!hud.paused)}
          >
            {hud.paused ? "Ouvrir" : "Pause"}
          </Button>
          {SPEEDS.map((speed) => (
            <Button
              key={speed}
              type="button"
              size="sm"
              variant={hud.speed === speed && !hud.paused ? "default" : "outline"}
              onClick={() => {
                setSpeed(speed);
                if (hud.paused) setPaused(false);
              }}
            >
              ×{speed}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setJournalOpen((value) => !value)}
          >
            Annales
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setArchivesOpen((value) => !value)}
          >
            Archives (lot)
          </Button>
        </div>
      </div>

      {hud.last_event ? (
        <p className="shrink-0 border-b border-burnished-gold/10 px-6 py-2 font-body text-sm text-on-surface-variant italic">
          {hud.last_event}
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <div className="relative min-h-0 min-w-0 flex-1 bg-ink-black">
          <FloorView onSelect={setSelected} />
          <div className="pointer-events-none absolute bottom-4 left-4 border border-burnished-gold/30 bg-surface/80 px-3 py-2">
            <p className="font-label text-[9px] tracking-widest text-burnished-gold uppercase">
              {hud.visitor_count} visiteurs · file {hud.queue_length} · staff occupé {hud.staff_busy}
            </p>
          </div>
        </div>

        {journalOpen ? (
          <aside className="custom-scroll flex w-full shrink-0 flex-col overflow-y-auto border-l border-burnished-gold/20 bg-surface-container/80 md:w-80">
            <div className="border-b border-outline-variant/30 p-4">
              <h3 className="font-headline text-lg tracking-widest text-primary uppercase">
                Annales
              </h3>
              <p className="mt-1 font-body text-xs text-on-surface-variant">
                Tâches et sélection. Le journal métier se remplit à chaque vente.
              </p>
            </div>
            {selected ? (
              <div className="border-b border-outline-variant/30 p-4">
                <p className="font-label text-[10px] tracking-widest text-burnished-gold uppercase">
                  {selected.kind === "staff" ? "Archiviste" : "Visiteur"}
                </p>
                <p className="font-headline text-xl text-primary">{selected.name}</p>
                <p className="font-body text-sm text-on-surface-variant">{selected.state}</p>
                {selected.employee_id ? (
                  <Link
                    href={`/staff/${selected.employee_id}`}
                    className="mt-2 inline-block font-label text-[10px] tracking-widest text-primary uppercase underline-offset-4 hover:underline"
                  >
                    Ouvrir le dossier
                  </Link>
                ) : null}
              </div>
            ) : null}
            <div className="p-4">
              <h4 className="mb-3 font-label text-[10px] tracking-widest text-outline uppercase">
                File de tâches
              </h4>
              <TasksPanel />
            </div>
          </aside>
        ) : null}
      </div>

      {archivesOpen ? (
        <div
          className={cn(
            "custom-scroll shrink-0 overflow-y-auto border-t border-burnished-gold/20 bg-surface p-6",
            "max-h-[45vh]",
          )}
        >
          <SimulationPanel />
        </div>
      ) : null}
    </div>
  );
}
