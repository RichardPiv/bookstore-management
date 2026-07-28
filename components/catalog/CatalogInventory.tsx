"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import CatalogBookCard from "@/components/catalog/CatalogBookCard";
import {
  ALL_CATEGORY,
  type CatalogBook,
  type CatalogCategory,
  mapApiBookToCatalogBook,
  mapApiCategoryToCatalogCategory,
} from "@/components/catalog/catalog-data";
import { cn } from "@/lib/utils";

type LoadStatus = "loading" | "ready" | "error";

const PAGE_SIZE = 24;

export default function CatalogInventory() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] =
    useState<CatalogCategory>(ALL_CATEGORY);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [books, setBooks] = useState<CatalogBook[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const [booksRes, categoriesRes] = await Promise.all([
          fetch("/api/books", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }),
          fetch("/api/categories", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }),
        ]);

        const [booksBody, categoriesBody] = await Promise.all([
          booksRes.json(),
          categoriesRes.json(),
        ]);

        if (cancelled) return;

        if (!booksRes.ok || !categoriesRes.ok) {
          setErrorMessage(
            booksBody.error?.message ??
              categoriesBody.error?.message ??
              "Impossible de joindre les archives. Réessayez.",
          );
          setStatus("error");
          return;
        }

        const mappedBooks = Array.isArray(booksBody.data)
          ? (booksBody.data as unknown[])
              .map(mapApiBookToCatalogBook)
              .filter((book): book is CatalogBook => book !== null)
          : [];

        const mappedCategories = Array.isArray(categoriesBody.data)
          ? (categoriesBody.data as unknown[])
              .map(mapApiCategoryToCatalogCategory)
              .filter(
                (category): category is CatalogCategory => category !== null,
              )
          : [];

        setBooks(mappedBooks);
        setCategories(mappedCategories);
        setPage(1);
        setStatus("ready");
      } catch {
        if (cancelled) return;
        setErrorMessage("Impossible de joindre les archives. Réessayez.");
        setStatus("error");
      }
    }

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const categoryFilters = useMemo(
    () => [ALL_CATEGORY, ...categories],
    [categories],
  );

  const filteredBooks = useMemo(() => {
    if (activeCategory.id === ALL_CATEGORY.id) {
      return books;
    }

    return books.filter((book) => book.category === activeCategory.name);
  }, [activeCategory, books]);

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / PAGE_SIZE));

  const paginatedBooks = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredBooks.slice(start, start + PAGE_SIZE);
  }, [filteredBooks, page]);

  function selectCategory(category: CatalogCategory) {
    setActiveCategory(category);
    setPage(1);
  }

  if (status === "loading") {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 py-24"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        <p className="font-label text-xs tracking-widest text-on-surface-variant uppercase">
          Consultation des archives…
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <p
        className="border border-outline-variant bg-surface-container-low px-6 py-4 font-body text-sm text-on-surface-variant"
        role="alert"
      >
        {errorMessage ?? "Impossible de joindre les archives. Réessayez."}
      </p>
    );
  }

  return (
    <>
      <div className="mb-10 flex flex-wrap items-center gap-6">
        <span className="font-label text-[10px] tracking-widest text-outline uppercase">
          Catégories :
        </span>
        <div className="flex flex-wrap gap-4">
          {categoryFilters.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => selectCategory(category)}
              className={cn(
                "btn-sculpted cursor-pointer px-6 py-2 font-label text-[10px] tracking-widest uppercase",
                activeCategory.id === category.id && "active",
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <p className="py-12 text-center font-body text-sm text-on-surface-variant italic">
          Aucun grimoire dans cette section des archives.
        </p>
      ) : (
        <>
          <div className="inventory-grid">
            {paginatedBooks.map((book) => (
              <CatalogBookCard key={book.id} book={book} />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav
              className="mt-10 flex flex-wrap items-center justify-center gap-4"
              aria-label="Pagination du catalogue"
            >
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-sculpted flex cursor-pointer items-center gap-1 px-4 py-2 font-label text-[10px] tracking-widest uppercase disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Page précédente"
              >
                <ChevronLeft className="size-3.5" aria-hidden />
                Précédent
              </button>

              <p className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase">
                Page <span className="text-primary">{page}</span>
                {" / "}
                {totalPages}
              </p>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn-sculpted flex cursor-pointer items-center gap-1 px-4 py-2 font-label text-[10px] tracking-widest uppercase disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Page suivante"
              >
                Suivant
                <ChevronRight className="size-3.5" aria-hidden />
              </button>
            </nav>
          ) : null}
        </>
      )}
    </>
  );
}
