import { formatMoney } from "./format";
import type { CartItem, CartOption, CouponRule, OptionGroup, Product, Variant } from "./types";

/** Un producto sin presentaciones se trata como una única variante sin nombre. */
export function productVariants(product: Product): Variant[] {
  if (product.variants?.length) return product.variants;
  return [{ id: "unico", name: "", price: product.price ?? 0 }];
}

export function hasNamedVariants(product: Product): boolean {
  return Boolean(product.variants?.length);
}

/** "desde $X": solo si las presentaciones tienen precios distintos (Coca o Sprite al mismo precio, no). */
export function showsPriceFrom(product: Product): boolean {
  return new Set(productVariants(product).map((v) => v.price)).size > 1;
}

export function priceFrom(product: Product): number {
  return Math.min(...productVariants(product).map((v) => v.price));
}

export function optionsTotal(options: CartOption[]): number {
  return options.reduce((sum, option) => sum + option.price * option.qty, 0);
}

export function itemTotal(item: CartItem): number {
  return (item.unitPrice + optionsTotal(item.options)) * item.qty;
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + itemTotal(item), 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

/** Descuento del cupón sobre el subtotal (0 si no llega al mínimo). */
export function couponDiscount(coupon: CouponRule, subtotal: number): number {
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) return 0;
  const raw = coupon.type === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
  return Math.min(Math.round(raw), subtotal);
}

export function describeCoupon(coupon: CouponRule): string {
  return coupon.type === "percent"
    ? `${coupon.value}% de descuento`
    : `${formatMoney(coupon.value)} de descuento`;
}

/** Texto de ayuda de un grupo de opciones según su mínimo y máximo. */
export function describeGroupRule(group: OptionGroup): string {
  const { min, max } = group;
  const options = (n: number) => (n === 1 ? "1 opción" : `${n} opciones`);
  if (min === 0) {
    return max === undefined ? "Seleccioná las opciones que quieras." : `Seleccioná hasta ${options(max)}.`;
  }
  if (max === min) return `Seleccioná ${options(min)}.`;
  if (max === undefined) return `Seleccioná al menos ${options(min)}.`;
  return `Seleccioná entre ${min} y ${max} opciones.`;
}
