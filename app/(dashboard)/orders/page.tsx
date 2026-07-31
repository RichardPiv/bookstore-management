import OrdersList from "@/components/order/OrdersList";

export default function OrdersPage() {
  return (
    <div className="custom-scroll flex-1 overflow-y-auto p-12">
      <div className="mx-auto max-w-7xl">
        <section className="mb-2 flex flex-col gap-1 border-l-4 border-burnished-gold pl-6">
          <h2 className="font-headline text-4xl font-normal tracking-wide text-primary uppercase">
            Commandes
          </h2>
          <p className="font-headline text-sm text-on-surface-variant italic">
            &ldquo;Gérer le flux des tomes est aussi vital que leur
            lecture.&rdquo;
          </p>
        </section>
        <OrdersList />
      </div>
    </div>
  );
}
