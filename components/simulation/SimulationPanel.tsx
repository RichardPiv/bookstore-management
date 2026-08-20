"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import SimulationLaunch from "./SimulationLaunch";
import SimulationRunView from "./SimulationRunView";
import {
  DEFAULT_EVENTS_COUNT,
  MAX_EVENTS_COUNT,
  MIN_EVENTS_COUNT,
  type SimulationPhase,
  type SimulationRun,
} from "./simulation-data";

export default function SimulationPanel() {
  const [phase, setPhase] = useState<SimulationPhase>("idle");
  const [eventsCount, setEventsCount] = useState(DEFAULT_EVENTS_COUNT);
  const [run, setRun] = useState<SimulationRun | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const title =
    phase === "idle"
      ? "Simulation"
      : phase === "running"
        ? "Simulation en cours"
        : "Simulation terminée";

  const subtitle =
    phase === "idle"
      ? "La simulation vous permet de tester les alertes et de visualiser les événements importants dans la Réserve."
      : "Observer les flux temporels pour mieux anticiper les désirs des mortels.";

  function handleEventsCountChange(value: number) {
    if (!Number.isFinite(value)) return;
    const clamped = Math.min(
      MAX_EVENTS_COUNT,
      Math.max(MIN_EVENTS_COUNT, Math.trunc(value)),
    );
    setEventsCount(clamped);
  }

  async function handleSubmit() {
    if (isSubmitting) return;

    if (
      !Number.isInteger(eventsCount) ||
      eventsCount < MIN_EVENTS_COUNT ||
      eventsCount > MAX_EVENTS_COUNT
    ) {
      setErrorMessage(
        `Le nombre d'événements doit être un entier entre ${MIN_EVENTS_COUNT} et ${MAX_EVENTS_COUNT}.`,
      );
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    setPhase("running");
    setRun(null);

    try {
      const response = await fetch("/api/simulation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events_count: eventsCount }),
      });
      const body = await response.json();

      if (!response.ok) {
        setErrorMessage(
          body.error?.message ?? "Impossible de lancer la simulation.",
        );
        setPhase("idle");
        return;
      }

      if (body.data) {
        setRun(body.data as SimulationRun);
        setPhase("done");
      } else {
        setErrorMessage("Réponse de simulation invalide.");
        setPhase("idle");
      }
    } catch {
      setErrorMessage("Impossible de joindre les archives. Réessayez.");
      setPhase("idle");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNewSimulation() {
    setRun(null);
    setPhase("idle");
    setErrorMessage(null);
  }

  return (
    <>
      <section className="flex flex-col gap-1 border-l-4 border-burnished-gold pl-6">
        <h2 className="font-headline-xl text-4xl tracking-widest text-ethereal-glow uppercase">
          {title}
        </h2>
        <p className="font-body-md text-on-surface-variant italic opacity-80">
          &ldquo;{subtitle}&rdquo;
        </p>
      </section>

      {phase === "running" ? (
        <div
          className="mt-10 flex flex-col items-center justify-center gap-4 py-24"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
          <p className="font-label text-xs tracking-widest text-on-surface-variant uppercase">
            Simulation du cycle en cours…
          </p>
          <p className="font-body text-sm text-on-surface-variant">
            {eventsCount} événement{eventsCount > 1 ? "s" : ""} demandé
            {eventsCount > 1 ? "s" : ""}
          </p>
        </div>
      ) : phase === "done" && run ? (
        <SimulationRunView run={run} onNewSimulation={handleNewSimulation} />
      ) : (
        <SimulationLaunch
          eventsCount={eventsCount}
          onEventsCountChange={handleEventsCountChange}
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
          onSubmit={() => void handleSubmit()}
        />
      )}
    </>
  );
}
