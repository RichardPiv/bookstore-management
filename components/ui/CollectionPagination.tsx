"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type CollectionPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  ariaLabel: string;
};

export default function CollectionPagination({
  page,
  totalPages,
  onPageChange,
  ariaLabel,
}: CollectionPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-4"
      aria-label={ariaLabel}
    >
      <Button
        type="button"
        variant="outline"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="min-w-32"
      >
        <ChevronLeft className="size-3.5" aria-hidden />
        Précédent
      </Button>

      <p className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase">
        Page <span className="text-primary">{page}</span>
        {" / "}
        {totalPages}
      </p>

      <Button
        type="button"
        variant="outline"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="min-w-32"
      >
        Suivant
        <ChevronRight className="size-3.5" aria-hidden />
      </Button>
    </nav>
  );
}
