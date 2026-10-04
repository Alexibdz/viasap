import { describe, expect, it } from "vitest";
import { formatMoney, normalizeText, parseAmount } from "./format";
import { distanceKm, quoteShipping } from "./geo";
import { couponDiscount, describeGroupRule, itemTotal, priceFrom } from "./pricing";
import type { CartItem, DeliverySettings } from "./types";

describe("formatMoney", () => {
  it("usa punto de miles y signo pesos", () => {
    expect(formatMoney(8500)).toBe("$8.500");
    expect(formatMoney(1234567)).toBe("$1.234.567");
    expect(formatMoney(0)).toBe("$0");
    expect(formatMoney(-1450)).toBe("-$1.450");
    expect(formatMoney(999.6)).toBe("$1.000");
  });

  it("lee montos escritos con o sin formato", () => {
    expect(parseAmount("$ 20.000")).toBe(20000);
    expect(parseAmount("")).toBe(0);
  });

  it("normaliza texto para buscar sin cambiar su longitud", () => {
    expect(normalizeText("Ñoquis de PAPÁ")).toBe("noquis de papa");
    expect(normalizeText("Ñoquis de PAPÁ")).toHaveLength("Ñoquis de PAPÁ".length);
  });
});

describe("precios", () => {
  it("toma el menor precio como 'Desde'", () => {
    const variants = [
      { id: "doble", name: "DOBLE", price: 10500 },
      { id: "simple", name: "SIMPLE", price: 8500 },
    ];
    expect(priceFrom({ id: "x", name: "X", variants })).toBe(8500);
    expect(priceFrom({ id: "y", name: "Y", price: 2000 })).toBe(2000);
  });

  it("suma opciones por unidad y multiplica por cantidad", () => {
    const item: CartItem = {
      key: "k",
      productId: "p",
      name: "P",
      sectionLabel: "S",
      unitPrice: 10000,
      qty: 2,
      options: [
        { groupId: "g", groupName: "G", optionId: "a", name: "A", price: 800, qty: 2 },
        { groupId: "g", groupName: "G", optionId: "b", name: "B", price: 0, qty: 1 },
      ],
    };
    expect(itemTotal(item)).toBe(23200);
  });

  it("aplica cupones respetando el mínimo y sin superar el subtotal", () => {
    expect(couponDiscount({ code: "A", type: "percent", value: 10 }, 14500)).toBe(1450);
    expect(couponDiscount({ code: "B", type: "fixed", value: 2000, minSubtotal: 15000 }, 14000)).toBe(0);
    expect(couponDiscount({ code: "B", type: "fixed", value: 2000, minSubtotal: 15000 }, 15000)).toBe(2000);
    expect(couponDiscount({ code: "C", type: "fixed", value: 5000 }, 3000)).toBe(3000);
  });

  it("explica las reglas de cada grupo de opciones", () => {
    const group = (min: number, max?: number) => ({ id: "g", name: "G", min, max, options: [] });
    expect(describeGroupRule(group(0))).toBe("Seleccioná las opciones que quieras.");
    expect(describeGroupRule(group(0, 1))).toBe("Seleccioná hasta 1 opción.");
    expect(describeGroupRule(group(1, 1))).toBe("Seleccioná 1 opción.");
    expect(describeGroupRule(group(1, 2))).toBe("Seleccioná entre 1 y 2 opciones.");
    expect(describeGroupRule(group(2))).toBe("Seleccioná al menos 2 opciones.");
  });
});

describe("envíos", () => {
  const store = { lat: -32.6181, lng: -60.1547 };
  const delivery: DeliverySettings = {
    pickup: true,
    delivery: true,
    zones: [
      { upToKm: 1.5, cost: 1000 },
      { upToKm: 3, cost: 1500 },
    ],
  };

  it("mide distancias en km", () => {
    expect(distanceKm(store, { lat: store.lat + 0.01, lng: store.lng })).toBeCloseTo(1.112, 2);
  });

  it("cotiza según la zona", () => {
    expect(quoteShipping(delivery, store, null)).toEqual({ status: "pending" });
    expect(quoteShipping(delivery, store, { lat: store.lat + 0.01, lng: store.lng })).toMatchObject({
      status: "ok",
      cost: 1000,
    });
    expect(quoteShipping(delivery, store, { lat: store.lat + 0.02, lng: store.lng })).toMatchObject({
      status: "ok",
      cost: 1500,
    });
    expect(quoteShipping(delivery, store, { lat: store.lat + 0.05, lng: store.lng })).toMatchObject({
      status: "out-of-range",
    });
    expect(quoteShipping({ ...delivery, zones: [] }, store, null)).toEqual({ status: "to-agree" });
  });
});
