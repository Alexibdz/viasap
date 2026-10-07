import { ChevronDown } from "react-bootstrap-icons";
import { categoryProducts, isOfferProduct, sectionLabel, showsSubcategoryName } from "@/lib/menu";
import type { ProductLayout } from "@/designs";
import type { Category, OfferInfo } from "@/lib/types";
import CategoryDetails from "./CategoryDetails";
import ProductCard from "./ProductCard";
import ProductTile from "./ProductTile";

interface MenuSectionProps {
  slug: string;
  category: Category;
  /** Lo que incluye cada oferta del menú, por id de producto. */
  offers: Record<string, OfferInfo>;
  /** Tiles con foto o filas en lista: lo decide el diseño del negocio. */
  layout: ProductLayout;
}

export default function MenuSection({ slug, category, offers, layout }: MenuSectionProps) {
  const Product = layout === "tiles" ? ProductTile : ProductCard;
  const count = categoryProducts(category).length;
  const unit = category.kind === "offers" ? (count === 1 ? "oferta" : "ofertas") : count === 1 ? "opción" : "opciones";

  return (
    <CategoryDetails
      id={`c-${category.id}`}
      defaultOpen={category.expanded}
      summary={
        <>
          <span className="menu-category-emoji" aria-hidden>
            {category.emoji ?? category.name.charAt(0)}
          </span>
          <span className="menu-category-text">
            <span className="menu-category-name">{category.name}</span>
            <span className="menu-category-count">
              {count} {unit}
            </span>
          </span>
          <ChevronDown className="menu-category-chevron" size={18} aria-hidden />
        </>
      }
    >
      {category.subcategories.map((subcategory) => (
        <div key={subcategory.id} className="menu-group">
          {showsSubcategoryName(category, subcategory) && <h3 className="menu-group-title">{subcategory.name}</h3>}
          <div className={layout === "tiles" ? "tile-grid" : "product-grid"}>
            {subcategory.products.map((product) => (
              <Product
                key={product.id}
                slug={slug}
                product={product}
                sectionLabel={sectionLabel(category, subcategory)}
                offer={offers[product.id]}
                isOffer={isOfferProduct(product, category)}
              />
            ))}
          </div>
        </div>
      ))}
    </CategoryDetails>
  );
}
