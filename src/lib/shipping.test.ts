import { describe, expect, it } from "vitest";
import { costaneraBurgers } from "@/data/stores/costanera-burgers";
import { shippingChip } from "./shipping";
import type { DeliverySettings } from "./types";

const base: DeliverySettings = costaneraBurgers.business.delivery;
const zone = (cost: number) => ({ id: `z${cost}`, name: `Zona ${cost}`, cost });

describe("etiqueta de envío de la cabecera", () => {
  it("muestra el envío más barato, con 'desde' si cambia según la zona", () => {
    expect(shippingChip(base)).toBe("desde $1.000");
    expect(shippingChip({ ...base, zones: [zone(1500)] })).toBe("$1.500");
  });

  it("cubre envío gratis, sin zonas y solo retiro", () => {
    expect(shippingChip({ ...base, zones: [zone(0)] })).toBe("Gratis");
    expect(shippingChip({ ...base, zones: [zone(0), zone(1000)] })).toBe("Según la zona");
    expect(shippingChip({ ...base, zones: [] })).toBe("A coordinar");
    expect(shippingChip({ ...base, delivery: false })).toBe("Solo retiro");
  });
});
