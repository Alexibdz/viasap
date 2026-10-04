import { describe, expect, it } from "vitest";
import { dobleQueso } from "@/data/stores/doble-queso";
import { laEsquina } from "@/data/stores/la-esquina";
import { featuredProducts, findProduct, isQuickAdd, showsSubcategoryName } from "./menu";
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

  it("los destacados no incluyen productos agotados", () => {
    const ids = featuredProducts(dobleQueso.menu).map((p) => p.id);
    expect(ids).toEqual(["bacon-jam", "cuarto-de-libra", "smash", "nuggets"]);
  });
});
