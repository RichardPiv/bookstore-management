import AlertsList from "@/components/alert/AlertsList";

export default function AlertsPage() {
  return (
    <div className="flex-1 space-y-12 overflow-y-auto p-12">
      <div className="mx-auto max-w-7xl">
        <section className="flex flex-col gap-1 border-l-4 border-burnished-gold pl-6">
          <h2 className="font-headline-xl text-4xl tracking-widest text-ethereal-glow uppercase">
            Alertes
          </h2>
          <p className="font-body-md text-on-surface-variant italic opacity-80">
            &ldquo;Les alertes vous permettent de rester informé des événements
            importants dans la Réserve.&rdquo;
          </p>
        </section>
        <AlertsList />
      </div>
    </div>
  );
}
