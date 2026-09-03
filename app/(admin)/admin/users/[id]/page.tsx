"use client";

import Link from "next/link";
import { FormEvent, use, useEffect, useState } from "react";

import ReliquaryFrame from "@/components/dashboard/ReliquaryFrame";
import TreasuryAdjustForm from "@/components/treasury/TreasuryAdjustForm";
import TreasuryMovementsList from "@/components/treasury/TreasuryMovementsList";
import {
  formatFlorins,
  type TreasuryMovementData,
  type TreasuryOverviewData,
} from "@/components/treasury/treasury-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserPublic } from "@/services/users/types";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function AdminUserDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [user, setUser] = useState<UserPublic | null>(null);
  const [overview, setOverview] = useState<TreasuryOverviewData | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function load() {
    setError(null);
    try {
      const userRes = await fetch(`/api/users/${id}`);
      const userBody = await userRes.json();
      if (!userRes.ok) {
        setError(userBody.error?.message ?? "Utilisateur introuvable.");
        return;
      }
      const nextUser = userBody.data as UserPublic;
      setUser(nextUser);
      setUsername(nextUser.username);
      setEmail(nextUser.email);
      setRole(nextUser.role);

      if (nextUser.role === "user") {
        const treasuryRes = await fetch(`/api/treasury?user_id=${id}`);
        const treasuryBody = await treasuryRes.json();
        if (treasuryRes.ok) {
          const data = treasuryBody.data;
          setOverview({
            id: data.id,
            balance:
              typeof data.balance === "string"
                ? data.balance
                : Number(data.balance).toFixed(2),
            low_threshold:
              typeof data.low_threshold === "string"
                ? data.low_threshold
                : Number(data.low_threshold).toFixed(2),
            is_low: Boolean(data.is_low),
            updated_at:
              typeof data.updated_at === "string"
                ? data.updated_at
                : new Date(data.updated_at).toISOString(),
          });
        } else {
          setOverview(null);
        }
      } else {
        setOverview(null);
      }
    } catch {
      setError("Impossible de charger la fiche.");
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const payload: Record<string, string> = {
        username,
        email,
        role,
      };
      if (password.trim()) {
        payload.password = password;
      }
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Mise à jour impossible.");
        return;
      }
      setPassword("");
      setMessage("Compte mis à jour.");
      await load();
    } catch {
      setError("Mise à jour impossible.");
    }
  }

  function handleAdjusted(payload: {
    account: TreasuryOverviewData;
    movement: TreasuryMovementData;
  }) {
    setOverview(payload.account);
    setRefreshKey((k) => k + 1);
  }

  if (!user && !error) {
    return (
      <div className="p-12 font-label text-xs tracking-widest text-outline uppercase">
        Chargement…
      </div>
    );
  }

  return (
    <div className="space-y-10 p-12">
      <div>
        <Link
          href="/admin/users"
          className="mb-4 inline-flex items-center gap-2 font-label text-[10px] tracking-widest text-burnished-gold/70 uppercase hover:text-primary"
        >
          ← Retour aux utilisateurs
        </Link>
        <section className="flex flex-col gap-1 border-l-4 border-burnished-gold pl-6">
          <h2 className="font-headline-xl text-4xl tracking-widest text-ethereal-glow uppercase">
            Fiche utilisateur
          </h2>
          <p className="font-body-md text-on-surface-variant italic opacity-80">
            {user?.username ?? "—"}
          </p>
        </section>
      </div>

      {error ? (
        <p className="font-body text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="font-body text-sm text-primary" role="status">
          {message}
        </p>
      ) : null}

      {user ? (
        <ReliquaryFrame parchment className="space-y-4 p-6">
          <form onSubmit={(e) => void handleSave(e)} className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-label text-[10px] tracking-widest text-outline uppercase">
                Identifiant
              </span>
              <input
                className="w-full rpg-input px-3 py-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-[10px] tracking-widest text-outline uppercase">
                Email
              </span>
              <input
                type="email"
                className="w-full rpg-input px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-[10px] tracking-widest text-outline uppercase">
                Nouveau mot de passe
              </span>
              <input
                type="password"
                className="w-full rpg-input px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                placeholder="Laisser vide pour ne pas changer"
              />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-[10px] tracking-widest text-outline uppercase">
                Rôle
              </span>
              <select
                className="w-full rpg-input px-3 py-2"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">Joueur</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <div className="md:col-span-2">
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </ReliquaryFrame>
      ) : null}

      {user?.role === "user" && overview ? (
        <>
          <ReliquaryFrame
            parchment
            variant={overview.is_low ? "error" : "default"}
            className="p-6"
          >
            <p
              className={cn(
                "font-label text-[10px] tracking-widest uppercase",
                overview.is_low ? "text-error/70" : "text-burnished-gold/60",
              )}
            >
              Solde du joueur
            </p>
            <p
              className={cn(
                "mt-2 font-headline-xl text-4xl",
                overview.is_low ? "text-error" : "text-primary",
              )}
            >
              {formatFlorins(overview.balance)} F
            </p>
          </ReliquaryFrame>

          <TreasuryAdjustForm userId={Number(id)} onAdjusted={handleAdjusted} />

          <ReliquaryFrame parchment className="p-6">
            <TreasuryMovementsList userId={Number(id)} refreshKey={refreshKey} />
          </ReliquaryFrame>
        </>
      ) : null}
    </div>
  );
}
