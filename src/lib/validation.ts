// Limpieza de datos que llegan del navegador (formularios del panel y pedidos).
// Todo lo que viene del cliente se trata como no confiable.

export const HEX_COLOR = /^#[0-9a-f]{6}$/i;
export const SAFE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Texto de una línea: sin espacios repetidos y con largo máximo. */
export function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

/** Texto de varias líneas (descripciones): conserva saltos de línea simples. */
export function cleanMultiline(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

/** Monto en pesos, entero y no negativo. null si no es un número válido. */
export function toAmount(value: unknown, max = 100_000_000): number | null {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof number !== "number" || !Number.isFinite(number) || number < 0 || number > max) return null;
  return Math.round(number);
}

/** Entero dentro de un rango. null si no corresponde. */
export function toInt(value: unknown, min: number, max: number): number | null {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof number !== "number" || !Number.isInteger(number) || number < min || number > max) return null;
  return number;
}

/** "Papas con cheddar" → "papas-con-cheddar". */
export function slugify(text: string, max = 40): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/, "");
}

/** Un id derivado del nombre que no choque con los existentes: "papas", "papas-2"… */
export function uniqueId(name: string, taken: Iterable<string>, fallback = "item"): string {
  const used = new Set(taken);
  const base = slugify(name) || fallback;
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}
