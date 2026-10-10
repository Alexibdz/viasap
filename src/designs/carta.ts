import type { StoreDesign } from "./index";

/**
 * "Carta" (Rotisería Alexis): como la carta impresa de un restaurante. Papel cálido,
 * el nombre en Anton con la última palabra en amarillo, los productos en renglones
 * con puntos hasta el precio y las descripciones en cursiva (Instrument Serif).
 * Las categorías siguen siendo tarjetas con emoji que se despliegan.
 */
export const carta: StoreDesign = {
  id: "carta",
  theme: { primary: "#f29100", accent: "#f2b631" },
  themeColor: "#f3ead8",
  products: "rows",
  tokens: {
    "--paper": "#f3ead8",
    "--paper-deep": "#e6d9c0",
    "--card": "#fffaf1",
    "--ink": "#1b130b",
    "--ink-2": "#4a3a2b",
    "--muted": "#6b5a48",
    "--line": "#e3d5bc",
    "--line-strong": "#cdbb9c",
    "--brand-ink": "#1b130b",
    "--accent-ink": "#1b130b",
    "--closed": "#d63a1f",
    "--open": "#2f8a4c",
    "--img-ph": "#e6d9c0",
    "--logo-bg": "#2a211a",
    "--font-text": "var(--font-archivo)",
    "--font-heading": "var(--font-archivo)",
    "--font-name": "var(--font-anton)",
    "--font-label": "var(--font-archivo)",
    "--font-status": "var(--font-archivo)",
    "--font-strong": "var(--font-archivo)",
    "--name-size": "64px",
    "--name-fit": "0.5",
    "--r-status": "16px",
    "--r-chip": "14px",
    "--r-offer": "18px",
    "--r-tile": "18px",
    "--r-btn": "12px",
  },
};
