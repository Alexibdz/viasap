import { describe, expect, it } from "vitest";
import { costaneraBurgers } from "@/data/stores/costanera-burgers";
import { rotiseriaAlexis } from "@/data/stores/rotiseria-alexis";
import { findProduct } from "./menu";
import { priceOrder, type OrderInput } from "./order-pricing";
import type { StoreSeed } from "./types";

// Miércoles 7/10/2026 a las 21: el local está abierto.
const OPEN = new Date("2026-10-07T21:00:00-03:00");
// Lunes 5/10/2026 al mediodía: los lunes está cerrado.
const MONDAY = new Date("2026-10-05T12:00:00-03:00");

// La hamburguesería para casi todo; la rotisería para empanadas y bebidas.
const store = costaneraBurgers;
const alexis = rotiseriaAlexis;
const near = { lat: store.business.address.lat + 0.005, lng: store.business.address.lng };
// Variante del local que no toma pedidos fuera de horario ni acepta pago combinado.
const strict: StoreSeed = {
  ...store,
  business: {
    ...store.business,
    acceptOrdersWhenClosed: false,
    payments: { ...store.business.payments, mixed: false },
  },
};

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
    const soldOut = structuredClone(store);
    findProduct(soldOut.menu, "ensalada-mixta")!.product.soldOut = true;
    expectError(priceOrder(soldOut, input({ lines: [{ productId: "ensalada-mixta", options: [], qty: 1 }] }), OPEN), /agotado/);
    expectError(
      priceOrder(store, input({ lines: [{ productId: "cuarto-de-libra", options: [], qty: 1 }] }), OPEN),
      /presentación/,
    );
    expectError(
      priceOrder(store, input({ lines: [{ productId: "ensalada-mixta", options: [], qty: 0 }] }), OPEN),
      /cantidad/,
    );
  });

  it("respeta mínimos y máximos de cada grupo de opciones", () => {
    // Asado para 2: hay que elegir entre 1 y 2 acompañamientos.
    const asado = (options: { groupId: string; optionId: string; qty: number }[]) =>
      input({ lines: [{ productId: "asado-2", options, qty: 1 }] });
    expectError(priceOrder(alexis, asado([]), OPEN), /Acompañamientos/);
    expectError(
      priceOrder(
        alexis,
        asado([
          { groupId: "acompanamiento", optionId: "papas-fritas", qty: 1 },
          { groupId: "acompanamiento", optionId: "ensalada", qty: 1 },
          { groupId: "acompanamiento", optionId: "pure", qty: 1 },
        ]),
        OPEN,
      ),
      /Acompañamientos/,
    );
    expect(priceOrder(alexis, asado([{ groupId: "acompanamiento", optionId: "ensalada-rusa", qty: 1 }]), OPEN).ok).toBe(true);
    // Extra cheddar admite hasta 3 por hamburguesa.
    const tooMuchCheddar = input({
      lines: [{ productId: "classic", variantId: "simple", options: [{ groupId: "extras", optionId: "cheddar", qty: 4 }], qty: 1 }],
    });
    expectError(priceOrder(store, tooMuchCheddar, OPEN), /opciones/);
  });

  it("cotiza el envío según la zona y valida dirección, zona y mínimo", () => {
    const delivery = (zoneId?: string) =>
      input({
        fulfillment: { method: "delivery", address: "Italia 120", location: near, zoneId, buildingType: "house" },
        payment: { method: "transfer" },
      });
    const inside = priceOrder(store, delivery("dentro-de-boulevard"), OPEN);
    expect(inside.ok && inside.order.totals).toEqual({ subtotal: 14500, discount: 0, shipping: 1000, total: 15500 });
    expect(inside.ok && inside.order.fulfillment).toMatchObject({ zone: "Dentro de boulevard", cost: 1000 });
    const outside = priceOrder(store, delivery("fuera-de-boulevard"), OPEN);
    expect(outside.ok && outside.order.totals.shipping).toBe(2000);
    expectError(priceOrder(store, delivery(), OPEN), /zona/);
    expectError(priceOrder(store, delivery("en-la-luna"), OPEN), /zona/);
    const small = input({
      lines: [{ productId: "papas-fritas", variantId: "chica", options: [], qty: 1 }],
      fulfillment: { method: "delivery", address: "Italia 120", location: near, zoneId: "dentro-de-boulevard", buildingType: "house" },
    });
    expectError(priceOrder(store, small, OPEN), /mínimo/);
  });

  it("guarda lo que incluye cada oferta, con los nombres del menú", () => {
    const result = priceOrder(store, input({ lines: [{ productId: "combo-pareja", options: [], qty: 1 }] }), OPEN);
    expect(result.ok && result.order.items[0]).toMatchObject({
      name: "Combo pareja",
      unitPrice: 22900,
      sectionLabel: "Ofertas",
      includes: "2x Classic (Doble), 1x Papas fritas (Grande)",
    });
  });

  it("no guarda aclaraciones en las bebidas", () => {
    const line = (productId: string, variantId?: string) => ({ productId, variantId, options: [], qty: 1, notes: "bien fría" });
    const result = priceOrder(alexis, input({ lines: [line("gaseosa-1l", "coca"), line("choripan")] }), OPEN);
    expect(result.ok && result.order.items.map((i) => i.notes)).toEqual([undefined, "bien fría"]);
  });

  it("valida los gustos de las empanadas (se reparten entre los que quiera el cliente)", () => {
    const docena = (options: { groupId: string; optionId: string; qty: number }[]) =>
      input({ lines: [{ productId: "docena", options, qty: 1 }] });
    const ok = priceOrder(
      alexis,
      docena([
        { groupId: "gustos", optionId: "carne-salada", qty: 6 },
        { groupId: "gustos", optionId: "jamon-y-queso", qty: 6 },
      ]),
      OPEN,
    );
    expect(ok.ok && ok.order.totals.subtotal).toBe(12000);
    expectError(priceOrder(alexis, docena([{ groupId: "gustos", optionId: "arabes", qty: 6 }]), OPEN), /gustos/);
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
    expectError(priceOrder(strict, input({ payment: { method: "mixed", cashAmount: 5000 } }), OPEN), /forma de pago/);
  });

  it("no toma pedidos con el local pausado o cerrado si así está configurado", () => {
    const paused: StoreSeed = { ...store, business: { ...store.business, ordersPaused: true } };
    expectError(priceOrder(paused, input(), OPEN), /pausó/);
    expectError(priceOrder(strict, input(), MONDAY), /cerrado/);
    expect(priceOrder(strict, input(), OPEN).ok).toBe(true);
    // Costanera Burgers acepta pedidos fuera de horario.
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
