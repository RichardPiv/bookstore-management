"use client";

import { cn } from "@/lib/utils";

export type FilterTabItem<T extends string> = {
  id: T;
  label: string;
  count: number;
};

type FilterTabsProps<T extends string> = {
  items: FilterTabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  className?: string;
};

export default function FilterTabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: FilterTabsProps<T>) {
  return (
    <div
      className={cn("flex flex-wrap gap-3", className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            "btn-sculpted cursor-pointer px-5 py-2 font-label text-[10px] tracking-widest uppercase",
            value === item.id && "active",
          )}
        >
          {item.label} ({item.count})
        </button>
      ))}
    </div>
  );
}
