import Image from "next/image";
import Link from "next/link";
import { Fire } from "react-bootstrap-icons";
import { formatMoney } from "@/lib/format";
import type { FeaturedOffer } from "@/lib/menu";
import { savingsPercent } from "@/lib/offers";
import { priceFrom, showsPriceFrom } from "@/lib/pricing";
import type { OfferInfo } from "@/lib/types";
import { CardPlus } from "./CardActions";

interface FeaturedRailProps {
  slug: string;
  items: FeaturedOffer[];
  /** Lo que incluye cada oferta armada, por id de producto. */
  offers: Record<string, OfferInfo>;
}

/** "Ofertas destacadas": carrusel arriba del menú con las ofertas marcadas en el panel. */
export default function FeaturedRail({ slug, items, offers }: FeaturedRailProps) {
  return (
    <section id="c-destacados" className="menu-section" aria-labelledby="t-destacados">
      <div className="menu-section-head">
        <h2 id="t-destacados" className="menu-section-title">
          <Fire className="featured-icon" aria-hidden /> Ofertas destacadas
        </h2>
      </div>
      <div className="featured-rail">
        {items.map(({ product, emoji }) => {
          const offer = offers[product.id];
          const percent = offer ? savingsPercent(offer) : 0;
          return (
            <Link key={product.id} href={`/${slug}/producto/${product.id}`} scroll={false} className="featured-card">
              <span className="featured-media">
                {product.imageUrl ? (
                  <Image src={product.imageUrl} alt="" fill sizes="180px" />
                ) : (
                  // Sin foto: el emoji de su categoría (o la inicial) en grande.
                  <span className="product-card-initial featured-initial" aria-hidden>
                    {emoji ?? product.name.charAt(0)}
                  </span>
                )}
                <span className="featured-badge">
                  {percent > 0 ? (
                    <>
                      <span className="visually-hidden">Ahorrás un </span>-{percent}%
                    </>
                  ) : (
                    "Oferta"
                  )}
                </span>
                <CardPlus productId={product.id} />
              </span>
              <span className="featured-name">{product.name}</span>
              <span className="featured-price">
                {showsPriceFrom(product) && <small>desde </small>}
                {formatMoney(priceFrom(product))}
                {offer && offer.savings > 0 && <s className="product-card-was">{formatMoney(offer.regularPrice)}</s>}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
