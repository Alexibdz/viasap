import type { TimeRange, Weekday, WeeklySchedule } from "./types";

export const WEEKDAY_NAMES: Record<Weekday, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

/** Orden para mostrar la semana, de lunes a domingo. */
export const WEEK_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

const SHORT_WEEKDAYS: Record<string, Weekday> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function crossesMidnight(range: TimeRange): boolean {
  return toMinutes(range.close) <= toMinutes(range.open);
}

/** Día de la semana y minutos desde la medianoche en la zona horaria del local. */
export function zonedWeekTime(date: Date, timeZone: string): { day: Weekday; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return {
    day: SHORT_WEEKDAYS[part("weekday")],
    minutes: Number(part("hour")) * 60 + Number(part("minute")),
  };
}

export type OpenStatus =
  | { open: true; closesAt: string }
  | { open: false; nextOpening: { day: Weekday; time: string; daysAhead: number } | null };

export function getOpenStatus(schedule: WeeklySchedule, timeZone: string, date: Date): OpenStatus {
  const { day, minutes } = zonedWeekTime(date, timeZone);

  for (const range of schedule[day]) {
    const open = toMinutes(range.open);
    const inRange = crossesMidnight(range)
      ? minutes >= open
      : minutes >= open && minutes < toMinutes(range.close);
    if (inRange) return { open: true, closesAt: range.close };
  }

  // Franjas de ayer que terminan después de la medianoche.
  const yesterday = ((day + 6) % 7) as Weekday;
  for (const range of schedule[yesterday]) {
    if (crossesMidnight(range) && minutes < toMinutes(range.close)) {
      return { open: true, closesAt: range.close };
    }
  }

  for (let daysAhead = 0; daysAhead <= 7; daysAhead++) {
    const candidate = ((day + daysAhead) % 7) as Weekday;
    const ranges = [...schedule[candidate]].sort((a, b) => toMinutes(a.open) - toMinutes(b.open));
    for (const range of ranges) {
      if (daysAhead === 0 && toMinutes(range.open) <= minutes) continue;
      return { open: false, nextOpening: { day: candidate, time: range.open, daysAhead } };
    }
  }
  return { open: false, nextOpening: null };
}

/** "a las 20:00", o "a la 01:30" (la una). */
export function atTime(time: string): string {
  return time.startsWith("01:") ? `a la ${time}` : `a las ${time}`;
}

function openingDay(next: { day: Weekday; daysAhead: number }): string {
  if (next.daysAhead === 0) return "hoy";
  if (next.daysAhead === 1) return "mañana";
  return `el ${WEEKDAY_NAMES[next.day].toLowerCase()}`;
}

/** "Abierto ahora · cierra a las 00:30" / "Abrimos hoy a las 20:00". */
export function describeStatus(status: OpenStatus): string {
  if (status.open) return `Abierto ahora · cierra ${atTime(status.closesAt)}`;
  const next = status.nextOpening;
  if (!next) return "Por ahora no tenemos horarios de atención cargados.";
  return `Abrimos ${openingDay(next)} ${atTime(next.time)}`;
}

export type StatusTone = "open" | "closed" | "paused" | "unknown";

/**
 * Lo que dice la tarjeta de estado de la cabecera. Sin la hora (en el servidor, antes
 * de hidratar) no se sabe si está abierto: queda neutra hasta que se sepa.
 */
export function statusCard(
  status: OpenStatus | null,
  paused = false,
): { tone: StatusTone; title: string; detail: string } {
  if (paused) return { tone: "paused", title: "Pedidos en pausa", detail: "Volvemos en un rato" };
  if (!status) return { tone: "unknown", title: "Horarios", detail: "Mirá cuándo atendemos" };
  if (status.open) return { tone: "open", title: "Abierto ahora", detail: `Cierra ${atTime(status.closesAt)}` };
  const next = status.nextOpening;
  if (!next) return { tone: "closed", title: "Cerrado", detail: "Sin horarios cargados" };
  return { tone: "closed", title: "Cerrado ahora", detail: `Abre ${openingDay(next)} ${atTime(next.time)}` };
}

export function formatDayRanges(ranges: TimeRange[]): string {
  if (!ranges.length) return "Cerrado";
  return ranges.map((r) => `${r.open} a ${r.close}`).join(" y ");
}
