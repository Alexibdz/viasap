import { onlyDigits } from "./format";
import { getOpenStatus } from "./hours";
import { findProduct } from "./menu";
import { offerIncludesText } from "./offers";
import { couponDiscount, hasNamedVariants, itemTotal, productVariants } from "./pricing";
import { quoteShipping } from "./shipping";
import type {
  BuildingType,
  CartItem,
  CartOption,
  Fulfillment,
  GeoPoint,
  PaymentMethod,
  StoredOrder,
  StoreSeed,
} from "./types";
import { cleanText, toAmount, toInt } from "./validation";

// El navegador manda qué eligió el cliente; los precios, el envío y el descuento
// se recalculan acá con los datos del local. Así el pedido guardado no depende de
// lo que diga el carrito.

export interface OrderLineInput {
  productId: string;
  variantId?: string;
  options: { groupId: string; optionId: string; qty: number }[];
  qty: number;
  notes?: string;
}

export interface OrderInput {
  number: string;
  code: string;
  customer: { name: string; phone: string };
  lines: OrderLineInput[];
  fulfillment:
    | { method: "pickup" }
    | {
        method: "delivery";
        address: string;
        location: GeoPoint | null;
        /** Zona de envío que eligió el cliente. */
        buildingType: BuildingType;
        floor?: string;
        apartment?: string;
        references?: string;
      };
  payment: { method: PaymentMethod; cashAmount?: number };
  couponCode?: string;
  /** Total que vio el cliente, para detectar diferencias. */
  clientTotal: number;
}

export type PricedOrder = { ok: true; order: StoredOrder } | { ok: false; error: string };

const ORDER_NUMBER = /^\d{4}$/;
const ORDER_CODE = /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
const BUILDINGS: BuildingType[] = ["house", "apartment", "other"];

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** Lo que manda el navegador por cada línea del carrito. */
export function orderLinesFromCart(items: CartItem[]): OrderLineInput[] {
  return items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    options: item.options.map((o) => ({ groupId: o.groupId, optionId: o.optionId, qty: o.qty })),
    qty: item.qty,
    notes: item.notes,
  }));
}

