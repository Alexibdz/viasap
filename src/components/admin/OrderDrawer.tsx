"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Offcanvas from "react-bootstrap/Offcanvas";
import { ExclamationTriangle, GeoAlt, Printer, Telephone, Whatsapp, XLg } from "react-bootstrap-icons";
import { useStore } from "@/components/store/StoreProvider";
import { formatTime, paymentLabel, timeAgo } from "@/lib/admin-format";
import { useNow } from "@/lib/client-hooks";
import { formatMoney } from "@/lib/format";
import { googleMapsUrl } from "@/lib/geo";
import { nextActionLabel, nextStatus, statusLabel } from "@/lib/order-status";
import { toWhatsAppNumber } from "@/lib/phone";
import { itemTotal } from "@/lib/pricing";
import type { Business, OrderStatus, StoredOrder } from "@/lib/types";
import { useOrderActions } from "./useOrderActions";

const STEPS: OrderStatus[] = ["pending", "preparing", "ready", "delivered"];
const CANCEL_REASONS = ["Nos quedamos sin stock", "Estamos por cerrar", "No llegamos a esa zona", "No pudimos contactarte"];
const BUILDING = { house: "Casa", apartment: "Departamento", other: "Otro lugar" } as const;

function paymentDetail(order: StoredOrder): string {
  const { method, cashAmount } = order.payment;
  const total = order.totals.total;
  if (method === "transfer") return "Pedile el comprobante de la transferencia.";
  if (method === "mixed") {
    return `Efectivo ${formatMoney(cashAmount ?? 0)} · transferencia ${formatMoney(total - (cashAmount ?? 0))}`;
  }
  return cashAmount && cashAmount > total
    ? `Paga con ${formatMoney(cashAmount)} · llevá ${formatMoney(cashAmount - total)} de vuelto`
    : "Paga con el monto justo.";
}

/** Comanda para imprimir (impresora térmica de 80 mm o una hoja común). */
function PrintTicket({ order, business }: { order: StoredOrder; business: Business }) {
  const f = order.fulfillment;
  return (
    <div className="adm-print">
      <p className="adm-print-big">{business.name}</p>
      <p>
        Pedido #{order.number} · {formatTime(order.createdAt, business.timezone)}
      </p>
      <p>
        {order.customer.name} · {order.customer.phone}
      </p>
      <hr />
      {order.items.map((item) => (
        <div key={item.key} className="adm-print-item">
          <p className="adm-print-strong">
            {item.qty}x {item.name}
            {item.variantName && ` (${item.variantName})`}
          </p>
          {item.options.map((o) => (
            <p key={o.optionId + o.groupId}>
              {"  "}+ {o.qty > 1 ? `${o.qty}x ` : ""}
              {o.name}
            </p>
          ))}
          {item.notes && <p>{`  >> ${item.notes}`}</p>}
        </div>
      ))}
      <hr />
      <p className="adm-print-strong">
        {f.method === "delivery" ? `ENVÍO: ${f.address}` : "RETIRA EN EL LOCAL"}
      </p>
      {/* Lo que necesita quien lleva el pedido: piso, depto, referencias y el vuelto. */}
      {f.method === "delivery" && (f.floor || f.apartment) && (
        <p>{[f.floor && `Piso ${f.floor}`, f.apartment && `Depto ${f.apartment}`].filter(Boolean).join(" · ")}</p>
      )}
      {f.method === "delivery" && f.references && <p>Ref.: {f.references}</p>}
      <p>
        {paymentLabel(order.payment.method)} · TOTAL {formatMoney(order.totals.total)}
      </p>
      {order.payment.method !== "transfer" && <p>{paymentDetail(order)}</p>}
    </div>
  );
}

