import { describe, expect, it } from "vitest";
import { formatDayTitle, formatTime, isSameDay, timeAgo } from "./admin-format";

const TZ = "America/Argentina/Buenos_Aires";

describe("formatos del panel", () => {
  it("muestra la hora del local", () => {
    expect(formatTime("2026-10-04T05:17:00.000Z", TZ)).toBe("02:17");
    expect(formatDayTitle(Date.parse("2026-10-04T15:00:00-03:00"), TZ)).toBe("Domingo 4 de octubre");
  });

  it("compara días en la zona del local, no en UTC", () => {
    const now = Date.parse("2026-10-04T23:30:00-03:00"); // ya es 5/10 en UTC
    expect(isSameDay("2026-10-04T01:00:00-03:00", now, TZ)).toBe(true);
    expect(isSameDay("2026-10-03T23:59:00-03:00", now, TZ)).toBe(false);
  });

  it("dice hace cuánto llegó un pedido", () => {
    const now = Date.parse("2026-10-04T12:00:00Z");
    expect(timeAgo("2026-10-04T11:59:40Z", now)).toBe("recién");
    expect(timeAgo("2026-10-04T11:55:00Z", now)).toBe("hace 5 min");
    expect(timeAgo("2026-10-04T09:00:00Z", now)).toBe("hace 3 h");
    expect(timeAgo("2026-10-03T11:00:00Z", now)).toBe("hace 1 día");
  });
});
