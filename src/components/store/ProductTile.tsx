import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { isQuickAdd } from "@/lib/menu";
import { offerIncludesText } from "@/lib/offers";
import { priceFrom, showsPriceFrom } from "@/lib/pricing";
import type { OfferInfo, Product } from "@/lib/types";
import { CardPlus, QuickAddButton } from "./CardActions";

interface ProductTileProps {
  slug: string;
  product: Product;
  sectionLabel: string;
  /** Lo que incluye, si es una oferta armada con productos del menú. */
  offer?: OfferInfo;
  /** Es una oferta o promo (aunque no se haya armado con productos). */
  isOffer?: boolean;
}

/** Producto en tile (foto arriba, nombre y precio abajo). La descripción queda para la ficha. */
export default function ProductTile({ slug, product, sectionLabel, offer, isOffer = Boolean(offer) }: ProductTileProps) {
  const quick = isQuickAdd(product);
  const classes = ["tile", product.soldOut && "is-soldout", isOffer && "is-offer"].filter(Boolean);

  return (
    <article className={classes.join(" ")}>
      <Link href={`/${slug}/producto/${product.id}`} scroll={false} className="tile-link">
        <span className="tile-media">
          {product.imageUrl && <Image src={product.imageUrl} alt="" fill sizes="(max-width: 480px) 45vw, 210px" />}
          {product.soldOut ? (
            <span className="tile-pill tile-pill--muted">Agotado</span>
          ) : (
            isOffer && <span className="tile-pill">Oferta</span>
          )}
        </span>
        <span className="tile-body">
          <span className="tile-name">{product.name}</span>
          <span className="tile-price">
            {showsPriceFrom(product) && "desde "}
            <strong>{formatMoney(priceFrom(product))}</strong>
          </span>
        </span>
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
