import { formatMoney } from "./format";
import type { DeliverySettings } from "./types";

// Envío por zonas con nombre ("Dentro de boulevard" / "Fuera de boulevard"). El cliente
// no elige la zona: al pedir ve los precios y el local le confirma el envío por WhatsApp.
// Si cuesta lo mismo en todas (o hay una sola), el costo ya se sabe y va en el total.

export type ShippingQuote = { status: "to-agree" } | { status: "ok"; cost: number };

export function quoteShipping(delivery: DeliverySettings): ShippingQuote {
  const from = shippingFrom(delivery);
  return from && !from.varies ? { status: "ok", cost: from.cost } : { status: "to-agree" };
}

export function shippingFrom(delivery: DeliverySettings): { cost: number; varies: boolean } | null {
  if (!delivery.zones.length) return null;
  const costs = delivery.zones.map((z) => z.cost);
  const cost = Math.min(...costs);
  return { cost, varies: costs.some((c) => c !== cost) };
}

/** Zonas sugeridas para empezar: lo más común en los pueblos y ciudades con boulevard. */
export const SUGGESTED_ZONES = ["Dentro de boulevard", "Fuera de boulevard", "Zona rural"];

/** Valor de la etiqueta "Envío" de la cabecera: "desde $1.000", "$1.500", "Gratis"… */
export function shippingChip(delivery: DeliverySettings): string {
  if (!delivery.delivery) return "Solo retiro";
  const from = shippingFrom(delivery);
  if (!from) return "A coordinar";
  if (from.cost === 0) return from.varies ? "Según la zona" : "Gratis";
  return from.varies ? `desde ${formatMoney(from.cost)}` : formatMoney(from.cost);
}
