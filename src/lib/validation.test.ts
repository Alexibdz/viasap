import { describe, expect, it } from "vitest";
import { toWhatsAppNumber } from "./phone";
import { cleanMultiline, cleanText, slugify, toAmount, toInt, uniqueId } from "./validation";

describe("limpieza de datos", () => {
  it("limpia textos", () => {
    expect(cleanText("  Ana   Pérez \n", 60)).toBe("Ana Pérez");
    expect(cleanText(42, 10)).toBe("");
    expect(cleanText("abcdef", 3)).toBe("abc");
    expect(cleanMultiline("Línea 1  \r\n\r\n\r\n\r\n  Línea   2", 100)).toBe("Línea 1\n\nLínea 2");
  });

  it("lee montos y enteros", () => {
    expect(toAmount("8500")).toBe(8500);
    expect(toAmount(99.6)).toBe(100);
    expect(toAmount(-1)).toBeNull();
    expect(toAmount("")).toBeNull();
    expect(toAmount("abc")).toBeNull();
    expect(toInt("3", 1, 5)).toBe(3);
    expect(toInt(2.5, 1, 5)).toBeNull();
    expect(toInt(9, 1, 5)).toBeNull();
  });

  it("genera ids legibles y únicos", () => {
    expect(slugify("Papas con Cheddar & Bacon!")).toBe("papas-con-cheddar-bacon");
    expect(slugify("Ñoquis de papá")).toBe("noquis-de-papa");
    expect(uniqueId("Papas", ["papas", "papas-2"])).toBe("papas-3");
    expect(uniqueId("¡¡¡", [], "producto")).toBe("producto");
  });
});

describe("toWhatsAppNumber", () => {
  it("normaliza teléfonos argentinos", () => {
    expect(toWhatsAppNumber("343 412 3456")).toBe("5493434123456");
    expect(toWhatsAppNumber("0343 15 412-3456")).toBe("5493434123456");
    expect(toWhatsAppNumber("3436 15 41 2345")).toBe("5493436412345");
    expect(toWhatsAppNumber("11 15 2345 6789")).toBe("5491123456789");
    expect(toWhatsAppNumber("+54 9 343 412 3456")).toBe("5493434123456");
    expect(toWhatsAppNumber("+54 343 412 3456")).toBe("5493434123456");
    expect(toWhatsAppNumber("4123456")).toBe("4123456");
  });
});
