import "server-only";

import type { StoredOrder } from "@/lib/types";
import { SAFE_NAME } from "@/lib/validation";
import { dataPath, readJson, withFileLock, writeJson } from "./storage";

// Pedidos de cada tienda en data/orders/<slug>.json, del más nuevo al más viejo.

const MAX_ORDERS = 3000;
const ordersFile = (slug: string) => dataPath("orders", `${slug}.json`);

export async function listOrders(slug: string): Promise<StoredOrder[]> {
  // El slug termina siendo un nombre de archivo: solo letras, números y guiones.
  if (!SAFE_NAME.test(slug)) return [];
  return (await readJson<StoredOrder[]>(ordersFile(slug))) ?? [];
}

/** Lo que necesita el tablero: pedidos en curso y los de las últimas horas. */
export async function listRecentOrders(slug: string, hours = 48): Promise<StoredOrder[]> {
  const since = Date.now() - hours * 60 * 60 * 1000;
  const active = new Set(["pending", "preparing", "ready"]);
  return (await listOrders(slug)).filter(
    (order) => active.has(order.status) || Date.parse(order.createdAt) >= since,
  );
}

export async function getOrder(slug: string, code: string): Promise<StoredOrder | null> {
  return (await listOrders(slug)).find((order) => order.code === code) ?? null;
}

export async function insertOrder(slug: string, order: StoredOrder): Promise<void> {
  if (!SAFE_NAME.test(slug)) throw new Error("Tienda inválida.");
  await withFileLock(ordersFile(slug), async () => {
    const orders = await listOrders(slug);
    if (orders.some((existing) => existing.code === order.code)) return;
    await writeJson(ordersFile(slug), [order, ...orders].slice(0, MAX_ORDERS));
  });
}

/**
 * Modifica un pedido. `change` devuelve false para no guardar nada
 * (por ejemplo, si el cambio de estado no corresponde).
 */
export async function updateOrder(
  slug: string,
  code: string,
  change: (order: StoredOrder) => boolean,
): Promise<StoredOrder | null> {
  if (!SAFE_NAME.test(slug)) return null;
  return withFileLock(ordersFile(slug), async () => {
    const orders = await listOrders(slug);
    const order = orders.find((existing) => existing.code === code);
    if (!order || !change(order)) return order ?? null;
    await writeJson(ordersFile(slug), orders);
    return order;
  });
}
