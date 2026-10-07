import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import OrderBar from "@/components/store/OrderBar";
import { StoreProvider } from "@/components/store/StoreProvider";
import { StoreUiProvider } from "@/components/store/StoreUi";
import { ToastProvider } from "@/components/store/ToastProvider";
import { designCss, designFor } from "@/designs";
import { designFontsCss } from "@/designs/fonts";
import { getBusiness, getMenu, listBusinesses } from "@/lib/data";
import { NavigationTracker } from "@/lib/navigation";
// Estilos propios de cada diseño, todos bajo [data-design="<id>"].
import "@/designs/brasa.css";
import "@/designs/tipografico.css";

export async function generateStaticParams() {
  const businesses = await listBusinesses();
  return businesses.map((business) => ({ slug: business.slug }));
}

export async function generateMetadata({ params }: LayoutProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusiness(slug);
  if (!business) return {};
  const description = business.description ?? `Mirá el menú de ${business.name} y pedí por WhatsApp.`;
  return {
    title: { default: `${business.name} · Menú y pedidos`, template: `%s · ${business.name}` },
    description,
    icons: { icon: business.logoUrl },
    openGraph: {
      title: business.name,
      description,
      type: "website",
      locale: "es_AR",
      // La vista previa al compartir el link muestra el logo.
      images: [business.logoUrl],
    },
  };
}

export async function generateViewport({ params }: LayoutProps<"/[slug]">): Promise<Viewport> {
  const { slug } = await params;
  return { themeColor: designFor(slug).themeColor };
}

export default async function StoreLayout({ children, modal, params }: LayoutProps<"/[slug]">) {
  const { slug } = await params;
  const [business, menu] = await Promise.all([getBusiness(slug), getMenu(slug)]);
  if (!business || !menu) notFound();
  // El diseño es del negocio, armado en el código: el local no lo configura.
  const design = designFor(slug);

  return (
    <StoreProvider business={business}>
      {/* En :root, así también lo toman las hojas, que se abren fuera de esta página. */}
      <style>{designFontsCss + designCss(design)}</style>
      <ToastProvider>
        <StoreUiProvider>
          <NavigationTracker />
          <div data-design={design.id}>
            {children}
            {modal}
            <OrderBar />
          </div>
        </StoreUiProvider>
      </ToastProvider>
    </StoreProvider>
  );
}
