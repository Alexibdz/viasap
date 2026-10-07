import { describe, expect, it } from "vitest";
import { heroTitleLines, lastLineWidth, longestLine } from "./hero";

const shown = (name: string) => heroTitleLines(name).map((line) => (line.mark ? `[${line.text}]` : line.text));

describe("título de la portada", () => {
  it("pone una palabra por renglón y resalta la del medio", () => {
    expect(shown("Título del negocio")).toEqual(["Título", "[del]", "negocio"]);
    expect(shown("Doble Queso")).toEqual(["Doble", "[Queso]"]);
    expect(shown("Lomitería")).toEqual(["Lomitería"]);
    expect(shown("   ")).toEqual([]);
  });

  it("con más de tres palabras arma tres renglones parejos", () => {
    expect(shown("Rotisería La Esquina de Paraná")).toEqual(["Rotisería", "[La Esquina]", "de Paraná"]);
    expect(heroTitleLines("El Rey del Pollo al Spiedo")).toHaveLength(3);
  });

  it("mide el renglón más largo, con las letras anchas y angostas pesando distinto", () => {
    expect(longestLine(heroTitleLines("Doble Queso"))).toBe(5);
    expect(longestLine(heroTitleLines("Rotisería La Esquina"))).toBe(8.2);
    expect(longestLine(heroTitleLines("Mmm Wow"))).toBe(4.2);
    expect(longestLine([])).toBe(1);
  });

  it("mide el último renglón, que comparte lugar con el botón de compartir", () => {
    expect(lastLineWidth(heroTitleLines("Rotisería Alexis"))).toBe(5.2);
    expect(lastLineWidth([])).toBe(1);
  });
});
