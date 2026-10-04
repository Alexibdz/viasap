import type { DeliverySettings, GeoPoint } from "./types";

const EARTH_RADIUS_KM = 6371;

/** Distancia en línea recta (fórmula de haversine). */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export type ShippingQuote =
  | { status: "to-agree" }
  | { status: "pending" }
  | { status: "ok"; cost: number; km: number }
  | { status: "out-of-range"; km: number };

/** Costo de envío según la zona (radio) donde cae la ubicación del cliente. */
export function quoteShipping(
  delivery: DeliverySettings,
  store: GeoPoint,
  location: GeoPoint | null,
): ShippingQuote {
  if (!delivery.zones.length) return { status: "to-agree" };
  if (!location) return { status: "pending" };
  const km = distanceKm(store, location);
  const zone = delivery.zones.find((z) => km <= z.upToKm);
  return zone ? { status: "ok", cost: zone.cost, km } : { status: "out-of-range", km };
}

export function googleMapsUrl(point: GeoPoint): string {
  return `https://www.google.com/maps/search/?api=1&query=${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
}
