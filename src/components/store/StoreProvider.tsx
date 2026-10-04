"use client";

import { createContext, use, type ReactNode } from "react";
import { addToCart, clearCart, setItemQty, useCartItems } from "@/lib/cart";
import { cartCount, cartSubtotal } from "@/lib/pricing";
import type { Business, CartItem } from "@/lib/types";

const StoreContext = createContext<Business | null>(null);

export function StoreProvider({ business, children }: { business: Business; children: ReactNode }) {
  return <StoreContext value={business}>{children}</StoreContext>;
}

export function useStore(): Business {
  const business = use(StoreContext);
  if (!business) throw new Error("useStore tiene que usarse dentro de <StoreProvider>.");
  return business;
}

export function useCart() {
  const { slug } = useStore();
  const items = useCartItems(slug);
  return {
    items,
    count: cartCount(items),
    subtotal: cartSubtotal(items),
    add: (lines: CartItem[]) => addToCart(slug, lines),
    setQty: (key: string, qty: number) => setItemQty(slug, key, qty),
    clear: () => clearCart(slug),
  };
}
