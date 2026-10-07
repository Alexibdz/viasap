import Link from "next/link";
import { notFound } from "next/navigation";
import { JournalText } from "react-bootstrap-icons";
import FeaturedRail from "@/components/store/FeaturedRail";
import MenuSection from "@/components/store/MenuSection";
import StoreHero from "@/components/store/StoreHero";
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

  return (
    <div className="storefront">
      <StoreHero />
      <main className="menu">
        {menu.length === 0 && (
          <div className="empty-state">
            <JournalText size={28} aria-hidden />
            <p>Estamos armando el menú. Volvé en un rato.</p>
          </div>
        )}
        {featured.length > 0 && <FeaturedRail slug={slug} items={featured} offers={offers} />}
        {categories.length > 0 && (
          <section className="menu-categories" aria-label="Menú">
            {categories.map((category) => (
              <MenuSection key={category.id} slug={slug} category={category} offers={offers} />
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