function OrderDetail({ order, onClose }: { order: StoredOrder; onClose: () => void }) {
  const business = useStore();
  const now = useNow();
  const { moveTo, messageCustomer, notifyCustomer, setNotifyCustomer, busyCode } = useOrderActions();
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState(CANCEL_REASONS[0]);

  const f = order.fulfillment;
  const method = f.method;
  const next = nextStatus(order.status);
  const action = nextActionLabel(order.status, method);
  const busy = busyCode === order.code;
  const finished = order.status === "delivered" || order.status === "cancelled";
  const current = STEPS.indexOf(order.status);
  const { totals } = order;

  return (
    <>
      <header className="adm-drawer-head">
        <div className="min-w-0">
          <p className="adm-eyebrow">Pedido</p>
          <h2 className="adm-drawer-title">#{order.number}</h2>
          <p className="adm-drawer-sub">
            {formatTime(order.createdAt, business.timezone)}
            {now !== null && ` · ${timeAgo(order.createdAt, now)}`} · <code>{order.code}</code>
          </p>
        </div>
        <span className={`adm-status is-${order.status}`}>{statusLabel(order.status, method)}</span>
        <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Cerrar">
          <XLg />
        </button>
      </header>

      {order.status === "cancelled" ? (
        <p className="adm-alert adm-alert--muted">
          Cancelado {order.cancelledBy === "customer" ? "por el cliente" : "por el local"}
          {order.cancelReason && `: ${order.cancelReason.toLowerCase()}`}.
        </p>
      ) : (
        <ol className="adm-progress" aria-label="Estado del pedido">
          {STEPS.map((step, index) => (
            <li key={step} className={index < current ? "is-done" : index === current ? "is-current" : undefined}>
              {statusLabel(step, method)}
            </li>
          ))}
        </ol>
      )}

      <div className="adm-drawer-body">
        <section className="adm-detail">
          <h3>Cliente</h3>
          <p className="adm-detail-main">{order.customer.name}</p>
          <p className="adm-detail-sub">{order.customer.phone}</p>
          <div className="adm-detail-actions">
            <button type="button" className="adm-btn adm-btn--wa" onClick={() => messageCustomer(order)}>
              <Whatsapp aria-hidden /> Escribirle
            </button>
            <a className="adm-btn" href={`tel:+${toWhatsAppNumber(order.customer.phone)}`}>
              <Telephone aria-hidden /> Llamar
            </a>
          </div>
        </section>

        <section className="adm-detail">
          <h3>{f.method === "delivery" ? "Envío a domicilio" : "Retira en el local"}</h3>
          {f.method === "delivery" ? (
            <>
              <p className="adm-detail-main">{f.address}</p>
              <p className="adm-detail-sub">
                {[
                  BUILDING[f.buildingType],
                  f.floor && `piso ${f.floor}`,
                  f.apartment && `depto ${f.apartment}`,
                  f.references,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {f.location && (
                <a className="adm-link" href={googleMapsUrl(f.location)} target="_blank" rel="noopener noreferrer">
                  <GeoAlt aria-hidden /> Ver en el mapa
                </a>
              )}
            </>
          ) : (
            <p className="adm-detail-sub">Pasa a buscarlo por {business.address.street}.</p>
          )}
        </section>

        <section className="adm-detail">
          <h3>Pedido</h3>
          <ul className="adm-lines">
            {order.items.map((item) => (
              <li key={item.key}>
                <div className="adm-line-top">
                  <span>
                    <strong>{item.qty}×</strong> {item.name}
                    {item.variantName && ` (${item.variantName})`}
                  </span>
                  <span>{formatMoney(itemTotal(item))}</span>
                </div>
                {item.options.length > 0 && (
                  <p className="adm-line-options">
                    {item.options.map((o) => `${o.qty > 1 ? `${o.qty}× ` : ""}${o.name}`).join(" · ")}
                  </p>
                )}
                {item.notes && <p className="adm-line-note">“{item.notes}”</p>}
              </li>
            ))}
          </ul>
          <dl className="adm-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(totals.subtotal)}</dd>
            </div>
            {order.coupon && (
              <div>
                <dt>Cupón {order.coupon.code}</dt>
                <dd>-{formatMoney(order.coupon.discount)}</dd>
              </div>
            )}
            {f.method === "delivery" && (
              <div>
                <dt>Envío</dt>
                <dd>{f.cost === null ? "A coordinar" : formatMoney(f.cost)}</dd>
              </div>
            )}
            <div className="is-total">
              <dt>Total</dt>
              <dd>{formatMoney(totals.total)}</dd>
            </div>
          </dl>
          {order.clientTotal > 0 && order.clientTotal !== totals.total && (
            <p className="adm-alert adm-alert--warn">
              <ExclamationTriangle aria-hidden /> El cliente vio un total de {formatMoney(order.clientTotal)}: puede que
              un precio haya cambiado mientras pedía.
            </p>
          )}
        </section>

        <section className="adm-detail">
          <h3>Pago</h3>
          <p className="adm-detail-main">{paymentLabel(order.payment.method)}</p>
          <p className="adm-detail-sub">{paymentDetail(order)}</p>
        </section>

        <section className="adm-detail">
          <h3>Historial</h3>
          <ul className="adm-timeline">
            {order.history.map((entry, index) => (
              <li key={index}>
                <span>{statusLabel(entry.status, method)}</span>
                <time>{formatTime(entry.at, business.timezone)}</time>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="adm-drawer-foot">
        {cancelling ? (
          <div className="adm-cancel">
            <p className="adm-cancel-title">¿Por qué lo cancelás?</p>
            <div className="adm-chips">
              {CANCEL_REASONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`adm-chip${reason === option ? " is-on" : ""}`}
                  onClick={() => setReason(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <input
              className="adm-input"
              aria-label="Motivo"
              maxLength={80}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="adm-drawer-buttons">
              <button type="button" className="adm-btn" onClick={() => setCancelling(false)}>
                Volver
              </button>
              <button
                type="button"
                className="adm-btn adm-btn--danger"
                disabled={busy}
                onClick={async () => {
                  await moveTo(order, "cancelled", reason);
                  setCancelling(false);
                }}
              >
                Cancelar pedido
              </button>
            </div>
          </div>
        ) : (
          <>
            {!finished && (
              <label className="adm-check">
                <input
                  type="checkbox"
                  checked={notifyCustomer}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                />
                Avisarle al cliente por WhatsApp cuando cambio el estado
              </label>
            )}
            <div className="adm-drawer-buttons">
              {next && action && (
                <button
                  type="button"
                  className="adm-btn adm-btn--primary adm-btn--grow"
                  disabled={busy}
                  onClick={() => moveTo(order, next)}
                >
                  {busy ? "Guardando…" : action}
                </button>
              )}
              <button type="button" className="adm-btn" onClick={() => window.print()} aria-label="Imprimir comanda">
                <Printer aria-hidden /> {finished && "Imprimir"}
              </button>
              {!finished && (
                <button type="button" className="adm-btn adm-btn--ghost-danger" onClick={() => setCancelling(true)}>
                  Cancelar
                </button>
              )}
            </div>
          </>
        )}
      </footer>

      {createPortal(<PrintTicket order={order} business={business} />, document.body)}
    </>
  );
}

interface OrderDrawerProps {
  order: StoredOrder | null;
  show: boolean;
  onHide: () => void;
  onExited: () => void;
}

export default function OrderDrawer({ order, show, onHide, onExited }: OrderDrawerProps) {
  return (
    <Offcanvas show={show && order !== null} onHide={onHide} onExited={onExited} placement="end" className="adm-drawer">
      {order && <OrderDetail key={order.code} order={order} onClose={onHide} />}
    </Offcanvas>
  );
}
