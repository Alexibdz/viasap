import { formatMoney, formatOrderDate, onlyDigits } from "./format";
import { googleMapsUrl } from "./geo";
import { itemTotal } from "./pricing";
import type { Business, CartItem, Order } from "./types";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
// Solo símbolos del plano básico de Unicode: algunos emojis llegan rotos en los links wa.me.
const RULE = "━━━━━━━━━━━━━━";

/** Número corto para hablar del pedido ("#7193") y código para identificarlo ("5DHE-7CVS-23BF"). */
export function generateOrderRef(): { number: string; code: string } {
  const bytes = new Uint8Array(14);
  crypto.getRandomValues(bytes);
  const number = String(1000 + (((bytes[0] << 8) | bytes[1]) % 9000));
  const chars = Array.from(bytes.slice(2), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
  return { number, code: `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}` };
}

export function whatsappUrl(phone: string, text?: string): string {
  const base = `https://wa.me/${onlyDigits(phone)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** El texto libre del cliente va en una sola línea para no romper el formato. */
function singleLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function groupBy<T>(list: T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of list) {
    const k = key(item);
    groups.set(k, [...(groups.get(k) ?? []), item]);
  }
  return groups;
}

function itemLines(items: CartItem[]): string[] {
  const lines: string[] = [];
  for (const [section, sectionItems] of groupBy(items, (i) => i.sectionLabel)) {
    if (lines.length) lines.push("");
    lines.push(`*${section.toUpperCase()}*`);
    for (const item of sectionItems) {
      const name = item.variantName ? `${item.name} (${item.variantName})` : item.name;
      lines.push(`• ${item.qty}x ${name} → ${formatMoney(itemTotal(item))}`);
      if (item.includes) lines.push(`   Incluye${item.qty > 1 ? " (c/u)" : ""}: ${item.includes}`);
      // Las opciones son por unidad: con 2 hamburguesas, cada una lleva sus extras.
      const each = item.qty > 1 ? " c/u" : "";
      for (const [groupName, options] of groupBy(item.options, (o) => o.groupName)) {
        const chosen = options.map((o) => {
          const qty = o.qty > 1 ? `${o.qty}x ` : "";
          const price = o.price ? ` (+${formatMoney(o.price * o.qty)}${each})` : "";
          return `${qty}${o.name}${price}`;
        });
        lines.push(`   + ${groupName}: ${chosen.join(", ")}`);
      }
      if (item.notes) lines.push(`   ✎ ${singleLine(item.notes)}`);
    }
  }
  return lines;
}

function totalsLines(order: Order, business: Business): string[] {
  const { totals, coupon, fulfillment } = order;
  const lines = [`Subtotal: ${formatMoney(totals.subtotal)}`];
  if (coupon && totals.discount > 0) lines.push(`Descuento (${coupon.code}): -${formatMoney(totals.discount)}`);
  let shippingPending = false;
  if (fulfillment.method === "delivery") {
    shippingPending = fulfillment.cost === null;
    const pending = business.delivery.zones.length ? "según la zona" : "a coordinar";
    const cost = fulfillment.cost === null ? pending : fulfillment.cost === 0 ? "gratis" : formatMoney(fulfillment.cost);
    lines.push(`Envío: ${cost}`);
  }
  lines.push(`*TOTAL: ${formatMoney(totals.total)}${shippingPending ? " + envío" : ""}*`);
  return lines;
}

function fulfillmentLines(order: Order, business: Business): string[] {
  const f = order.fulfillment;
  if (f.method === "pickup") {
    return ["*Entrega:* retiro en el local", `${business.address.street}, ${business.address.city}`];
  }
  let building = { house: "Casa", apartment: "Departamento", other: "Otro tipo de lugar" }[f.buildingType];
  if (f.buildingType === "apartment") {
    const unit = [f.floor && `piso ${f.floor}`, f.apartment && `depto ${f.apartment}`].filter(Boolean);
    if (unit.length) building += `: ${unit.join(", ")}`;
  }
  const lines = [`*Entrega:* envío a domicilio${f.zone ? ` (${f.zone.toLowerCase()})` : ""}`, singleLine(f.address)];
  lines.push(f.references ? `${building} · Ref.: ${singleLine(f.references)}` : building);
  if (f.location) lines.push(`Ubicación: ${googleMapsUrl(f.location)}`);
  return lines;
}

function paymentLines(order: Order, business: Business): string[] {
  const { payment, totals } = order;
  const transfer = business.payments.transfer;

  if (payment.method === "cash") {
    const lines = ["*Pago:* efectivo"];
    if (payment.cashAmount && payment.cashAmount > totals.total) {
      lines.push(
        `Pago con ${formatMoney(payment.cashAmount)} (vuelto: ${formatMoney(payment.cashAmount - totals.total)})`,
      );
    }
    return lines;
  }

  const lines =
    payment.method === "transfer"
      ? ["*Pago:* transferencia"]
      : [
          "*Pago:* efectivo + transferencia",
          `Efectivo: ${formatMoney(payment.cashAmount ?? 0)} · Transferencia: ${formatMoney(totals.total - (payment.cashAmount ?? 0))}`,
        ];
  if (transfer) {
    lines.push(
      `CBU/CVU: ${transfer.cbu}`,
      `Alias: ${transfer.alias}`,
      `Titular: ${transfer.holder}${transfer.bank ? ` · ${transfer.bank}` : ""}`,
      "_Te mando el comprobante por acá._",
    );
  }
  return lines;
}

/** Mensaje que el cliente manda por WhatsApp con todo lo que el local necesita. */
export function buildOrderMessage(order: Order, business: Business): string {
  return [
    "*¡Hola! Quiero hacer este pedido:*",
    "",
    `*Pedido #${order.number}* · \`\`\`${order.code}\`\`\``,
    `${business.name} · ${formatOrderDate(order.createdAt, business.timezone)}`,
    "",
    `*Cliente:* ${singleLine(order.customer.name)}`,
    `*Teléfono:* ${singleLine(order.customer.phone)}`,
    "",
    RULE,
    ...itemLines(order.items),
    RULE,
    ...totalsLines(order, business),
    "",
    ...fulfillmentLines(order, business),
    "",
    ...paymentLines(order, business),
    "",
    "_¿Me confirman el pedido? ¡Gracias!_",
  ].join("\n");
}
