"use client";

import type { AdminSortState } from "@/components/admin/useAdminTableFilters";
import { cn } from "@/lib/utils";

type AdminTableSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  hasActiveFilters?: boolean;
  matchCount: number;
  totalCount: number;
  placeholder?: string;
  className?: string;
};

export function AdminTableSearch({
  value,
  onChange,
  onClear,
  hasActiveFilters = false,
  matchCount,
  totalCount,
  placeholder = "Rechercher…",
  className,
}: AdminTableSearchProps) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-center gap-3 border-b border-outline-variant/30 pb-4",
        className,
      )}
    >
      <label className="relative min-w-[220px] flex-1">
        <span className="sr-only">Recherche</span>
        <span
          className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-base text-outline"
          aria-hidden
        >
          search
        </span>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="rpg-input w-full py-2 pr-3 pl-10 text-sm"
        />
      </label>
      <p className="font-label text-[10px] tracking-widest text-outline uppercase">
        {matchCount === totalCount
          ? `${totalCount} entrée${totalCount > 1 ? "s" : ""}`
          : `${matchCount} / ${totalCount}`}
      </p>
      {hasActiveFilters && onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="font-label text-[10px] tracking-widest text-burnished-gold uppercase hover:text-primary"
        >
          Réinitialiser
        </button>
      ) : null}
    </div>
  );
}

type AdminSortableThProps = {
  label: string;
  columnKey: string;
  sort: AdminSortState;
  onToggle: (key: string) => void;
  className?: string;
};

export function AdminSortableTh({
  label,
  columnKey,
  sort,
  onToggle,
  className,
}: AdminSortableThProps) {
  const active = sort?.key === columnKey;
  const direction = active ? sort.direction : null;
  const arrowIcon =
    direction === "asc"
      ? "arrow_drop_up"
      : direction === "desc"
        ? "arrow_drop_down"
        : "arrow_drop_down";

  return (
    <th className={cn("px-3 py-3", className)}>
      <button
        type="button"
        onClick={() => onToggle(columnKey)}
        className={cn(
          "inline-flex w-full max-w-full cursor-pointer items-center gap-0.5 text-left font-label text-[10px] tracking-widest uppercase transition-colors",
          active
            ? "text-burnished-gold"
            : "text-burnished-gold/70 hover:text-burnished-gold",
        )}
        aria-label={
          direction === "asc"
            ? `Trier ${label} par ordre décroissant`
            : direction === "desc"
              ? `Annuler le tri sur ${label}`
              : `Trier ${label} par ordre croissant`
        }
      >
        <span className="truncate">{label}</span>
        <span
          className={cn(
            "material-symbols-outlined shrink-0 text-[18px] leading-none",
            active ? "text-burnished-gold" : "text-outline/45",
          )}
          aria-hidden
        >
          {arrowIcon}
        </span>
      </button>
    </th>
  );
}
