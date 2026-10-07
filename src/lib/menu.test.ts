import { describe, expect, it } from "vitest";
import { costaneraBurgers } from "@/data/stores/costanera-burgers";
import { rotiseriaAlexis } from "@/data/stores/rotiseria-alexis";
import {
  featuredOffers,
  findProduct,
  isOfferProduct,
  isQuickAdd,
  listedCategories,
  menuOffers,
  showsSubcategoryName,
  visibleMenu,
} from "./menu";
import type { Category } from "./types";

describe("menú", () => {
  it("arma la etiqueta de sección para el mensaje", () => {
    expect(findProduct(rotiseriaAlexis.menu, "mila-napo")?.sectionLabel).toBe("Minutas · Milanesas y lomo");
    expect(findProduct(costaneraBurgers.menu, "cuarto-de-libra")?.sectionLabel).toBe("Hamburguesas");
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
    const find = (id: string) => (findProduct(rotiseriaAlexis.menu, id) ?? findProduct(costaneraBurgers.menu, id))!.product;
    expect(isQuickAdd(find("pizza-comun"))).toBe(true);
    expect(isQuickAdd({ ...find("pizza-comun"), soldOut: true })).toBe(false); // agotado
    expect(isQuickAdd(find("tortilla"))).toBe(false); // tiene presentaciones
    expect(isQuickAdd(find("noquis"))).toBe(false); // hay que elegir la salsa
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
    findProduct(menu, "promo-pizza-empanadas-xxl")!.product.soldOut = true;
    // Un producto que no es oferta no se destaca aunque tenga la marca.
    findProduct(menu, "pizza-comun")!.product.featured = true;
    const featured = featuredOffers(menu);
    // Primero todo lo de la categoría de ofertas; después las destacadas de las demás.
    expect(featured.map((f) => f.product.id)).toEqual(["pizza-y-empanadas", "promo-2-muzza", "dos-panchos-coca"]);
    // La categoría de ofertas no se lista abajo del carrusel.
    expect(listedCategories(menu).some((c) => c.id === "ofertas")).toBe(false);
    expect(listedCategories(menu)).toHaveLength(menu.length - 1);
    expect(featuredOffers(costaneraBurgers.menu).map((f) => f.product.id)).toEqual([
      "combo-pareja",
      "dos-smash",
      "combo-familiar",
    ]);
    // Las ofertas sin foto usan el emoji de su categoría.
    expect(featured.find((f) => f.product.id === "promo-2-muzza")?.emoji).toBe("🍕");
  });

  it("decora las categorías con su emoji, sin tocar el nombre (que va al mensaje)", () => {
    const pizzas = rotiseriaAlexis.menu.find((c) => c.id === "pizzas")!;
    expect(pizzas.emoji).toBe("🍕");
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

  it("separa los locales: las fotos quedaron en la hamburguesería", () => {
    const withPhoto = (menu: typeof rotiseriaAlexis.menu) =>
      menu.flatMap((c) => c.subcategories.flatMap((s) => s.products)).filter((p) => p.imageUrl).length;
    expect(withPhoto(rotiseriaAlexis.menu)).toBe(0);
    expect(withPhoto(costaneraBurgers.menu)).toBeGreaterThan(10);
    expect(findProduct(rotiseriaAlexis.menu, "smash")).toBeNull();
  });

  it("la hamburguesería tiene torpedos y panchos, y no postres", () => {
    const names = (id: string) =>
      costaneraBurgers.menu.find((c) => c.id === id)?.subcategories.flatMap((s) => s.products.map((p) => p.name));
    expect(names("torpedos")).toHaveLength(3);
    expect(names("panchos")).toEqual(["Pancho simple", "Pancho XXL"]);
    expect(names("postres")).toBeUndefined();
  });

  it("resuelve lo que incluye cada oferta con los precios del menú", () => {
    const offers = menuOffers(rotiseriaAlexis.menu);
    expect(Object.keys(offers)).toEqual(["pizza-y-empanadas", "promo-2-muzza", "dos-panchos-coca"]);
    const burgers = menuOffers(costaneraBurgers.menu);
    // 2 Classic dobles ($10.000) + papas fritas grandes ($4.500) = $24.500; la oferta sale $22.900.
    expect(burgers["combo-pareja"]).toEqual({
      lines: [
        { productId: "classic", name: "Classic (Doble)", qty: 2, price: 20000 },
        { productId: "papas-fritas", name: "Papas fritas (Grande)", qty: 1, price: 4500 },
      ],
      regularPrice: 24500,
      savings: 1600,
    });
    // Una oferta fuera de la categoría de ofertas también se resuelve (2 panchos + Coca de 1 litro).
    expect(offers["dos-panchos-coca"].lines.map((l) => l.name)).toEqual([
      "Súper pancho con papas bastón",
      "Coca o Sprite 1 litro (Coca-Cola)",
    ]);
    expect(findProduct(costaneraBurgers.menu, "combo-pareja")?.offer).toEqual(burgers["combo-pareja"]);
    expect(findProduct(costaneraBurgers.menu, "classic")?.offer).toBeUndefined();
  });
});
