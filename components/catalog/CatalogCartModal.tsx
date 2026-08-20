"use client";

import OrnamentalFrame from "@/components/ui/OrnamentalFrame";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import useCatalogueCart from "./useCatalogueCart";

export default function CatalogCartModal() {
  const {
    isCartOpen,
    closeCart,
    total,
    itemsCount,
    checkout,
    cart,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
  } = useCatalogueCart();

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-ink-black/65 px-4 py-8 backdrop-blur-sm transition-opacity duration-200 sm:px-6",
        isCartOpen ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!isCartOpen}
    >
      <div className="absolute inset-0" onClick={closeCart} aria-hidden />

      <OrnamentalFrame className="relative z-10 flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden bg-surface-container-low shadow-2xl">
        <div className="border-b border-outline-variant/40 bg-surface-container px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 font-label text-[10px] tracking-[0.24em] text-burnished-gold/70 uppercase">
                Réserve des acquisitions
              </p>
              <h2 className="font-headline text-2xl text-primary uppercase sm:text-3xl">
                Panier
              </h2>
              <p className="mt-2 font-body text-sm text-on-surface-variant">
                {itemsCount} article{itemsCount > 1 ? "s" : ""} prêt
                {itemsCount > 1 ? "s" : ""} à être commandé
                {itemsCount > 1 ? "s" : ""}.
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={closeCart}
              className="shrink-0"
              aria-label="Fermer le panier"
            >
              <span className="material-symbols-outlined">close</span>
            </Button>
          </div>
        </div>

        <div className="custom-scroll flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {cart.items.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center border border-dashed border-outline-variant/50 bg-surface-container px-6 py-10 text-center">
              <span
                className="material-symbols-outlined mb-4 text-4xl text-outline/50"
                aria-hidden
              >
                shopping_cart
              </span>
              <p className="font-headline text-lg text-primary uppercase">
                Panier vide
              </p>
              <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-on-surface-variant">
                Ajoute des grimoires depuis le catalogue pour préparer une
                commande fournisseur.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <article
                  key={item.book.id}
                  className="border border-outline-variant/40 bg-surface-container px-4 py-4 sm:px-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="mb-2 font-headline text-lg leading-tight text-primary">
                        {item.book.title}
                      </p>
                      <p className="font-label text-[10px] tracking-[0.22em] text-on-surface-variant uppercase">
                        Code {item.book.loreCode || item.book.id}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:min-w-[280px]">
                      <div className="border border-outline-variant/40 bg-surface px-3 py-3 text-center">
                        <p className="mb-1 font-label text-xs tracking-[0.2em] text-outline uppercase">
                          Prix
                        </p>
                        <p className="font-body text-sm text-on-surface">
                          {item.book.purchasePrice.toLocaleString("fr-FR")} F
                        </p>
                      </div>

                      <div className="border border-outline-variant/40 bg-surface px-3 py-3 text-center">
                        <p className="mb-1 font-label text-xs tracking-[0.2em] text-outline uppercase">
                          Qté
                        </p>
                        <div className="flex items-center justify-center flex-col">
                          <p className="font-body text-lg text-on-surface">
                            {item.quantity}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() =>
                                updateItemQuantity(item, item.quantity - 1)
                              }
                            >
                              <span className="material-symbols-outlined">
                                remove
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() =>
                                updateItemQuantity(item, item.quantity + 1)
                              }
                            >
                              <span className="material-symbols-outlined">
                                add
                              </span>
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="border border-primary/30 bg-primary/5 px-3 py-3 text-center">
                        <p className="mb-1 font-label text-xs tracking-[0.2em] text-primary/80 uppercase">
                          Total
                        </p>
                        <p className="font-body text-sm text-primary">
                          {(
                            item.quantity * item.book.purchasePrice
                          ).toLocaleString("fr-FR")}{" "}
                          F
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item)}
                      >
                        <span className="material-symbols-outlined">
                          {" "}
                          delete{" "}
                        </span>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-outline-variant/40 bg-surface-container px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-label text-[10px] tracking-[0.24em] text-outline uppercase">
                Montant total
              </p>
              <p className="mt-1 font-headline text-2xl text-primary">
                {total.toLocaleString("fr-FR")} Florins
              </p>
            </div>

            <Button
              onClick={checkout}
              disabled={total === 0}
              size="lg"
              className="min-w-[220px]"
            >
              <span className="material-symbols-outlined" aria-hidden>
                local_shipping
              </span>
              Commander
            </Button>
          </div>
        </div>
      </OrnamentalFrame>
    </div>
  );
}
