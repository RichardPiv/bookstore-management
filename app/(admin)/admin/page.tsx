import Link from "next/link";

import ReliquaryFrame from "@/components/dashboard/ReliquaryFrame";

const HUB_CARDS = [
  {
    href: "/admin/supervision",
    title: "Supervision",
    description: "Vue d’ensemble des librairies joueurs.",
    icon: "monitoring",
  },
  {
    href: "/admin/users",
    title: "Utilisateurs",
    description: "Créer et gérer les comptes.",
    icon: "group",
  },
  {
    href: "/admin/books",
    title: "Catalogue",
    description: "CRUD des grimoires.",
    icon: "menu_book",
  },
  {
    href: "/admin/suppliers",
    title: "Fournisseurs",
    description: "Référentiel des fournisseurs.",
    icon: "local_shipping",
  },
  {
    href: "/admin/authors",
    title: "Auteurs",
    description: "Référentiel des auteurs.",
    icon: "history_edu",
  },
  {
    href: "/admin/categories",
    title: "Catégories",
    description: "Taxonomie commerciale.",
    icon: "category",
  },
  {
    href: "/admin/formats",
    title: "Formats",
    description: "Formats d’ouvrages.",
    icon: "book_2",
  },
] as const;

export default function AdminHubPage() {
  return (
    <div className="space-y-10 p-12">
      <section className="flex flex-col gap-1 border-l-4 border-burnished-gold pl-6">
        <h2 className="font-headline-xl text-4xl tracking-widest text-ethereal-glow uppercase">
          Hub d&apos;administration
        </h2>
        <p className="font-body-md text-on-surface-variant italic opacity-80">
          Pilotage du Reliquaire et des librairies isolées.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {HUB_CARDS.map((card) => (
          <Link key={card.href} href={card.href} className="group block">
            <ReliquaryFrame
              parchment
              className="h-full p-8 transition-all duration-300 group-hover:scale-[1.01]"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-headline-lg text-xl tracking-widest text-primary uppercase">
                  {card.title}
                </h3>
                <span
                  className="material-symbols-outlined text-2xl text-burnished-gold"
                  aria-hidden
                >
                  {card.icon}
                </span>
              </div>
              <p className="font-body text-sm text-on-surface-variant">
                {card.description}
              </p>
            </ReliquaryFrame>
          </Link>
        ))}
      </div>
    </div>
  );
}
