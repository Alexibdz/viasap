import { formatMoney, onlyDigits, parseAmount } from "./format";
import { couponDiscount } from "./pricing";
import { quoteShipping, type ShippingQuote } from "./shipping";
import type { AddressValue, Business, BuildingType, CouponRule, DeliveryMethod, PaymentMethod } from "./types";

// Reglas del checkout en funciones puras: la pantalla solo las muestra.

export type Step = 1 | 2 | 3;

export interface CheckoutDraft {
  name: string;
  phone: string;
  method: DeliveryMethod | null;
  address: AddressValue | null;
  /** Zona de envío elegida ("Dentro de boulevard"). */
  zoneId: string | null;
  buildingType: BuildingType;
  floor: string;
  apartment: string;
  references: string;
  payment: PaymentMethod | null;
  cashInput: string;
  coupon: CouponRule | null;
}

export type CheckoutField =
  | "method"
  | "address"
  | "zone"
  | "unit"
  | "minOrder"
  | "name"
  | "phone"
  | "closed"
  | "payment"
  | "cash";

/** Campos de cada paso, en el orden en que aparecen en pantalla. */
export const STEP_FIELDS: Record<Step, CheckoutField[]> = {
  1: [],
  2: ["method", "address", "zone", "unit", "minOrder", "name", "phone"],
  3: ["closed", "payment", "cash"],
};

export interface CheckoutSummary {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  quote: ShippingQuote | null;
  cashAmount: number;
  errors: Partial<Record<CheckoutField, string>>;
}

/**
 * Calcula totales y errores del pedido.
 * `isOpen` es null mientras no se conoce la hora (render en el servidor).
 */
export function evaluateCheckout(
  draft: CheckoutDraft,
  subtotal: number,
  business: Business,
  isOpen: boolean | null,
): CheckoutSummary {
  const { delivery } = business;
  const quote = draft.method === "delivery" ? quoteShipping(delivery, draft.zoneId) : null;
  const shipping = quote?.status === "ok" ? quote.cost : 0;
  const discount = draft.coupon ? couponDiscount(draft.coupon, subtotal) : 0;
  const total = subtotal - discount + shipping;
  const cashAmount = parseAmount(draft.cashInput);

  const errors: Partial<Record<CheckoutField, string>> = {};
  if (!draft.method) errors.method = "Elegí cómo querés recibir tu pedido.";
  if (draft.method === "delivery") {
    if (!draft.address?.label) errors.address = "Buscá y elegí tu dirección.";
    else if (!draft.address.location) errors.address = "Marcá tu ubicación en el mapa.";
    if (quote?.status === "pending") errors.zone = "Elegí tu zona de envío.";
    if (draft.buildingType === "apartment" && !draft.floor.trim() && !draft.apartment.trim()) {
      errors.unit = "Indicá el piso y el departamento.";
    }
    if (delivery.minOrder && subtotal < delivery.minOrder) {
      errors.minOrder = `El pedido mínimo para envíos es de ${formatMoney(delivery.minOrder)}.`;
    }
  }
  if (draft.name.trim().length < 2) errors.name = "Ingresá tu nombre y apellido.";
  if (onlyDigits(draft.phone).length < 8) errors.phone = "Ingresá un teléfono válido, con código de área.";

  if (business.ordersPaused) {
    errors.closed = "El local pausó los pedidos por un rato.";
  } else if (isOpen === false && !business.acceptOrdersWhenClosed) {
    errors.closed = "El local está cerrado y no toma pedidos en este momento.";
  }
  if (!draft.payment) errors.payment = "Elegí cómo vas a pagar.";
  else if (draft.payment === "mixed" && (cashAmount <= 0 || cashAmount >= total)) {
    errors.cash = `Indicá cuánto pagás en efectivo (menos de ${formatMoney(total)}).`;
  } else if (draft.payment === "cash" && draft.cashInput && cashAmount < total) {
    errors.cash = `El monto tiene que ser de al menos ${formatMoney(total)}.`;
  }

  return { subtotal, discount, shipping, total, quote, cashAmount, errors };
}

export function stepIsValid(step: Step, errors: CheckoutSummary["errors"]): boolean {
  return STEP_FIELDS[step].every((field) => !errors[field]);
}

/** Paso más avanzado al que se puede llegar con los datos actuales. */
export function maxReachableStep(errors: CheckoutSummary["errors"]): Step {
  return stepIsValid(2, errors) ? 3 : 2;
}

/** Montos redondos para "¿con cuánto pagás?": $15.500 → $16.000 y $20.000. */
export function suggestCashAmounts(total: number): number[] {
  const amounts = [1000, 5000, 10000, 20000].map((step) => Math.ceil((total + 1) / step) * step);
  return [...new Set(amounts)].slice(0, 3);
}
