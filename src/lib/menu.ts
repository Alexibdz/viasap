import { hasNamedVariants, priceFrom } from "./pricing";
import type { Category, Product, ProductContext, SearchEntry, Subcategory } from "./types";

/**
 * ¿Vale la pena mostrar el nombre del grupo? No cuando la categoría tiene un solo
 * grupo con productos, ni cuando el grupo tiene un único producto con su mismo nombre.
 */
export function showsSubcategoryName(category: Category, subcategory: Subcategory): boolean {
  if (category.subcategories.filter((s) => s.products.length).length < 2) return false;
  const [only] = subcategory.products;
  return !(subcategory.products.length === 1 && only.name.toLowerCase() === subcategory.name.toLowerCase());
}

/** Encabezado del producto en el mensaje de WhatsApp: "Minutas · De pollo" o "Bebidas". */
export function sectionLabel(category: Category, subcategory: Subcategory): string {
  return showsSubcategoryName(category, subcategory) ? `${category.name} · ${subcategory.name}` : category.name;
}

/**
 * El menú que ve el cliente: sin grupos vacíos ni categorías sin productos (por
 * ejemplo, una categoría recién creada en el panel). Los agotados se muestran.
 */
export function visibleMenu(menu: Category[]): Category[] {
  return menu
    .map((category) => ({ ...category, subcategories: category.subcategories.filter((s) => s.products.length) }))
    .filter((category) => category.subcategories.length > 0);
}

export function categoryProducts(category: Category): Product[] {
  return category.subcategories.flatMap((s) => s.products);
}

export function allProducts(menu: Category[]): Product[] {
  return menu.flatMap(categoryProducts);
}

export function featuredProducts(menu: Category[]): Product[] {
  return allProducts(menu).filter((p) => p.featured && !p.soldOut);
}

export function findProduct(menu: Category[], productId: string): ProductContext | null {
  for (const category of menu) {
    for (const subcategory of category.subcategories) {
      const product = subcategory.products.find((p) => p.id === productId);
      if (product) {
        return {
          product,
          category: { id: category.id, name: category.name },
          sectionLabel: sectionLabel(category, subcategory),
        };
      }
    }
  }
  return null;
}

/** Índice liviano para el buscador (se manda al navegador). */
export function buildSearchIndex(menu: Category[]): SearchEntry[] {
  return menu.flatMap((category) =>
    categoryProducts(category).map((product) => ({
      productId: product.id,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      categoryId: category.id,
      categoryName: category.name,
      priceFrom: priceFrom(product),
      hasVariants: hasNamedVariants(product),
      soldOut: Boolean(product.soldOut),
    })),
  );
}

/** Se puede agregar al pedido sin abrir el detalle (no hay nada para elegir). */
export function isQuickAdd(product: Product): boolean {
  return !product.soldOut && !product.variants?.length && !product.optionGroups?.length;
}
