"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import ReliquaryFrame from "@/components/dashboard/ReliquaryFrame";
import StaffPortrait from "@/components/staff/StaffPortrait";
import { parseStats } from "@/simulation/types";

type Employee = {
  id: number;
  name: string;
  role: string;
  wage_daily: string | number;
  status: string;
  appearance_json: string;
  stats_json: string;
  lore_code: string | null;
  is_dismissible: boolean;
};

const ROLE_LABEL: Record<string, string> = {
  clerk: "Comptoir",
  stocker: "Manutention",
  receiver: "Quai",
};

export default function StaffList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/staff");
        const body = await res.json();
        if (!res.ok) {
          setError(body.error?.message ?? "Impossible de lire le registre.");
          return;
        }
        setEmployees(body.data ?? []);
      } catch {
        setError("Impossible de joindre les archives.");
      }
    })();
  }, []);

  return (
    <div className="mt-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-body text-sm text-on-surface-variant">
          {employees.length} archiviste{employees.length > 1 ? "s" : ""} en poste
        </p>
        <Button asChild>
          <Link href="/staff/recruit">Recruter</Link>
        </Button>
      </div>

      {error ? (
        <p className="border border-error/40 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {employees.map((employee) => {
          const stats = parseStats(employee.stats_json);
          const wage =
            typeof employee.wage_daily === "string"
              ? employee.wage_daily
              : Number(employee.wage_daily).toFixed(2);
          return (
            <Link key={employee.id} href={`/staff/${employee.id}`}>
              <ReliquaryFrame parchment className="flex gap-4 p-5 transition-colors hover:border-primary/50">
                <StaffPortrait appearance={employee.appearance_json} size={72} />
                <div className="min-w-0 flex-1">
                  <p className="font-label text-[10px] tracking-widest text-burnished-gold/70 uppercase">
                    {ROLE_LABEL[employee.role] ?? employee.role}
                    {employee.lore_code ? ` · ${employee.lore_code}` : ""}
                  </p>
                  <h3 className="font-headline text-xl text-primary">{employee.name}</h3>
                  <p className="mt-1 font-label text-[10px] tracking-widest text-on-surface-variant uppercase">
                    {wage} F / jour · moral {Math.round(stats.morale)} · fatigue{" "}
                    {Math.round(stats.fatigue)}
                  </p>
                </div>
              </ReliquaryFrame>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
