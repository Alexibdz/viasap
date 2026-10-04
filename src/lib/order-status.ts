import { formatMoney } from "./format";
import type { Business, DeliveryMethod, OrderStatus, StoredOrder } from "./types";

// Ciclo de vida de un pedido: nuevo → en preparación → listo / en camino → entregado.
// Se puede cancelar en cualquier momento antes de entregarlo.

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "preparing",
  preparing: "ready",
  ready: "delivered",
};

export const ACTIVE_STATUSES: OrderStatus[] = ["pending", "preparing", "ready"];

export function nextStatus(status: OrderStatus): OrderStatus | null {
  return NEXT[status] ?? null;
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (to === "cancelled") return from !== "delivered" && from !== "cancelled";
  return NEXT[from] === to;
}

export function statusLabel(status: OrderStatus, method: DeliveryMethod): string {
  switch (status) {
    case "pending":
      return "Nuevo";
    case "preparing":
      return "En preparación";
    case "ready":
      return method === "delivery" ? "En camino" : "Listo para retirar";
    case "delivered":
      return "Entregado";
    case "cancelled":
      return "Cancelado";
  }
}

/** Texto del botón que lleva al próximo estado. */
export function nextActionLabel(status: OrderStatus, method: DeliveryMethod): string | null {
  switch (status) {
    case "pending":
      return "Confirmar pedido";
    case "preparing":
      return method === "delivery" ? "Salió el envío" : "Está listo";
    case "ready":
      return "Marcar entregado";
    default:
      return null;
  }
}

/** Lo que ve el cliente después de enviar su pedido. */
export function customerStatus(status: OrderStatus, method: DeliveryMethod): { title: string; detail: string } {
  switch (status) {
    case "pending":
      return { title: "Esperando confirmación", detail: "El local todavía no confirmó tu pedido." };
    case "preparing":
      return { title: "¡Confirmado! Lo están preparando", detail: "Te avisamos cuando esté listo." };
    case "ready":
      return method === "delivery"
        ? { title: "Tu pedido va en camino", detail: "Ya salió del local." }
        : { title: "Listo para retirar", detail: "Podés pasar a buscarlo." };
    case "delivered":
      return { title: "¡Entregado!", detail: "Que lo disfrutes." };
    case "cancelled":
      return { title: "Pedido cancelado", detail: "Este pedido no se va a preparar." };
  }
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

/** Mensaje sugerido para avisarle al cliente por WhatsApp cuando cambia el estado. */
export function customerNotice(order: StoredOrder, business: Business, status: OrderStatus): string {
  const hello = `¡Hola ${firstName(order.customer.name)}!`.replace(" !", "!");
  const number = `#${order.number}`;
  const delivery = order.fulfillment.method === "delivery";
  switch (status) {
    case "pending":
      return `${hello} Recibimos tu pedido ${number} en ${business.name}. En un ratito te lo confirmamos.`;
    case "preparing": {
      const transfer =
        order.payment.method !== "cash" ? " Cuando puedas, mandanos el comprobante de la transferencia." : "";
      return `${hello} Confirmamos tu pedido ${number} (${formatMoney(order.totals.total)}) y ya lo estamos preparando.${transfer}`;
    }
    case "ready":
      return delivery
        ? `${hello} Tu pedido ${number} ya salió para tu casa. ¡Llega en un rato!`
        : `${hello} Tu pedido ${number} está listo. Podés retirarlo en ${business.address.street}.`;
    case "delivered":
      return `¡Gracias por tu compra, ${firstName(order.customer.name)}! Esperamos que lo disfrutes.`;
    case "cancelled": {
      const reason = order.cancelReason ? ` (${order.cancelReason.toLowerCase()})` : "";
      return `${hello} Lamentablemente tuvimos que cancelar tu pedido ${number}${reason}. Disculpá las molestias.`;
    }
  }
}
