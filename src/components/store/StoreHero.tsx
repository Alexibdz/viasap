"use client";

import Image from "next/image";
import { Bag, Bank, Bicycle, Receipt, Search } from "react-bootstrap-icons";
import { formatMoney } from "@/lib/format";
import ClosedNotice from "./ClosedNotice";
import ShareButton from "./ShareButton";
import StatusPill from "./StatusPill";
import { useStore } from "./StoreProvider";
import { useStoreUi } from "./StoreUi";

export default function StoreHero() {
  const business = useStore();
  const { openSearch, openInfo } = useStoreUi();
  const { delivery, payments } = business;
  const cheapestShipping = delivery.zones.length ? Math.min(...delivery.zones.map((z) => z.cost)) : null;

  return (
    <header className="hero">
      <div className="hero-cover">
        {business.coverUrl && (
          <Image
            src={business.coverUrl}
            alt=""
            fill
            sizes="(max-width: 760px) 100vw, 760px"
            loading="eager"
            fetchPriority="high"
          />
        )}
        <div className="hero-cover-actions">
          <button type="button" className="round-btn" aria-label="Buscar en el menú" onClick={openSearch}>
            <Search size={17} />
          </button>
          <ShareButton title={business.name} className="round-btn" />
        </div>
      </div>

      <div className="hero-body">
        <Image src={business.logoUrl} alt="" width={84} height={84} className="hero-logo" />
        <h1 className="hero-title">{business.name}</h1>
        {business.description && <p className="hero-desc">{business.description}</p>}

        <div className="hero-status">
          <StatusPill onClick={openInfo} />
          <button type="button" className="text-btn" onClick={openInfo}>
            Más info
          </button>
        </div>

        <ul className="hero-facts">
          {delivery.delivery && (
            <li>
              <Bicycle aria-hidden />
              {cheapestShipping === null ? "Envío a coordinar" : `Envío desde ${formatMoney(cheapestShipping)}`}
            </li>
          )}
          {delivery.pickup && (
            <li>
              <Bag aria-hidden /> Retiro en el local
            </li>
          )}
          {delivery.minOrder ? (
            <li>
              <Receipt aria-hidden /> Mínimo {formatMoney(delivery.minOrder)}
            </li>
          ) : null}
          {payments.transfer && (
            <li>
              <Bank aria-hidden /> Transferencia
            </li>
          )}
        </ul>

        <ClosedNotice />
      </div>
    </header>
  );
}
