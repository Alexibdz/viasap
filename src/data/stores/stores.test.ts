import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { allProducts } from "@/lib/menu";
import type { StoreSeed } from "@/lib/types";
import { stores } from "./index";

// Chequeos de los datos cargados a mano, para detectar errores antes de publicar.

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const publicFileExists = (url: string) => existsSync(join(process.cwd(), "public", url));

function duplicates(values: string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

it("no repite slugs entre tiendas", () => {
  expect(duplicates(stores.map((s) => s.business.slug))).toEqual([]);
});

describe.each(stores.map((store) => [store.business.slug, store] as [string, StoreSeed]))("tienda %s", (_, store) => {
  const { business, menu, coupons } = store;
  const products = allProducts(menu);

  it("tiene datos de negocio válidos", () => {
    expect(business.slug).toMatch(SLUG);
    expect(business.whatsapp).toMatch(/^\d{10,15}$/);
    expect(Object.values(business.theme).every((color) => HEX_COLOR.test(color))).toBe(true);
    expect(Object.keys(business.schedule)).toHaveLength(7);
    for (const ranges of Object.values(business.schedule)) {
      for (const range of ranges) {
        expect(range.open).toMatch(TIME);
        expect(range.close).toMatch(TIME);
      }
    }
    expect(business.delivery.pickup || business.delivery.delivery).toBe(true);
    const zones = business.delivery.zones.map((z) => z.upToKm);
    expect(zones).toEqual([...zones].sort((a, b) => a - b));
    expect(business.payments.cash || business.payments.transfer).toBeTruthy();
    if (business.payments.mixed) expect(business.payments.transfer).not.toBeNull();
    expect(coupons.every((c) => c.code === c.code.toUpperCase() && c.value > 0)).toBe(true);
  });

  it("usa ids únicos y aptos para URL", () => {
    const categoryIds = menu.map((c) => c.id);
    const productIds = products.map((p) => p.id);
    expect(duplicates(categoryIds)).toEqual([]);
    expect(duplicates(productIds)).toEqual([]);
    expect([...categoryIds, ...productIds].every((id) => SLUG.test(id))).toBe(true);
    for (const category of menu) {
      expect(category.subcategories.length).toBeGreaterThan(0);
      expect(duplicates(category.subcategories.map((s) => s.id))).toEqual([]);
    }
  });

  it("tiene precios y opciones coherentes", () => {
    for (const product of products) {
      const prices = product.variants?.length ? product.variants.map((v) => v.price) : [product.price];
      expect(prices.every((price) => typeof price === "number" && price > 0), product.id).toBe(true);
      expect(duplicates((product.variants ?? []).map((v) => v.id)), product.id).toEqual([]);
      for (const group of product.optionGroups ?? []) {
        expect(group.options.length, `${product.id}/${group.id}`).toBeGreaterThan(0);
        expect(group.min).toBeGreaterThanOrEqual(0);
        if (group.max !== undefined) expect(group.max).toBeGreaterThanOrEqual(Math.max(group.min, 1));
        expect(duplicates(group.options.map((o) => o.id)), `${product.id}/${group.id}`).toEqual([]);
        expect(group.options.every((o) => o.price >= 0)).toBe(true);
      }
      expect(duplicates((product.optionGroups ?? []).map((g) => g.id)), product.id).toEqual([]);
    }
  });

  it("referencia imágenes que existen en /public", () => {
    const urls = [
      business.logoUrl,
      business.coverUrl,
      ...menu.map((c) => c.imageUrl),
      ...products.map((p) => p.imageUrl),
    ].filter((url): url is string => Boolean(url));
    expect(urls.filter((url) => url.startsWith("/") && !publicFileExists(url))).toEqual([]);
  });
});
