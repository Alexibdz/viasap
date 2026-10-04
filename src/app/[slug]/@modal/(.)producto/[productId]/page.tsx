import ProductSheet from "@/components/store/ProductSheet";
import { getMenu, getProduct } from "@/lib/data";
import { allProducts } from "@/lib/menu";

export async function generateStaticParams({ params }: { params: { slug: string } }) {
  const menu = await getMenu(params.slug);
  return allProducts(menu ?? []).map((product) => ({ productId: product.id }));
}

// Producto abierto desde el menú: se intercepta la ruta /[slug]/producto/[id] y se
// muestra como hoja sobre el menú. Con un link directo se ve la página completa.
export default async function ProductModal({ params }: { params: Promise<{ slug: string; productId: string }> }) {
  const { slug, productId } = await params;
  const context = await getProduct(slug, productId);
  if (!context) return null;
  return <ProductSheet key={productId} context={context} />;
}
