import { formatMoney } from "./format";
import type { DeliverySettings, DeliveryZone } from "./types";

// Envío por zonas con nombre ("Dentro de boulevard" / "Fuera de boulevard"):
// el cliente elige la suya al pedir y el costo sale de esa zona.

export type ShippingQuote =
  | { status: "to-agree" }
  | { status: "pending" }
  | { status: "ok"; cost: number; zone: DeliveryZone };

export function quoteShipping(delivery: DeliverySettings, zoneId: string | null | undefined): ShippingQuote {
  if (!delivery.zones.length) return { status: "to-agree" };
  const zone = zoneId ? delivery.zones.find((z) => z.id === zoneId) : undefined;
  return zone ? { status: "ok", cost: zone.cost, zone } : { status: "pending" };
}

/** Envío más barato y si hay zonas con otro costo ("desde"). null = sin zonas, se coordina. */
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
