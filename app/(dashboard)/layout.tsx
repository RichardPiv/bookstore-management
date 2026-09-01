import DashboardFooter from "@/components/dashboard/DashboardFooter";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import TreasuryBalanceProvider from "@/components/treasury/TreasuryBalanceProvider";
import { getTreasuryOverview } from "@/services/treasury/treasury-service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const treasury = await getTreasuryOverview();

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
