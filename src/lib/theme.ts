import type { Theme } from "./types";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const INK = "#191714";

function channels(hex: string): number[] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Blanco si alcanza contraste 3:1 (textos de botón, en negrita), si no, tinta oscura. */
export function readableText(background: string): string {
  return 1.05 / (luminance(background) + 0.05) >= 3 ? "#ffffff" : INK;
}

/** Oscurece (amount < 0) o aclara (amount > 0) mezclando con negro o blanco. */
export function shade(hex: string, amount: number): string {
  const target = amount < 0 ? 0 : 255;
  const weight = Math.abs(amount);
  return `#${channels(hex)
    .map((c) => Math.round(c + (target - c) * weight).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Variables CSS de la tienda. Un color inválido se ignora y quedan los de globals.css. */
export function themeCss(theme: Theme): string {
  const declarations: string[] = [];
  if (HEX_COLOR.test(theme.primary)) {
    declarations.push(
      `--brand:${theme.primary}`,
      `--brand-ink:${readableText(theme.primary)}`,
      `--brand-press:${shade(theme.primary, -0.14)}`,
      `--brand-wash:${shade(theme.primary, 0.9)}`,
      `--brand-line:${shade(theme.primary, 0.65)}`,
    );
  }
  if (HEX_COLOR.test(theme.accent)) {
    declarations.push(`--accent:${theme.accent}`, `--accent-ink:${readableText(theme.accent)}`);
  }
  return `:root{${declarations.join(";")}}`;
}
