import { describe, expect, it } from "vitest";
import { dobleQueso } from "@/data/stores/doble-queso";
import { buildOrderMessage, generateOrderRef, whatsappUrl } from "./order";
import type { Business, CartItem, Order } from "./types";

const business: Business = {
  ...dobleQueso.business,
  name: "Walo's Burgers",
  payments: {
    cash: true,
    mixed: true,
    transfer: { cbu: "0000003100048961741394", holder: "Titular Demo", alias: "Walosburgers", bank: "Mercado Pago" },
  },
};

const cuartoDoble: CartItem = {
  key: "linea-1",
  productId: "cuarto-de-libra",
  name: "Cuarto de libra",
  sectionLabel: "Hamburguesas",
  variantId: "doble",
  variantName: "Doble",
  unitPrice: 10500,
  options: [
    { groupId: "papas", groupName: "Mejorá tus papas", optionId: "cheddar", name: "Papas con cheddar", price: 4000, qty: 1 },
  ],
  qty: 1,
};

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    number: "7193",
    code: "5DHE-7CVS-23BF",
    createdAt: new Date("2026-10-04T02:17:00-03:00"),
    customer: { name: "test", phone: "33323213" },
    items: [cuartoDoble],
    fulfillment: {
      method: "delivery",
      address: "Catamarca 502, Victoria, Entre Ríos, Argentina",
      location: { lat: -32.62, lng: -60.15 },
      buildingType: "house",
      cost: 1000,
    },
    payment: { method: "transfer" },
    totals: { subtotal: 14500, discount: 0, shipping: 1000, total: 15500 },
    ...overrides,
  };
}

describe("buildOrderMessage", () => {
  it("arma el mensaje completo para delivery con transferencia", () => {
    expect(buildOrderMessage(makeOrder(), business)).toBe(
      [
        "*¡Hola! Quiero hacer este pedido:*",
        "",
        "*Pedido #7193* · ```5DHE-7CVS-23BF```",
        "Walo's Burgers · 04/10/26 02:17 hs",
        "",
        "*Cliente:* test",
        "*Teléfono:* 33323213",
        "",
        "━━━━━━━━━━━━━━",
        "*HAMBURGUESAS*",
        "• 1x Cuarto de libra (Doble) → $14.500",
        "   + Mejorá tus papas: Papas con cheddar (+$4.000)",
        "━━━━━━━━━━━━━━",
        "Subtotal: $14.500",
        "Envío: $1.000",
        "*TOTAL: $15.500*",
        "",
        "*Entrega:* envío a domicilio",
        "Catamarca 502, Victoria, Entre Ríos, Argentina",
        "Casa",
        "Ubicación: https://www.google.com/maps/search/?api=1&query=-32.620000,-60.150000",
        "",
        "*Pago:* transferencia",
        "CBU/CVU: 0000003100048961741394",
        "Alias: Walosburgers",
        "Titular: Titular Demo · Mercado Pago",
        "_Te mando el comprobante por acá._",
        "",
        "_¿Me confirman el pedido? ¡Gracias!_",
      ].join("\n"),
    );
  });

  it("aclara que las opciones son por unidad y deja la observación en una línea", () => {
    const message = buildOrderMessage(
      makeOrder({
        items: [{ ...cuartoDoble, qty: 2, notes: "sin\ncebolla" }],
        fulfillment: { method: "pickup" },
        payment: { method: "cash", cashAmount: 40000 },
        totals: { subtotal: 29000, discount: 0, shipping: 0, total: 29000 },
      }),
      business,
    );
    expect(message).toContain("• 2x Cuarto de libra (Doble) → $29.000");
    expect(message).toContain("   + Mejorá tus papas: Papas con cheddar (+$4.000 c/u)");
    expect(message).toContain("   ✎ sin cebolla");
    expect(message).toContain("*Pago:* efectivo\nPago con $40.000 (vuelto: $11.000)");
    expect(message).toContain("*Entrega:* retiro en el local\nSarmiento 450, Victoria");
    expect(message).not.toContain("Envío:");
    expect(message).not.toContain("CBU/CVU");
  });

  it("agrupa por sección, junta las opciones de un grupo y omite precios en cero", () => {
    const coca: CartItem = {
      key: "linea-2",
      productId: "coca-cola",
      name: "Coca-Cola 500 ml",
      sectionLabel: "Bebidas",
      unitPrice: 2000,
      options: [{ groupId: "hielo", groupName: "Hielo", optionId: "si", name: "Con hielo", price: 0, qty: 1 }],
      qty: 3,
    };
    const extras: CartItem = {
      ...cuartoDoble,
      key: "linea-3",
      options: [
        { groupId: "extras", groupName: "Extras", optionId: "cheddar", name: "Extra cheddar", price: 800, qty: 2 },
        { groupId: "extras", groupName: "Extras", optionId: "pepinillos", name: "Pepinillos", price: 500, qty: 1 },
      ],
    };
    const message = buildOrderMessage(makeOrder({ items: [extras, coca] }), business);
    expect(message).toContain("   + Extras: 2x Extra cheddar (+$1.600), Pepinillos (+$500)");
    expect(message).toContain("\n\n*BEBIDAS*\n• 3x Coca-Cola 500 ml → $6.000\n   + Hielo: Con hielo\n━━━━━━━━━━━━━━");
  });

  it("incluye cupón, pago combinado, departamento y envío a coordinar", () => {
    const message = buildOrderMessage(
      makeOrder({
        fulfillment: {
          method: "delivery",
          address: "Italia 120",
          location: null,
          buildingType: "apartment",
          floor: "3",
          apartment: "B",
          references: "portón verde",
          cost: null,
        },
        payment: { method: "mixed", cashAmount: 5000 },
        coupon: { code: "BIENVENIDA", discount: 1450 },
        totals: { subtotal: 14500, discount: 1450, shipping: 0, total: 13050 },
      }),
      business,
    );
    expect(message).toContain("*Pago:* efectivo + transferencia\nEfectivo: $5.000 · Transferencia: $8.050");
    expect(message).toContain("Departamento: piso 3, depto B · Ref.: portón verde");
    expect(message).not.toContain("Ubicación:");
    expect(message).toContain("Descuento (BIENVENIDA): -$1.450\nEnvío: a coordinar\n*TOTAL: $13.050 + envío*");
  });
});

describe("generateOrderRef", () => {
  it("genera número de 4 dígitos y código sin caracteres ambiguos", () => {
    for (let i = 0; i < 50; i++) {
      const { number, code } = generateOrderRef();
      expect(number).toMatch(/^[1-9]\d{3}$/);
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    }
  });
});

describe("whatsappUrl", () => {
  it("deja solo dígitos en el número y codifica el texto", () => {
    expect(whatsappUrl("+54 9 343 600-0000")).toBe("https://wa.me/5493436000000");
    expect(whatsappUrl("5493436000000", "Hola *che*\n¿todo bien?")).toBe(
      "https://wa.me/5493436000000?text=Hola%20*che*%0A%C2%BFtodo%20bien%3F",
    );
  });
});
