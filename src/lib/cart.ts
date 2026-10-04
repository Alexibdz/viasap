import { useSyncExternalStore } from "react";
import type { CartItem } from "./types";

// Carrito por tienda guardado en localStorage. Es un store externo (no estado de
// React) para que el header, la barra inferior y el checkout compartan los mismos
// datos, y para sincronizar entre pestañas.

const STORAGE_PREFIX = "viasap:cart:";
const STORAGE_VERSION = 1;
const EMPTY: CartItem[] = [];

const cache = new Map<string, CartItem[]>();
const listeners = new Set<() => void>();

function read(slug: string): CartItem[] {
  const cached = cache.get(slug);
  if (cached) return cached;
  let items = EMPTY;
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_PREFIX + slug) ?? "null");
    if (stored?.v === STORAGE_VERSION && Array.isArray(stored.items)) items = stored.items;
  } catch {
    // localStorage bloqueado o JSON inválido: carrito vacío.
  }
  cache.set(slug, items);
  return items;
}

function write(slug: string, items: CartItem[]) {
  cache.set(slug, items);
  try {
    if (items.length) {
      window.localStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify({ v: STORAGE_VERSION, items }));
    } else {
      window.localStorage.removeItem(STORAGE_PREFIX + slug);
    }
  } catch {
    // Sin persistencia (modo privado, cuota llena): el carrito vive en memoria.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key?.startsWith(STORAGE_PREFIX)) {
      cache.delete(event.key.slice(STORAGE_PREFIX.length));
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Dos líneas iguales (mismo producto, presentación, opciones y observación) se suman. */
function signature(item: CartItem): string {
  const options = item.options
    .map((o) => `${o.groupId}:${o.optionId}:${o.qty}`)
    .sort()
    .join(",");
  return [item.productId, item.variantId ?? "", options, item.notes ?? ""].join("|");
}

export function addToCart(slug: string, newItems: CartItem[]) {
  const items = [...read(slug)];
  for (const newItem of newItems) {
    const index = items.findIndex((item) => signature(item) === signature(newItem));
    if (index >= 0) items[index] = { ...items[index], qty: items[index].qty + newItem.qty };
    else items.push(newItem);
  }
  write(slug, items);
}

export function setItemQty(slug: string, key: string, qty: number) {
  const items = read(slug);
  write(
    slug,
    qty > 0 ? items.map((item) => (item.key === key ? { ...item, qty } : item)) : items.filter((item) => item.key !== key),
  );
}

export function clearCart(slug: string) {
  write(slug, EMPTY);
}

export function useCartItems(slug: string): CartItem[] {
  return useSyncExternalStore(
    subscribe,
    () => read(slug),
    () => EMPTY,
  );
}
