import { ChevronDown } from "react-bootstrap-icons";
import { categoryProducts, isOfferProduct, sectionLabel, showsSubcategoryName } from "@/lib/menu";
import type { Category, OfferInfo } from "@/lib/types";
import CategoryDetails from "./CategoryDetails";
import ProductCard from "./ProductCard";

interface MenuSectionProps {
  slug: string;
  category: Category;
  /** Lo que incluye cada oferta del menú, por id de producto. */
  offers: Record<string, OfferInfo>;
}

export default function MenuSection({ slug, category, offers }: MenuSectionProps) {
  const count = categoryProducts(category).length;
  const unit = category.kind === "offers" ? (count === 1 ? "oferta" : "ofertas") : count === 1 ? "opción" : "opciones";

  return (
    <CategoryDetails
      id={`c-${category.id}`}
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
          <div className="product-grid">
            {subcategory.products.map((product) => (
              <ProductCard
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
