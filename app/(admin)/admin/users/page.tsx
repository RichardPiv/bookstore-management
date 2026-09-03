"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

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
import type { UserPublic } from "@/services/users/types";

const USER_COLUMNS: AdminColumnDef<UserPublic>[] = [
  {
    key: "username",
    label: "Identifiant",
    getValue: (user) => user.username,
  },
  {
    key: "email",
    label: "Email",
    getValue: (user) => user.email,
  },
  {
    key: "role",
    label: "Rôle",
    getValue: (user) => user.role,
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });

  async function loadUsers() {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/users");
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Impossible de charger les utilisateurs.");
        setStatus("error");
        return;
      }
      setUsers(body.data ?? []);
      setStatus("ready");
    } catch {
      setError("Impossible de charger les utilisateurs.");
      setStatus("error");
    }
  }

  useEffect(() => {
    void loadUsers();
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
  } = useAdminTableFilters(users, USER_COLUMNS, {
    searchValues: (user) => [
      user.username,
      user.email,
      user.role === "admin" ? "admin" : "joueur user",
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

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * ADMIN_LIST_PAGE_SIZE;
    return filteredRows.slice(start, start + ADMIN_LIST_PAGE_SIZE);
  }, [filteredRows, page]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Création impossible.");
        setCreating(false);
        return;
      }
      setForm({ username: "", email: "", password: "", role: "user" });
      setCreating(false);
      setPage(1);
      await loadUsers();
    } catch {
      setError("Création impossible.");
      setCreating(false);
    }
  }

  return (
    <div className="space-y-10 p-12">
      <section className="flex flex-col gap-1 border-l-4 border-burnished-gold pl-6">
        <h2 className="font-headline-xl text-4xl tracking-widest text-ethereal-glow uppercase">
          Utilisateurs
        </h2>
        <p className="font-body-md text-on-surface-variant italic opacity-80">
          Comptes administrateurs et joueurs.
        </p>
      </section>

      <ReliquaryFrame parchment className="space-y-4 p-6">
        <h3 className="font-headline-lg text-lg tracking-widest text-primary uppercase">
          Créer un compte
        </h3>
        <form onSubmit={(e) => void handleCreate(e)} className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block font-label text-[10px] tracking-widest text-outline uppercase">
              Identifiant
            </span>
            <input
              className="w-full rpg-input px-3 py-2"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-label text-[10px] tracking-widest text-outline uppercase">
              Email
            </span>
            <input
              type="email"
              className="w-full rpg-input px-3 py-2"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-label text-[10px] tracking-widest text-outline uppercase">
              Mot de passe
            </span>
            <input
              type="password"
              className="w-full rpg-input px-3 py-2"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              minLength={8}
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-label text-[10px] tracking-widest text-outline uppercase">
              Rôle
            </span>
            <select
              className="w-full rpg-input px-3 py-2"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="user">Joueur</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <div className="md:col-span-2">
            <Button type="submit" disabled={creating}>
              {creating ? "Création…" : "Créer"}
            </Button>
          </div>
        </form>
      </ReliquaryFrame>

      {error ? (
        <p className="font-body text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      <ReliquaryFrame parchment className="p-6">
        {status === "loading" ? (
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
              placeholder="Rechercher identifiant, email…"
            />

            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr className="border-b border-burnished-gold/30">
                  <AdminSortableTh
                    className="w-[28%]"
                    label="Identifiant"
                    columnKey="username"
                    sort={sort}
                    onToggle={toggleSort}
                  />
                  <AdminSortableTh
                    className="w-[36%]"
                    label="Email"
                    columnKey="email"
                    sort={sort}
                    onToggle={toggleSort}
                  />
                  <AdminSortableTh
                    className="w-[16%]"
                    label="Rôle"
                    columnKey="role"
                    sort={sort}
                    onToggle={toggleSort}
                  />
                  <th className="w-[20%] px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-8 font-body text-sm text-on-surface-variant italic"
                    >
                      {totalCount === 0
                        ? "Aucun utilisateur."
                        : "Aucun résultat pour cette recherche."}
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-outline-variant/20 font-body text-sm"
                    >
                      <td className="truncate px-3 py-3 text-primary">
                        {user.username}
                      </td>
                      <td className="truncate px-3 py-3">{user.email}</td>
                      <td className="px-3 py-3 uppercase">{user.role}</td>
                      <td className="px-3 py-3 text-right">
                        <Link
                          href={`/admin/users/${user.id}`}
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
              ariaLabel="Pagination des utilisateurs"
            />
          </>
        )}
      </ReliquaryFrame>
    </div>
  );
}
