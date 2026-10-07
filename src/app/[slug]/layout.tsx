import type { Metadata, Viewport } from "next";
import { Anton, Archivo } from "next/font/google";
import { notFound } from "next/navigation";
import CartPill from "@/components/store/CartPill";
import { StoreProvider } from "@/components/store/StoreProvider";
import { StoreUiProvider } from "@/components/store/StoreUi";
import { ToastProvider } from "@/components/store/ToastProvider";
import { getBusiness, getMenu, listBusinesses } from "@/lib/data";
import { NavigationTracker } from "@/lib/navigation";
import { themeCss } from "@/lib/theme";

// Fuentes de la portada de la tienda ("Tipográfico"): Anton para el nombre y la cinta, Archivo para el resto.
const heroDisplay = Anton({ weight: "400", subsets: ["latin"], variable: "--font-hero-display" });
const heroText = Archivo({ weight: ["500", "600", "700", "800"], subsets: ["latin"], variable: "--font-hero-text" });

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
      // Sin foto para compartir, la vista previa muestra el logo.
      images: [business.coverUrl ?? business.logoUrl],
    },
  };
}

export async function generateViewport({ params }: LayoutProps<"/[slug]">): Promise<Viewport> {
  const { slug } = await params;
  const business = await getBusiness(slug);
  return { themeColor: business?.theme.primary };
}

export default async function StoreLayout({ children, modal, params }: LayoutProps<"/[slug]">) {
  const { slug } = await params;
  const [business, menu] = await Promise.all([getBusiness(slug), getMenu(slug)]);
  if (!business || !menu) notFound();

  return (
    <StoreProvider business={business}>
      <style>{themeCss(business.theme)}</style>
      <ToastProvider>
        <StoreUiProvider>
          <NavigationTracker />
          <div className={`${heroDisplay.variable} ${heroText.variable}`}>
            {children}
            {modal}
          </div>
          <CartPill />
        </StoreUiProvider>
      </ToastProvider>
    </StoreProvider>
  );
}
