import { describe, expect, it } from "vitest";
import { dobleQueso } from "@/data/stores/doble-queso";
import { laEsquina } from "@/data/stores/la-esquina";
import { priceOrder, type OrderInput } from "./order-pricing";
import type { StoreSeed } from "./types";

// Miércoles 7/10/2026 a las 21: los dos locales están abiertos.
const OPEN = new Date("2026-10-07T21:00:00-03:00");
// Lunes 5/10/2026 al mediodía: La Esquina cierra los lunes.
const MONDAY = new Date("2026-10-05T12:00:00-03:00");

const store = dobleQueso;
const near = { lat: store.business.address.lat + 0.005, lng: store.business.address.lng };

function input(overrides: Partial<OrderInput> = {}): OrderInput {
  return {
    number: "4444",
    code: "JXRJ-WZBF-RXHH",
    customer: { name: "Ana Pérez", phone: "343 412 3456" },
    lines: [
      {
        productId: "cuarto-de-libra",
        variantId: "doble",
        options: [{ groupId: "papas", optionId: "cheddar", qty: 1 }],
        qty: 1,
      },
    ],
    fulfillment: { method: "pickup" },
    payment: { method: "cash" },
    clientTotal: 14500,
    ...overrides,
  };
}

function expectError(result: ReturnType<typeof priceOrder>, message: RegExp) {
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error).toMatch(message);
}

describe("priceOrder", () => {
  it("recalcula precios con los datos del local", () => {
    const result = priceOrder(store, input(), OPEN);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { order } = result;
    expect(order.status).toBe("pending");
    expect(order.items[0]).toMatchObject({
      name: "Cuarto de libra",
      variantName: "Doble",
      unitPrice: 10500,
      sectionLabel: "Hamburguesas",
      options: [{ name: "Papas con cheddar", price: 4000, qty: 1 }],
    });
    expect(order.totals).toEqual({ subtotal: 14500, discount: 0, shipping: 0, total: 14500 });
    expect(order.history).toEqual([{ status: "pending", at: OPEN.toISOString() }]);
  });

  it("rechaza productos inexistentes, agotados o mal armados", () => {
    expectError(priceOrder(store, input({ lines: [{ productId: "no-existe", options: [], qty: 1 }] }), OPEN), /ya no está/);
    expectError(priceOrder(store, input({ lines: [{ productId: "agua", options: [], qty: 1 }] }), OPEN), /agotado/);
    expectError(
      priceOrder(store, input({ lines: [{ productId: "cuarto-de-libra", options: [], qty: 1 }] }), OPEN),
      /presentación/,
    );
    expectError(
      priceOrder(store, input({ lines: [{ productId: "coca-cola", options: [], qty: 0 }] }), OPEN),
      /cantidad/,
    );
  });

  it("respeta mínimos y máximos de cada grupo de opciones", () => {
    const nuggets = (options: { groupId: string; optionId: string; qty: number }[]) =>
      input({ lines: [{ productId: "nuggets", variantId: "x6", options, qty: 1 }] });
    expectError(priceOrder(store, nuggets([]), OPEN), /Salsas/);
    expectError(
      priceOrder(
        store,
        nuggets([
          { groupId: "salsas", optionId: "barbacoa", qty: 1 },
          { groupId: "salsas", optionId: "ketchup", qty: 1 },
          { groupId: "salsas", optionId: "alioli", qty: 1 },
        ]),
        OPEN,
      ),
      /Salsas/,
    );
    expect(priceOrder(store, nuggets([{ groupId: "salsas", optionId: "cheddar", qty: 1 }]), OPEN).ok).toBe(true);
    // Extra cheddar admite hasta 3 por hamburguesa.
    const tooMuchCheddar = input({
      lines: [{ productId: "classic", variantId: "simple", options: [{ groupId: "extras", optionId: "cheddar", qty: 4 }], qty: 1 }],
    });
    expectError(priceOrder(store, tooMuchCheddar, OPEN), /opciones/);
  });

  it("cotiza el envío y valida dirección, zona y mínimo", () => {
    const delivery = (location: { lat: number; lng: number } | null) =>
      input({
        fulfillment: { method: "delivery", address: "Italia 120", location, buildingType: "house" },
        payment: { method: "transfer" },
      });
    const ok = priceOrder(store, delivery(near), OPEN);
    expect(ok.ok && ok.order.totals).toEqual({ subtotal: 14500, discount: 0, shipping: 1000, total: 15500 });
    expectError(priceOrder(store, delivery(null), OPEN), /ubicación/);
    expectError(priceOrder(store, delivery({ lat: near.lat + 0.3, lng: near.lng }), OPEN), /fuera de la zona/);
    const small = input({
      lines: [{ productId: "coca-cola", options: [], qty: 1 }],
      fulfillment: { method: "delivery", address: "Italia 120", location: near, buildingType: "house" },
    });
    expectError(priceOrder(store, small, OPEN), /mínimo/);
  });

  it("aplica solo cupones válidos sin frenar el pedido", () => {
    const withCoupon = (couponCode: string) => priceOrder(store, input({ couponCode }), OPEN);
    const valid = withCoupon("bienvenida");
    expect(valid.ok && valid.order.coupon).toEqual({ code: "BIENVENIDA", discount: 1450 });
    expect(valid.ok && valid.order.totals.total).toBe(13050);
    const unknown = withCoupon("NOEXISTE");
    expect(unknown.ok && unknown.order.coupon).toBeUndefined();
    const belowMinimum = withCoupon("FINDE2000"); // pide $15.000 y el pedido es de $14.500
    expect(belowMinimum.ok && belowMinimum.order.totals.discount).toBe(0);
  });

  it("valida la forma de pago según lo que acepta el local", () => {
    const mixed = (cashAmount: number) => priceOrder(store, input({ payment: { method: "mixed", cashAmount } }), OPEN);
    expect(mixed(5000).ok).toBe(true);
    expectError(mixed(14500), /efectivo/);
    // La Esquina no acepta pago combinado.
    const esquina = priceOrder(
      laEsquina,
      input({ lines: [{ productId: "ravioles", options: [{ groupId: "salsa", optionId: "fileto", qty: 1 }], qty: 1 }], payment: { method: "mixed", cashAmount: 1000 } }),
      OPEN,
    );
    expectError(esquina, /forma de pago/);
  });

  it("no toma pedidos con el local pausado o cerrado si así está configurado", () => {
    const paused: StoreSeed = { ...store, business: { ...store.business, ordersPaused: true } };
    expectError(priceOrder(paused, input(), OPEN), /pausó/);
    const pasta = input({ lines: [{ productId: "noquis", options: [{ groupId: "salsa", optionId: "fileto", qty: 1 }], qty: 1 }] });
    expectError(priceOrder(laEsquina, pasta, MONDAY), /cerrado/);
    expect(priceOrder(laEsquina, pasta, OPEN).ok).toBe(true);
    // Doble Queso acepta pedidos fuera de horario.
    expect(priceOrder(store, input(), MONDAY).ok).toBe(true);
  });

  it("no se rompe con datos basura", () => {
    for (const garbage of [null, "hola", 42, {}, { number: "1234", code: "JXRJ-WZBF-RXHH", lines: "x" }]) {
      expect(priceOrder(store, garbage, OPEN).ok).toBe(false);
    }
    expectError(priceOrder(store, input({ code: "../../etc" }), OPEN), /inválido/);
    expectError(priceOrder(store, input({ customer: { name: "A", phone: "12" } }), OPEN), /contacto/);
  });
});
