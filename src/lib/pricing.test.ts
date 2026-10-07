import { describe, expect, it } from "vitest";
import { formatMoney, normalizeText, parseAmount } from "./format";
import { couponDiscount, describeGroupRule, itemTotal, priceFrom, showsPriceFrom } from "./pricing";
import { quoteShipping, shippingFrom } from "./shipping";
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

describe("precio desde", () => {
  it("solo dice 'desde' si las presentaciones tienen precios distintos", () => {
    const variants = (...prices: number[]) => prices.map((price, i) => ({ id: `v${i}`, name: `V${i}`, price }));
    expect(showsPriceFrom({ id: "pepsi", name: "Pepsi", variants: variants(4800, 3500) })).toBe(true);
    expect(showsPriceFrom({ id: "laton", name: "Latón", variants: variants(4000, 4000) })).toBe(false);
    expect(showsPriceFrom({ id: "coca", name: "Coca", price: 2000 })).toBe(false);
  });
});

describe("envíos", () => {
  const delivery: DeliverySettings = {
    pickup: true,
    delivery: true,
    zones: [
      { id: "dentro", name: "Dentro de boulevard", cost: 1000 },
      { id: "fuera", name: "Fuera de boulevard", cost: 1500 },
    ],
  };

  it("el cliente no elige zona: si el precio cambia según la zona, lo confirma el local", () => {
    expect(quoteShipping(delivery)).toEqual({ status: "to-agree" });
    expect(quoteShipping({ ...delivery, zones: [] })).toEqual({ status: "to-agree" });
    // Con un solo precio (una zona o todas iguales) ya se sabe y va en el total.
    expect(quoteShipping({ ...delivery, zones: [delivery.zones[1]] })).toEqual({ status: "ok", cost: 1500 });
    const same = delivery.zones.map((zone) => ({ ...zone, cost: 800 }));
    expect(quoteShipping({ ...delivery, zones: same })).toEqual({ status: "ok", cost: 800 });
  });

  it("resume el envío más barato para la portada", () => {
    expect(shippingFrom(delivery)).toEqual({ cost: 1000, varies: true });
    expect(shippingFrom({ ...delivery, zones: [delivery.zones[0]] })).toEqual({ cost: 1000, varies: false });
    expect(shippingFrom({ ...delivery, zones: [] })).toBeNull();
  });
});
