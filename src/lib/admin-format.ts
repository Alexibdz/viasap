import type { PaymentMethod } from "./types";

// Formatos del panel. Las horas siempre se muestran en la zona horaria del local.

/** "02:17" */
export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("es-AR", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
    new Date(iso),
  );
}

/** "2026-10-04": sirve para comparar días en la zona del local. */
export function dayKey(date: Date | number | string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(date),
  );
}

export function isSameDay(iso: string, now: number, timeZone: string): boolean {
  return dayKey(iso, timeZone) === dayKey(now, timeZone);
}

/** "Domingo 4 de octubre" */
export function formatDayTitle(now: number, timeZone: string): string {
  const text = new Intl.DateTimeFormat("es-AR", { timeZone, weekday: "long", day: "numeric", month: "long" }).format(
    new Date(now),
  );
  return text.charAt(0).toUpperCase() + text.slice(1).replace(",", "");
}

/** "recién", "hace 5 min", "hace 2 h", "hace 3 días". */
export function timeAgo(iso: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - Date.parse(iso)) / 60_000));
  if (minutes < 1) return "recién";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} ${days === 1 ? "día" : "días"}`;
}

export function paymentLabel(method: PaymentMethod): string {
  return { cash: "Efectivo", transfer: "Transferencia", mixed: "Efectivo + transferencia" }[method];
}
