"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const adminNav = [
  { href: "/admin", label: "Hub", match: "exact" as const },
  { href: "/admin/supervision", label: "Supervision", match: "prefix" as const },
  { href: "/admin/users", label: "Utilisateurs", match: "prefix" as const },
  { href: "/admin/books", label: "Catalogue", match: "prefix" as const },
  { href: "/admin/suppliers", label: "Fournisseurs", match: "prefix" as const },
  { href: "/admin/authors", label: "Auteurs", match: "prefix" as const },
  { href: "/admin/categories", label: "Catégories", match: "prefix" as const },
  { href: "/admin/formats", label: "Formats", match: "prefix" as const },
];

function isActive(
  pathname: string,
  href: string,
  match: "exact" | "prefix",
): boolean {
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <aside className="sticky top-0 z-50 flex h-screen w-72 flex-col border-r-2 border-burnished-gold/30 bg-surface-container-lowest">
      <div className="mb-4 p-8">
        <div className="mb-4 flex items-center gap-4">
          <div className="seal-badge">
            <span
              className="material-symbols-outlined text-2xl text-burnished-gold"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden
            >
              admin_panel_settings
            </span>
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg leading-none tracking-tighter text-primary uppercase">
              Administration
            </h1>
            <p className="mt-1 font-label-sm text-[10px] tracking-[0.2em] text-burnished-gold/60 uppercase">
              Reliquaire Central
            </p>
          </div>
        </div>
        <div className="cisellated-divider" aria-hidden />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4">
        {adminNav.map(({ href, label, match }) => {
          const active = isActive(pathname, href, match);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "nav-item group flex items-center px-4 py-3 transition-all",
                active
                  ? "active text-primary"
                  : "text-on-surface-variant hover:text-primary",
              )}
            >
              <span className="game-cursor" aria-hidden />
              <span className="font-headline-lg text-lg tracking-widest uppercase">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-6">
        <Button
          type="button"
          variant="ghost"
          disabled={loggingOut}
          onClick={() => void handleLogout()}
          className="w-full justify-start border-transparent text-on-surface-variant hover:bg-transparent hover:text-error"
        >
          <span className="material-symbols-outlined mr-2">logout</span>
          {loggingOut ? "Déconnexion…" : "Se déconnecter"}
        </Button>
      </div>
    </aside>
  );
}
