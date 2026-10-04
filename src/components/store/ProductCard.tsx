import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { isQuickAdd } from "@/lib/menu";
import { hasNamedVariants, priceFrom } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { CardPlus, QuickAddButton } from "./CardActions";

interface ProductCardProps {
  slug: string;
  product: Product;
  sectionLabel: string;
}

export default function ProductCard({ slug, product, sectionLabel }: ProductCardProps) {
  const quick = isQuickAdd(product);

  return (
    <article className={`product-card${product.soldOut ? " is-soldout" : ""}`}>
      <Link href={`/${slug}/producto/${product.id}`} scroll={false} className="product-card-link">
        <span className="product-card-text">
          <span className="product-card-name">{product.name}</span>
          {product.description && <span className="product-card-desc">{product.description}</span>}
          <span className="product-card-price">
            {product.soldOut ? (
              <span className="tag tag--muted">Agotado</span>
            ) : (
              <>
                {hasNamedVariants(product) && <small>desde</small>}
                {formatMoney(priceFrom(product))}
              </>
            )}
          </span>
        </span>
        <span className="product-card-media">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt="" fill sizes="(max-width: 640px) 104px, 120px" />
          ) : (
            <span className="product-card-initial" aria-hidden>
              {product.name.charAt(0)}
            </span>
          )}
        </span>
        {!product.soldOut && !quick && <CardPlus productId={product.id} />}
      </Link>
      {quick && <QuickAddButton product={product} sectionLabel={sectionLabel} />}
    </article>
  );
}
