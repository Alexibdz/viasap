import { describe, expect, it } from "vitest";
import { rotiseriaAlexis } from "@/data/stores/rotiseria-alexis";
import { upgradeStore, upgradeZones } from "./store-upgrade";
import type { StoreSeed } from "./types";

describe("tiendas guardadas con el formato anterior", () => {
  it("pasa las zonas por distancia a zonas con nombre, sin cambiar los costos", () => {
    expect(
      upgradeZones([
        { upToKm: 1.5, cost: 1000 },
        { upToKm: 3, cost: 1500 },
      ]),
    ).toEqual([
      { id: "hasta-1-5-km", name: "Hasta 1,5 km", cost: 1000 },
      { id: "hasta-3-km", name: "Hasta 3 km", cost: 1500 },
    ]);
  });

  it("no toca las zonas que ya tienen nombre", () => {
    const store = structuredClone(rotiseriaAlexis);
    expect(upgradeStore(store).business.delivery.zones).toEqual(rotiseriaAlexis.business.delivery.zones);
  });

  it("actualiza la tienda leída del disco", () => {
    const saved = structuredClone(rotiseriaAlexis) as unknown as { business: { delivery: { zones: unknown[] } } };
    saved.business.delivery.zones = [{ upToKm: 2, cost: 900 }];
    const store = upgradeStore(saved as unknown as StoreSeed);
    expect(store.business.delivery.zones).toEqual([{ id: "hasta-2-km", name: "Hasta 2 km", cost: 900 }]);
  });

  it("descarta lo que el local ya no configura: colores, frase destacada y foto para compartir", () => {
    const saved = structuredClone(rotiseriaAlexis) as unknown as { business: Record<string, unknown> };
    Object.assign(saved.business, { theme: { primary: "#e8590c" }, highlight: "Frase", coverUrl: "/demo/x.jpg" });
    const { business } = upgradeStore(saved as unknown as StoreSeed);
    expect(["theme", "highlight", "coverUrl"].filter((key) => key in business)).toEqual([]);
    expect(business.logoUrl).toBe(rotiseriaAlexis.business.logoUrl);
  });
});
