import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { isQuickAdd } from "@/lib/menu";
import { offerIncludesText } from "@/lib/offers";
import { priceFrom, showsPriceFrom } from "@/lib/pricing";
import type { OfferInfo, Product } from "@/lib/types";
import { CardPlus, QuickAddButton } from "./CardActions";

interface ProductCardProps {
  slug: string;
  product: Product;
  sectionLabel: string;
  /** Lo que incluye, si es una oferta armada con productos del menú. */
  offer?: OfferInfo;
  /** Es una oferta o promo (aunque no se haya armado con productos). */
  isOffer?: boolean;
}

export default function ProductCard({ slug, product, sectionLabel, offer, isOffer = Boolean(offer) }: ProductCardProps) {
  const quick = isQuickAdd(product);
  // Con foto, la etiqueta va sobre la foto; sin foto, al lado del precio (arriba chocaría con el "+").
  const badge =
    isOffer && !product.soldOut ? (
      <span className={`product-card-badge${product.imageUrl ? "" : " product-card-badge--inline"}`}>
        Oferta
      </span>
    ) : null;
  const classes = [
    "product-card",
    product.soldOut && "is-soldout",
    // Sin foto: la tarjeta es solo texto (mejor eso que una foto de referencia).
    !product.imageUrl && "is-textonly",
    isOffer && "is-offer",
  ].filter(Boolean);

  return (
    <article className={classes.join(" ")}>
      <Link href={`/${slug}/producto/${product.id}`} scroll={false} className="product-card-link">
        <span className="product-card-text">
          <span className="product-card-name">{product.name}</span>
          {product.description && <span className="product-card-desc">{product.description}</span>}
          {offer && (
            <span className="product-card-includes">
              Incluye {offer.lines.map((line) => `${line.qty}× ${line.name}`).join(" · ")}
            </span>
          )}
          <span className="product-card-price">
            {product.soldOut ? (
              <span className="tag tag--muted">Agotado</span>
            ) : (
              <>
                {showsPriceFrom(product) && <small>desde</small>}
                {formatMoney(priceFrom(product))}
                {!product.imageUrl && badge}
              </>
            )}
          </span>
        </span>
        {product.imageUrl && (
          <span className="product-card-media">
            <Image src={product.imageUrl} alt="" fill sizes="(max-width: 640px) 104px, 120px" />
          </span>
        )}
        {product.imageUrl && badge}
        {!product.soldOut && !quick && <CardPlus productId={product.id} />}
      </Link>
      {quick && (
        <QuickAddButton
          product={product}
          sectionLabel={sectionLabel}
          includes={offer ? offerIncludesText(offer.lines) : undefined}
        />
      )}
    </article>
  );
}
