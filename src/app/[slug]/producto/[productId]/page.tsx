import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppBar from "@/components/store/AppBar";
import { ProductPageForm } from "@/components/store/ProductSheet";
import { getBusiness, getMenu, getProduct } from "@/lib/data";
import { allProducts } from "@/lib/menu";

export async function generateStaticParams({ params }: { params: { slug: string } }) {
  const menu = await getMenu(params.slug);
  return allProducts(menu ?? []).map((product) => ({ productId: product.id }));
}

export async function generateMetadata({ params }: PageProps<"/[slug]/producto/[productId]">): Promise<Metadata> {
  const { slug, productId } = await params;
  const context = await getProduct(slug, productId);
  if (!context) return {};
  const { product } = context;
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.imageUrl ? [product.imageUrl] : undefined,
    },
  };
}

// Página completa del producto (link compartido o recarga). Desde el menú se abre como hoja.
export default async function ProductPage({ params }: PageProps<"/[slug]/producto/[productId]">) {
  const { slug, productId } = await params;
  const [business, context] = await Promise.all([getBusiness(slug), getProduct(slug, productId)]);
  if (!business || !context) notFound();

  return (
    <>
      <AppBar title={business.name} backHref={`/${slug}`} />
      <main className="product-page">
        <ProductPageForm context={context} storeHref={`/${slug}`} />
      </main>
    </>
  );
}
