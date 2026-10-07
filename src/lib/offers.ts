import { hasNamedVariants, priceFrom, productVariants } from "./pricing";
import type { BundleLine, OfferInfo, Product } from "./types";

// Ofertas: productos armados con otros productos del menú y un precio especial.
// Lo que incluyen se resuelve siempre con el menú actual (nombres y precios al día).

export function productIndex(products: Product[]): Map<string, Product> {
  return new Map(products.map((product) => [product.id, product]));
}

/** Lo que incluye la oferta y cuánto se ahorra. Lo que ya no está en el menú se omite. */
export function resolveOffer(product: Product, catalog: Map<string, Product>): OfferInfo | null {
  if (!product.bundle?.length) return null;
  const lines: BundleLine[] = [];
  for (const item of product.bundle) {
    const included = catalog.get(item.productId);
    if (!included || included.id === product.id) continue;
    const variants = productVariants(included);
    const named = hasNamedVariants(included);
    // Si la presentación ya no existe, se toma la primera para no perder la línea.
    const variant = (named && variants.find((v) => v.id === item.variantId)) || variants[0];
    lines.push({
      productId: included.id,
      name: named ? `${included.name} (${variant.name})` : included.name,
      qty: item.qty,
      price: variant.price * item.qty,
    });
  }
  if (!lines.length) return null;
  const regularPrice = lines.reduce((sum, line) => sum + line.price, 0);
  return { lines, regularPrice, savings: Math.max(0, regularPrice - priceFrom(product)) };
}

/** "2x Classic (Doble), 1x Papas fritas (Grande)": para el mensaje, la comanda y el carrito. */
export function offerIncludesText(lines: BundleLine[]): string {
  return lines.map((line) => `${line.qty}x ${line.name}`).join(", ");
}

/** Ahorro en porcentaje, redondeado (0 si no hay ahorro). */
export function savingsPercent(offer: OfferInfo): number {
  return offer.regularPrice > 0 ? Math.round((offer.savings / offer.regularPrice) * 100) : 0;
}

/** Ofertas que incluyen un producto: no se puede borrar sin sacarlo antes de ellas. */
export function offersIncluding(products: Product[], productId: string): Product[] {
  return products.filter((p) => p.id !== productId && p.bundle?.some((item) => item.productId === productId));
}
