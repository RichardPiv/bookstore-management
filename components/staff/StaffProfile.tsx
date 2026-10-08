"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import ReliquaryFrame from "@/components/dashboard/ReliquaryFrame";
import StaffPortrait from "@/components/staff/StaffPortrait";
import { parseStats } from "@/simulation/types";
import { SHELF_CATEGORIES, shelfLocationCode } from "@/simulation/categories";
import { useSimulationRuntimeOptional } from "@/components/simulation-runtime/SimulationRuntimeProvider";
import { EMPLOYEE_ROLES } from "@/services/staff/types";

type Employee = {
  id: number;
  name: string;
  role: string;
  wage_daily: string | number;
  hired_at: string;
  status: string;
  appearance_json: string;
  stats_json: string;
  lore_code: string | null;
  is_dismissible: boolean;
};

const ROLE_LABEL: Record<string, string> = {
  clerk: "Vendeur / comptoir",
  stocker: "Manutentionnaire",
  receiver: "Réceptionnaire",
};

const STAT_ROWS: Array<[string, keyof ReturnType<typeof parseStats>]> = [
  ["Moral", "morale"],
  ["Fatigue", "fatigue"],
  ["Fiabilité", "reliability"],
  ["Encaissement", "checkout_speed"],
  ["Conseil", "advice"],
  ["Mise en rayon", "restock_speed"],
  ["Portage", "carry"],
  ["Réception", "receive_speed"],
];

export default function StaffProfile({ employeeId }: { employeeId: number }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const runtime = useSimulationRuntimeOptional();

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/staff/${employeeId}`);
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Employé introuvable.");
        return;
      }
      setEmployee(body.data);
    })();
  }, [employeeId]);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json();
      if (res.ok) {
        setEmployee(payload.data);
        await runtime?.refreshWorld();
      } else {
        setError(payload.error?.message ?? "Mise à jour impossible.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function assign(role: string) {
    await patch({ role });
  }

  async function dismiss() {
    if (!employee?.is_dismissible) return;
    if (!window.confirm(`Licencier ${employee.name} ?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/staff/${employeeId}/dismiss`, {
        method: "POST",
      });
      if (res.ok) {
        await runtime?.refreshWorld();
        router.push("/staff");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!employee) {
    return (
      <p className="mt-10 font-body text-sm text-on-surface-variant">
        {error ?? "Chargement du dossier…"}
      </p>
    );
  }

  const stats = parseStats(employee.stats_json);
  const wage =
    typeof employee.wage_daily === "string"
      ? employee.wage_daily
      : Number(employee.wage_daily).toFixed(2);
  const specialtyValue = stats.specialty_shelf ?? "none";

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[280px_1fr]">
      <ReliquaryFrame parchment className="flex flex-col items-center gap-4 p-6">
        <StaffPortrait appearance={employee.appearance_json} size={128} />
        <h3 className="text-center font-headline text-2xl text-primary">
          {employee.name}
        </h3>
        <p className="font-label text-[10px] tracking-widest text-burnished-gold/80 uppercase">
          {ROLE_LABEL[employee.role]}
        </p>
        <p className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase">
          {wage} F / jour · XP {Math.round(stats.xp ?? 0)}
        </p>
      </ReliquaryFrame>

      <div className="space-y-6">
        {error ? (
          <p
            className="border border-error/40 bg-error/5 px-4 py-3 text-sm text-error"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <ReliquaryFrame parchment className="p-6">
          <h4 className="font-headline text-lg tracking-widest text-primary uppercase">
            Statistiques
          </h4>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            {STAT_ROWS.map(([label, key]) => (
              <div key={key}>
                <dt className="font-label text-[9px] tracking-widest text-outline uppercase">
                  {label}
                </dt>
                <dd className="font-body text-on-surface">
                  {Math.round(Number(stats[key]))}
                </dd>
              </div>
            ))}
            <div>
              <dt className="font-label text-[9px] tracking-widest text-outline uppercase">
                Expérience
              </dt>
              <dd className="font-body text-on-surface">
                {Math.round(stats.xp ?? 0)} XP
              </dd>
            </div>
          </dl>
          <p className="mt-3 font-body text-xs text-on-surface-variant">
            Les tâches réussies font progresser les compétences (plafond soft
            ~92).
          </p>
        </ReliquaryFrame>

        <ReliquaryFrame parchment className="p-6">
          <h4 className="font-headline text-lg tracking-widest text-primary uppercase">
            Rôle
          </h4>
          <div className="mt-4 flex flex-wrap gap-2">
            {EMPLOYEE_ROLES.map((role) => (
              <Button
                key={role}
                type="button"
                variant={employee.role === role ? "default" : "outline"}
                disabled={busy}
                onClick={() => void assign(role)}
              >
                {ROLE_LABEL[role]}
              </Button>
            ))}
          </div>
        </ReliquaryFrame>

        <ReliquaryFrame parchment className="p-6">
          <h4 className="font-headline text-lg tracking-widest text-primary uppercase">
            Affectation
          </h4>
          <p className="mt-1 font-body text-xs text-on-surface-variant">
            Spécialité de rayon (bonus restock / conseil) et priorité caisse pour
            les vendeurs.
          </p>

          <label className="mt-4 block">
            <span className="font-label text-[9px] tracking-widest text-outline uppercase">
              Spécialité de rayon
            </span>
            <select
              className="mt-1 w-full border border-outline-variant/50 bg-surface px-3 py-2 font-body text-sm text-on-surface"
              disabled={busy}
              value={specialtyValue}
              onChange={(event) => {
                const value = event.target.value;
                void patch({
                  specialty_shelf: value === "none" ? null : value,
                });
              }}
            >
              <option value="none">Aucune</option>
              {SHELF_CATEGORIES.map((cat) => (
                <option key={cat.code} value={shelfLocationCode(cat.code)}>
                  {cat.name} ({cat.code})
                </option>
              ))}
            </select>
          </label>

          {employee.role === "clerk" ? (
            <label className="mt-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={Boolean(stats.counter_focus)}
                disabled={busy}
                onChange={(event) => {
                  void patch({ counter_focus: event.target.checked });
                }}
              />
              <span>
                <span className="font-label text-[10px] tracking-widest text-burnished-gold uppercase">
                  Priorité comptoir
                </span>
                <span className="mt-0.5 block font-body text-xs text-on-surface-variant">
                  Ce vendeur tient le comptoir principal. Sans cette option, il
                  officie au comptoir ouest (2ᵉ caisse).
                </span>
              </span>
            </label>
          ) : null}
        </ReliquaryFrame>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/staff">Retour au registre</Link>
          </Button>
          {employee.is_dismissible ? (
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => void dismiss()}
            >
              Licencier
            </Button>
          ) : (
            <p className="font-body text-sm text-on-surface-variant">
              Cet archiviste fait partie du personnel officiel de la Réserve.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
