import { describe, expect, it } from "vitest";
import { offerIncludesText, offersIncluding, productIndex, resolveOffer, savingsPercent } from "./offers";
import type { Product } from "./types";

const burger: Product = {
  id: "classic",
  name: "Classic",
  variants: [
    { id: "simple", name: "Simple", price: 8000 },
    { id: "doble", name: "Doble", price: 10000 },
  ],
};
const coca: Product = { id: "coca", name: "Coca-Cola", price: 2000 };
const combo: Product = {
  id: "combo",
  name: "Combo",
  price: 20000,
  bundle: [
    { productId: "classic", variantId: "doble", qty: 2 },
    { productId: "coca", qty: 1 },
  ],
};
const catalog = productIndex([burger, coca, combo]);

describe("ofertas", () => {
  it("calcula lo que incluye, el precio por separado y el ahorro", () => {
    const offer = resolveOffer(combo, catalog);
    expect(offer).toEqual({
      lines: [
        { productId: "classic", name: "Classic (Doble)", qty: 2, price: 20000 },
        { productId: "coca", name: "Coca-Cola", qty: 1, price: 2000 },
      ],
      regularPrice: 22000,
      savings: 2000,
    });
    expect(savingsPercent(offer!)).toBe(9);
    expect(offerIncludesText(offer!.lines)).toBe("2x Classic (Doble), 1x Coca-Cola");
  });

  it("no es oferta si no incluye nada, y omite lo que ya no está en el menú", () => {
    expect(resolveOffer(burger, catalog)).toBeNull();
    const stale: Product = { ...combo, bundle: [{ productId: "borrado", qty: 1 }, { productId: "coca", qty: 3 }] };
    expect(resolveOffer(stale, catalog)?.lines).toEqual([{ productId: "coca", name: "Coca-Cola", qty: 3, price: 6000 }]);
    expect(resolveOffer({ ...combo, bundle: [{ productId: "borrado", qty: 1 }] }, catalog)).toBeNull();
  });

  it("si la presentación ya no existe usa la primera, y no informa ahorro si la oferta sale más cara", () => {
    const changed: Product = { ...combo, price: 30000, bundle: [{ productId: "classic", variantId: "triple", qty: 1 }] };
    const offer = resolveOffer(changed, catalog)!;
    expect(offer.lines[0].name).toBe("Classic (Simple)");
    expect(offer.savings).toBe(0);
    expect(savingsPercent(offer)).toBe(0);
  });

  it("encuentra las ofertas que incluyen un producto", () => {
    expect(offersIncluding([burger, coca, combo], "coca").map((p) => p.id)).toEqual(["combo"]);
    expect(offersIncluding([burger, coca, combo], "combo")).toEqual([]);
  });
});
