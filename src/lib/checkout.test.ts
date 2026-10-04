import { describe, expect, it } from "vitest";
import { dobleQueso } from "@/data/stores/doble-queso";
import { evaluateCheckout, maxReachableStep, stepIsValid, suggestCashAmounts, type CheckoutDraft } from "./checkout";

// Doble Queso: zonas de 1,5 / 3 / 5 km, pedido mínimo de $8.000 y acepta pedidos con el local cerrado.
const business = dobleQueso.business;
const near = { lat: business.address.lat + 0.005, lng: business.address.lng }; // ~0,6 km
const far = { lat: business.address.lat + 0.2, lng: business.address.lng }; // ~22 km

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

  it("cotiza el envío según la zona y valida la ubicación", () => {
    const withoutPin = evaluateCheckout(
      { ...base, ...delivery({ label: "Italia 120", location: null, approximate: true }) },
      10000,
      business,
      true,
    );
    expect(withoutPin.errors.address).toBe("Marcá tu ubicación en el mapa.");

    const close = evaluateCheckout(
      { ...base, ...delivery({ label: "Italia 120", location: near, approximate: false }) },
      10000,
      business,
      true,
    );
    expect(close.errors).toEqual({});
    expect(close.shipping).toBe(1000);
    expect(close.total).toBe(11000);

    const tooFar = evaluateCheckout(
      { ...base, ...delivery({ label: "Ruta 11", location: far, approximate: false }) },
      10000,
      business,
      true,
    );
    expect(tooFar.errors.address).toMatch(/fuera de la zona/);
  });

  it("exige pedido mínimo y piso o depto para envíos", () => {
    const summary = evaluateCheckout(
      { ...base, ...delivery({ label: "Italia 120", location: near, approximate: false }), buildingType: "apartment" },
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
