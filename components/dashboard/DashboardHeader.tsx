import { Button } from "@/components/ui/button";

const HEADER_ACTIONS = [
  { icon: "search", label: "Rechercher" },
  { icon: "notifications", label: "Notifications" },
  { icon: "settings", label: "Paramètres" },
] as const;

const ARCHIVIST_AVATAR_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAgwnvayWc_-ja1Tf3zBg59Bt9kT5Y4pSfpd2CSAsUyJ7yG7NFwacqCCH3nuHDNBjddlHub9d083G655xEJ3QkdVqzdwnkttOfiDba-KkKirW1TbpKYUoZ-R_u81MJ9i9bRzJeVRq1lxNlerdVYDVRdyJ-0FZY-eJs7lwt50_5bPhUxrnaDgIP1gu1M65kuxOQJE4oU1Fm67Iy1Enxk9WfjqlVQQuiBw-OI3xv91bcSH2w1IcwQWfIIFmlliRNbcgv68H3Ypjw18wU0";

export default function DashboardHeader() {
  return (
    <header className="z-40 flex h-16 w-full shrink-0 items-center justify-between border-b border-burnished-gold/20 bg-surface-container/50 px-6 backdrop-blur-sm md:px-12">
      <div className="flex items-center gap-4">
        <span
          className="material-symbols-outlined text-sm text-burnished-gold"
          aria-hidden
        >
          menu_book
        </span>
        <span className="font-label-sm text-xs tracking-wider text-on-surface-variant uppercase italic">
          Archives Mondiales • Secteur IV
        </span>
      </div>

      <div className="flex items-center gap-4 md:gap-8">
        <div className="flex items-center gap-4 md:gap-6">
          {HEADER_ACTIONS.map(({ icon, label }) => (
            <Button
              key={icon}
              type="button"
              variant="ghost"
              size="icon-sm"
              className="border-transparent text-burnished-gold/70 hover:bg-transparent hover:text-primary"
              aria-label={label}
            >
              <span className="material-symbols-outlined text-xl">{icon}</span>
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-3 border-l border-burnished-gold/20 pl-4 md:pl-6">
          <div className="hidden text-right sm:block">
            <p className="mb-1 font-label-sm text-[10px] leading-none text-burnished-gold/60 uppercase">
              Archiviste
            </p>
            <p className="font-headline-lg text-sm leading-none tracking-widest text-primary">
              M. Valerius
            </p>
          </div>
          <div className="dashboard-avatar reliquary-border size-10 shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ARCHIVIST_AVATAR_URL}
              alt="Avatar de l'archiviste"
              className="size-full object-cover contrast-125 brightness-75 grayscale"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
