"use client";

import Offcanvas from "react-bootstrap/Offcanvas";
import { Bicycle, Clock, Shop, XLg } from "react-bootstrap-icons";
import { useNow } from "@/lib/client-hooks";
import { formatMoney } from "@/lib/format";
import { describeStatus, formatDayRanges, getOpenStatus, WEEK_ORDER, WEEKDAY_NAMES, zonedWeekTime } from "@/lib/hours";
import { useStore } from "./StoreProvider";

/** Las etiquetas de la portada abren una hoja para cada cosa: horarios o envíos. */
export type InfoSection = "hours" | "delivery";

interface InfoSheetProps {
  show: boolean;
  onHide: () => void;
  section: InfoSection;
}

function Hours() {
  const business = useStore();
  const now = useNow();
  const date = now === null ? null : new Date(now);
  const status = date ? getOpenStatus(business.schedule, business.timezone, date) : null;
  const today = date ? zonedWeekTime(date, business.timezone).day : null;

  return (
    <>
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
    </>
  );
}

function Delivery() {
  const { delivery, address } = useStore();

  return (
    <>
      {delivery.delivery &&
        (delivery.zones.length ? (
          <ul className="zones">
            {delivery.zones.map((zone) => (
              <li key={zone.id}>
                <span>{zone.name}</span>
                <strong>{zone.cost ? formatMoney(zone.cost) : "Gratis"}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="info-note">El costo del envío se coordina por WhatsApp.</p>
        ))}
      {delivery.delivery && delivery.minOrder ? (
        <p className="info-note">Pedido mínimo para envíos: {formatMoney(delivery.minOrder)}.</p>
      ) : null}
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
    </>
  );
}

export default function InfoSheet({ show, onHide, section }: InfoSheetProps) {
  const { delivery } = useStore();
  const title =
    section === "hours" ? (
      <>
        <Clock aria-hidden /> Horarios
      </>
    ) : (
      <>
        <Bicycle aria-hidden /> {delivery.delivery ? "Envíos a domicilio" : "Entregas"}
      </>
    );

  return (
    <Offcanvas show={show} onHide={onHide} placement="bottom" className="sheet" aria-labelledby="info-title">
      <div className="sheet-handle" aria-hidden />
      <div className="sheet-scroll info-sheet">
        <header className="info-head">
          <h2 id="info-title" className="info-title">
            {title}
          </h2>
          <button type="button" className="round-btn round-btn--soft ms-auto" onClick={onHide} aria-label="Cerrar">
            <XLg size={16} />
          </button>
        </header>
        {section === "hours" ? <Hours /> : <Delivery />}
      </div>
    </Offcanvas>
  );
}
