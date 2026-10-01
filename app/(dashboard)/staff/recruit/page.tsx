import Link from "next/link";

import StaffRecruit from "@/components/staff/StaffRecruit";

export default function StaffRecruitPage() {
  return (
    <div className="custom-scroll flex-1 overflow-y-auto p-12">
      <div className="mx-auto max-w-6xl">
        <section className="mb-2 flex flex-col gap-1 border-l-4 border-burnished-gold pl-6">
          <p className="font-label text-[10px] tracking-widest text-burnished-gold/70 uppercase">
            <Link href="/staff" className="hover:text-primary">
              Employés
            </Link>
            {" · "}Recrutement
          </p>
          <h2 className="font-headline-xl text-4xl tracking-widest text-ethereal-glow uppercase">
            Candidats du jour
          </h2>
          <p className="font-body-md text-on-surface-variant italic opacity-80">
            &ldquo;Cinq visages nouveaux se présentent aux Archives. Choisis avec
            soin : chacun pèsera sur la caisse à la fermeture.&rdquo;
          </p>
        </section>
        <StaffRecruit />
      </div>
    </div>
  );
}
