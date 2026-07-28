import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#features", label: "Explorer" },
  { href: "#features", label: "Catalogues" },
  { href: "#features", label: "Simulateur" },
];

export default function HomeHeader() {
  return (
    <header className="fixed top-0 left-0 z-40 flex h-20 w-full items-center justify-between bg-surface/80 px-6 backdrop-blur-sm md:px-12">
      <div className="flex items-center gap-4">
        <span className="font-label text-xs tracking-[0.3em] text-primary opacity-60">
          V.04.12.S4
        </span>
        <h1 className="font-headline text-xl font-bold tracking-tighter text-primary md:text-2xl">
          La Réserve des Grimoires
        </h1>
      </div>
      <nav className="flex items-center gap-8">
        <div className="hidden gap-6 font-label text-[10px] tracking-widest text-outline uppercase md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <Link href="/login" className={cn(buttonVariants())}>
          S&apos;identifier
        </Link>
      </nav>
    </header>
  );
}
