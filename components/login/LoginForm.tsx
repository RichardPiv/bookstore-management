"use client";

import { BookOpen, ChevronRight, KeyRound, Loader2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type FormStatus = "idle" | "loading" | "error";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const body = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(
          body.error?.message ?? "Identifiants incorrects. Réessayez.",
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMessage("Impossible de joindre les archives. Réessayez.");
    }
  }

  const isLoading = status === "loading";

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">
        <div className="group">
          <label
            htmlFor="username"
            className="mb-1.5 block font-label text-xs tracking-widest text-outline uppercase transition-colors group-focus-within:text-primary"
          >
            Identifiant du Conservateur
          </label>
          <div className="login-rpg-input flex items-center px-3 py-2">
            <User
              className="mr-2 size-[18px] shrink-0 text-outline transition-colors group-focus-within:text-primary"
              aria-hidden
            />
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="nom_d_utilisateur"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={isLoading}
              className="w-full border-none bg-transparent font-label text-sm text-on-surface outline-none placeholder:text-outline/40 focus:ring-0 disabled:opacity-60"
            />
          </div>
        </div>

        <div className="group">
          <label
            htmlFor="password"
            className="mb-1.5 block font-label text-xs tracking-widest text-outline uppercase transition-colors group-focus-within:text-primary"
          >
            Mot de Passe de la Crypte
          </label>
          <div className="login-rpg-input flex items-center px-3 py-2">
            <KeyRound
              className="mr-2 size-[18px] shrink-0 text-outline transition-colors group-focus-within:text-primary"
              aria-hidden
            />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
              className="w-full border-none bg-transparent font-label text-sm tracking-widest text-primary outline-none placeholder:text-outline/40 focus:ring-0 disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      {errorMessage ? (
        <p
          className="font-label text-xs tracking-wide text-error uppercase"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="login-rpg-button group flex w-full items-center justify-between px-4 py-3.5 font-headline text-[15px] font-bold tracking-[0.15em] uppercase transition-all"
        >
          {isLoading ? (
            <>
              <span className="size-[18px] opacity-0" aria-hidden />
              <span>Consultation…</span>
              <Loader2 className="size-[18px] animate-spin" aria-hidden />
            </>
          ) : (
            <>
              <ChevronRight
                className="size-[18px] opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
              <span>Entrer dans le Reliquaire</span>
              <BookOpen className="size-[18px]" aria-hidden />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
