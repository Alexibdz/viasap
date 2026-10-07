import { productIndex, resolveOffer } from "./offers";
import { priceFrom, showsPriceFrom } from "./pricing";
import type { Category, OfferInfo, Product, ProductContext, SearchEntry, Subcategory } from "./types";

/**
 * ¿Vale la pena mostrar el nombre del grupo? No cuando la categoría tiene un solo
 * grupo con productos, ni cuando el grupo tiene un único producto con su mismo nombre.
 */
export function showsSubcategoryName(category: Category, subcategory: Subcategory): boolean {
  if (category.subcategories.filter((s) => s.products.length).length < 2) return false;
  const [only] = subcategory.products;
  return !(subcategory.products.length === 1 && only.name.toLowerCase() === subcategory.name.toLowerCase());
}

/**
 * Encabezado del producto en el mensaje de WhatsApp: "Minutas · De pollo" o "Bebidas".
 * Un grupo que se llama igual que su categoría ("Pizzas" junto a "Promos") no se repite.
 */
export function sectionLabel(category: Category, subcategory: Subcategory): string {
  const sameName = subcategory.name.trim().toLowerCase() === category.name.trim().toLowerCase();
  return showsSubcategoryName(category, subcategory) && !sameName ? `${category.name} · ${subcategory.name}` : category.name;
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

/** Es una oferta si se marcó así, si se armó con productos o si está en la categoría de ofertas. */
export function isOfferProduct(product: Product, category: Pick<Category, "kind">): boolean {
  return Boolean(product.isOffer || product.bundle?.length || category.kind === "offers");
}

export interface FeaturedOffer {
  product: Product;
  /** Emoji de su categoría, para las ofertas sin foto. */
  emoji?: string;
}

/** "Ofertas destacadas": las ofertas marcadas como destacadas, de cualquier categoría (sin agotadas). */
export function featuredOffers(menu: Category[]): FeaturedOffer[] {
  return menu.flatMap((category) =>
    categoryProducts(category)
      .filter((p) => p.featured && !p.soldOut && isOfferProduct(p, category))
      .map((product) => ({ product, emoji: category.emoji })),
  );
}

export function findProduct(menu: Category[], productId: string): ProductContext | null {
  for (const category of menu) {
    for (const subcategory of category.subcategories) {
      const product = subcategory.products.find((p) => p.id === productId);
      if (product) {
        const offer = resolveOffer(product, productIndex(allProducts(menu)));
        return {
          product,
          category: { id: category.id, name: category.name },
          sectionLabel: sectionLabel(category, subcategory),
          allowsNotes: !category.hideNotes,
          ...(offer ? { offer } : {}),
        };
      }
    }
  }
  return null;
}

/** Lo que incluye cada oferta del menú, por id de producto. */
export function menuOffers(menu: Category[]): Record<string, OfferInfo> {
  const products = allProducts(menu);
  const catalog = productIndex(products);
  const offers: Record<string, OfferInfo> = {};
  for (const product of products) {
    const offer = resolveOffer(product, catalog);
    if (offer) offers[product.id] = offer;
  }
  return offers;
}

/** "🍕 Pizzas" (el emoji es decoración: no va en el mensaje de WhatsApp). */
export function categoryLabel(category: Pick<Category, "name" | "emoji">): string {
  return category.emoji ? `${category.emoji} ${category.name}` : category.name;
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
      hasVariants: showsPriceFrom(product),
      soldOut: Boolean(product.soldOut),
    })),
  );
}

/** Se puede agregar al pedido sin abrir el detalle (no hay nada para elegir). */
export function isQuickAdd(product: Product): boolean {
  return !product.soldOut && !product.variants?.length && !product.optionGroups?.length;
}
