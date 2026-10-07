"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useNow } from "@/lib/client-hooks";
import { googleMapsUrl } from "@/lib/geo";
import { longestWord, splitName } from "@/lib/hero";
import { getOpenStatus, statusCard } from "@/lib/hours";
import { shippingChip } from "@/lib/shipping";
import { useStore } from "./StoreProvider";
import { useStoreUi } from "./StoreUi";

/**
 * Cabecera de la tienda, igual para todos los negocios (cada diseño la viste a su manera):
 * logo, ubicación, nombre, descripción, la tarjeta de estado y las etiquetas de envío y retiro.
 */
export default function StoreHeader() {
  const business = useStore();
  const { openInfo } = useStoreUi();
  const now = useNow();
  const { address, delivery } = business;
  // En el servidor no se sabe la hora: hasta hidratar, la tarjeta queda neutra.
  const status = now === null ? null : getOpenStatus(business.schedule, business.timezone, new Date(now));
  const card = statusCard(status, business.ordersPaused);
  const { lead, last } = splitName(business.name);

  return (
    <header className="store-header">
      <div className="store-intro">
        <span className="store-logo">
          <Image src={business.logoUrl} alt="" width={120} height={120} loading="eager" fetchPriority="high" />
        </span>
        <p className="store-location">
          {address.city}
          {address.province && ` · ${address.province}`}
        </p>
        <h1 className="store-name" style={{ "--name-chars": longestWord(business.name) } as CSSProperties}>
          {lead && `${lead} `}
          <span className="store-name-last">{last}</span>
        </h1>
        {business.description && <p className="store-tagline">{business.description}</p>}
      </div>

      <div className="store-facts">
        <button type="button" className="store-status" data-tone={card.tone} onClick={() => openInfo("hours")}>
          <span className="store-status-dot" aria-hidden />
          <span className="store-status-text">
            <span className="store-status-title">{card.title}</span>
            <span className="store-status-detail">{card.detail}</span>
          </span>
          <span className="store-status-btn">Ver horarios</span>
        </button>

        <div className="store-chips">
          <button type="button" className="store-chip" onClick={() => openInfo("delivery")}>
            <span className="store-chip-label">Envío</span>
            <span className="store-chip-value">{shippingChip(delivery)}</span>
          </button>
          <a
            className="store-chip"
            href={googleMapsUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${delivery.pickup ? "Retiro en" : "Estamos en"} ${address.street}, ${address.city} (abre el mapa)`}
          >
            <span className="store-chip-label">{delivery.pickup ? "Retiro" : "Dirección"}</span>
            <span className="store-chip-value">{address.street}</span>
          </a>
        </div>
      </div>
    </header>
  );
}
