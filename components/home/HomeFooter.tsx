import { BookOpen } from "lucide-react";
import Link from "next/link";

const footerLinks = [
  { href: "#", label: "Politique de Confidentialité" },
  { href: "#", label: "Termes du Codex" },
  { href: "#", label: "Contact Sigil" },
];

export default function HomeFooter() {
  return (
    <footer className="flex w-full flex-col items-center justify-between gap-6 border-t border-outline-variant bg-surface-container-lowest px-6 py-8 md:flex-row md:px-12">
      <div className="flex flex-col items-center gap-2 md:items-start">
        <span className="font-label text-[10px] tracking-[0.2em] text-outline uppercase opacity-60">
          Guilde des Archivistes de SIM • Hillsvaire C.2
        </span>
        <span className="font-label text-[9px] text-outline-variant">
          M C M X C V I I
        </span>
      </div>
      <div className="flex flex-wrap justify-center gap-8">
        {footerLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="font-label text-[10px] tracking-widest text-outline uppercase transition-colors hover:text-primary"
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-4 opacity-40">
        <div className="h-px w-8 bg-outline" />
        <BookOpen className="size-5 text-outline" aria-hidden />
        <div className="h-px w-8 bg-outline" />
      </div>
    </footer>
  );
}
