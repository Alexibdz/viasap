import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { FeaturedOffer } from "@/lib/menu";
import { priceFrom, showsPriceFrom } from "@/lib/pricing";
import type { OfferInfo } from "@/lib/types";

interface OffersCarouselProps {
  slug: string;
  items: FeaturedOffer[];
  /** Lo que incluye cada oferta armada, por id de producto. */
  offers: Record<string, OfferInfo>;
}

/** Ofertas arriba del menú: una tarjeta grande por oferta; con varias, se pasan de costado. */
export default function OffersCarousel({ slug, items, offers }: OffersCarouselProps) {
  return (
    <section className="offers" aria-labelledby="t-ofertas">
      <h2 id="t-ofertas" className="visually-hidden">
        Ofertas
      </h2>
      <div className={`offers-track${items.length > 1 ? " is-carousel" : ""}`}>
        {items.map(({ product }) => {
          const offer = offers[product.id];
          const includes = offer
            ? `incluye ${offer.lines.map((line) => `${line.qty > 1 ? `${line.qty} ` : ""}${line.name}`).join(" + ")}`
            : product.description;
          return (
            <Link
              key={product.id}
              href={`/${slug}/producto/${product.id}`}
              scroll={false}
              className={`offer-card${product.imageUrl ? "" : " is-textonly"}`}
            >
              <span className="offer-text">
                <span className="offer-kicker">Oferta</span>
                <span className="offer-name">{product.name}</span>
                {includes && <span className="offer-includes">{includes}</span>}
                <span className="offer-price">
                  {showsPriceFrom(product) && <small>desde </small>}
                  {formatMoney(priceFrom(product))}
                </span>
              </span>
              {product.imageUrl && (
                <span className="offer-media">
                  <Image src={product.imageUrl} alt="" fill sizes="150px" />
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
