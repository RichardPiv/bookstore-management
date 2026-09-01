"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  parseFlorins,
  type TreasuryOverviewData,
} from "./treasury-data";

type TreasuryBalanceContextValue = {
  overview: TreasuryOverviewData | null;
  refreshTreasury: () => Promise<void>;
};

const TreasuryBalanceContext = createContext<TreasuryBalanceContextValue | null>(
  null,
);

async function fetchTreasuryOverview(): Promise<TreasuryOverviewData | null> {
  try {
    const response = await fetch("/api/treasury");
    if (!response.ok) return null;
    const body = await response.json();
    return body.data as TreasuryOverviewData;
  } catch {
    return null;
  }
}

export default function TreasuryBalanceProvider({
  children,
  initialOverview,
}: {
  children: React.ReactNode;
  initialOverview?: TreasuryOverviewData;
}) {
  const [overview, setOverview] = useState<TreasuryOverviewData | null>(
    initialOverview ?? null,
  );

  const refreshTreasury = useCallback(async () => {
    const next = await fetchTreasuryOverview();
    if (next) {
      setOverview(next);
    }
  }, []);

  const value = useMemo(
    () => ({ overview, refreshTreasury }),
    [overview, refreshTreasury],
  );

  return (
    <TreasuryBalanceContext.Provider value={value}>
      {children}
    </TreasuryBalanceContext.Provider>
  );
}

export function useTreasuryBalance() {
  const context = useContext(TreasuryBalanceContext);
  if (!context) {
    throw new Error(
      "useTreasuryBalance must be used within a TreasuryBalanceProvider",
    );
  }
  return context;
}

/** Safe when provider is absent (e.g. tests). */
export function useTreasuryBalanceOptional() {
  return useContext(TreasuryBalanceContext);
}

export function treasuryBalanceAmount(
  overview: TreasuryOverviewData | null,
): number {
  return overview ? parseFlorins(overview.balance) : 0;
}
