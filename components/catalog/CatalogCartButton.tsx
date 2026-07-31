"use client";

import { Button } from "../ui/button";
import useCatalogueCart from "./useCatalogueCart";

export default function CatalogueCartButton() {
  const { openCart, itemsCount } = useCatalogueCart();

  return (
    <Button onClick={openCart} disabled={itemsCount === 0}>
      <span className="material-symbols-outlined">shopping_cart</span>
      <span>Panier ({itemsCount})</span>
    </Button>
  );
}
