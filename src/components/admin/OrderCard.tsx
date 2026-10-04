"use client";

import { ArrowRightShort, Bag, Bicycle } from "react-bootstrap-icons";
import { useStore } from "@/components/store/StoreProvider";
import { formatTime, paymentLabel, timeAgo } from "@/lib/admin-format";
import { formatMoney } from "@/lib/format";
import { nextActionLabel, nextStatus } from "@/lib/order-status";
import type { StoredOrder } from "@/lib/types";

interface OrderCardProps {
  order: StoredOrder;
  now: number | null;
  busy: boolean;
  onOpen: () => void;
  onAdvance: () => void;
}

export default function OrderCard({ order, now, busy, onOpen, onAdvance }: OrderCardProps) {
  const { timezone } = useStore();
  const method = order.fulfillment.method;
  const action = nextActionLabel(order.status, method);
  const units = order.items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <article className={`adm-order is-${order.status}${busy ? " is-busy" : ""}`}>
      {/* Toda la tarjeta abre el detalle; el botón de acción queda por encima. */}
      <button type="button" className="adm-order-open" onClick={onOpen} aria-label={`Ver pedido #${order.number}`} />
      <div className="adm-order-top">
        <span className="adm-order-number">#{order.number}</span>
        <span className="adm-order-time">
          {formatTime(order.createdAt, timezone)}
          {now !== null && ` · ${timeAgo(order.createdAt, now)}`}
        </span>
      </div>
      <p className="adm-order-name">{order.customer.name}</p>
      <p className="adm-order-meta">
        {method === "delivery" ? <Bicycle aria-hidden /> : <Bag aria-hidden />}
        {method === "delivery" ? "Envío" : "Retira"} · {paymentLabel(order.payment.method)}
      </p>
      <div className="adm-order-foot">
        <span>
          {units} {units === 1 ? "producto" : "productos"}
        </span>
        <strong>{formatMoney(order.totals.total)}</strong>
      </div>
      {action && nextStatus(order.status) && (
        <button type="button" className="adm-order-action" onClick={onAdvance} disabled={busy}>
          {action} <ArrowRightShort size={20} aria-hidden />
        </button>
      )}
    </article>
  );
}
