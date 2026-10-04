import Link from "next/link";

export default function NotFound() {
  return (
    <main className="nf">
      <p className="nf-code">404</p>
      <h1 className="nf-title">Este plato no está en el menú</h1>
      <p className="nf-text">Puede que el link esté mal escrito o que la tienda ya no exista.</p>
      <Link href="/" className="btn-main">
        Ir al inicio
      </Link>
    </main>
  );
}
