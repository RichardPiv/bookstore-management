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
import type { SupervisionPlayerRow } from "@/services/admin/supervision-service";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("fr-FR");
}

const SUPERVISION_COLUMNS: AdminColumnDef<SupervisionPlayerRow>[] = [
  {
    key: "player",
    label: "Joueur",
    getValue: (player) => player.username,
  },
  {
    key: "balance",
    label: "Solde",
    getValue: (player) =>
      player.balance == null ? Number.NEGATIVE_INFINITY : Number(player.balance),
    sortType: "number",
  },
  {
    key: "alerts",
    label: "Alertes",
    getValue: (player) => player.active_alerts,
    sortType: "number",
  },
  {
    key: "orders",
    label: "Commandes",
    getValue: (player) => player.pending_orders,
    sortType: "number",
  },
  {
    key: "simulation",
    label: "Dernière sim.",
    getValue: (player) =>
      player.last_simulation_at
        ? new Date(player.last_simulation_at).getTime()
        : Number.NEGATIVE_INFINITY,
    sortType: "number",
  },
];

export default function AdminSupervisionPage() {
  const [players, setPlayers] = useState<SupervisionPlayerRow[]>([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/supervision");
        const body = await res.json();
        if (!res.ok) {
          setError(body.error?.message ?? "Impossible de charger la supervision.");
          setLoading(false);
          return;
        }
        setPlayers(body.data ?? []);
        setLoading(false);
      } catch {
        setError("Impossible de charger la supervision.");
        setLoading(false);
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
  } = useAdminTableFilters(players, SUPERVISION_COLUMNS, {
    searchValues: (player) => [
      player.username,
      player.email,
      player.balance,
      player.active_alerts,
      player.pending_orders,
      formatDate(player.last_simulation_at),
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

  const paginatedPlayers = useMemo(() => {
    const start = (page - 1) * ADMIN_LIST_PAGE_SIZE;
    return filteredRows.slice(start, start + ADMIN_LIST_PAGE_SIZE);
  }, [filteredRows, page]);

  return (
    <div className="space-y-10 p-12">
      <section className="flex flex-col gap-1 border-l-4 border-burnished-gold pl-6">
        <h2 className="font-headline-xl text-4xl tracking-widest text-ethereal-glow uppercase">
          Supervision
        </h2>
        <p className="font-body-md text-on-surface-variant italic opacity-80">
          État des librairies joueurs.
        </p>
      </section>

      {error ? (
        <p className="font-body text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      <ReliquaryFrame parchment className="p-6">
        {loading ? (
          <p className="font-label text-xs tracking-widest text-outline uppercase">
            Chargement…
          </p>
        ) : (
          <>
            <AdminTableSearch
              value={search}
              onChange={setSearch}
              onClear={clearFilters}
              hasActiveFilters={hasActiveFilters}
              matchCount={matchCount}
              totalCount={totalCount}
              placeholder="Rechercher joueur, email…"
            />

            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr className="border-b border-burnished-gold/30">
                  <AdminSortableTh
                    className="w-[28%]"
                    label="Joueur"
                    columnKey="player"
                    sort={sort}
                    onToggle={toggleSort}
                  />
                  <AdminSortableTh
                    className="w-[14%]"
                    label="Solde"
                    columnKey="balance"
                    sort={sort}
                    onToggle={toggleSort}
                  />
                  <AdminSortableTh
                    className="w-[12%]"
                    label="Alertes"
                    columnKey="alerts"
                    sort={sort}
                    onToggle={toggleSort}
                  />
                  <AdminSortableTh
                    className="w-[14%]"
                    label="Commandes"
                    columnKey="orders"
                    sort={sort}
                    onToggle={toggleSort}
                  />
                  <AdminSortableTh
                    className="w-[18%]"
                    label="Dernière sim."
                    columnKey="simulation"
                    sort={sort}
                    onToggle={toggleSort}
                  />
                  <th className="w-[14%] px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginatedPlayers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 font-body text-sm text-on-surface-variant italic"
                    >
                      {totalCount === 0
                        ? "Aucun joueur pour le moment."
                        : "Aucun résultat pour cette recherche."}
                    </td>
                  </tr>
                ) : (
                  paginatedPlayers.map((player) => (
                    <tr
                      key={player.id}
                      className="border-b border-outline-variant/20 font-body text-sm"
                    >
                      <td className="px-3 py-3">
                        <div className="truncate font-headline text-primary">
                          {player.username}
                        </div>
                        <div className="truncate font-label text-[10px] text-outline uppercase">
                          {player.email}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={player.is_low ? "text-error" : "text-primary"}
                        >
                          {player.balance ?? "—"} F
                        </span>
                      </td>
                      <td className="px-3 py-3">{player.active_alerts}</td>
                      <td className="px-3 py-3">{player.pending_orders}</td>
                      <td className="px-3 py-3">
                        {formatDate(player.last_simulation_at)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Link
                          href={`/admin/users/${player.id}`}
                          className="font-label text-[10px] tracking-widest text-burnished-gold uppercase hover:text-primary"
                        >
                          Fiche →
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
              ariaLabel="Pagination de la supervision"
            />
          </>
        )}
      </ReliquaryFrame>
    </div>
  );
}
