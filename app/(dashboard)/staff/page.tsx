import StaffList from "@/components/staff/StaffList";

export default function StaffPage() {
  return (
    <div className="custom-scroll flex-1 overflow-y-auto p-12">
      <div className="mx-auto max-w-5xl">
        <section className="mb-2 flex flex-col gap-1 border-l-4 border-burnished-gold pl-6">
          <h2 className="font-headline-xl text-4xl tracking-widest text-ethereal-glow uppercase">
            Employés
          </h2>
          <p className="font-body-md text-on-surface-variant italic opacity-80">
            &ldquo;Le Grand Archiviste ne porte pas les caisses — il compose
            l&apos;équipe qui fait vivre la Réserve.&rdquo;
          </p>
        </section>
        <StaffList />
      </div>
    </div>
  );
}
