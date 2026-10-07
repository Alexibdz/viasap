import { themeCss } from "@/lib/theme";
import type { Theme } from "@/lib/types";
import { brasa } from "./brasa";
import { tipografico } from "./tipografico";

// Diseño de cada negocio. Lo arma viasap en el código; el local no lo configura.
// Los componentes y el comportamiento son los mismos para todos los negocios: el
// diseño solo cambia cómo se ven (variables CSS, fuentes, tipo de tarjeta) y sus
// estilos propios van en el .css del diseño, bajo [data-design="<id>"].

/** Cómo se muestran los productos de una categoría: tiles con foto o filas en lista. */
export type ProductLayout = "tiles" | "rows";

export interface StoreDesign {
  id: string;
  /** Color de marca (botones, selección) y de acento: de acá salen los tonos derivados. */
  theme: Theme;
  /** Variables CSS que pisan las de globals.css en las páginas de la tienda. */
  tokens: Record<string, string>;
  /** Color de la barra del navegador en el celular. */
  themeColor: string;
  products: ProductLayout;
}

/** Diseño de base para un negocio que todavía no tiene el suyo. */
const base: StoreDesign = {
  id: "base",
  theme: { primary: "#e8590c", accent: "#ffd43b" },
  tokens: {},
  themeColor: "#f6f2ec",
  products: "rows",
};

const bySlug: Record<string, StoreDesign> = {
  "costanera-burgers": brasa,
  "rotiseria-alexis": tipografico,
};

export function designFor(slug: string): StoreDesign {
  return bySlug[slug] ?? base;
}

/** Variables CSS del diseño: primero los tonos de marca, después lo propio del diseño. */
export function designCss(design: StoreDesign): string {
  const tokens = Object.entries(design.tokens).map(([name, value]) => `${name}:${value}`);
  return themeCss(design.theme) + (tokens.length ? `:root{${tokens.join(";")}}` : "");
}
