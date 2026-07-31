"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { rarityLabels } from "@/components/catalog/catalog-data";
import { isBookRarity } from "@/lib/book-rarities";
import type { BookWithAuthors } from "@/services/books/types";

type LoadStatus = "loading" | "ready" | "error";

const SHELF_MAX = 10;

function formatFlorins(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString("fr-FR");
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n.toLocaleString("fr-FR");
  }
  return "—";
}

function formatIsbn13(code: string): string {
  const digits = code.replace(/\D/g, "");
  if (digits.length !== 13) return code;
  return `${digits.slice(0, 3)}-${digits.slice(3, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR");
}

function displayText(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") {
    return "—";
  }
  return value;
}

type MetaFieldProps = {
  label: string;
  children: ReactNode;
};

function MetaField({ label, children }: MetaFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] tracking-widest text-outline uppercase">
        {label}
      </span>
      <div className="font-label text-lg text-on-surface">{children}</div>
    </div>
  );
}

export default function BookCard({ id }: { id: string }) {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [book, setBook] = useState<BookWithAuthors | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBook() {
      if (!id || !/^\d+$/.test(id)) {
        setErrorMessage("Identifiant de grimoire invalide.");
        setStatus("error");
        return;
      }

      try {
        setStatus("loading");
        setErrorMessage(null);

        const bookRes = await fetch(`/api/books/${id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const bookBody = await bookRes.json();

        if (cancelled) return;

        if (!bookRes.ok) {
          setErrorMessage(
            bookBody.error?.message ??
              "Impossible de joindre les archives. Réessayez.",
          );
          setStatus("error");
          return;
        }

        setBook(bookBody.data);
        setStatus("ready");
      } catch {
        if (cancelled) return;
        setErrorMessage("Impossible de joindre les archives. Réessayez.");
        setStatus("error");
      }
    }

    void loadBook();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (status === "loading") {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 py-24"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        <p className="font-label text-xs tracking-widest text-on-surface-variant uppercase">
          Consultation du livre…
        </p>
      </div>
    );
  }

  if (status === "error" || !book) {
    return (
      <div className="space-y-6 py-12">
        <p
          className="border border-outline-variant bg-surface-container-low px-6 py-4 font-body text-sm text-on-surface-variant"
          role="alert"
        >
          {errorMessage ?? "Impossible de joindre le livre. Réessayez."}
        </p>
        <Link
          href="/catalog"
          className="group inline-flex items-center gap-2 font-label text-[10px] tracking-widest text-outline uppercase transition-colors hover:text-primary"
        >
          <span className="material-symbols-outlined text-base transition-transform group-hover:-translate-x-1">
            arrow_left_alt
          </span>
          Retour au Catalogue
        </Link>
      </div>
    );
  }

  const rarityKey = isBookRarity(book.rarity) ? book.rarity : "common";
  const rarity = rarityLabels[rarityKey];
  const authorsLabel =
    book.authors.length > 0
      ? book.authors.map((author) => author.name).join(", ")
      : "Auteur inconnu";
  const coverUrl =
    typeof book.cover_url === "string" && book.cover_url.length > 0
      ? book.cover_url
      : null;

  return (
    <div className="relative z-10 flex w-full flex-col items-start gap-12 md:flex-row">
      {/* Couverture */}
      <div className="sticky top-24 w-full shrink-0 md:w-1/2">
        <div className="book-detail-cover border-ornamental relative mx-auto w-full max-w-[450px] bg-surface-container-low p-4 shadow-2xl">
          <div
            className="catalog-corner catalog-corner-tl size-6! border-[3px]!"
            aria-hidden
          />
          <div
            className="catalog-corner catalog-corner-br size-6! border-[3px]!"
            aria-hidden
          />
          <div className="book-detail-cover-frame relative aspect-[3/4] w-full overflow-hidden">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt={`Couverture de ${book.title}`}
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <div className="book-detail-cover-placeholder absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                <span
                  className="material-symbols-outlined text-7xl text-outline/35"
                  aria-hidden
                >
                  menu_book
                </span>
                <p className="mt-5 font-headline text-xl tracking-wide text-primary/85">
                  Couverture indisponible
                </p>
                <p className="mt-2 max-w-[18rem] font-label text-[10px] tracking-widest text-outline uppercase">
                  Le cadre reste reserve a l&apos;enluminure du codex
                </p>
              </div>
            )}
            <div
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 to-transparent"
              aria-hidden
            />
          </div>
        </div>
      </div>

      {/* Détails */}
      <div className="w-full space-y-8 md:w-1/2">
        <header className="mb-6 space-y-2">
          {!book.is_active ? (
            <span className="mb-2 inline-block border border-error/50 bg-error/10 px-3 py-1 font-label text-[10px] tracking-widest text-error uppercase">
              Codex désactivé
            </span>
          ) : null}
          <h1 className="font-headline text-4xl font-semibold tracking-tight text-primary md:text-5xl">
            {book.title}
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-primary/30" aria-hidden />
            <p className="font-body text-base tracking-wide text-secondary italic md:text-lg">
              Par {authorsLabel}
            </p>
          </div>
          {book.category ? (
            <p className="font-label text-[10px] tracking-widest text-outline uppercase">
              {book.category.name}
              {book.lore_code ? ` · ${book.lore_code}` : null}
            </p>
          ) : book.lore_code ? (
            <p className="font-label text-[10px] tracking-widest text-outline uppercase">
              {book.lore_code}
            </p>
          ) : null}
        </header>

        <div className="space-y-4">
          <div className="cisellated-divider" aria-hidden />
          <p className="font-body text-base leading-relaxed text-on-surface-variant italic md:text-lg">
            {book.summary}
          </p>
          <div className="cisellated-divider" aria-hidden />
        </div>

        <div className="grid grid-cols-1 gap-6 font-label md:grid-cols-2">
          <MetaField label="Code lore">{displayText(book.lore_code)}</MetaField>
          <MetaField label="Cote d'archive">{displayText(book.cote)}</MetaField>
          <MetaField label="Éditeur">{book.editor}</MetaField>
          <MetaField label="Date de publication">
            {formatDate(book.publication_date)}
          </MetaField>
          <MetaField label="EAN">{formatIsbn13(book.ean)}</MetaField>
          <MetaField label="ISBN">{formatIsbn13(book.isbn)}</MetaField>
          <MetaField label="Collection">
            {displayText(book.collection)}
          </MetaField>
          <MetaField label="Série / Volume">
            {book.series
              ? `${book.series}${book.volume != null ? ` — tome ${book.volume}` : ""}`
              : "—"}
          </MetaField>
          <MetaField label="Format">
            {displayText(book.format?.name)}
          </MetaField>
          <MetaField label="Disponible fournisseur">
            {book.supplier_available ? (
              <span className="text-primary">Oui</span>
            ) : (
              <span className="text-error">Non</span>
            )}
          </MetaField>
          <MetaField label="Classification de Rareté">
            <span
              className={`inline-block border border-primary bg-primary/10 px-3 py-1 text-sm font-bold tracking-[0.2em] uppercase ${rarity.className}`}
            >
              {rarity.label}
            </span>
          </MetaField>
          <MetaField label="Statut">
            {book.is_active ? (
              <span className="text-primary">Actif</span>
            ) : (
              <span className="text-error">Désactivé</span>
            )}
          </MetaField>
          <MetaField label="Prix de vente">
            <span className="font-headline text-2xl font-bold text-primary">
              {formatFlorins(book.sale_price)} Florins
            </span>
          </MetaField>
          <MetaField label="Valeur d'Acquisition">
            <span className="flex items-center gap-1.5 font-headline text-2xl font-bold text-primary">
              <span className="material-symbols-outlined text-xl" aria-hidden>
                monetization_on
              </span>
              {formatFlorins(book.purchase_price)} Florins
            </span>
          </MetaField>
          <MetaField label="Ajouté aux archives">
            {formatDate(book.created_at)}
          </MetaField>
          <MetaField label="Dernière mise à jour">
            {formatDate(book.updated_at)}
          </MetaField>
        </div>

        <div className="flex flex-col gap-4 border border-outline-variant/30 bg-surface-container p-6 sm:flex-row sm:items-center sm:justify-between">
          {book.inventory == null ? (
            <div className="flex items-center gap-4">
              <span
                className="material-symbols-outlined text-outline"
                aria-hidden
              >
                inventory_2
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] tracking-widest text-outline uppercase">
                  Stocks en Archive
                </span>
                <span className="text-on-surface-variant">
                  Pas encore en librairie
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <span
                  className="material-symbols-outlined text-primary"
                  aria-hidden
                >
                  inventory_2
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] tracking-widest text-outline uppercase">
                    Stocks en Archive
                  </span>
                  <span className="text-on-surface">
                    Réserve:{" "}
                    <span className="font-bold text-primary">
                      {book.inventory.qty_reserve}
                    </span>
                  </span>
                </div>
              </div>
              <div
                className="hidden h-8 w-px bg-outline-variant/50 sm:block"
                aria-hidden
              />
              <div className="flex items-center gap-4">
                <span
                  className="material-symbols-outlined text-primary"
                  aria-hidden
                >
                  auto_stories
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] tracking-widest text-outline uppercase">
                    Exposition Publique
                  </span>
                  <span className="text-on-surface">
                    Rayon:{" "}
                    <span className="font-bold text-primary">
                      {book.inventory.qty_shelf} / {SHELF_MAX}
                    </span>
                  </span>
                </div>
              </div>
              <div
                className="hidden h-8 w-px bg-outline-variant/50 sm:block"
                aria-hidden
              />
              <div className="flex items-center gap-4">
                <span
                  className="material-symbols-outlined text-primary"
                  aria-hidden
                >
                  notifications_active
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] tracking-widest text-outline uppercase">
                    Seuil d&apos;alerte
                  </span>
                  <span className="text-on-surface">
                    <span className="font-bold text-primary">
                      {book.inventory.alert_threshold}
                    </span>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link
            href={`/catalog/${book.id}/edit`}
            className="glow-gold min-w-[200px] flex-1 border border-primary bg-primary/5 px-6 py-3 text-center font-label text-[10px] tracking-widest text-primary uppercase transition-all duration-200 active:scale-95"
          >
            Modifier le Codex
          </Link>
          <Link
            href="/stocks"
            className="min-w-[200px] flex-1 border border-outline px-6 py-3 text-center font-label text-[10px] tracking-widest text-on-surface uppercase transition-all duration-200 hover:border-primary hover:text-primary active:scale-95"
          >
            Remettre en Rayon
          </Link>
        </div>

        <Link
          href="/catalog"
          className="group flex w-full items-center justify-center gap-2 font-label text-[10px] tracking-widest text-outline uppercase transition-colors hover:text-primary"
        >
          <span className="material-symbols-outlined transition-transform group-hover:-translate-x-2">
            arrow_left_alt
          </span>
          Retour au Catalogue
        </Link>
      </div>
    </div>
  );
}
