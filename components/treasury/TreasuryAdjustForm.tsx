"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  formatFlorins,
  type TreasuryMovementData,
  type TreasuryOverviewData,
} from "./treasury-data";

type TreasuryAdjustFormProps = {
  /** Target player id (required for admin adjust). */
  userId: number;
  onAdjusted: (payload: {
    account: TreasuryOverviewData;
    movement: TreasuryMovementData;
  }) => void;
};

export default function TreasuryAdjustForm({
  userId,
  onAdjusted,
}: TreasuryAdjustFormProps) {
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const parsedAmount = Number(amount.replace(",", "."));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Le montant doit être un nombre strictement positif.");
      setStatus("error");
      return;
    }

    const trimmedNote = note.trim();
    if (trimmedNote.length < 3) {
      setErrorMessage("Le motif doit contenir au moins 3 caractères.");
      setStatus("error");
      return;
    }

    try {
      const response = await fetch("/api/treasury/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          direction,
          amount: parsedAmount,
          note: trimmedNote,
        }),
      });

      const body = await response.json();

      if (!response.ok) {
        setErrorMessage(
          body.error?.message ?? "Impossible d'appliquer l'ajustement.",
        );
        setStatus("error");
        return;
      }

      onAdjusted(body.data);
      setAmount("");
      setNote("");
      setStatus("idle");
    } catch {
      setErrorMessage("Impossible d'appliquer l'ajustement. Réessayez.");
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-5 border border-outline-variant/40 bg-surface-container px-5 py-5"
    >
      <div>
        <p className="font-label text-[10px] tracking-[0.24em] text-burnished-gold/70 uppercase">
          Ajustement manuel
        </p>
        <p className="mt-1 font-body text-sm text-on-surface-variant">
          Injection ou retrait de florins avec motif obligatoire (D66).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["in", "out"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setDirection(value)}
            className={cn(
              "border px-4 py-2 font-label text-[10px] tracking-widest uppercase transition-colors",
              direction === value
                ? "border-primary bg-primary/10 text-primary"
                : "border-outline-variant/50 text-on-surface-variant hover:border-primary/40",
            )}
          >
            {value === "in" ? "Crédit (+)" : "Débit (−)"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block font-label text-[10px] tracking-widest text-outline uppercase">
            Montant (florins)
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100,00"
            className="w-full border border-outline-variant/50 bg-surface px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary"
            required
          />
        </label>
        <label className="block">
          <span className="mb-2 block font-label text-[10px] tracking-widest text-outline uppercase">
            Motif
          </span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Raison de l'ajustement"
            minLength={3}
            maxLength={255}
            className="w-full border border-outline-variant/50 bg-surface px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary"
            required
          />
        </label>
      </div>

      {errorMessage ? (
        <p className="font-body text-sm text-error" role="alert">{errorMessage}</p>
      ) : null}

      <Button
        type="submit"
        disabled={status === "submitting"}
        className="min-w-[180px]"
      >
        {status === "submitting" ? "Application…" : "Appliquer l'ajustement"}
      </Button>
    </form>
  );
}
