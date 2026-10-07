import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChatDots, Phone, Shop, Whatsapp } from "react-bootstrap-icons";
import { listBusinesses } from "@/lib/data";

// Portada de la plataforma. En la beta presenta la idea y lista las tiendas de ejemplo.
export default async function Home() {
  const businesses = await listBusinesses();

  return (
    <main className="landing">
      <header className="landing-hero">
        <div className="landing-inner">
          <span className="brand-mark">
            <ChatDots aria-hidden /> viasap
          </span>
          <h1 className="landing-title">
            Tu menú online.
            <br />
            <em>Los pedidos, directo a tu WhatsApp.</em>
          </h1>
          <p className="landing-lead">
            Para rotiserías, hamburgueserías y locales de comida: tus clientes eligen desde el celular y te llega el
            pedido completo, listo para preparar.
          </p>
          <ul className="landing-points">
            <li>
              <Phone aria-hidden /> Sin descargar nada: funciona en el navegador
            </li>
            <li>
              <Shop aria-hidden /> Un link propio para tu Instagram y tus estados
            </li>
            <li>
              <Whatsapp aria-hidden /> Pedido, envío y pago en un solo mensaje
            </li>
          </ul>
        </div>
      </header>

      <section className="landing-inner landing-stores">
        <h2 className="landing-subtitle">Probá una tienda de ejemplo</h2>
        <div className="store-tiles">
          {businesses.map((business) => (
            <Link key={business.slug} href={`/${business.slug}`} className="store-tile">
              {/* El logo entero sobre fondo oscuro. */}
              <span className="store-tile-cover">
                <Image
                  src={business.logoUrl}
                  alt=""
                  fill
                  sizes="(max-width: 700px) 100vw, 360px"
                />
              </span>
              <span className="store-tile-body">
                <Image src={business.logoUrl} alt="" width={52} height={52} className="store-tile-logo" />
                <span className="store-tile-name">{business.name}</span>
                <span className="store-tile-desc">{business.description}</span>
                <span className="store-tile-foot">
                  {business.address.city}, {business.address.province}
                  <ArrowUpRight aria-hidden />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="landing-footer">viasap · beta</footer>
    </main>
  );
}
