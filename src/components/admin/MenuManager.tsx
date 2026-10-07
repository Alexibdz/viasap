"use client";

import Image from "next/image";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, PencilSquare, PlusLg, Search, Star, StarFill } from "react-bootstrap-icons";
import { moveCategory, moveProduct, setProductFlags, type ActionResult } from "@/app/admin/actions";
import { useToast } from "@/components/store/ToastProvider";
import {
  moveCategory as moveCategoryInMenu,
  moveProduct as moveProductInMenu,
  toCategoryDraft,
  updateProductFlags,
  type CategoryDraft,
} from "@/lib/admin-forms";
import { formatMoney, normalizeText } from "@/lib/format";
import { isOfferProduct } from "@/lib/menu";
import { priceFrom, showsPriceFrom } from "@/lib/pricing";
import type { Category } from "@/lib/types";
import CategoryModal from "./CategoryModal";

type MenuChange =
  | { type: "flags"; productId: string; flags: { soldOut?: boolean; featured?: boolean } }
  | { type: "product"; productId: string; direction: -1 | 1 }
  | { type: "category"; categoryId: string; direction: -1 | 1 };

/** Aplica el cambio sobre una copia, para mostrarlo antes de que responda el servidor. */
function applyChange(menu: Category[], change: MenuChange): Category[] {
  const next = structuredClone(menu);
  if (change.type === "flags") updateProductFlags(next, change.productId, change.flags);
  if (change.type === "product") moveProductInMenu(next, change.productId, change.direction);
  if (change.type === "category") moveCategoryInMenu(next, change.categoryId, change.direction);
  return next;
}

const NEW_CATEGORY: CategoryDraft = {
  id: null,
  name: "",
  imageUrl: "",
  emoji: "",
  offers: false,
  hideNotes: false,
  groups: [{ id: null, name: "" }],
};

