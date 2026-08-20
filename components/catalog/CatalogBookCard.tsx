import Link from "next/link";
import { useCallback } from "react";

import {
  type CatalogBook,
  rarityLabels,
} from "@/components/catalog/catalog-data";
import OrnamentalFrame from "@/components/ui/OrnamentalFrame";
import { useCart } from "./CartProvider";

type CatalogBookCardProps = {
  book: CatalogBook;
};

export default function CatalogBookCard({ book }: CatalogBookCardProps) {
  const rarity = rarityLabels[book.rarity];

  const { addItem } = useCart();

  const handleAddToCart = useCallback(() => {
    addItem({ book, quantity: 1 });
  }, [book, addItem]);

  return (
    <OrnamentalFrame
      as="article"
      className="flex flex-col bg-surface-container-low p-6"
    >
      <Link
        href={`/catalog/${book.id}`}
        className="relative mb-6 aspect-[4/3] w-full border border-outline-variant bg-surface p-1"
      >
        {book.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.imageUrl}
            alt={book.title}
            className="size-full object-cover"
          />
        ) : (
          <div
            className="flex size-full items-center justify-center bg-surface-container-lowest"
            aria-hidden
          >
            <span className="material-symbols-outlined text-4xl text-outline/40">
              menu_book
            </span>
          </div>
        )}
        <div className="absolute top-3 right-3 border border-outline-variant bg-surface-container-lowest px-2 py-1 font-label text-[9px] tracking-widest uppercase">
          <span className={rarity.className}>{rarity.label}</span>
        </div>
      </Link>

      <div className="flex-1">
        <Link href={`/catalog/${book.id}`}>
          <h3 className="mb-2 font-headline text-xl text-primary transition-colors hover:text-primary-fixed-dim">
            {book.title}
          </h3>
        </Link>
        <p className="line-clamp-3 font-body text-sm leading-relaxed text-on-surface-variant">
          {book.description}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-outline-variant pt-4">
        <div
          className="flex items-center gap-1.5 font-label text-sm tracking-wide text-primary"
          title="Prix d'achat"
        >
          <span
            className="material-symbols-outlined text-base text-primary"
            aria-hidden
          >
            monetization_on
          </span>
          <span>{book.purchasePrice.toLocaleString("fr-FR")} Florins</span>
        </div>
        <button
          type="button"
          className="flex size-8 items-center justify-center border border-outline-variant bg-surface text-outline cursor-pointer transition-colors hover:border-primary hover:text-primary"
          aria-label={`Ajouter ${book.title} au panier`}
          onClick={handleAddToCart}
        >
          <span className="material-symbols-outlined text-sm">
            add_shopping_cart
          </span>
        </button>
      </div>
    </OrnamentalFrame>
  );
}
