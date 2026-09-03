"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

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
import { Button } from "@/components/ui/button";

type NamedEntity = { id: number; name: string; code?: string | null };

type AdminNamedCrudProps = {
  title: string;
  description: string;
  apiPath: string;
  withCode?: boolean;
};

export default function AdminNamedCrud({
  title,
  description,
  apiPath,
  withCode = false,
}: AdminNamedCrudProps) {
  const [items, setItems] = useState<NamedEntity[]>([]);
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");

  const columns = useMemo<AdminColumnDef<NamedEntity>[]>(() => {
    const cols: AdminColumnDef<NamedEntity>[] = [
      {
        key: "name",
        label: "Nom",
        getValue: (item) => item.name,
      },
    ];
    if (withCode) {
      cols.push({
        key: "code",
        label: "Code",
        getValue: (item) => item.code ?? "",
      });
    }
    return cols;
  }, [withCode]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(apiPath);
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Chargement impossible.");
        return;
      }
      setItems(body.data ?? []);
    } catch {
      setError("Chargement impossible.");
    }
  }, [apiPath]);

  useEffect(() => {
    void load();
  }, [load]);

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
  } = useAdminTableFilters(items, columns, {
    searchValues: (item) => [item.name, item.code],
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

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ADMIN_LIST_PAGE_SIZE;
    return filteredRows.slice(start, start + ADMIN_LIST_PAGE_SIZE);
  }, [filteredRows, page]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const payload: Record<string, string> = { name };
      if (withCode) payload.code = code.trim().toUpperCase();
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Création impossible.");
        return;
      }
      setName("");
      setCode("");
      setPage(1);
      await load();
    } catch {
      setError("Création impossible.");
    }
  }

  async function handleUpdate(id: number) {
    setError(null);
    try {
      const payload: Record<string, string> = { name: editName };
      if (withCode) payload.code = editCode.trim().toUpperCase();
      const res = await fetch(`${apiPath}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Mise à jour impossible.");
        return;
      }
      setEditingId(null);
      await load();
    } catch {
      setError("Mise à jour impossible.");
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    try {
      const res = await fetch(`${apiPath}/${id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Suppression impossible.");
        return;
      }
      await load();
    } catch {
      setError("Suppression impossible.");
    }
  }

  const colSpan = withCode ? 3 : 2;

  return (
    <div className="space-y-10 p-12">
      <section className="flex flex-col gap-1 border-l-4 border-burnished-gold pl-6">
        <h2 className="font-headline-xl text-4xl tracking-widest text-ethereal-glow uppercase">
          {title}
        </h2>
        <p className="font-body-md text-on-surface-variant italic opacity-80">
          {description}
        </p>
      </section>

      <ReliquaryFrame parchment className="space-y-4 p-6">
        <form onSubmit={(e) => void handleCreate(e)} className="flex flex-wrap gap-3">
          <input
            className="rpg-input min-w-[200px] flex-1 px-3 py-2"
            placeholder="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {withCode ? (
            <input
              className="rpg-input w-32 px-3 py-2"
              placeholder="Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          ) : null}
          <Button type="submit">Ajouter</Button>
        </form>
      </ReliquaryFrame>

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
          placeholder="Rechercher…"
        />

        <table className="w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="border-b border-burnished-gold/30">
              <AdminSortableTh
                className={withCode ? "w-[45%]" : "w-[70%]"}
                label="Nom"
                columnKey="name"
                sort={sort}
                onToggle={toggleSort}
              />
              {withCode ? (
                <AdminSortableTh
                  className="w-[25%]"
                  label="Code"
                  columnKey="code"
                  sort={sort}
                  onToggle={toggleSort}
                />
              ) : null}
              <th className="w-[30%] px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-3 py-8 font-body text-sm text-on-surface-variant italic"
                >
                  {totalCount === 0
                    ? "Aucun élément."
                    : "Aucun résultat pour cette recherche."}
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-outline-variant/20 font-body text-sm"
                >
                  {editingId === item.id ? (
                    <td colSpan={colSpan} className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          className="rpg-input min-w-[180px] flex-1 px-3 py-2"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                        {withCode ? (
                          <input
                            className="rpg-input w-28 px-3 py-2"
                            value={editCode}
                            onChange={(e) => setEditCode(e.target.value)}
                          />
                        ) : null}
                        <Button
                          type="button"
                          onClick={() => void handleUpdate(item.id)}
                        >
                          OK
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Annuler
                        </Button>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="truncate px-3 py-3 font-headline text-primary">
                        {item.name}
                      </td>
                      {withCode ? (
                        <td className="truncate px-3 py-3 font-label text-[10px] tracking-widest text-outline uppercase">
                          {item.code ?? "—"}
                        </td>
                      ) : null}
                      <td className="px-3 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(item.id);
                              setEditName(item.name);
                              setEditCode(item.code ?? "");
                            }}
                          >
                            Éditer
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-error"
                            onClick={() => void handleDelete(item.id)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        <CollectionPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          ariaLabel={`Pagination — ${title}`}
        />
      </ReliquaryFrame>
    </div>
  );
}
