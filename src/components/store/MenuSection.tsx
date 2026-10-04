import { categoryProducts, sectionLabel, showsSubcategoryName } from "@/lib/menu";
import type { Category } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function MenuSection({ slug, category }: { slug: string; category: Category }) {
  const count = categoryProducts(category).length;

  return (
    <section id={`c-${category.id}`} className="menu-section" aria-labelledby={`t-${category.id}`}>
      <div className="menu-section-head">
        <h2 id={`t-${category.id}`} className="menu-section-title">
          {category.name}
        </h2>
        <span className="menu-section-count">
          {count} {count === 1 ? "opción" : "opciones"}
        </span>
      </div>
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
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
