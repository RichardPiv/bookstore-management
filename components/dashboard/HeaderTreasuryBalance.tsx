"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { formatFlorins } from "@/components/treasury/treasury-data";
import { useTreasuryBalance } from "@/components/treasury/TreasuryBalanceProvider";

export default function HeaderTreasuryBalance() {
  const { overview } = useTreasuryBalance();

  if (!overview) {
    return null;
  }

  return (
    <Link
      href="/treasury"
      className={cn(
        "hidden items-center gap-2 border px-3 py-1.5 transition-colors sm:flex",
        overview.is_low
          ? "border-error/40 bg-error/10 text-error hover:border-error/60"
          : "border-burnished-gold/30 text-burnished-gold hover:border-primary hover:text-primary",
      )}
    >
      <span className="material-symbols-outlined text-base" aria-hidden>
        payments
      </span>
      <span className="font-label-sm text-[10px] tracking-widest uppercase">
        {formatFlorins(overview.balance)} F
      </span>
      {overview.is_low ? (
        <span className="font-label-sm text-[9px] tracking-wider text-error/80 uppercase">
          Bas
        </span>
      ) : null}
    </Link>
  );
}
