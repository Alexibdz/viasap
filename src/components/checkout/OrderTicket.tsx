"use client";

import { Bicycle, Person, Shop } from "react-bootstrap-icons";
import { useCart, useStore } from "@/components/store/StoreProvider";
import type { CheckoutDraft, CheckoutSummary } from "@/lib/checkout";
import { formatMoney } from "@/lib/format";
import { itemTotal } from "@/lib/pricing";

/** Resumen con forma de ticket de mostrador. */
export default function OrderTicket({ draft, summary }: { draft: CheckoutDraft; summary: CheckoutSummary }) {
  const business = useStore();
  const { items } = useCart();
  const { quote } = summary;

  return (
    // El borde dentado es una máscara, que recortaría la sombra: la sombra va en el contenedor.
    <div className="ticket-wrap">
      <section className="ticket" aria-label="Resumen del pedido">
        <div className="ticket-head">
          <span className="ticket-store">{business.name}</span>
          <span className="ticket-label">Resumen</span>
        </div>
        <ul className="ticket-lines">
          {items.map((item) => (
            <li key={item.key}>
              <span>
                {item.qty}× {item.name}
                {item.variantName && ` (${item.variantName})`}
              </span>
              <span>{formatMoney(itemTotal(item))}</span>
            </li>
          ))}
        </ul>
        <div className="ticket-rule" />
        <dl className="ticket-totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatMoney(summary.subtotal)}</dd>
          </div>
          {summary.discount > 0 && (
            <div>
              <dt>Descuento{draft.coupon && ` (${draft.coupon.code})`}</dt>
              <dd>-{formatMoney(summary.discount)}</dd>
            </div>
          )}
          {draft.method === "delivery" && (
            <div>
              <dt>Envío</dt>
              <dd>{quote?.status === "ok" ? formatMoney(quote.cost) : "A coordinar"}</dd>
            </div>
          )}
          <div className="ticket-total">
            <dt>Total</dt>
            <dd>{formatMoney(summary.total)}</dd>
          </div>
        </dl>
        <div className="ticket-rule" />
        <ul className="ticket-meta">
          <li>
            <Person aria-hidden /> {draft.name.trim()} · {draft.phone.trim()}
          </li>
          <li>
            {draft.method === "delivery" ? (
              <>
                <Bicycle aria-hidden /> {draft.address?.label}
              </>
            ) : (
              <>
                <Shop aria-hidden /> Retiro en {business.address.street}
              </>
            )}
          </li>
        </ul>
      </section>
    </div>
  );
}
