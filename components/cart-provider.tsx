"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CatalogueProduct } from "@/lib/types";

export type CartItem = CatalogueProduct & { quantity: number };

type CartContextValue = {
  items: CartItem[];
  addItem: (product: CatalogueProduct) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "gowtham-fireworks-retail-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved) as CartItem[]);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    addItem(product) {
      setItems((current) => {
        const found = current.find((item) => item.id === product.id);
        if (found) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        return [...current, { ...product, quantity: 1 }];
      });
    },
    updateQuantity(id, quantity) {
      setItems((current) => current
        .map((item) => item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item));
    },
    removeItem(id) {
      setItems((current) => current.filter((item) => item.id !== id));
    },
    clearCart() {
      setItems([]);
    },
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.retailPrice * item.quantity, 0),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within CartProvider");
  return value;
}
