"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import ReliquaryFrame from "@/components/dashboard/ReliquaryFrame";
import StaffPortrait from "@/components/staff/StaffPortrait";
import { useSimulationRuntimeOptional } from "@/components/simulation-runtime/SimulationRuntimeProvider";
import type { StaffCandidate } from "@/services/staff/types";

const ROLE_LABEL: Record<string, string> = {
  clerk: "Comptoir",
  stocker: "Manutention",
  receiver: "Quai",
};

export default function StaffRecruit() {
  const [candidates, setCandidates] = useState<StaffCandidate[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const runtime = useSimulationRuntimeOptional();

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/staff/candidates");
      const body = await res.json();
      if (res.ok) {
        setCandidates(body.data ?? []);
      } else {
        setError(body.error?.message ?? "Aucun candidat aujourd'hui.");
      }
    })();
  }, []);

  async function hire(key: string) {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch("/api/staff/recruit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_key: key }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Recrutement impossible.");
        return;
      }
      await runtime?.refreshWorld();
      router.push("/staff");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {error ? (
        <p className="md:col-span-2 border border-error/40 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
      {candidates.map((candidate) => (
        <ReliquaryFrame key={candidate.key} parchment className="flex flex-col gap-4 p-5">
          <div className="flex gap-4">
            <StaffPortrait appearance={candidate.appearance} size={72} />
            <div>
              <p className="font-label text-[10px] tracking-widest text-burnished-gold/70 uppercase">
                {ROLE_LABEL[candidate.role]}
              </p>
              <h3 className="font-headline text-xl text-primary">{candidate.name}</h3>
              <p className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase">
                {candidate.wage_daily} F / jour
              </p>
            </div>
          </div>
          <p className="font-body text-sm text-on-surface-variant italic">{candidate.blurb}</p>
          <p className="font-label text-[10px] tracking-widest text-outline uppercase">
            Encaissement {candidate.stats.checkout_speed} · Rayon {candidate.stats.restock_speed} ·
            Quai {candidate.stats.receive_speed}
          </p>
          <Button
            type="button"
            disabled={busy === candidate.key}
            onClick={() => void hire(candidate.key)}
          >
            {busy === candidate.key ? "Embauche…" : "Recruter"}
          </Button>
        </ReliquaryFrame>
      ))}
    </div>
  );
}