export default function MenuManager({ menu }: { menu: Category[] }) {
  const notify = useToast();
  const [shownMenu, showChange] = useOptimistic(menu, applyChange);
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<CategoryDraft | null>(null);

  function run(change: MenuChange, action: () => Promise<ActionResult>, success?: string) {
    startTransition(async () => {
      showChange(change);
      const result = await action();
      if (!result.ok) notify(result.error ?? "No se pudo guardar.");
      else if (success) notify(success);
    });
  }

  const term = normalizeText(query.trim());
  const matches = (name: string) => !term || normalizeText(name).includes(term);
  const productCount = shownMenu.reduce((sum, c) => sum + c.subcategories.reduce((s, g) => s + g.products.length, 0), 0);
  const visible = shownMenu.filter((category) =>
    category.subcategories.some((group) => group.products.some((product) => matches(product.name))) || !term,
  );

  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <div>
          <h1 className="adm-title">Menú</h1>
          <p className="adm-subtitle">
            {productCount} productos en {shownMenu.length} categorías
          </p>
        </div>
        <div className="adm-head-actions">
          <button type="button" className="adm-btn" onClick={() => setEditing(NEW_CATEGORY)}>
            <PlusLg aria-hidden /> Categoría
          </button>
          <Link href="/admin/menu/nuevo" className="adm-btn adm-btn--primary">
            <PlusLg aria-hidden /> Producto
          </Link>
        </div>
      </header>

      <label className="adm-search">
        <Search aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar un producto"
          aria-label="Buscar un producto"
        />
      </label>

      {visible.length === 0 && <p className="adm-muted">No hay productos que coincidan con “{query}”.</p>}

      {visible.map((category) => {
        const index = shownMenu.indexOf(category);
        const count = category.subcategories.reduce((sum, group) => sum + group.products.length, 0);
        return (
          <section key={category.id} className="adm-category">
            <header className="adm-category-head">
              <span className="adm-category-thumb">
                {category.imageUrl && <Image src={category.imageUrl} alt="" fill sizes="48px" />}
              </span>
              <div className="min-w-0">
                <h2 className="adm-category-name">
                  {category.emoji && <span aria-hidden>{category.emoji} </span>}
                  {category.name}
                </h2>
                <p className="adm-muted">
                  {count} {count === 1 ? (category.kind === "offers" ? "oferta" : "producto") : category.kind === "offers" ? "ofertas" : "productos"}
                  {category.kind === "offers" && <span className="adm-flag">Ofertas</span>}
                </p>
              </div>
              <div className="adm-category-actions">
                <button
                  type="button"
                  className="adm-icon-btn"
                  aria-label={`Subir ${category.name}`}
                  disabled={index === 0 || Boolean(term)}
                  onClick={() => run({ type: "category", categoryId: category.id, direction: -1 }, () => moveCategory(category.id, -1))}
                >
                  <ArrowUp />
                </button>
                <button
                  type="button"
                  className="adm-icon-btn"
                  aria-label={`Bajar ${category.name}`}
                  disabled={index === shownMenu.length - 1 || Boolean(term)}
                  onClick={() => run({ type: "category", categoryId: category.id, direction: 1 }, () => moveCategory(category.id, 1))}
                >
                  <ArrowDown />
                </button>
                <button
                  type="button"
                  className="adm-icon-btn"
                  aria-label={`Editar ${category.name}`}
                  onClick={() => setEditing(toCategoryDraft(category))}
                >
                  <PencilSquare />
                </button>
              </div>
            </header>

            {category.subcategories.map((group) => {
              const products = group.products.filter((product) => matches(product.name));
              if (!products.length && term) return null;
              return (
                <div key={group.id} className="adm-group">
                  {category.subcategories.length > 1 && <p className="adm-group-name">{group.name}</p>}
                  {products.length === 0 && <p className="adm-muted adm-group-empty">Sin productos en este grupo.</p>}
                  <ul className="adm-products">
                    {products.map((product) => {
                      const position = group.products.indexOf(product);
                      return (
                        <li key={product.id} className={`adm-product${product.soldOut ? " is-soldout" : ""}`}>
                          <Link href={`/admin/menu/${product.id}`} className="adm-product-main">
                            <span className="adm-product-thumb">
                              {product.imageUrl ? (
                                <Image src={product.imageUrl} alt="" fill sizes="52px" />
                              ) : (
                                <span aria-hidden>{product.name.charAt(0)}</span>
                              )}
                            </span>
                            <span className="adm-product-text">
                              <strong>{product.name}</strong>
                              <small>
                                {showsPriceFrom(product) ? `desde ${formatMoney(priceFrom(product))}` : formatMoney(priceFrom(product))}
                                {product.bundle?.length
                                  ? ` · oferta con ${product.bundle.length} ${product.bundle.length === 1 ? "producto" : "productos"}`
                                  : isOfferProduct(product, category)
                                    ? " · oferta"
                                    : ""}
                                {product.optionGroups?.length
                                  ? ` · ${product.optionGroups.length} ${product.optionGroups.length === 1 ? "grupo" : "grupos"} de opciones`
                                  : ""}
                              </small>
                            </span>
                          </Link>
                          {/* Solo las ofertas se destacan (arriba del menú, en "Ofertas destacadas"). */}
                          {isOfferProduct(product, category) ? (
                            <button
                              type="button"
                              className={`adm-star${product.featured ? " is-on" : ""}`}
                              aria-pressed={Boolean(product.featured)}
                              aria-label={product.featured ? "Quitar de ofertas destacadas" : "Destacar oferta"}
                              title='Destacada en "Ofertas destacadas"'
                              onClick={() =>
                                run(
                                  { type: "flags", productId: product.id, flags: { featured: !product.featured } },
                                  () => setProductFlags(product.id, { featured: !product.featured }),
                                  product.featured ? "Ya no está destacada" : "Destacada en la tienda",
                                )
                              }
                            >
                              {product.featured ? <StarFill /> : <Star />}
                            </button>
                          ) : (
                            <span className="adm-star" aria-hidden />
                          )}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={!product.soldOut}
                            className={`adm-avail${product.soldOut ? " is-off" : ""}`}
                            onClick={() =>
                              run(
                                { type: "flags", productId: product.id, flags: { soldOut: !product.soldOut } },
                                () => setProductFlags(product.id, { soldOut: !product.soldOut }),
                                product.soldOut ? `${product.name}: disponible` : `${product.name}: agotado`,
                              )
                            }
                          >
                            {product.soldOut ? "Agotado" : "Disponible"}
                          </button>
                          <span className="adm-reorder">
                            <button
                              type="button"
                              aria-label={`Subir ${product.name}`}
                              disabled={position === 0 || Boolean(term)}
                              onClick={() => run({ type: "product", productId: product.id, direction: -1 }, () => moveProduct(product.id, -1))}
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              aria-label={`Bajar ${product.name}`}
                              disabled={position === group.products.length - 1 || Boolean(term)}
                              onClick={() => run({ type: "product", productId: product.id, direction: 1 }, () => moveProduct(product.id, 1))}
                            >
                              <ArrowDown size={14} />
                            </button>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}

            <Link href={`/admin/menu/nuevo?categoria=${category.id}`} className="adm-add-row">
              <PlusLg aria-hidden /> {category.kind === "offers" ? "Armar oferta" : "Agregar producto"} en {category.name}
            </Link>
          </section>
        );
      })}

      <CategoryModal draft={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
