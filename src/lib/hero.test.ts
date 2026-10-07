import { describe, expect, it } from "vitest";
import { longestWord, splitName } from "./hero";

describe("nombre de la cabecera", () => {
  it("separa la última palabra", () => {
    expect(splitName("Costanera Burgers")).toEqual({ lead: "Costanera", last: "Burgers" });
    expect(splitName(" Rotisería  La Esquina ")).toEqual({ lead: "Rotisería La", last: "Esquina" });
    expect(splitName("Lomitería")).toEqual({ lead: "", last: "Lomitería" });
    expect(splitName("   ")).toEqual({ lead: "", last: "" });
  });

  it("mide la palabra más larga, con las letras anchas y angostas pesando distinto", () => {
    expect(longestWord("Costanera Burgers")).toBe(9);
    expect(longestWord("Rotisería Alexis")).toBe(8.2);
    expect(longestWord("Mmm Wow")).toBe(4.2);
    expect(longestWord("")).toBe(1);
  });
});
