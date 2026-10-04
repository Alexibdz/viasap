/** "$10.500". Agrupa con punto sin depender de ICU, así coincide en servidor y navegador. */
export function formatMoney(value: number): string {
  const rounded = Math.round(Math.abs(value));
  const digits = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${value < 0 && rounded > 0 ? "-" : ""}$${digits}`;
}

/** "$ 20.000" o "20000" → 20000. Devuelve 0 si no hay dígitos. */
export function parseAmount(value: string): number {
  return Number(onlyDigits(value)) || 0;
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** "04/10/26 02:17 hs" en la zona horaria del local. */
export function formatOrderDate(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("es-AR", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${part("day")}/${part("month")}/${part("year")} ${part("hour")}:${part("minute")} hs`;
}

/**
 * Minúsculas y sin tildes, para buscar "cafe" y encontrar "Café". Conserva la
 * longitud del texto, así una coincidencia se puede resaltar en el original.
 */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
