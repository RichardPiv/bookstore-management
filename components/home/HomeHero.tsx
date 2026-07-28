import Link from "next/link";

export default function HomeHero() {
  return (
    <>
      <div className="home-vignette absolute inset-0 z-0 opacity-40">
        <div
          className="h-[870px] w-full bg-cover bg-center"
          style={{ backgroundImage: "url(/img/home_hero.jpg)" }}
          role="img"
          aria-label="Intérieur d'une bibliothèque ancienne baignée d'une lumière dorée"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
      </div>

      <section className="relative z-10 container mx-auto max-w-5xl px-6 pt-32 pb-24 text-center">
        <div className="mb-8 inline-block font-label text-xs tracking-[0.4em] text-burnished-gold uppercase">
          Système de Gestion de Grimoires Prestidigitateurs
        </div>

        <h2 className="mb-6 font-headline text-5xl leading-tight font-semibold italic md:text-8xl">
          Entrez dans les
          <br />
          Archives Mondiales
        </h2>

        <p className="mx-auto mb-12 max-w-2xl font-body text-xl leading-relaxed text-on-surface-variant italic md:text-2xl">
          Le système de gestion et de simulation de grimoires le plus prestigieux
          du Secteur IV.
        </p>

        <div className="flex flex-col items-center justify-center gap-6 md:flex-row">
          <Link
            href="/login"
            className="group relative flex h-14 w-64 items-center justify-center border border-primary bg-transparent transition-all duration-300 hover:bg-primary"
          >
            <span className="font-label text-sm tracking-widest text-primary uppercase group-hover:text-on-primary">
              Ouvrir le grimoire
            </span>
            <span
              className="absolute -top-1 -left-1 h-2 w-2 border-t-2 border-l-2 border-primary"
              aria-hidden
            />
            <span
              className="absolute -right-1 -bottom-1 h-2 w-2 border-r-2 border-b-2 border-primary"
              aria-hidden
            />
          </Link>
          <Link
            href="#features"
            className="font-label text-xs tracking-widest text-outline uppercase transition-colors hover:text-primary"
          >
            Consulter le manuel de l&apos;Archiviste
          </Link>
        </div>
      </section>
    </>
  );
}
