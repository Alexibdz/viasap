import type { GeoPoint } from "./types";

export function googleMapsUrl(point: GeoPoint): string {
  return `https://www.google.com/maps/search/?api=1&query=${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
}
