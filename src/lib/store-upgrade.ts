import type { DeliveryZone, StoreSeed } from "./types";
import { uniqueId } from "./validation";

// Tiendas guardadas con un formato anterior (data/stores/*.json). Se actualizan al
// leerlas, así nadie tiene que tocar los archivos a mano.

interface LegacyZone {
  id?: unknown;
  name?: unknown;
  /** Formato anterior: radio en km desde el local. */
  upToKm?: unknown;
  cost?: unknown;
}

const formatKm = (km: number) => String(km).replace(".", ",");

/** Zonas por distancia ("hasta 3 km") → zonas con nombre ("Hasta 3 km"). */
export function upgradeZones(zones: unknown): DeliveryZone[] {
  if (!Array.isArray(zones)) return [];
  const taken = new Set<string>();
  return zones.map((raw: LegacyZone, index) => {
    const name =
      typeof raw.name === "string" && raw.name
        ? raw.name
        : typeof raw.upToKm === "number"
          ? `Hasta ${formatKm(raw.upToKm)} km`
          : `Zona ${index + 1}`;
    const id = typeof raw.id === "string" && raw.id && !taken.has(raw.id) ? raw.id : uniqueId(name, taken, "zona");
    taken.add(id);
    return { id, name, cost: typeof raw.cost === "number" ? raw.cost : 0 };
  });
}

/** Datos que el local ya no configura: el diseño, la frase destacada y la foto para compartir. */
const RETIRED_FIELDS = ["theme", "highlight", "coverUrl"];

export function upgradeStore(store: StoreSeed): StoreSeed {
  const business = store.business as unknown as Record<string, unknown>;
  for (const key of RETIRED_FIELDS) delete business[key];
  const zones = store.business.delivery.zones as unknown[];
  if (zones.some((zone) => typeof (zone as LegacyZone).name !== "string" || typeof (zone as LegacyZone).id !== "string")) {
    store.business.delivery.zones = upgradeZones(zones);
  }
  return store;
}
