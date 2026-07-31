"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import { Cart, CartContextType, CartItem } from "./catalog-data";

const CART_STORAGE_KEY = "catalog-cart";

const EMPTY_CART: Cart = { items: [] };

type CartAction =
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "REMOVE_ITEM"; item: CartItem }
  | { type: "UPDATE_ITEM_QUANTITY"; item: CartItem; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; cart: Cart };

export const CartContext = createContext<CartContextType | null>(null);

function isCart(value: unknown): value is Cart {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as Cart).items)
  );
}

function loadCartFromStorage(): Cart {
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

async function getUserId() {
  try {
    const userResponse = await fetch("/api/auth/me");
    if (!userResponse.ok) {
      throw new Error("Failed to get user");
    }
    const user = await userResponse.json();
    return Number(user.data?.id);
  } catch {
    return null;
  }
}

async function getSupplierId() {
  try {
    const supplierResponse = await fetch("/api/suppliers");
    if (!supplierResponse.ok) {
      throw new Error("Failed to get supplier");
    }
    const supplier = await supplierResponse.json();
    return Number(supplier.data[0].id);
  } catch {
    return null;
  }
}

async function completeCheckout(cart: Cart) {
  try {
    const [userId, supplierId] = await Promise.all([
      getUserId(),
      getSupplierId(),
    ]);

    if (!userId || !supplierId) {
      throw new Error("Impossible de résoudre l'utilisateur ou le fournisseur.");
    }

    const ordersResponse = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        immediate: true,
        lines: cart.items.map((item) => ({
          book_id: Number(item.book.id),
          supplier_id: supplierId,
          qty: item.quantity,
        })),
      }),
    });

    if (!ordersResponse.ok) {
      const errorBody = (await ordersResponse.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      throw new Error(
        errorBody?.error?.message ?? "Impossible de créer la commande.",
      );
    }

    await ordersResponse.json();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export function cartReducer(state: Cart, action: CartAction): Cart {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.items.find(
        (item) => item.book.id === action.item.book.id,
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.book.id === action.item.book.id
              ? { ...item, quantity: item.quantity + action.item.quantity }
              : item,
          ),
        };
      }

      return { ...state, items: [...state.items, action.item] };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter(
          (item) => item.book.id !== action.item.book.id,
        ),
      };
    case "UPDATE_ITEM_QUANTITY": {
      const newQuantity = action.quantity;

      if (newQuantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (item) => item.book.id !== action.item.book.id,
          ),
        };
      }

      return {
        ...state,
        items: state.items.map((item) =>
          item.book.id === action.item.book.id
            ? { ...item, quantity: newQuantity }
            : item,
        ),
      };
    }
    case "CLEAR_CART":
      return EMPTY_CART;
    case "LOAD_CART":
      return action.cart;
    default:
      return state;
  }
}

export default function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cart, dispatch] = useReducer(cartReducer, EMPTY_CART);
  const [isHydrated, setIsHydrated] = useState(false);

  const [isCartOpen, setIsCartOpen] = useState(false);

  function openCart() {
    setIsCartOpen(true);
  }

  function closeCart() {
    setIsCartOpen(false);
  }

  useEffect(() => {
    dispatch({ type: "LOAD_CART", cart: loadCartFromStorage() });
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, isHydrated]);

  const itemsCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);
  const total = cart.items.reduce(
    (acc, item) => acc + item.book.purchasePrice * item.quantity,
    0,
  );

  function addItem(item: CartItem) {
    dispatch({ type: "ADD_ITEM", item });
  }

  function removeItem(item: CartItem) {
    dispatch({ type: "REMOVE_ITEM", item });
  }

  function updateItemQuantity(item: CartItem, quantity: number) {
    dispatch({ type: "UPDATE_ITEM_QUANTITY", item, quantity });
  }

  function clearCart() {
    dispatch({ type: "CLEAR_CART" });
  }

  async function checkout() {
    const success = await completeCheckout(cart);

    if (success) {
      dispatch({ type: "CLEAR_CART" });
      closeCart();
    }

    return success;
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        itemsCount,
        total,
        addItem,
        removeItem,
        updateItemQuantity,
        clearCart,
        checkout,
        isCartOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
