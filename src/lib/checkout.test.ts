import { describe, expect, it } from "vitest";
import { rotiseriaAlexis } from "@/data/stores/rotiseria-alexis";
import { evaluateCheckout, maxReachableStep, stepIsValid, suggestCashAmounts, type CheckoutDraft } from "./checkout";

// Rotisería Alexis: envío dentro de boulevard ($1.000), fuera ($2.000) y zona rural ($3.000), pedido mínimo de $8.000
// y acepta pedidos con el local cerrado.
const business = rotiseriaAlexis.business;
const pin = { lat: business.address.lat + 0.005, lng: business.address.lng };

const base: CheckoutDraft = {
  name: "Ana Pérez",
  phone: "343 412 3456",
  method: "pickup",
  address: null,
  buildingType: "house",
  floor: "",
  apartment: "",
  references: "",
  payment: "cash",
  cashInput: "",
  coupon: null,
};

const delivery = (address: CheckoutDraft["address"]): Partial<CheckoutDraft> => ({ method: "delivery", address });

describe("evaluateCheckout", () => {
  it("con retiro en el local y efectivo no hay nada que corregir", () => {
    const summary = evaluateCheckout(base, 10000, business, true);
    expect(summary.errors).toEqual({});
    expect(summary.total).toBe(10000);
    expect(maxReachableStep(summary.errors)).toBe(3);
  });

  it("pide contacto, forma de entrega y forma de pago", () => {
    const summary = evaluateCheckout({ ...base, name: " ", phone: "123", method: null, payment: null }, 10000, business, true);
    expect(Object.keys(summary.errors).sort()).toEqual(["method", "name", "payment", "phone"]);
    expect(stepIsValid(2, summary.errors)).toBe(false);
    expect(maxReachableStep(summary.errors)).toBe(2);
  });

  it("valida la ubicación; el envío según la zona lo confirma el local", () => {
    const withoutPin = evaluateCheckout(
      { ...base, ...delivery({ label: "Italia 120", location: null, approximate: true }) },
      10000,
      business,
      true,
    );
    expect(withoutPin.errors.address).toBe("Marcá tu ubicación en el mapa.");

    // Zonas con precios distintos: no se elige la zona y el total va sin envío.
    const byZone = evaluateCheckout(
      { ...base, ...delivery({ label: "Italia 120", location: pin, approximate: false }) },
      10000,
      business,
      true,
    );
    expect(byZone.errors).toEqual({});
    expect(byZone.quote).toEqual({ status: "to-agree" });
    expect(byZone.total).toBe(10000);

    // Un solo precio: se suma al total.
    const fixed = evaluateCheckout(
      { ...base, ...delivery({ label: "Italia 120", location: pin, approximate: false }) },
      10000,
      { ...business, delivery: { ...business.delivery, zones: [{ id: "victoria", name: "Victoria", cost: 1500 }] } },
      true,
    );
    expect(fixed.shipping).toBe(1500);
    expect(fixed.total).toBe(11500);
  });

  it("exige pedido mínimo y piso o depto para envíos", () => {
    const summary = evaluateCheckout(
      { ...base, ...delivery({ label: "Italia 120", location: pin, approximate: false }), buildingType: "apartment" },
      5000,
      business,
      true,
    );
    expect(summary.errors.minOrder).toMatch(/\$8\.000/);
    expect(summary.errors.unit).toBeDefined();
  });

  it("valida los montos en efectivo y el pago combinado", () => {
    expect(evaluateCheckout({ ...base, cashInput: "5000" }, 10000, business, true).errors.cash).toMatch(/al menos/);
    expect(evaluateCheckout({ ...base, cashInput: "20000" }, 10000, business, true).errors.cash).toBeUndefined();
    expect(evaluateCheckout({ ...base, payment: "mixed" }, 10000, business, true).errors.cash).toBeDefined();
    expect(evaluateCheckout({ ...base, payment: "mixed", cashInput: "4000" }, 10000, business, true).errors.cash).toBeUndefined();
  });

  it("aplica el cupón sobre el subtotal", () => {
    const summary = evaluateCheckout(
      { ...base, coupon: { code: "BIENVENIDA", type: "percent", value: 10 } },
      14500,
      business,
      true,
    );
    expect(summary.discount).toBe(1450);
    expect(summary.total).toBe(13050);
  });

  it("bloquea el pedido con el local cerrado solo si no acepta pedidos fuera de horario", () => {
    const strict = { ...business, acceptOrdersWhenClosed: false };
    expect(evaluateCheckout(base, 10000, strict, false).errors.closed).toBeDefined();
    expect(evaluateCheckout(base, 10000, strict, null).errors.closed).toBeUndefined();
    expect(evaluateCheckout(base, 10000, business, false).errors.closed).toBeUndefined();
  });
});

describe("suggestCashAmounts", () => {
  it("sugiere montos redondos mayores al total", () => {
    expect(suggestCashAmounts(15500)).toEqual([16000, 20000]);
    expect(suggestCashAmounts(20000)).toEqual([21000, 25000, 30000]);
  });
});
