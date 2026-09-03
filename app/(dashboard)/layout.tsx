import { redirect } from "next/navigation";

import DashboardFooter from "@/components/dashboard/DashboardFooter";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import TreasuryBalanceProvider from "@/components/treasury/TreasuryBalanceProvider";
import { getSessionUser } from "@/lib/auth";
import { isPlayerRole } from "@/lib/roles";
import { getTreasuryOverview } from "@/services/treasury/treasury-service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }
  if (!isPlayerRole(session.role)) {
    redirect("/admin");
  }

  const treasury = await getTreasuryOverview(session.id);

  const initialOverview = {
    id: treasury.id,
    balance: treasury.balance.toFixed(2),
    low_threshold: treasury.low_threshold.toFixed(2),
    is_low: treasury.is_low,
    updated_at: treasury.updated_at.toISOString(),
  };

  return (
    <TreasuryBalanceProvider initialOverview={initialOverview}>
      <div className="flex h-screen min-h-0 overflow-hidden">
        <DashboardSidebar />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <DashboardHeader />
          <div className="custom-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </div>
          <DashboardFooter />
        </div>
      </div>
    </TreasuryBalanceProvider>
  );
}
