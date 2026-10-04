"use client";

import Image from "next/image";
import Link from "next/link";
import { PlusLg } from "react-bootstrap-icons";
import QtyStepper from "@/components/store/QtyStepper";
import { useCart, useStore } from "@/components/store/StoreProvider";
import type { CheckoutDraft, CheckoutSummary } from "@/lib/checkout";
import { formatMoney } from "@/lib/format";
import { itemTotal } from "@/lib/pricing";
import type { CouponRule } from "@/lib/types";
import CouponField from "./CouponField";

interface StepCartProps {
  summary: CheckoutSummary;
  coupon: CheckoutDraft["coupon"];
  onCouponChange: (coupon: CouponRule | null) => void;
}

export default function StepCart({ summary, coupon, onCouponChange }: StepCartProps) {
  const { slug } = useStore();
  const { items, setQty } = useCart();

  return (
    <>
      <section className="panel">
        <ul className="line-items">
          {items.map((item) => (
            <li key={item.key} className="line-item">
              <span className="line-item-media">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt="" fill sizes="60px" />
                ) : (
                  <span className="product-card-initial" aria-hidden>
                    {item.name.charAt(0)}
                  </span>
                )}
              </span>
              <div className="line-item-body">
                <div className="line-item-top">
                  <span className="line-item-name">
                    {item.name}
                    {item.variantName && <span className="line-item-variant"> · {item.variantName}</span>}
                  </span>
                  <strong className="line-item-price">{formatMoney(itemTotal(item))}</strong>
                </div>
                {item.options.length > 0 && (
                  <p className="line-item-meta">
                    {item.options.map((o) => `${o.qty > 1 ? `${o.qty}x ` : ""}${o.name}`).join(" · ")}
                  </p>
                )}
                {item.notes && <p className="line-item-meta line-item-note">“{item.notes}”</p>}
                <QtyStepper
                  value={item.qty}
                  removable
                  max={50}
                  label={item.name}
                  onChange={(qty) => setQty(item.key, qty)}
                />
              </div>
            </li>
          ))}
        </ul>
        <Link href={`/${slug}`} className="btn-ghost btn-block">
          <PlusLg aria-hidden /> Agregar más productos
        </Link>
      </section>

      <section className="panel">
        <CouponField subtotal={summary.subtotal} value={coupon} onChange={onCouponChange} />
      </section>

      <section className="panel totals">
        <div className="totals-row">
          <span>Subtotal</span>
          <span>{formatMoney(summary.subtotal)}</span>
        </div>
        {summary.discount > 0 && (
          <div className="totals-row totals-row--discount">
            <span>Descuento</span>
            <span>-{formatMoney(summary.discount)}</span>
          </div>
        )}
        <p className="field-hint mb-0">El envío se calcula en el próximo paso.</p>
      </section>
    </>
  );
}
