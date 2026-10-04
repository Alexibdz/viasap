import Image from "next/image";
import Link from "next/link";
import { Fire } from "react-bootstrap-icons";
import { formatMoney } from "@/lib/format";
import { hasNamedVariants, priceFrom } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { CardPlus } from "./CardActions";

/** Carrusel "Lo más pedido" arriba del menú. */
export default function FeaturedRail({ slug, products }: { slug: string; products: Product[] }) {
  return (
    <section id="c-destacados" className="menu-section" aria-labelledby="t-destacados">
      <div className="menu-section-head">
        <h2 id="t-destacados" className="menu-section-title">
          <Fire className="featured-icon" aria-hidden /> Lo más pedido
        </h2>
      </div>
      <div className="featured-rail">
        {products.map((product) => (
          <Link key={product.id} href={`/${slug}/producto/${product.id}`} scroll={false} className="featured-card">
            <span className="featured-media">
              {product.imageUrl && <Image src={product.imageUrl} alt="" fill sizes="180px" />}
              <CardPlus productId={product.id} />
            </span>
            <span className="featured-name">{product.name}</span>
            <span className="featured-price">
              {hasNamedVariants(product) && <small>desde </small>}
              {formatMoney(priceFrom(product))}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
