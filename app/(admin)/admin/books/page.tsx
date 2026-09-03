"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ADMIN_LIST_PAGE_SIZE } from "@/components/admin/admin-list";
import {
  AdminSortableTh,
  AdminTableSearch,
} from "@/components/admin/AdminTableToolbar";
import {
  useAdminTableFilters,
  type AdminColumnDef,
} from "@/components/admin/useAdminTableFilters";
import ReliquaryFrame from "@/components/dashboard/ReliquaryFrame";
import CollectionPagination from "@/components/ui/CollectionPagination";
import type { BookWithAuthors } from "@/services/books/types";

const BOOK_COLUMNS: AdminColumnDef<BookWithAuthors>[] = [
  {
    key: "title",
    label: "Titre",
    getValue: (book) => book.title,
  },
  {
    key: "cote",
    label: "Cote",
    getValue: (book) => book.cote ?? "",
  },
  {
    key: "status",
    label: "Statut",
    getValue: (book) => (book.is_active ? 1 : 0),
    sortType: "number",
  },
];

export default function AdminBooksPage() {
  const [books, setBooks] = useState<BookWithAuthors[]>([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/books");
        const body = await res.json();
        if (!res.ok) {
          setError(body.error?.message ?? "Impossible de charger le catalogue.");
          return;
        }
        setBooks(body.data ?? []);
      } catch {
        setError("Impossible de charger le catalogue.");
      }
    })();
  }, []);

  const {
    search,
    setSearch,
    sort,
    toggleSort,
    clearFilters,
    filteredRows,
    hasActiveFilters,
    matchCount,
    totalCount,
  } = useAdminTableFilters(books, BOOK_COLUMNS, {
    searchValues: (book) => [
      book.title,
      book.cote,
      book.lore_code,
      book.is_active ? "actif" : "desactive",
    ],
  });

  useEffect(() => {
    setPage(1);
  }, [search, sort]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / ADMIN_LIST_PAGE_SIZE),
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedBooks = useMemo(() => {
    const start = (page - 1) * ADMIN_LIST_PAGE_SIZE;
    return filteredRows.slice(start, start + ADMIN_LIST_PAGE_SIZE);
  }, [filteredRows, page]);

  return (
    <div className="space-y-10 p-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <section className="flex flex-col gap-1 border-l-4 border-burnished-gold pl-6">
          <h2 className="font-headline-xl text-4xl tracking-widest text-ethereal-glow uppercase">
            Catalogue
          </h2>
          <p className="font-body-md text-on-surface-variant italic opacity-80">
            Gestion des grimoires.
          </p>
        </section>
        <Link
          href="/admin/books/new"
          className="border border-primary bg-primary/5 px-5 py-3 font-label text-[10px] tracking-widest text-primary uppercase"
        >
          Nouveau Codex
        </Link>
      </div>

      {error ? (
        <p className="font-body text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      <ReliquaryFrame parchment className="p-6">
        <AdminTableSearch
          value={search}
          onChange={setSearch}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
          matchCount={matchCount}
          totalCount={totalCount}
          placeholder="Rechercher titre, cote…"
        />

        <table className="w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="border-b border-burnished-gold/30">
              <AdminSortableTh
                className="w-[42%]"
                label="Titre"
                columnKey="title"
                sort={sort}
                onToggle={toggleSort}
              />
              <AdminSortableTh
                className="w-[28%]"
                label="Cote"
                columnKey="cote"
                sort={sort}
                onToggle={toggleSort}
              />
              <AdminSortableTh
                className="w-[15%]"
                label="Statut"
                columnKey="status"
                sort={sort}
                onToggle={toggleSort}
              />
              <th className="w-[15%] px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {paginatedBooks.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 font-body text-sm text-on-surface-variant italic"
                >
                  {totalCount === 0
                    ? "Aucun livre."
                    : "Aucun résultat pour cette recherche."}
                </td>
              </tr>
            ) : (
              paginatedBooks.map((book) => (
                <tr
                  key={book.id}
                  className="border-b border-outline-variant/20 font-body text-sm"
                >
                  <td className="truncate px-3 py-3 text-primary">{book.title}</td>
                  <td className="truncate px-3 py-3">{book.cote ?? "—"}</td>
                  <td className="px-3 py-3">
                    {book.is_active ? "Actif" : "Désactivé"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Link
                      href={`/admin/books/${book.id}/edit`}
                      className="font-label text-[10px] tracking-widest text-burnished-gold uppercase hover:text-primary"
                    >
                      Éditer →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <CollectionPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          ariaLabel="Pagination du catalogue"
        />
      </ReliquaryFrame>
    </div>
  );
}
