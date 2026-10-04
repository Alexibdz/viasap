import "server-only";

import { findProduct } from "./menu";
import { listStoreSlugs, loadStore } from "./server/stores";
import type { Business, Category, Coupon, ProductContext } from "./types";

// Lectura pública de las tiendas (lo que ve el cliente). Nunca devuelve los datos
// privados (cupones completos, acceso al panel). Al pasar a Supabase se reemplaza
// el cuerpo de estas funciones y el resto de la app no cambia.

export async function listBusinesses(): Promise<Business[]> {
  const stores = await Promise.all((await listStoreSlugs()).map(loadStore));
  return stores.filter((store) => store !== null).map((store) => store.business);
}

export async function getBusiness(slug: string): Promise<Business | null> {
  return (await loadStore(slug))?.business ?? null;
}

export async function getMenu(slug: string): Promise<Category[] | null> {
  return (await loadStore(slug))?.menu ?? null;
}

export async function getCategory(slug: string, categoryId: string): Promise<Category | null> {
  return (await getMenu(slug))?.find((category) => category.id === categoryId) ?? null;
}

export async function getProduct(slug: string, productId: string): Promise<ProductContext | null> {
  const menu = await getMenu(slug);
  return menu ? findProduct(menu, productId) : null;
}

/** Los cupones nunca se mandan al navegador: se validan acá. */
export async function findCoupon(slug: string, code: string): Promise<Coupon | null> {
  const normalized = code.trim().toUpperCase();
  return (await loadStore(slug))?.coupons.find((coupon) => coupon.code === normalized) ?? null;
}
