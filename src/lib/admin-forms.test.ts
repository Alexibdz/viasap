import { describe, expect, it } from "vitest";
import { costaneraBurgers } from "@/data/stores/costanera-burgers";
import {
  applyCategory,
  buildCoupon,
  cleanEmoji,
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
  withoutErrors,
  type ProductDraft,
} from "./admin-forms";
import { findProduct } from "./menu";
import type { Category } from "./types";

const freshMenu = (): Category[] => structuredClone(costaneraBurgers.menu);

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
  isOffer: false,
  bundle: [],
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
    });
    placeProduct(menu, result.value);
    expect(findProduct(menu, "doble-bacon")?.category.id).toBe("hamburguesas");
  });

  it("solo destaca ofertas, y una oferta puede estar en cualquier categoría", () => {
    const menu = freshMenu();
    // "Destacado" en un producto común no se guarda: arriba del menú van las ofertas destacadas.
    const common = buildProduct(draft({ featured: true }), menu);
    expect(common.ok && common.value.product.featured).toBeUndefined();
    // La misma hamburguesa marcada como oferta, dentro de Hamburguesas, sí se destaca.
    const promo = buildProduct(draft({ isOffer: true, featured: true }), menu);
    expect(promo.ok && promo.value.product).toMatchObject({ isOffer: true, featured: true });
    expect(promo.ok && promo.value.categoryId).toBe("hamburguesas");
    // Si no es oferta, lo que haya quedado en el armador no se guarda.
    const leftover = buildProduct(draft({ bundle: [{ productId: "ensalada-mixta", variantId: "", qty: "1" }] }), menu);
    expect(leftover.ok && leftover.value.product.bundle).toBeUndefined();
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
        categoryId: "postres",
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
    expect(moved?.sectionLabel).toBe("Postres · Acompañamientos");
    expect(menu.find((c) => c.id === "papas")?.subcategories[0].products.map((p) => p.id)).toEqual([
      "papas-fritas",
      "ensalada-mixta",
    ]);
  });

  it("cambia disponibilidad, orden y borra", () => {
    const menu = freshMenu();
    expect(updateProductFlags(menu, "classic", { soldOut: true, featured: true })).toBe(true);
    expect(findProduct(menu, "classic")?.product).toMatchObject({ soldOut: true, featured: true });
    updateProductFlags(menu, "classic", { soldOut: false });
    expect(findProduct(menu, "classic")?.product.soldOut).toBeUndefined();
    expect(moveProduct(menu, "classic", -1)).toBe(true);
    expect(menu.find((c) => c.id === "hamburguesas")?.subcategories[0].products[0].id).toBe("classic");
    expect(moveProduct(menu, "classic", -1)).toBe(false);
    expect(removeProduct(menu, "classic")).toBe(true);
    expect(findProduct(menu, "classic")).toBeNull();
  });

  it("solo acepta fotos del panel o de ejemplo, y la foto es opcional", () => {
    const result = buildProduct(draft({ imageUrl: "https://otro-sitio.com/x.jpg" }), freshMenu());
    expect(result.ok && result.value.product.imageUrl).toBeUndefined();
    expect(buildProduct(draft({ imageUrl: "" }), freshMenu()).ok).toBe(true);
  });
});

describe("armador de ofertas", () => {
  const offer = (bundle: ProductDraft["bundle"], overrides: Partial<ProductDraft> = {}) =>
    draft({
      name: "Combo noche",
      categoryId: "ofertas",
      subcategoryId: "ofertas",
      hasVariants: false,
      price: "15000",
      optionGroups: [],
      bundle,
      ...overrides,
    });

  it("guarda los productos incluidos con su presentación y cantidad", () => {
    const result = buildProduct(
      offer([
        { productId: "smash", variantId: "doble", qty: "2" },
        { productId: "ensalada-mixta", variantId: "", qty: "2" },
      ]),
      freshMenu(),
    );
    expect(result.ok && result.value.product.bundle).toEqual([
      { productId: "smash", variantId: "doble", qty: 2 },
      { productId: "ensalada-mixta", qty: 2 },
    ]);
  });

  it("marca productos inexistentes, presentaciones faltantes, cantidades inválidas y ofertas anidadas", () => {
    const result = buildProduct(
      offer([
        { productId: "no-existe", variantId: "", qty: "1" },
        { productId: "smash", variantId: "gigante", qty: "1" },
        { productId: "ensalada-mixta", variantId: "", qty: "0" },
        { productId: "combo-pareja", variantId: "", qty: "1" },
      ]),
      freshMenu(),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual([
      "bundle.0.productId",
      "bundle.1.variantId",
      "bundle.2.qty",
      "bundle.3.productId",
    ]);
  });

  it("un producto incluido en una oferta no puede ser una oferta", () => {
    const menu = freshMenu();
    const edit = draft({
      id: "classic",
      name: "Classic",
      hasVariants: true,
      isOffer: true,
      bundle: [{ productId: "ensalada-mixta", variantId: "", qty: "1" }],
    });
    const result = buildProduct(edit, menu);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.bundle).toMatch(/otra oferta/);
  });
});

describe("errores del formulario", () => {
  it("borra los del campo editado y los de sus filas", () => {
    const errors = { name: "Falta", "variants.0.price": "Falta", "variants.1.name": "Falta", variantsOk: "x" };
    expect(withoutErrors(errors, ["variants"])).toEqual({ name: "Falta", variantsOk: "x" });
    expect(withoutErrors(errors, ["variants.1.name", "name"])).toEqual({ "variants.0.price": "Falta", variantsOk: "x" });
  });

  it("devuelve el mismo objeto si no había nada para borrar", () => {
    const errors = { name: "Falta" };
    expect(withoutErrors(errors, ["price"])).toBe(errors);
  });
});

