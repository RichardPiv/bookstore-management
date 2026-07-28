import Link from "next/link";

import BookForm from "@/components/Book/BookForm";

export default function NewBookPage() {
  return (
    <div className="custom-scroll flex-1 overflow-y-auto p-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <Link
            href="/catalog"
            className="group mb-6 inline-flex items-center gap-2 font-label text-[10px] tracking-widest text-burnished-gold/70 uppercase transition-colors hover:text-primary"
          >
            <span
              className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-1"
              aria-hidden
            >
              arrow_back
            </span>
            Retour au catalogue
          </Link>
          <h1 className="font-headline text-4xl font-normal tracking-wide text-primary uppercase">
            Nouveau Codex
          </h1>
          <p className="mt-3 font-body text-sm text-on-surface-variant italic">
            Inscrivez un nouveau grimoire dans les archives de La Réserve.
          </p>
        </header>

        <BookForm />
      </div>
    </div>
  );
}
