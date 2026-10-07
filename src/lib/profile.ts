import type { AddressValue, BuildingType, DeliveryMethod } from "./types";

// Datos del cliente recordados en el navegador para no pedirlos en cada compra.
// Nombre y teléfono valen para todas las tiendas; la entrega es por tienda.

const CUSTOMER_KEY = "viasap:customer";
const DELIVERY_PREFIX = "viasap:delivery:";

export interface SavedCustomer {
  name: string;
  phone: string;
}

export interface SavedDelivery {
  method: DeliveryMethod | null;
  address: AddressValue | null;
  buildingType: BuildingType;
  floor: string;
  apartment: string;
  references: string;
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin persistencia: se vuelve a completar la próxima vez.
  }
}

export function loadCustomer(): SavedCustomer {
  return load(CUSTOMER_KEY, { name: "", phone: "" });
}

export function saveCustomer(customer: SavedCustomer) {
  save(CUSTOMER_KEY, customer);
}

export function loadDelivery(slug: string): SavedDelivery {
  return load(DELIVERY_PREFIX + slug, {
    method: null,
    address: null,
    buildingType: "house",
    floor: "",
    apartment: "",
    references: "",
  });
}

export function saveDelivery(slug: string, delivery: SavedDelivery) {
  save(DELIVERY_PREFIX + slug, delivery);
}
