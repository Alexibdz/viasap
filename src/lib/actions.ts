"use server";

import { findCoupon } from "./data";
import { formatMoney } from "./format";
import type { CouponRule } from "./types";

export type CouponResult = { ok: true; coupon: CouponRule } | { ok: false; error: string };

export async function validateCoupon(slug: string, code: string, subtotal: number): Promise<CouponResult> {
  if (typeof slug !== "string" || typeof code !== "string" || typeof subtotal !== "number") {
    return { ok: false, error: "Datos inválidos." };
  }
  if (!code.trim()) return { ok: false, error: "Ingresá un código." };

  const coupon = await findCoupon(slug, code.slice(0, 40));
  if (!coupon?.active) return { ok: false, error: "El cupón no existe o ya no está vigente." };
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    return { ok: false, error: `Este cupón es para pedidos desde ${formatMoney(coupon.minSubtotal)}.` };
  }
  const { code: validCode, type, value, minSubtotal } = coupon;
  return { ok: true, coupon: { code: validCode, type, value, minSubtotal } };
}