function parseLocation(value: unknown): GeoPoint | null {
  if (!isRecord(value)) return null;
  const { lat, lng } = value;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function priceLine(store: StoreSeed, line: unknown, key: string): CartItem | string {
  if (!isRecord(line) || typeof line.productId !== "string") return "Hay un producto inválido en el pedido.";
  const context = findProduct(store.menu, line.productId);
  if (!context) return "Uno de los productos ya no está en el menú.";
  const { product } = context;
  if (product.soldOut) return `${product.name} está agotado.`;

  const qty = toInt(line.qty, 1, 50);
  if (qty === null) return `La cantidad de ${product.name} no es válida.`;

  const named = hasNamedVariants(product);
  const variants = productVariants(product);
  const variant = named ? variants.find((v) => v.id === line.variantId) : variants[0];
  if (!variant) return `Elegí una presentación de ${product.name}.`;

  const options: CartOption[] = [];
  for (const raw of Array.isArray(line.options) ? line.options : []) {
    const group = isRecord(raw) ? product.optionGroups?.find((g) => g.id === raw.groupId) : undefined;
    const option = isRecord(raw) ? group?.options.find((o) => o.id === raw.optionId) : undefined;
    const optionQty = isRecord(raw) && option ? toInt(raw.qty, 1, option.maxQty ?? 1) : null;
    if (!group || !option || optionQty === null || options.some((o) => o.groupId === group.id && o.optionId === option.id)) {
      return `Revisá las opciones de ${product.name}.`;
    }
    options.push({ groupId: group.id, groupName: group.name, optionId: option.id, name: option.name, price: option.price, qty: optionQty });
  }
  for (const group of product.optionGroups ?? []) {
    const count = options.filter((o) => o.groupId === group.id).reduce((sum, o) => sum + o.qty, 0);
    if (count < group.min || (group.max !== undefined && count > group.max)) {
      return `Revisá "${group.name}" en ${product.name}.`;
    }
  }

  // En las categorías sin aclaraciones (bebidas) no se guarda lo que mande el navegador.
  const notes = context.allowsNotes ? cleanText(line.notes, 150) : "";
  return {
    key,
    productId: product.id,
    name: product.name,
    imageUrl: product.imageUrl,
    sectionLabel: context.sectionLabel,
    variantId: named ? variant.id : undefined,
    variantName: named ? variant.name : undefined,
    unitPrice: variant.price,
    options,
    includes: context.offer ? offerIncludesText(context.offer.lines) : undefined,
    notes: notes || undefined,
    qty,
  };
}

export function priceOrder(store: StoreSeed, input: unknown, now: Date): PricedOrder {
  const fail = (error: string): PricedOrder => ({ ok: false, error });
  const { business } = store;
  if (!isRecord(input)) return fail("Pedido inválido.");
  const { number, code } = input;
  if (typeof number !== "string" || !ORDER_NUMBER.test(number) || typeof code !== "string" || !ORDER_CODE.test(code)) {
    return fail("Pedido inválido.");
  }

  if (business.ordersPaused) return fail("El local pausó los pedidos por un rato.");
  if (!business.acceptOrdersWhenClosed && !getOpenStatus(business.schedule, business.timezone, now).open) {
    return fail("El local está cerrado.");
  }

  const customer = isRecord(input.customer) ? input.customer : {};
  const name = cleanText(customer.name, 60);
  const phone = cleanText(customer.phone, 25);
  if (name.length < 2 || onlyDigits(phone).length < 8) return fail("Faltan los datos de contacto.");

  if (!Array.isArray(input.lines) || input.lines.length === 0 || input.lines.length > 60) {
    return fail("El pedido está vacío.");
  }
  const items: CartItem[] = [];
  for (const [index, line] of input.lines.entries()) {
    const item = priceLine(store, line, `${code}-${index + 1}`);
    if (typeof item === "string") return fail(item);
    items.push(item);
  }
  const subtotal = items.reduce((sum, item) => sum + itemTotal(item), 0);

  // Un cupón que no aplica (vencido, inexistente o sin llegar al mínimo) no frena el pedido.
  let coupon: StoredOrder["coupon"];
  const couponCode = typeof input.couponCode === "string" ? input.couponCode.trim().toUpperCase() : "";
  const found = couponCode ? store.coupons.find((c) => c.active && c.code === couponCode) : undefined;
  if (found && couponDiscount(found, subtotal) > 0) coupon = { code: found.code, discount: couponDiscount(found, subtotal) };
  const discount = coupon?.discount ?? 0;

  const requested = isRecord(input.fulfillment) ? input.fulfillment : {};
  let fulfillment: Fulfillment;
  let shipping = 0;
  if (requested.method === "pickup" && business.delivery.pickup) {
    fulfillment = { method: "pickup" };
  } else if (requested.method === "delivery" && business.delivery.delivery) {
    const address = cleanText(requested.address, 200);
    if (address.length < 3) return fail("Falta la dirección de entrega.");
    const location = parseLocation(requested.location);
    const quote = quoteShipping(business.delivery);
    if (business.delivery.minOrder && subtotal < business.delivery.minOrder) {
      return fail("El pedido no llega al mínimo para envíos.");
    }
    shipping = quote.status === "ok" ? quote.cost : 0;
    const buildingType = BUILDINGS.find((b) => b === requested.buildingType) ?? "house";
    fulfillment = {
      method: "delivery",
      address,
      location,
      buildingType,
      floor: buildingType === "apartment" ? cleanText(requested.floor, 10) || undefined : undefined,
      apartment: buildingType === "apartment" ? cleanText(requested.apartment, 10) || undefined : undefined,
      references: cleanText(requested.references, 150) || undefined,
      cost: quote.status === "ok" ? quote.cost : null,
    };
  } else {
    return fail("Elegí una forma de entrega válida.");
  }

  const total = subtotal - discount + shipping;

  const payment = isRecord(input.payment) ? input.payment : {};
  const { payments } = business;
  let method: PaymentMethod;
  if (payment.method === "cash" && payments.cash) method = "cash";
  else if (payment.method === "transfer" && payments.transfer) method = "transfer";
  else if (payment.method === "mixed" && payments.mixed && payments.cash && payments.transfer) method = "mixed";
  else return fail("Elegí una forma de pago válida.");
  const cashAmount = method === "transfer" ? null : toAmount(payment.cashAmount);
  if (method === "mixed" && (cashAmount === null || cashAmount <= 0 || cashAmount >= total)) {
    return fail("Revisá cuánto pagás en efectivo.");
  }

  const createdAt = now.toISOString();
  return {
    ok: true,
    order: {
      number,
      code,
      createdAt,
      status: "pending",
      history: [{ status: "pending", at: createdAt }],
      customer: { name, phone },
      items,
      fulfillment,
      payment: { method, cashAmount: cashAmount || undefined },
      coupon,
      totals: { subtotal, discount, shipping, total },
      clientTotal: toAmount(input.clientTotal) ?? 0,
    },
  };
}
