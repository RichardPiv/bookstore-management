import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import {
  addItemsToCartStorage,
  catalogBookFromStock,
} from "@/components/catalog/cart-storage";

import { isReserveEmpty, type Stock } from "./stock-data";

export const CATALOG_CART_OPEN_QUERY = "cart=open";

/** Default quantity when ordering from an empty reserve. */
export const REORDER_CART_QUANTITY = 1;

export function navigateToCatalogCart(router: AppRouterInstance) {
  router.push(`/catalog?${CATALOG_CART_OPEN_QUERY}`);
}

export function addStockToCart(stock: Stock, quantity = REORDER_CART_QUANTITY) {
  return addItemsToCartStorage([
    { book: catalogBookFromStock(stock), quantity },
  ]);
}

export function addEmptyReserveStocksToCart(
  stocks: Stock[],
  quantity = REORDER_CART_QUANTITY,
) {
  const items = stocks
    .filter((stock) => stock.is_active && isReserveEmpty(stock))
    .map((stock) => ({
      book: catalogBookFromStock(stock),
      quantity,
    }));

  return addItemsToCartStorage(items);
}
