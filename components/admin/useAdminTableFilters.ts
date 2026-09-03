"use client";

import { useCallback, useMemo, useState } from "react";

export type AdminSortDirection = "asc" | "desc";

export type AdminColumnDef<T> = {
  key: string;
  label: string;
  getValue: (row: T) => string | number | boolean | null | undefined;
  /** How to compare values; defaults to auto (number vs string). */
  sortType?: "auto" | "string" | "number";
};

export type AdminSortState = {
  key: string;
  direction: AdminSortDirection;
} | null;

function normalize(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "1" : "0";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toComparable(
  value: string | number | boolean | null | undefined,
  sortType: "auto" | "string" | "number",
): string | number {
  if (value == null) return sortType === "number" ? Number.NEGATIVE_INFINITY : "";
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return value;
  const trimmed = String(value).trim();
  if (sortType === "number" || (sortType === "auto" && /^-?\d+(\.\d+)?$/.test(trimmed))) {
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : Number.NEGATIVE_INFINITY;
  }
  return normalize(trimmed);
}

export function filterAndSortAdminRows<T>(
  rows: T[],
  columns: AdminColumnDef<T>[],
  search: string,
  sort: AdminSortState,
  searchValues?: (row: T) => Array<string | number | boolean | null | undefined>,
): T[] {
  const query = normalize(search);

  let result = rows;
  if (query) {
    result = rows.filter((row) => {
      const parts = searchValues
        ? searchValues(row)
        : columns.map((col) => col.getValue(row));
      const haystack = normalize(parts.map((p) => String(p ?? "")).join(" "));
      return haystack.includes(query);
    });
  }

  if (!sort) return result;

  const column = columns.find((col) => col.key === sort.key);
  if (!column) return result;

  const sortType = column.sortType ?? "auto";
  const direction = sort.direction === "asc" ? 1 : -1;

  return [...result].sort((a, b) => {
    const av = toComparable(column.getValue(a), sortType);
    const bv = toComparable(column.getValue(b), sortType);
    if (av < bv) return -1 * direction;
    if (av > bv) return 1 * direction;
    return 0;
  });
}

export function useAdminTableFilters<T>(
  rows: T[],
  columns: AdminColumnDef<T>[],
  options?: {
    searchValues?: (row: T) => Array<string | number | boolean | null | undefined>;
  },
) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<AdminSortState>(null);

  const toggleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) {
        return { key, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      return null;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setSort(null);
  }, []);

  const filteredRows = useMemo(
    () =>
      filterAndSortAdminRows(
        rows,
        columns,
        search,
        sort,
        options?.searchValues,
      ),
    [rows, columns, search, sort, options?.searchValues],
  );

  const hasActiveFilters = search.trim() !== "" || sort != null;

  return {
    search,
    setSearch,
    sort,
    toggleSort,
    clearFilters,
    filteredRows,
    hasActiveFilters,
    matchCount: filteredRows.length,
    totalCount: rows.length,
  };
}

/** @deprecated Use AdminColumnDef */
export type AdminColumnFilterDef<T> = AdminColumnDef<T>;
