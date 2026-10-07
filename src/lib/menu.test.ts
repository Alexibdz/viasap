import { describe, expect, it } from "vitest";
import { rotiseriaAlexis } from "@/data/stores/rotiseria-alexis";
import {
  categoryLabel,
  featuredOffers,
  findProduct,
  isOfferProduct,
  isQuickAdd,
  menuOffers,
  showsSubcategoryName,
  visibleMenu,
} from "./menu";
import type { Category } from "./types";

describe("menú", () => {
  it("arma la etiqueta de sección para el mensaje", () => {
    expect(findProduct(rotiseriaAlexis.menu, "nuggets")?.sectionLabel).toBe("Pollo · Crispy");
    expect(findProduct(rotiseriaAlexis.menu, "cuarto-de-libra")?.sectionLabel).toBe("Hamburguesas · Smash de la casa");
    expect(findProduct(rotiseriaAlexis.menu, "pizza-comun")?.sectionLabel).toBe("Pizzas");
    expect(findProduct(rotiseriaAlexis.menu, "no-existe")).toBeNull();
  });

  it("no repite como título un grupo que solo tiene un producto con su mismo nombre", () => {
    const category: Category = {
      id: "hamburguesas",
      name: "Hamburguesas",
      subcategories: [
        { id: "classic", name: "CLASSIC", products: [{ id: "classic", name: "Classic", price: 8000 }] },
        {
          id: "veggie",
          name: "Veggie",
          products: [
            { id: "lentejas", name: "De lentejas", price: 8000 },
            { id: "garbanzos", name: "De garbanzos", price: 8000 },
          ],
        },
      ],
    };
    expect(showsSubcategoryName(category, category.subcategories[0])).toBe(false);
    expect(showsSubcategoryName(category, category.subcategories[1])).toBe(true);
  });

  it("permite agregar directo solo productos sin nada para elegir", () => {
    const find = (id: string) => findProduct(rotiseriaAlexis.menu, id)!.product;
    expect(isQuickAdd(find("pizza-comun"))).toBe(true);
    expect(isQuickAdd({ ...find("pizza-comun"), soldOut: true })).toBe(false); // agotado
    expect(isQuickAdd(find("tortilla"))).toBe(false); // tiene presentaciones
    expect(isQuickAdd(find("patitas"))).toBe(false); // tiene salsas obligatorias
    expect(isQuickAdd(find("docena"))).toBe(false); // hay que elegir los gustos
  });

  it("no muestra categorías ni grupos vacíos, y un grupo vacío no cuenta para los títulos", () => {
    const menu: Category[] = [
      { id: "postres", name: "Postres", subcategories: [{ id: "postres", name: "Postres", products: [] }] },
      {
        id: "minutas",
        name: "Minutas",
        subcategories: [
          { id: "carne", name: "De carne", products: [{ id: "mila", name: "Milanesa", price: 9000, soldOut: true }] },
          { id: "pollo", name: "De pollo", products: [] },
        ],
      },
    ];
    const visible = visibleMenu(menu);
    expect(visible.map((c) => c.id)).toEqual(["minutas"]);
    expect(visible[0].subcategories.map((s) => s.id)).toEqual(["carne"]);
    expect(menu[1].subcategories).toHaveLength(2); // no modifica el original
    expect(findProduct(menu, "mila")?.sectionLabel).toBe("Minutas");
  });

  it("destaca solo ofertas, de cualquier categoría y sin agotadas", () => {
    const menu = structuredClone(rotiseriaAlexis.menu);
    findProduct(menu, "combo-pareja")!.product.soldOut = true;
    // Un producto que no es oferta no se destaca aunque tenga la marca.
    findProduct(menu, "smash")!.product.featured = true;
    const featured = featuredOffers(menu);
    expect(featured.map((f) => f.product.id)).toEqual([
      "pollo-para-compartir",
      "promo-2-muzza",
      "promo-pizza-empanadas-xxl",
      "dos-panchos-coca",
    ]);
    // Las ofertas sin foto usan el emoji de su categoría.
    expect(featured.find((f) => f.product.id === "promo-2-muzza")?.emoji).toBe("🍕");
  });

  it("decora las categorías con su emoji, sin tocar el nombre (que va al mensaje)", () => {
    const pizzas = rotiseriaAlexis.menu.find((c) => c.id === "pizzas")!;
    expect(categoryLabel(pizzas)).toBe("🍕 Pizzas");
    expect(categoryLabel({ name: "Postres" })).toBe("Postres");
    expect(findProduct(rotiseriaAlexis.menu, "pizza-comun")?.sectionLabel).toBe("Pizzas");
  });

  it("las ofertas pueden estar en cualquier categoría", () => {
    const pizzas = rotiseriaAlexis.menu.find((c) => c.id === "pizzas")!;
    const ofertas = rotiseriaAlexis.menu.find((c) => c.id === "ofertas")!;
    const product = (id: string) => findProduct(rotiseriaAlexis.menu, id)!.product;
    expect(isOfferProduct(product("promo-2-muzza-jamon"), pizzas)).toBe(true); // marcada, sin armar
    expect(isOfferProduct(product("pizza-comun"), pizzas)).toBe(false);
    expect(isOfferProduct({ id: "x", name: "X", price: 1 }, ofertas)).toBe(true); // por estar en Ofertas
    expect(findProduct(rotiseriaAlexis.menu, "promo-2-muzza")?.sectionLabel).toBe("Pizzas · Promos");
  });

  it("las bebidas no llevan aclaración", () => {
    expect(findProduct(rotiseriaAlexis.menu, "pepsi")?.allowsNotes).toBe(false);
    expect(findProduct(rotiseriaAlexis.menu, "asado-2")?.allowsNotes).toBe(true);
  });

  it("resuelve lo que incluye cada oferta con los precios del menú", () => {
    const offers = menuOffers(rotiseriaAlexis.menu);
    expect(Object.keys(offers)).toEqual([
      "combo-pareja",
      "pizza-y-empanadas",
      "pollo-para-compartir",
      "promo-2-muzza",
      "dos-panchos-coca",
    ]);
    // 2 Classic dobles ($10.000) + papas fritas grandes ($6.000) = $26.000; la oferta sale $22.900.
    expect(offers["combo-pareja"]).toEqual({
      lines: [
        { productId: "classic", name: "Classic (Doble)", qty: 2, price: 20000 },
        { productId: "papas-fritas", name: "Papas fritas grandes", qty: 1, price: 6000 },
      ],
      regularPrice: 26000,
      savings: 3100,
    });
    // Una oferta fuera de la categoría de ofertas también se resuelve (2 panchos + Coca de 1 litro).
    expect(offers["dos-panchos-coca"].lines.map((l) => l.name)).toEqual([
      "Súper pancho con papas bastón",
      "Coca o Sprite 1 litro (Coca-Cola)",
    ]);
    expect(findProduct(rotiseriaAlexis.menu, "combo-pareja")?.offer).toEqual(offers["combo-pareja"]);
    expect(findProduct(rotiseriaAlexis.menu, "classic")?.offer).toBeUndefined();
  });
});
