import type { NextRequest } from "next/server";
import { getBusiness } from "@/lib/data";
import type { Business } from "@/lib/types";

// Buscador de direcciones con Nominatim (OpenStreetMap). Es gratis pero pide
// identificar la app y no más de 1 consulta por segundo: sirve para la beta.
// Para producción conviene un proveedor pago (Google Places, Mapbox, Geoapify)
// y alcanza con cambiar este archivo.

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const USER_AGENT = process.env.GEOCODER_USER_AGENT || "viasap-beta/0.1 (pedidos por WhatsApp)";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
/** Radio de búsqueda alrededor del local, en grados (~25 km). */
const SEARCH_RADIUS_DEG = 0.25;

interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
  /** No se encontró la altura exacta: el pin cae en la calle. */
  approximate: boolean;
}

interface NominatimPlace {
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  address?: Record<string, string | undefined>;
  error?: string;
}

const cache = new Map<string, { expires: number; value: unknown }>();

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await load();
  if (cache.size > 500) cache.clear();
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, value });
  return value;
}

async function nominatim<T>(endpoint: "search" | "reverse", params: Record<string, string>): Promise<T> {
  const query = new URLSearchParams({ format: "jsonv2", addressdetails: "1", "accept-language": "es", ...params });
  const response = await fetch(`${NOMINATIM_URL}/${endpoint}?${query}`, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Nominatim respondió ${response.status}`);
  return response.json() as Promise<T>;
}

function toResult(place: NominatimPlace, typedNumber: string | null): GeocodeResult {
  const a = place.address ?? {};
  const street = a.road ?? a.pedestrian ?? a.footway ?? a.path ?? place.name ?? "";
  const number = a.house_number ?? typedNumber ?? "";
  const locality = a.city ?? a.town ?? a.village ?? a.hamlet ?? a.suburb ?? a.municipality;
  const label =
    [[street, number].filter(Boolean).join(" "), locality, a.state, a.country].filter(Boolean).join(", ") ||
    place.display_name;
  return { label, lat: Number(place.lat), lng: Number(place.lon), approximate: !a.house_number };
}

async function searchAddress(business: Business, query: string): Promise<GeocodeResult[]> {
  const { lat, lng, city, province } = business.address;
  const params = {
    viewbox: [lng - SEARCH_RADIUS_DEG, lat + SEARCH_RADIUS_DEG, lng + SEARCH_RADIUS_DEG, lat - SEARCH_RADIUS_DEG].join(","),
    bounded: "1",
    countrycodes: "ar",
    limit: "6",
  };
  // Primero con la ciudad del local ("catamarca 432" es una calle, no la provincia).
  let places = await nominatim<NominatimPlace[]>("search", { ...params, q: `${query}, ${city}, ${province}` });
  if (!places.length) places = await nominatim<NominatimPlace[]>("search", { ...params, q: query });

  // Si el mapa no conoce la altura, conservamos el número que escribió el cliente.
  const typedNumber = query.match(/\b\d{1,5}\b/)?.[0] ?? null;
  const results = new Map<string, GeocodeResult>();
  for (const place of places) {
    const result = toResult(place, typedNumber);
    if (!results.has(result.label)) results.set(result.label, result);
  }
  return [...results.values()];
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const place = await nominatim<NominatimPlace>("reverse", { lat: String(lat), lon: String(lng), zoom: "18" });
  return place.error ? null : toResult(place, null).label;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const business = await getBusiness(params.get("slug") ?? "");
  if (!business) return Response.json({ error: "La tienda no existe." }, { status: 404 });

  try {
    if (params.has("lat") && params.has("lng")) {
      const lat = Number(params.get("lat"));
      const lng = Number(params.get("lng"));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return Response.json({ error: "Coordenadas inválidas." }, { status: 400 });
      }
      const label = await cached(`r:${lat.toFixed(5)},${lng.toFixed(5)}`, () => reverseGeocode(lat, lng));
      return Response.json({ label });
    }

    const query = (params.get("q") ?? "").trim().slice(0, 120);
    if (query.length < 3) return Response.json({ results: [] });
    const results = await cached(`s:${business.slug}:${query.toLowerCase()}`, () => searchAddress(business, query));
    return Response.json({ results });
  } catch {
    return Response.json({ error: "No pudimos buscar la dirección." }, { status: 502 });
  }
}