describe("categorías", () => {
  it("crea categorías y no borra grupos ni categorías con productos", () => {
    const menu = freshMenu();
    const created = applyCategory(menu, { id: null, name: "Helados", imageUrl: "", groups: [] });
    expect(created).toEqual({ ok: true, value: "helados" });
    expect(menu.at(-1)?.subcategories).toEqual([{ id: "helados", name: "Helados", products: [] }]);

    const dropGroup = applyCategory(menu, { id: "papas", name: "Papas", imageUrl: "", groups: [{ id: null, name: "Otro" }] });
    expect(dropGroup.ok).toBe(false);
    expect(removeCategory(menu, "papas").ok).toBe(false);
    expect(removeCategory(menu, "helados").ok).toBe(true);
  });

  it("guarda el emoji y las marcas de ofertas y sin aclaraciones, y los saca al borrarlos", () => {
    const menu = freshMenu();
    const groups = [{ id: "helados", name: "Helados" }];
    applyCategory(menu, { id: null, name: "Helados", imageUrl: "", emoji: " 🍦 ", offers: true, hideNotes: true, expanded: true, groups });
    expect(menu.at(-1)).toMatchObject({ id: "helados", emoji: "🍦", kind: "offers", hideNotes: true, expanded: true });
    applyCategory(menu, { id: "helados", name: "Helados", imageUrl: "", emoji: "", offers: false, hideNotes: false, expanded: false, groups });
    expect(menu.at(-1)).not.toHaveProperty("emoji");
    expect(menu.at(-1)).not.toHaveProperty("kind");
    expect(menu.at(-1)).not.toHaveProperty("hideNotes");
    expect(menu.at(-1)).not.toHaveProperty("expanded");
  });

  it("acepta solo uno o dos emojis", () => {
    expect(cleanEmoji("🍕")).toBe("🍕");
    expect(cleanEmoji("🍔🍟")).toBe("🍔🍟");
    expect(cleanEmoji("🧑‍🍳")).toBe("🧑‍🍳");
    expect(cleanEmoji("")).toBe("");
    expect(cleanEmoji("pizza")).toBeNull();
    expect(cleanEmoji("123")).toBeNull();
    expect(cleanEmoji("🍕🍕🍕")).toBeNull();
    const result = applyCategory(freshMenu(), { id: null, name: "Helados", imageUrl: "", emoji: "hola", groups: [] });
    expect(result).toEqual({ ok: false, errors: { emoji: "Poné un emoji (ej: 🍕) o dejalo vacío." } });
  });

  it("con un solo grupo sin nombre usa el de la categoría (como arranca el formulario)", () => {
    const menu = freshMenu();
    const created = applyCategory(menu, { id: null, name: "Helados", imageUrl: "", groups: [{ id: null, name: "" }] });
    expect(created).toEqual({ ok: true, value: "helados" });
    expect(menu.at(-1)?.subcategories).toEqual([{ id: "helados", name: "Helados", products: [] }]);

    const twoGroups = applyCategory(menu, {
      id: null,
      name: "Bebidas frías",
      imageUrl: "",
      groups: [{ id: null, name: "Gaseosas" }, { id: null, name: "" }],
    });
    expect(twoGroups).toEqual({ ok: false, errors: { "groups.1.name": "Falta el nombre del grupo." } });
  });
});

describe("ajustes", () => {
  it("normaliza los datos del local", () => {
    const result = buildStoreInfo({
      name: " Doble Queso ",
      description: "",
      highlight: "  Todas   con papas ",
      whatsapp: "0343 15 412-3456",
      instagram: "@doblequeso",
      address: { street: "Sarmiento 450", city: "Victoria", province: "Entre Ríos", lat: -32.6, lng: -60.1 },
    });
    expect(result.ok && result.value).toMatchObject({
      name: "Doble Queso",
      highlight: "Todas con papas",
      whatsapp: "5493434123456",
      instagram: "doblequeso",
    });
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

  it("arma zonas de envío con nombre y exige alguna forma de entrega y de pago", () => {
    const delivery = buildDelivery({
      pickup: true,
      delivery: true,
      zones: [
        { id: null, name: " Dentro de boulevard ", cost: "1000" },
        { id: "afuera", name: "Fuera de boulevard", cost: "0" },
      ],
      minOrder: "",
    });
    expect(delivery.ok && delivery.value.zones).toEqual([
      { id: "dentro-de-boulevard", name: "Dentro de boulevard", cost: 1000 },
      { id: "afuera", name: "Fuera de boulevard", cost: 0 },
    ]);
    const invalid = buildDelivery({
      pickup: true,
      delivery: true,
      zones: [
        { id: null, name: "Centro", cost: "" },
        { id: null, name: "", cost: "500" },
        { id: null, name: "centro", cost: "800" },
      ],
    });
    expect(!invalid.ok && Object.keys(invalid.errors).sort()).toEqual(["zones", "zones.0.cost", "zones.1.name"]);
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
    const coupons = costaneraBurgers.coupons;
    expect(buildCoupon({ code: "bienvenida", type: "percent", value: "10" }, coupons, null).ok).toBe(false);
    expect(buildCoupon({ code: "bienvenida", type: "percent", value: "15" }, coupons, "BIENVENIDA").ok).toBe(true);
    expect(buildCoupon({ code: "X", type: "fixed", value: "100" }, coupons, null).ok).toBe(false);
    const fixed = buildCoupon({ code: "promo500", type: "fixed", value: "500", minSubtotal: "5000", active: true }, coupons, null);
    expect(fixed.ok && fixed.value).toEqual({ code: "PROMO500", type: "fixed", value: 500, minSubtotal: 5000, active: true });
  });
});
