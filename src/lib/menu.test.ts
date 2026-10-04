import { describe, expect, it } from "vitest";
import { dobleQueso } from "@/data/stores/doble-queso";
import { laEsquina } from "@/data/stores/la-esquina";
import { featuredProducts, findProduct, isQuickAdd, showsSubcategoryName, visibleMenu } from "./menu";
import type { Category } from "./types";

describe("menú", () => {
  it("arma la etiqueta de sección para el mensaje", () => {
    expect(findProduct(laEsquina.menu, "milanesa-pollo")?.sectionLabel).toBe("Minutas · De pollo");
    expect(findProduct(dobleQueso.menu, "cuarto-de-libra")?.sectionLabel).toBe("Hamburguesas");
    expect(findProduct(dobleQueso.menu, "no-existe")).toBeNull();
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
    const find = (id: string) => findProduct(dobleQueso.menu, id)!.product;
    expect(isQuickAdd(find("coca-cola"))).toBe(true);
    expect(isQuickAdd(find("agua"))).toBe(false); // agotado
    expect(isQuickAdd(find("cerveza"))).toBe(false); // tiene presentaciones
    expect(isQuickAdd(find("patitas"))).toBe(false); // tiene salsas obligatorias
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

  it("los destacados no incluyen productos agotados", () => {
    const ids = featuredProducts(dobleQueso.menu).map((p) => p.id);
    expect(ids).toEqual(["bacon-jam", "cuarto-de-libra", "smash", "nuggets"]);
  });
});
