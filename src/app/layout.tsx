import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  // Base para las URLs absolutas de las vistas previas (Open Graph). Configurala al publicar.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "viasap · Tu menú online, tus pedidos por WhatsApp",
  description: "Catálogo online para rotiserías y locales de comida. Los pedidos llegan listos a tu WhatsApp.",
  // Cada tienda lo reemplaza por su logo en su layout.
  icons: { icon: "/viasap-icon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
