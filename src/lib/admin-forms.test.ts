import { describe, expect, it } from "vitest";
import { dobleQueso } from "@/data/stores/doble-queso";
import {
  applyCategory,
  buildCoupon,
  buildDelivery,
  buildPayments,
  buildProduct,
  buildSchedule,
  buildStoreInfo,
  moveProduct,
  NEW_GROUP,
  placeProduct,
  removeCategory,
  removeProduct,
  updateProductFlags,
  type ProductDraft,
} from "./admin-forms";
import { findProduct } from "./menu";
import type { Category } from "./types";

const freshMenu = (): Category[] => structuredClone(dobleQueso.menu);

const draft = (overrides: Partial<ProductDraft> = {}): ProductDraft => ({
  id: null,
  name: "Doble Bacon",
  description: "Con mucho bacon.",
  imageUrl: "/media/doble-queso/0123456789abcdef.webp",
  categoryId: "hamburguesas",
  subcategoryId: "hamburguesas",
  newGroupName: "",
  hasVariants: true,
  price: "",
  variants: [
    { id: null, name: "Simple", price: "9000" },
    { id: null, name: "Doble", price: "11000" },
  ],
  optionGroups: [
    {
      id: null,
      name: "Salsas",
      min: "1",
      max: "2",
      options: [
        { id: null, name: "Barbacoa", price: "", maxQty: "" },
        { id: null, name: "Cheddar", price: "600", maxQty: "2" },
      ],
    },
  ],
  soldOut: false,
  featured: true,
  ...overrides,
});

