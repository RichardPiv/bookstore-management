"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNav, isNavActive } from "@/components/dashboard/dashboard-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardSidebar() {
  const pathname = usePathname();

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
              auto_stories
            </span>
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg leading-none tracking-tighter text-primary uppercase">
              La Réserve
            </h1>
            <p className="mt-1 font-label-sm text-[10px] tracking-[0.2em] text-burnished-gold/60 uppercase">
              Grand Archiviste
            </p>
          </div>
        </div>
        <div className="cisellated-divider" aria-hidden />
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {dashboardNav.map(({ href, label, variant, match }) => {
          const active = isNavActive(pathname, href, match);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "nav-item group flex items-center px-4 py-4 transition-all",
                active
                  ? "active text-primary"
                  : "text-on-surface-variant hover:text-primary",
              )}
            >
              <span className="game-cursor" aria-hidden />
              <span
                className={cn(
                  "font-headline-lg text-xl tracking-widest uppercase",
                  variant === "alert" &&
                    !active &&
                    "text-error/80 group-hover:text-error",
                  variant === "alert" && active && "text-error",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-6">
        <div className="rpg-window">
          <Link
            href="/catalog/new"
            className="rpg-window-inner flex w-full items-center justify-center gap-2 py-3 font-label-sm tracking-widest text-burnished-gold uppercase transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined text-sm">add_box</span>
            Nouveau Codex
          </Link>
        </div>

        <div className="mt-6 flex justify-between px-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="border-transparent text-on-surface-variant hover:bg-transparent hover:text-primary"
            aria-label="Aide"
          >
            <span className="material-symbols-outlined">help</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="border-transparent text-on-surface-variant hover:bg-transparent hover:text-error"
            aria-label="Se déconnecter"
          >
            <span className="material-symbols-outlined">logout</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
