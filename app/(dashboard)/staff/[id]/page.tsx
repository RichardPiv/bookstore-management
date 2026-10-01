import Link from "next/link";

import StaffProfile from "@/components/staff/StaffProfile";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffProfilePage({ params }: PageProps) {
  const { id } = await params;
  const employeeId = Number.parseInt(id, 10);

  return (
    <div className="custom-scroll flex-1 overflow-y-auto p-12">
      <div className="mx-auto max-w-5xl">
        <section className="mb-2 flex flex-col gap-1 border-l-4 border-burnished-gold pl-6">
          <p className="font-label text-[10px] tracking-widest text-burnished-gold/70 uppercase">
            <Link href="/staff" className="hover:text-primary">
              Employés
            </Link>
            {" · "}Dossier
          </p>
          <h2 className="font-headline-xl text-4xl tracking-widest text-ethereal-glow uppercase">
            Archiviste
          </h2>
        </section>
        {Number.isInteger(employeeId) && employeeId > 0 ? (
          <StaffProfile employeeId={employeeId} />
        ) : (
          <p className="mt-10 text-error">Identifiant invalide.</p>
        )}
      </div>
    </div>
  );
}
