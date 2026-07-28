import { BookOpen } from "lucide-react";

export default function LoginPanelHeader() {
  return (
    <header className="mb-10 flex flex-col items-center text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full border border-primary/30">
        <BookOpen className="size-8 text-primary" aria-hidden />
      </div>
      <h1 className="mb-1 font-headline text-2xl font-bold tracking-widest text-primary uppercase">
        La Réserve des Grimoires
      </h1>
      <p className="font-label text-xs tracking-[0.3em] text-primary/70 uppercase">
        Grand Archiviste
      </p>
      <div className="mt-8 mb-4 h-px w-full max-w-[200px] bg-gradient-to-r from-transparent via-outline-variant to-transparent" />
      <h2 className="font-headline text-xl tracking-wider text-on-surface uppercase">
        Accès aux Archives
      </h2>
      <p className="mt-2 font-label text-xs tracking-[0.2em] text-outline uppercase">
        Authentification Requise
      </p>
    </header>
  );
}
