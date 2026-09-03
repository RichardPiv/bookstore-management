"use client";

import { FormEvent, useEffect, useState } from "react";

import ReliquaryFrame from "@/components/dashboard/ReliquaryFrame";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/profile");
        const body = await res.json();
        if (res.ok && body.data) {
          setUsername(body.data.username ?? "");
          setEmail(body.data.email ?? "");
        }
      } catch {
        setError("Impossible de charger le profil.");
      }
    })();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Impossible de changer le mot de passe.");
        setSaving(false);
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Mot de passe mis à jour.");
      setSaving(false);
    } catch {
      setError("Impossible de changer le mot de passe.");
      setSaving(false);
    }
  }

  return (
    <div className="custom-scroll flex-1 overflow-y-auto p-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <section className="flex flex-col gap-1 border-l-4 border-burnished-gold pl-6">
          <h2 className="font-headline-xl text-4xl tracking-widest text-ethereal-glow uppercase">
            Profil
          </h2>
          <p className="font-body-md text-on-surface-variant italic opacity-80">
            Consultez votre identité et changez votre mot de passe.
          </p>
        </section>

        <ReliquaryFrame parchment className="space-y-4 p-6">
          <div>
            <p className="font-label text-[10px] tracking-widest text-outline uppercase">
              Identifiant
            </p>
            <p className="mt-1 font-headline text-xl text-primary">{username || "—"}</p>
          </div>
          <div>
            <p className="font-label text-[10px] tracking-widest text-outline uppercase">
              Email
            </p>
            <p className="mt-1 font-body text-on-surface">{email || "—"}</p>
          </div>
        </ReliquaryFrame>

        <ReliquaryFrame parchment className="space-y-4 p-6">
          <h3 className="font-headline-lg text-lg tracking-widest text-primary uppercase">
            Changer le mot de passe
          </h3>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <label className="block">
              <span className="mb-2 block font-label text-[10px] tracking-widest text-outline uppercase">
                Mot de passe actuel
              </span>
              <input
                type="password"
                className="w-full rpg-input px-3 py-2"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
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
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>
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
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : "Mettre à jour"}
            </Button>
          </form>
        </ReliquaryFrame>
      </div>
    </div>
  );
}
