import type { Cart, CartItem, CatalogBook } from "./catalog-data";

export const CART_STORAGE_KEY = "catalog-cart";

const EMPTY_CART: Cart = { items: [] };

function isCart(value: unknown): value is Cart {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as Cart).items)
  );
}

export function loadCartFromStorage(): Cart {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) {
      return EMPTY_CART;
    }

    const parsed: unknown = JSON.parse(saved);
    return isCart(parsed) ? parsed : EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
}

export function saveCartToStorage(cart: Cart): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

/** Merge items into persisted cart (same rules as CartProvider reducer). */
export function addItemsToCartStorage(items: CartItem[]): Cart {
  let cart = loadCartFromStorage();

  for (const item of items) {
    const existing = cart.items.find(
      (row) => row.book.id === item.book.id,
    );

    if (existing) {
      cart = {
        ...cart,
        items: cart.items.map((row) =>
          row.book.id === item.book.id
            ? { ...row, quantity: row.quantity + item.quantity }
            : row,
        ),
      };
    } else {
      cart = { ...cart, items: [...cart.items, item] };
    }
  }

  saveCartToStorage(cart);
  return cart;
}

export function catalogBookFromStock(
  stock: {
    book_id: number;
    title: string;
    purchase_price: number | string;
  },
): CatalogBook {
  return {
    id: String(stock.book_id),
    loreCode: String(stock.book_id),
    title: stock.title,
    description: "",
    purchasePrice: Number(stock.purchase_price),
    rarity: "common",
    category: "",
    imageUrl: null,
  };
}