describe("productos", () => {
  it("crea un producto con ids derivados del nombre", () => {
    const menu = freshMenu();
    const result = buildProduct(draft(), menu);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.product).toEqual({
      id: "doble-bacon",
      name: "Doble Bacon",
      description: "Con mucho bacon.",
      imageUrl: "/media/doble-queso/0123456789abcdef.webp",
      variants: [
        { id: "simple", name: "Simple", price: 9000 },
        { id: "doble", name: "Doble", price: 11000 },
      ],
      optionGroups: [
        {
          id: "salsas",
          name: "Salsas",
          min: 1,
          max: 2,
          options: [
            { id: "barbacoa", name: "Barbacoa", price: 0 },
            { id: "cheddar", name: "Cheddar", price: 600, maxQty: 2 },
          ],
        },
      ],
      featured: true,
    });
    placeProduct(menu, result.value);
    expect(findProduct(menu, "doble-bacon")?.category.id).toBe("hamburguesas");
  });

  it("marca errores por campo", () => {
    const result = buildProduct(
      draft({
        name: "",
        variants: [{ id: null, name: "", price: "0" }],
        optionGroups: [{ id: null, name: "", min: "3", max: "1", options: [] }],
      }),
      freshMenu(),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(
      [
        "name",
        "variants.0.name",
        "variants.0.price",
        "optionGroups.0.name",
        "optionGroups.0.max",
        "optionGroups.0.options",
      ].sort(),
    );
  });

  it("edita conservando ids y lo mueve a un grupo nuevo de otra categoría", () => {
    const menu = freshMenu();
    const result = buildProduct(
      draft({
        id: "papas-casa",
        name: "Papas rústicas",
        categoryId: "pollo",
        subcategoryId: NEW_GROUP,
        newGroupName: "Acompañamientos",
        hasVariants: false,
        price: "5000",
        optionGroups: [],
        featured: false,
      }),
      menu,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    placeProduct(menu, result.value);
    const moved = findProduct(menu, "papas-casa");
    expect(moved?.product).toMatchObject({ id: "papas-casa", name: "Papas rústicas", price: 5000 });
    expect(moved?.sectionLabel).toBe("Pollo · Acompañamientos");
    expect(menu.find((c) => c.id === "papas")?.subcategories[0].products.map((p) => p.id)).toEqual([
      "papas-fritas",
      "papas-cheddar",
    ]);
  });

  it("cambia disponibilidad, orden y borra", () => {
    const menu = freshMenu();
    expect(updateProductFlags(menu, "classic", { soldOut: true, featured: true })).toBe(true);
    expect(findProduct(menu, "classic")?.product).toMatchObject({ soldOut: true, featured: true });
    updateProductFlags(menu, "classic", { soldOut: false });
    expect(findProduct(menu, "classic")?.product.soldOut).toBeUndefined();
    expect(moveProduct(menu, "classic", -1)).toBe(true);
    expect(menu[0].subcategories[0].products[0].id).toBe("classic");
    expect(moveProduct(menu, "classic", -1)).toBe(false);
    expect(removeProduct(menu, "classic")).toBe(true);
    expect(findProduct(menu, "classic")).toBeNull();
  });

  it("solo acepta fotos del panel o de ejemplo", () => {
    const result = buildProduct(draft({ imageUrl: "https://otro-sitio.com/x.jpg" }), freshMenu());
    expect(result.ok && result.value.product.imageUrl).toBeUndefined();
  });
});

describe("categorías", () => {
  it("crea categorías y no borra grupos ni categorías con productos", () => {
    const menu = freshMenu();
    const created = applyCategory(menu, { id: null, name: "Postres", imageUrl: "", groups: [] });
    expect(created).toEqual({ ok: true, value: "postres" });
    expect(menu.at(-1)?.subcategories).toEqual([{ id: "postres", name: "Postres", products: [] }]);

    const dropGroup = applyCategory(menu, { id: "pollo", name: "Pollo", imageUrl: "", groups: [{ id: null, name: "Otro" }] });
    expect(dropGroup.ok).toBe(false);
    expect(removeCategory(menu, "pollo").ok).toBe(false);
    expect(removeCategory(menu, "postres").ok).toBe(true);
  });
});

describe("ajustes", () => {
  it("normaliza los datos del local", () => {
    const result = buildStoreInfo({
      name: " Doble Queso ",
      description: "",
      whatsapp: "0343 15 412-3456",
      instagram: "@doblequeso",
      address: { street: "Sarmiento 450", city: "Victoria", province: "Entre Ríos", lat: -32.6, lng: -60.1 },
    });
    expect(result.ok && result.value).toMatchObject({ name: "Doble Queso", whatsapp: "5493434123456", instagram: "doblequeso" });
  });

  it("valida horarios, incluso los que pasan la medianoche", () => {
    const week = (ranges: { open: string; close: string }[]) => ({
      schedule: { 0: [], 1: [], 2: [], 3: ranges, 4: [], 5: [], 6: [] },
      acceptOrdersWhenClosed: true,
    });
    expect(buildSchedule(week([{ open: "20:00", close: "00:30" }])).ok).toBe(true);
    expect(buildSchedule(week([{ open: "11:00", close: "14:30" }, { open: "14:00", close: "16:00" }])).ok).toBe(false);
    expect(buildSchedule(week([{ open: "25:00", close: "10:00" }])).ok).toBe(false);
  });

  it("ordena zonas de envío y exige alguna forma de entrega y de pago", () => {
    const delivery = buildDelivery({
      pickup: true,
      delivery: true,
      zones: [
        { upToKm: "3", cost: "1500" },
        { upToKm: "1.5", cost: "1000" },
      ],
      minOrder: "",
    });
    expect(delivery.ok && delivery.value.zones.map((z) => z.upToKm)).toEqual([1.5, 3]);
    expect(buildDelivery({ pickup: false, delivery: false, zones: [] }).ok).toBe(false);
    expect(buildPayments({ cash: false, transferEnabled: false }).ok).toBe(false);
    const payments = buildPayments({
      cash: true,
      transferEnabled: true,
      mixed: true,
      transfer: { alias: "MI.ALIAS.MP", cbu: "0000003100099999999901", holder: "Ana", bank: "" },
    });
    expect(payments.ok && payments.value).toEqual({
      cash: true,
      mixed: true,
      transfer: { alias: "MI.ALIAS.MP", cbu: "0000003100099999999901", holder: "Ana" },
    });
  });

  it("valida cupones", () => {
    const coupons = dobleQueso.coupons;
    expect(buildCoupon({ code: "bienvenida", type: "percent", value: "10" }, coupons, null).ok).toBe(false);
    expect(buildCoupon({ code: "bienvenida", type: "percent", value: "15" }, coupons, "BIENVENIDA").ok).toBe(true);
    expect(buildCoupon({ code: "X", type: "fixed", value: "100" }, coupons, null).ok).toBe(false);
    const fixed = buildCoupon({ code: "promo500", type: "fixed", value: "500", minSubtotal: "5000", active: true }, coupons, null);
    expect(fixed.ok && fixed.value).toEqual({ code: "PROMO500", type: "fixed", value: 500, minSubtotal: 5000, active: true });
  });
});
