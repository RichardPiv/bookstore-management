import TreasuryPanel from "@/components/treasury/TreasuryPanel";
import { getSessionUser } from "@/lib/auth";
import { getTreasuryOverview } from "@/services/treasury/treasury-service";
import { redirect } from "next/navigation";

export default async function TreasuryPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }
  const overview = await getTreasuryOverview(session.id);

  const initialOverview = {
    id: overview.id,
    balance: overview.balance.toFixed(2),
    low_threshold: overview.low_threshold.toFixed(2),
    is_low: overview.is_low,
    updated_at: overview.updated_at.toISOString(),
  };

  return (
    <div className="custom-scroll flex-1 overflow-y-auto p-12">
      <div className="mx-auto max-w-5xl">
        <section className="mb-2 flex flex-col gap-1 border-l-4 border-burnished-gold pl-6">
          <h2 className="font-headline-xl text-4xl tracking-widest text-ethereal-glow uppercase">
            Trésorerie
          </h2>
          <p className="font-body-md text-on-surface-variant italic opacity-80">
            &ldquo;Les florins suivent le flux des grimoires — chaque mouvement
            laisse une trace dans le grand livre.&rdquo;
          </p>
        </section>

        <TreasuryPanel initialOverview={initialOverview} />
      </div>
    </div>
  );
}
