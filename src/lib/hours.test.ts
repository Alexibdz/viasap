import { describe, expect, it } from "vitest";
import { atTime, describeStatus, formatDayRanges, getOpenStatus, statusCard } from "./hours";
import type { WeeklySchedule } from "./types";

const TZ = "America/Argentina/Buenos_Aires";

// Semana del 4/10/2026: domingo 4, miércoles 7, jueves 8, viernes 9, sábado 10.
const schedule: WeeklySchedule = {
  0: [],
  1: [],
  2: [],
  3: [{ open: "20:00", close: "00:30" }],
  4: [],
  5: [
    { open: "20:00", close: "01:30" },
    { open: "11:00", close: "14:30" },
  ],
  6: [],
};

const at = (localTime: string) => new Date(`${localTime}-03:00`);

describe("getOpenStatus", () => {
  it("está abierto dentro de una franja", () => {
    expect(getOpenStatus(schedule, TZ, at("2026-10-07T21:00:00"))).toEqual({ open: true, closesAt: "00:30" });
  });

  it("sigue abierto después de la medianoche si la franja de ayer cruza el día", () => {
    expect(getOpenStatus(schedule, TZ, at("2026-10-08T00:15:00"))).toEqual({ open: true, closesAt: "00:30" });
    expect(getOpenStatus(schedule, TZ, at("2026-10-10T01:00:00"))).toEqual({ open: true, closesAt: "01:30" });
  });

  it("calcula la próxima apertura cuando está cerrado", () => {
    expect(getOpenStatus(schedule, TZ, at("2026-10-08T00:45:00"))).toEqual({
      open: false,
      nextOpening: { day: 5, time: "11:00", daysAhead: 1 },
    });
    expect(getOpenStatus(schedule, TZ, at("2026-10-09T15:00:00"))).toEqual({
      open: false,
      nextOpening: { day: 5, time: "20:00", daysAhead: 0 },
    });
    expect(getOpenStatus(schedule, TZ, at("2026-10-04T10:00:00"))).toEqual({
      open: false,
      nextOpening: { day: 3, time: "20:00", daysAhead: 3 },
    });
  });

  it("usa la zona horaria del local y no la del dispositivo", () => {
    // 00:15 UTC del jueves = 21:15 del miércoles en Argentina.
    expect(getOpenStatus(schedule, TZ, new Date("2026-10-08T00:15:00Z")).open).toBe(true);
  });

  it("encuentra la apertura de la semana siguiente", () => {
    const onlyWednesday: WeeklySchedule = { ...schedule, 5: [] };
    expect(getOpenStatus(onlyWednesday, TZ, at("2026-10-07T01:00:00"))).toEqual({
      open: false,
      nextOpening: { day: 3, time: "20:00", daysAhead: 0 },
    });
    expect(getOpenStatus(onlyWednesday, TZ, at("2026-10-08T02:00:00"))).toEqual({
      open: false,
      nextOpening: { day: 3, time: "20:00", daysAhead: 6 },
    });
  });

  it("devuelve null si no hay horarios cargados", () => {
    const empty: WeeklySchedule = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    expect(getOpenStatus(empty, TZ, at("2026-10-07T21:00:00"))).toEqual({ open: false, nextOpening: null });
  });
});

describe("textos de horarios", () => {
  it("describe el estado", () => {
    expect(describeStatus({ open: true, closesAt: "00:30" })).toBe("Abierto ahora · cierra a las 00:30");
    expect(describeStatus({ open: false, nextOpening: { day: 5, time: "20:00", daysAhead: 0 } })).toBe(
      "Abrimos hoy a las 20:00",
    );
    expect(describeStatus({ open: false, nextOpening: { day: 5, time: "11:00", daysAhead: 1 } })).toBe(
      "Abrimos mañana a las 11:00",
    );
    expect(describeStatus({ open: false, nextOpening: { day: 3, time: "20:00", daysAhead: 3 } })).toBe(
      "Abrimos el miércoles a las 20:00",
    );
  });

  it("arma la tarjeta de estado de la cabecera", () => {
    expect(statusCard({ open: true, closesAt: "00:30" })).toEqual({
      tone: "open",
      title: "Abierto ahora",
      detail: "Cierra a las 00:30",
    });
    expect(statusCard({ open: true, closesAt: "01:30" }).detail).toBe("Cierra a la 01:30");
    expect(statusCard({ open: false, nextOpening: { day: 5, time: "20:00", daysAhead: 0 } })).toEqual({
      tone: "closed",
      title: "Cerrado ahora",
      detail: "Abre hoy a las 20:00",
    });
    expect(statusCard({ open: false, nextOpening: { day: 3, time: "20:00", daysAhead: 4 } }).detail).toBe(
      "Abre el miércoles a las 20:00",
    );
    expect(statusCard({ open: false, nextOpening: null }).detail).toBe("Sin horarios cargados");
    // En pausa manda la pausa, abierto o no; sin la hora, neutra.
    expect(statusCard({ open: true, closesAt: "00:30" }, true)).toEqual({
      tone: "paused",
      title: "Pedidos en pausa",
      detail: "Volvemos en un rato",
    });
    expect(statusCard(null).tone).toBe("unknown");
    expect(atTime("13:00")).toBe("a las 13:00");
  });

  it("formatea las franjas de un día", () => {
    expect(formatDayRanges([])).toBe("Cerrado");
    expect(formatDayRanges(schedule[5])).toBe("20:00 a 01:30 y 11:00 a 14:30");
  });
});
