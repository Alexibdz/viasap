import Link from "next/link";
import { notFound } from "next/navigation";
import { JournalText } from "react-bootstrap-icons";
import MenuSection from "@/components/store/MenuSection";
import OffersCarousel from "@/components/store/OffersCarousel";
import StoreHeader from "@/components/store/StoreHeader";
import { designFor } from "@/designs";
import { getBusiness, getMenu } from "@/lib/data";
import { featuredOffers, listedCategories, menuOffers } from "@/lib/menu";

export default async function StorePage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const [business, menu] = await Promise.all([getBusiness(slug), getMenu(slug)]);
  if (!business || !menu) notFound();

  const featured = featuredOffers(menu);
  const offers = menuOffers(menu);
  // Las ofertas van en el carrusel de arriba: su categoría no se repite en la lista.
  const categories = listedCategories(menu);
  const { products: layout } = designFor(slug);

  return (
    <div className="storefront">
      <StoreHeader />
      <main className="menu">
        {menu.length === 0 && (
          <div className="empty-state">
            <JournalText size={28} aria-hidden />
            <p>Estamos armando el menú. Volvé en un rato.</p>
          </div>
        )}
        {featured.length > 0 && <OffersCarousel slug={slug} items={featured} offers={offers} />}
        {categories.length > 0 && (
          <section className="menu-categories" aria-label="Menú">
            {categories.map((category) => (
              <MenuSection key={category.id} slug={slug} category={category} offers={offers} layout={layout} />
            ))}
          </section>
        )}
        <footer className="store-footer">
          <p>
            <strong>{business.name}</strong> · {business.address.street}, {business.address.city}
          </p>
          <p>
            Pedidos online con <Link href="/">viasap</Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
