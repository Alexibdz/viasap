import { describe, expect, it } from "vitest";
import { rotiseriaAlexis } from "@/data/stores/rotiseria-alexis";
import { canTransition, customerNotice, nextActionLabel, nextStatus, statusLabel } from "./order-status";
import type { StoredOrder } from "./types";

const order: StoredOrder = {
  number: "4444",
  code: "JXRJ-WZBF-RXHH",
  createdAt: "2026-10-04T05:17:00.000Z",
  status: "pending",
  history: [{ status: "pending", at: "2026-10-04T05:17:00.000Z" }],
  customer: { name: "Ana Pérez", phone: "343 412 3456" },
  items: [],
  fulfillment: { method: "pickup" },
  payment: { method: "transfer" },
  totals: { subtotal: 12500, discount: 0, shipping: 0, total: 12500 },
  clientTotal: 12500,
};

describe("estados del pedido", () => {
  it("avanza en orden y se puede cancelar hasta antes de entregarlo", () => {
    expect(nextStatus("pending")).toBe("preparing");
    expect(nextStatus("ready")).toBe("delivered");
    expect(nextStatus("delivered")).toBeNull();
    expect(canTransition("pending", "ready")).toBe(false);
    expect(canTransition("preparing", "ready")).toBe(true);
    expect(canTransition("ready", "cancelled")).toBe(true);
    expect(canTransition("delivered", "cancelled")).toBe(false);
    expect(canTransition("cancelled", "preparing")).toBe(false);
  });

  it("nombra los estados según la forma de entrega", () => {
    expect(statusLabel("ready", "pickup")).toBe("Listo para retirar");
    expect(statusLabel("ready", "delivery")).toBe("En camino");
    expect(nextActionLabel("preparing", "delivery")).toBe("Salió el envío");
    expect(nextActionLabel("delivered", "pickup")).toBeNull();
  });

  it("arma los avisos para el cliente", () => {
    const business = rotiseriaAlexis.business;
    expect(customerNotice(order, business, "preparing")).toBe(
      "¡Hola Ana! Confirmamos tu pedido #4444 ($12.500) y ya lo estamos preparando. Cuando puedas, mandanos el comprobante de la transferencia.",
    );
    expect(customerNotice(order, business, "ready")).toBe(
      "¡Hola Ana! Tu pedido #4444 está listo. Podés retirarlo en Sarmiento 450.",
    );
    expect(customerNotice({ ...order, cancelReason: "Nos quedamos sin stock" }, business, "cancelled")).toContain(
      "cancelar tu pedido #4444 (nos quedamos sin stock)",
    );
  });
});
