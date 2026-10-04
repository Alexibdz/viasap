"use client";

import Image from "next/image";
import Offcanvas from "react-bootstrap/Offcanvas";
import { Bicycle, Clock, CreditCard, Instagram, Shop, SignTurnRight, Whatsapp, XLg } from "react-bootstrap-icons";
import { useNow } from "@/lib/client-hooks";
import { formatMoney } from "@/lib/format";
import { googleMapsUrl } from "@/lib/geo";
import { describeStatus, formatDayRanges, getOpenStatus, WEEK_ORDER, WEEKDAY_NAMES, zonedWeekTime } from "@/lib/hours";
import { whatsappUrl } from "@/lib/order";
import { useStore } from "./StoreProvider";

const formatKm = (km: number) => `${String(km).replace(".", ",")} km`;

export default function InfoSheet({ show, onHide }: { show: boolean; onHide: () => void }) {
  const business = useStore();
  const now = useNow();
  const date = now === null ? null : new Date(now);
  const status = date ? getOpenStatus(business.schedule, business.timezone, date) : null;
  const today = date ? zonedWeekTime(date, business.timezone).day : null;
  const { address, delivery, payments } = business;

  return (
    <Offcanvas show={show} onHide={onHide} placement="bottom" className="sheet" aria-labelledby="info-title">
      <div className="sheet-handle" aria-hidden />
      <div className="sheet-scroll info-sheet">
        <header className="info-head">
          <Image src={business.logoUrl} alt="" width={56} height={56} className="info-logo" />
          <div className="min-w-0">
            <h2 id="info-title" className="info-title">
              {business.name}
            </h2>
            <p className="info-sub">
              {address.street}, {address.city}
            </p>
          </div>
          <button type="button" className="round-btn round-btn--soft ms-auto" onClick={onHide} aria-label="Cerrar">
            <XLg size={16} />
          </button>
        </header>

        <div className="info-actions">
          <a href={googleMapsUrl(address)} target="_blank" rel="noopener noreferrer" className="info-action">
            <span className="info-action-icon">
              <SignTurnRight size={20} />
            </span>
            Cómo llegar
          </a>
          <a href={whatsappUrl(business.whatsapp)} target="_blank" rel="noopener noreferrer" className="info-action">
            <span className="info-action-icon">
              <Whatsapp size={20} />
            </span>
            WhatsApp
          </a>
          {business.instagram && (
            <a
              href={`https://instagram.com/${business.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="info-action"
            >
              <span className="info-action-icon">
                <Instagram size={20} />
              </span>
              Instagram
            </a>
          )}
        </div>

        <section className="info-block">
          <h3 className="info-block-title">
            <Clock aria-hidden /> Horarios
          </h3>
          {status && (
            <p className={`info-status ${status.open ? "is-open" : "is-closed"}`}>{describeStatus(status)}</p>
          )}
          <ul className="hours">
            {WEEK_ORDER.map((day) => (
              <li key={day} className={day === today ? "is-today" : undefined}>
                <span>{WEEKDAY_NAMES[day]}</span>
                <span>{formatDayRanges(business.schedule[day])}</span>
              </li>
            ))}
          </ul>
        </section>

        {delivery.delivery && (
          <section className="info-block">
            <h3 className="info-block-title">
              <Bicycle aria-hidden /> Envíos a domicilio
            </h3>
            {delivery.zones.length ? (
              <ul className="zones">
                {delivery.zones.map((zone) => (
                  <li key={zone.upToKm}>
                    <span>Hasta {formatKm(zone.upToKm)}</span>
                    <strong>{formatMoney(zone.cost)}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="info-note">El costo del envío se coordina por WhatsApp.</p>
            )}
            {delivery.minOrder ? (
              <p className="info-note">Pedido mínimo para envíos: {formatMoney(delivery.minOrder)}.</p>
            ) : null}
          </section>
        )}

        {delivery.pickup && (
          <section className="info-block">
            <h3 className="info-block-title">
              <Shop aria-hidden /> Retiro en el local
            </h3>
            <p className="info-note">
              {address.street}, {address.city}, {address.province}.
            </p>
          </section>
        )}

        <section className="info-block">
          <h3 className="info-block-title">
            <CreditCard aria-hidden /> Formas de pago
          </h3>
          <div className="tags">
            {payments.cash && <span className="tag">Efectivo</span>}
            {payments.transfer && <span className="tag">Transferencia</span>}
            {payments.mixed && <span className="tag">Efectivo + transferencia</span>}
          </div>
        </section>
      </div>
    </Offcanvas>
  );
}
