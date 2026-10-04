"use server";

import { priceOrder } from "./order-pricing";
import { insertOrder, updateOrder } from "./server/orders";
import { loadStore } from "./server/stores";

export type SubmitOrderResult = { ok: true } | { ok: false; error: string };

/** Guarda el pedido que el cliente acaba de mandar por WhatsApp, con precios recalculados. */
export async function submitOrder(slug: unknown, input: unknown): Promise<SubmitOrderResult> {
  if (typeof slug !== "string") return { ok: false, error: "Tienda inválida." };
  const store = await loadStore(slug);
  if (!store) return { ok: false, error: "La tienda no existe." };
  const priced = priceOrder(store, input, new Date());
  if (!priced.ok) return priced;
  await insertOrder(slug, priced.order);
  return { ok: true };
}

export type CancelOrderResult = { ok: true } | { ok: false; reason: "not-found" | "too-late" };

/** El cliente cancela su pedido mientras el local todavía no lo confirmó. El código hace de llave. */
export async function cancelOrder(slug: unknown, code: unknown): Promise<CancelOrderResult> {
  if (typeof slug !== "string" || typeof code !== "string") return { ok: false, reason: "not-found" };
  const outcome = { tooLate: false };
  const order = await updateOrder(slug, code, (current) => {
    if (current.status !== "pending") {
      outcome.tooLate = current.status !== "cancelled";
      return false;
    }
    current.status = "cancelled";
    current.cancelledBy = "customer";
    current.history.push({ status: "cancelled", at: new Date().toISOString() });
    return true;
  });
  if (!order) return { ok: false, reason: "not-found" };
  return outcome.tooLate ? { ok: false, reason: "too-late" } : { ok: true };
}
