"use client";

import Image from "next/image";
import { Fragment, type CSSProperties } from "react";
import { useNow } from "@/lib/client-hooks";
import { formatMoney } from "@/lib/format";
import { googleMapsUrl } from "@/lib/geo";
import { heroTitleLines, longestLine } from "@/lib/hero";
import { getOpenStatus, nextOpeningLabel } from "@/lib/hours";
import { shippingFrom } from "@/lib/shipping";
import ShareButton from "./ShareButton";
import { useStore } from "./StoreProvider";
import { useStoreUi } from "./StoreUi";

function Chevron() {
  return (
    <svg className="hero-tag-icon" viewBox="0 0 24 24" aria-hidden>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/**
 * Portada de la tienda (dirección "Tipográfico"): el nombre en grande, el logo,
 * la cinta de "cerrado" y las etiquetas de horario, envío y dirección.
 */
export default function StoreHero() {
  const business = useStore();
  const { openInfo, openSearch } = useStoreUi();
  const now = useNow();
  // En el servidor no se sabe la hora: hasta hidratar no hay estado ni cinta.
  const status = now === null ? null : getOpenStatus(business.schedule, business.timezone, new Date(now));
  const { delivery, address } = business;
  const lines = heroTitleLines(business.name);
  const shipping = shippingFrom(delivery);

  // Etiqueta de horario: "Abierto · cierra 00:30" o "Cerrado · abre hoy 20:00".
  const opens = status && !status.open && status.nextOpening ? nextOpeningLabel(status.nextOpening) : null;
  let statusLabel = "Horarios";
  if (status?.open) statusLabel = `Abierto · cierra ${status.closesAt}`;
  else if (status) statusLabel = opens ? `Cerrado · abre ${opens}` : "Cerrado";

  let ticker: string[] | null = null;
  if (business.ordersPaused) {
    ticker = ["Pedidos en pausa", "Volvemos en un rato", "Mirá el menú mientras tanto"];
  } else if (status && !status.open) {
    const message = business.acceptOrdersWhenClosed
      ? "Pedí igual y lo preparamos al abrir"
      : "Mirá el menú y pedí cuando abramos";
    ticker = opens ? ["Cerrado", `Abre ${opens}`, message] : ["Cerrado", message];
  }

  let shippingTag: { label: string; value?: string } | null = null;
  if (delivery.delivery) {
    if (!shipping) shippingTag = { label: "Envío", value: "a coordinar" };
    else if (shipping.cost === 0 && !shipping.varies) shippingTag = { label: "Envío", value: "gratis" };
    else shippingTag = { label: shipping.varies ? "Envío desde" : "Envío", value: formatMoney(shipping.cost) };
  }

  return (
    <header className="hero" data-open={status ? String(status.open) : undefined}>
      <div className="hero-top">
        <button type="button" className="hero-share hero-search" aria-label="Buscar en el menú" onClick={openSearch}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <circle cx="11" cy="11" r="6.5" />
            <path d="M20 20l-4.2-4.2" />
          </svg>
        </button>
        <ShareButton title={business.name} className="hero-share">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 15V3M7.5 7.5L12 3l4.5 4.5M5 12v8h14v-8" />
          </svg>
        </ShareButton>
      </div>

      <div className="hero-main">
        <div className="hero-title-box">
          <h1 className="hero-title" style={{ "--hero-chars": longestLine(lines) } as CSSProperties}>
            {lines.map((line, index) => (
              <Fragment key={index}>
                {index > 0 && <br />}
                {line.mark ? <span className="hero-mark">{line.text}</span> : line.text}
              </Fragment>
            ))}
          </h1>
        </div>
        <div className="hero-photo">
          <Image
            src={business.logoUrl}
            alt=""
            fill
            sizes="(min-width: 760px) 168px, 128px"
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </div>

      {ticker && (
        <div className="hero-ticker">
          <p className="visually-hidden">{ticker.join(". ")}.</p>
          {/* Dos copias iguales: al llegar a la mitad, la animación vuelve al principio sin salto. */}
          <div className="hero-ticker-track" aria-hidden>
            {[0, 1].map((copy) =>
              ticker.map((text, index) => (
                <Fragment key={`${copy}-${index}`}>
                  <span>{text}</span>
                  <span>•</span>
                </Fragment>
              )),
            )}
          </div>
        </div>
      )}

      <div className="hero-body">
        {(business.description || business.highlight) && (
          <p className="hero-desc">
            {business.description}
            {business.description && business.highlight && " "}
            {business.highlight && <mark>{business.highlight}</mark>}
          </p>
        )}

        <div className="hero-tags">
          <button type="button" className="hero-tag" onClick={() => openInfo("hours")}>
            <span className="hero-tag-dot" aria-hidden />
            <span>{statusLabel}</span>
            <Chevron />
          </button>
          {shippingTag ? (
            <button type="button" className="hero-tag" onClick={() => openInfo("delivery")}>
              <span>
                <span className="hero-tag-label">{shippingTag.label}</span> {shippingTag.value}
              </span>
              <Chevron />
            </button>
          ) : (
            <span className="hero-tag hero-tag--static">Solo retiro en el local</span>
          )}
          <a
            className="hero-tag"
            href={googleMapsUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Cómo llegar a ${address.street}, ${address.city} (abre el mapa)`}
          >
            <svg className="hero-tag-icon hero-tag-icon--pin" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
            <span>{address.street}</span>
            <Chevron />
          </a>
        </div>
      </div>
    </header>
  );
}
