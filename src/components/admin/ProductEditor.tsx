"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, PlusLg, Trash3 } from "react-bootstrap-icons";
import { deleteProduct, saveProduct } from "@/app/admin/actions";
import ProductCard from "@/components/store/ProductCard";
import { useStore } from "@/components/store/StoreProvider";
import { useToast } from "@/components/store/ToastProvider";
import { NEW_GROUP, previewProduct, withoutErrors, type FieldErrors, type ProductDraft } from "@/lib/admin-forms";
import { formatMoney } from "@/lib/format";
import { resolveOffer, savingsPercent } from "@/lib/offers";
import { describeGroupRule } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import ImageField from "./ImageField";
import { Field, MoneyInput, Panel, Switch } from "./ui";

type GroupDraft = ProductDraft["optionGroups"][number];
type OptionDraft = GroupDraft["options"][number];
type BundleDraft = ProductDraft["bundle"][number];

export interface CategoryChoice {
  id: string;
  name: string;
  /** Categoría de ofertas: el editor muestra el armador de ofertas. */
  offers: boolean;
  groups: { id: string; name: string }[];
}

/** Producto que se puede sumar a una oferta (con el nombre de su categoría para agruparlo). */
export interface CatalogProduct extends Pick<Product, "id" | "name" | "price" | "variants"> {
  category: string;
}

const emptyOption = (): OptionDraft => ({ id: null, name: "", price: "", maxQty: "" });
const emptyGroup = (): GroupDraft => ({ id: null, name: "", min: "0", max: "", options: [emptyOption()] });

/** El texto que ve el cliente debajo del grupo ("Seleccioná 1 opción."). */
function ruleText(group: GroupDraft): string {
  const min = Number(group.min) || 0;
  const max = group.max === "" ? undefined : Number(group.max);
  if (max !== undefined && (!Number.isInteger(max) || max < Math.max(min, 1))) return "Revisá el máximo.";
  return describeGroupRule({ id: "", name: "", min, max, options: [] });
}

export default function ProductEditor({
  initial,
  categories,
  catalog,
}: {
  initial: ProductDraft;
  categories: CategoryChoice[];
  catalog: CatalogProduct[];
}) {
  const router = useRouter();
  const notify = useToast();
  const { slug } = useStore();
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const isNew = !initial.id;
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const category = categories.find((c) => c.id === draft.categoryId);
  const isOffer = Boolean(category?.offers) || draft.isOffer;
  // El producto que se está editando no puede sumarse a sí mismo.
  const choices = useMemo(() => catalog.filter((p) => p.id !== initial.id), [catalog, initial.id]);
  const choicesById = useMemo(() => new Map(choices.map((p) => [p.id, p])), [choices]);
  const choiceGroups = useMemo(() => {
    const groups = new Map<string, CatalogProduct[]>();
    for (const product of choices) groups.set(product.category, [...(groups.get(product.category) ?? []), product]);
    return groups;
  }, [choices]);
  const preview = previewProduct({ ...draft, isOffer });
  const offer = resolveOffer(preview, choicesById);

  // Al editar un campo se borra su error (agregar o quitar filas borra los de toda la lista).
  const clearErrors = (prefix: string, patch: object) =>
    setErrors((current) => withoutErrors(current, Object.keys(patch).map((key) => prefix + key)));
  const update = (patch: Partial<ProductDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    clearErrors("", patch);
  };
  const updateVariant = (index: number, patch: Partial<ProductDraft["variants"][number]>) => {
    setDraft((d) => ({ ...d, variants: d.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)) }));
    clearErrors(`variants.${index}.`, patch);
  };
  const updateGroup = (index: number, patch: Partial<GroupDraft>) => {
    setDraft((d) => ({ ...d, optionGroups: d.optionGroups.map((g, i) => (i === index ? { ...g, ...patch } : g)) }));
    clearErrors(`optionGroups.${index}.`, patch);
  };
  const updateBundle = (index: number, patch: Partial<BundleDraft>) => {
    setDraft((d) => ({ ...d, bundle: d.bundle.map((item, i) => (i === index ? { ...item, ...patch } : item)) }));
    clearErrors(`bundle.${index}.`, patch);
  };
  const updateOption = (groupIndex: number, optionIndex: number, patch: Partial<OptionDraft>) => {
    setDraft((d) => ({
      ...d,
      optionGroups: d.optionGroups.map((g, i) =>
        i === groupIndex ? { ...g, options: g.options.map((o, j) => (j === optionIndex ? { ...o, ...patch } : o)) } : g,
      ),
    }));
    clearErrors(`optionGroups.${groupIndex}.options.${optionIndex}.`, patch);
  };

  async function save() {
    setSaving(true);
    const result = await saveProduct(draft);
    setSaving(false);
    if (result.ok) {
      notify(isNew ? "Producto creado" : "Cambios guardados");
      router.push("/admin/menu");
      return;
    }
    setErrors(result.errors ?? {});
    notify(result.error ?? "Revisá los campos marcados.");
    requestAnimationFrame(() =>
      document.querySelector(".adm-error")?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  }

  async function remove() {
    if (!initial.id || !window.confirm(`¿Borrar "${initial.name}"? No se puede deshacer.`)) return;
    const result = await deleteProduct(initial.id);
    if (result.ok) {
      notify("Producto borrado");
      router.push("/admin/menu");
    } else {
      notify(result.error ?? "No se pudo borrar.");
    }
  }

  return (
    <div className="adm-page adm-editor">
      <header className="adm-page-head">
        <div className="min-w-0">
          <Link href="/admin/menu" className="adm-back">
            <ArrowLeft aria-hidden /> Menú
          </Link>
          <h1 className="adm-title">{isNew ? (isOffer ? "Nueva oferta" : "Nuevo producto") : initial.name}</h1>
        </div>
      </header>

      <div className="adm-editor-grid">
        <div className="adm-editor-main">
          <Panel title="Datos">
            <Field label="Nombre" htmlFor="p-name" error={errors.name}>
              <input
                id="p-name"
                className="adm-input"
                value={draft.name}
                maxLength={60}
                placeholder={isOffer ? "Ej: Combo pareja" : "Ej: Milanesa napolitana"}
                onChange={(e) => update({ name: e.target.value })}
              />
            </Field>
            <Field label="Descripción" htmlFor="p-desc" hint="Ingredientes, tamaño, si incluye guarnición…">
              <textarea
                id="p-desc"
                className="adm-input"
                rows={3}
                maxLength={300}
                value={draft.description}
                onChange={(e) => update({ description: e.target.value })}
              />
            </Field>
            <div className="adm-grid-2">
              <Field label="Categoría" htmlFor="p-cat" error={errors.categoryId}>
                <select
                  id="p-cat"
                  className="adm-input"
                  value={draft.categoryId}
                  onChange={(e) => {
                    const next = categories.find((c) => c.id === e.target.value);
                    update({ categoryId: e.target.value, subcategoryId: next?.groups[0]?.id ?? "" });
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Grupo" htmlFor="p-group" hint="Para separar dentro de la categoría." error={errors.subcategoryId}>
                <select
                  id="p-group"
                  className="adm-input"
                  value={draft.subcategoryId}
                  onChange={(e) => update({ subcategoryId: e.target.value })}
                >
                  {category?.groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {category.groups.length === 1 ? `${g.name} (único)` : g.name}
                    </option>
                  ))}
                  <option value={NEW_GROUP}>+ Grupo nuevo…</option>
                </select>
              </Field>
            </div>
            <div className="adm-switches">
              <Switch
                checked={isOffer}
                disabled={Boolean(category?.offers)}
                onChange={(on) => update({ isOffer: on })}
                label="Es una oferta o promo"
                description={
                  category?.offers
                    ? "Está en la categoría de ofertas."
                    : "Puede estar en cualquier categoría: se puede destacar arriba del menú y armar con productos."
                }
              />
            </div>
            {draft.subcategoryId === NEW_GROUP && (
              <Field label="Nombre del grupo nuevo" htmlFor="p-newgroup" error={errors.newGroupName}>
                <input
                  id="p-newgroup"
                  className="adm-input"
                  value={draft.newGroupName}
                  maxLength={40}
                  placeholder="Ej: De pollo"
                  onChange={(e) => update({ newGroupName: e.target.value })}
                />
              </Field>
            )}
          </Panel>

          {isOffer && (
            <Panel
              title="Armador de oferta"
              description="Sumá los productos del menú que incluye. El cliente ve el detalle y cuánto ahorra."
            >
              <div className="adm-rows">
                {draft.bundle.map((item, index) => {
                  const included = choicesById.get(item.productId);
                  const rowError =
                    errors[`bundle.${index}.productId`] ?? errors[`bundle.${index}.variantId`] ?? errors[`bundle.${index}.qty`];
                  return (
                    <div key={index} className="adm-row adm-row--bundle">
                      <select
                        className="adm-input adm-bundle-product"
                        aria-label={`Producto ${index + 1} de la oferta`}
                        value={item.productId}
                        onChange={(e) =>
                          updateBundle(index, {
                            productId: e.target.value,
                            variantId: choicesById.get(e.target.value)?.variants?.[0]?.id ?? "",
                          })
                        }
                      >
                        <option value="">Elegí un producto…</option>
                        {[...choiceGroups].map(([name, products]) => (
                          <optgroup key={name} label={name}>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {included?.variants?.length ? (
                        <select
                          className="adm-input"
                          aria-label={`Presentación de ${included.name}`}
                          value={item.variantId}
                          onChange={(e) => updateBundle(index, { variantId: e.target.value })}
                        >
                          {included.variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name} · {formatMoney(v.price)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="adm-bundle-price">
                          {included?.price !== undefined ? formatMoney(included.price) : ""}
                        </span>
                      )}
                      <span className="adm-unit adm-unit--before">
                        <span aria-hidden>×</span>
                        <input
                          className="adm-input adm-input--qty"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={20}
                          aria-label={`Cantidad de ${included?.name ?? `el producto ${index + 1}`}`}
                          value={item.qty}
                          onChange={(e) => updateBundle(index, { qty: e.target.value })}
                        />
                      </span>
                      <button
                        type="button"
                        className="adm-icon-btn"
                        aria-label="Sacar de la oferta"
                        onClick={() => update({ bundle: draft.bundle.filter((_, i) => i !== index) })}
                      >
                        <Trash3 />
                      </button>
                      {rowError && <p className="adm-error adm-row-error">{rowError}</p>}
                    </div>
                  );
                })}
                {errors.bundle && <p className="adm-error">{errors.bundle}</p>}
                <button
                  type="button"
                  className="adm-btn adm-btn--dashed"
                  disabled={draft.bundle.length >= 12}
                  onClick={() => update({ bundle: [...draft.bundle, { productId: "", variantId: "", qty: "1" }] })}
                >
                  <PlusLg aria-hidden /> Sumar producto
                </button>
              </div>
              {offer && (
                <dl className="adm-offer-sum">
                  <div>
                    <dt>Por separado</dt>
                    <dd>{formatMoney(offer.regularPrice)}</dd>
                  </div>
                  <div>
                    <dt>Precio de la oferta</dt>
                    <dd>{preview.price ? formatMoney(preview.price) : "Ponelo abajo"}</dd>
                  </div>
                  <div className={offer.savings > 0 && preview.price ? "is-good" : "is-bad"}>
                    <dt>El cliente ahorra</dt>
                    <dd>
                      {offer.savings > 0 && preview.price
                        ? `${formatMoney(offer.savings)} (${savingsPercent(offer)} %)`
                        : "Nada todavía"}
                    </dd>
                  </div>
                </dl>
              )}
            </Panel>
          )}

          <Panel
            title="Foto (opcional)"
            description="Mejor una foto real de tu producto que una de referencia. Si no tenés, dejalo sin foto: la tarjeta se ve bien igual."
          >
            <ImageField value={draft.imageUrl} onChange={(imageUrl) => update({ imageUrl })} />
          </Panel>

          <Panel title={isOffer ? "Precio de la oferta" : "Precio"}>
            {(!isOffer || draft.hasVariants) && (
            <div className="adm-segmented" role="radiogroup" aria-label="Tipo de precio">
              <button
                type="button"
                role="radio"
                aria-checked={!draft.hasVariants}
                className={!draft.hasVariants ? "is-on" : undefined}
                onClick={() => update({ hasVariants: false })}
              >
                Precio único
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={draft.hasVariants}
                className={draft.hasVariants ? "is-on" : undefined}
                onClick={() => update({ hasVariants: true })}
              >
                Presentaciones
              </button>
            </div>
            )}
            {draft.hasVariants ? (
              <div className="adm-rows">
                <p className="adm-hint">Tamaños o porciones: el cliente elige una. Ej: Simple, Doble / Media docena, Docena.</p>
                {draft.variants.map((variant, index) => (
                  <div key={variant.id ?? `nueva-${index}`} className="adm-row adm-row--variant">
                    <input
                      className="adm-input"
                      aria-label={`Presentación ${index + 1}`}
                      placeholder="Nombre"
                      value={variant.name}
                      maxLength={30}
                      onChange={(e) => updateVariant(index, { name: e.target.value })}
                    />
                    <MoneyInput
                      aria-label={`Precio de la presentación ${index + 1}`}
                      placeholder="Precio"
                      value={variant.price}
                      onChange={(price) => updateVariant(index, { price })}
                    />
                    <button
                      type="button"
                      className="adm-icon-btn"
                      aria-label="Quitar presentación"
                      disabled={draft.variants.length === 1}
                      onClick={() => update({ variants: draft.variants.filter((_, i) => i !== index) })}
                    >
                      <Trash3 />
                    </button>
                    {(errors[`variants.${index}.name`] || errors[`variants.${index}.price`]) && (
                      <p className="adm-error adm-row-error">
                        {errors[`variants.${index}.name`] ?? errors[`variants.${index}.price`]}
                      </p>
                    )}
                  </div>
                ))}
                {errors.variants && <p className="adm-error">{errors.variants}</p>}
                <button
                  type="button"
                  className="adm-btn adm-btn--dashed"
                  disabled={draft.variants.length >= 12}
                  onClick={() => update({ variants: [...draft.variants, { id: null, name: "", price: "" }] })}
                >
                  <PlusLg aria-hidden /> Agregar presentación
                </button>
              </div>
            ) : (
              <Field label={isOffer ? "Precio de la oferta" : "Precio"} htmlFor="p-price" error={errors.price}>
                <MoneyInput id="p-price" placeholder="0" value={draft.price} onChange={(price) => update({ price })} />
              </Field>
            )}
          </Panel>

          <Panel
            title="Opciones para elegir"
            description="Extras, salsas, guarniciones o ingredientes para sacar. Cada grupo puede ser obligatorio u opcional."
          >
            {draft.optionGroups.map((group, g) => (
              <div key={group.id ?? `grupo-${g}`} className="adm-option-group">
                <div className="adm-option-group-head">
                  <input
                    className="adm-input adm-input--strong"
                    aria-label={`Nombre del grupo ${g + 1}`}
                    placeholder="Nombre del grupo (ej: Salsas)"
                    value={group.name}
                    maxLength={40}
                    onChange={(e) => updateGroup(g, { name: e.target.value })}
                  />
                  <button
                    type="button"
                    className="adm-icon-btn"
                    aria-label="Quitar grupo"
                    onClick={() => update({ optionGroups: draft.optionGroups.filter((_, i) => i !== g) })}
                  >
                    <Trash3 />
                  </button>
                </div>
                {errors[`optionGroups.${g}.name`] && <p className="adm-error">{errors[`optionGroups.${g}.name`]}</p>}
                <div className="adm-grid-2">
                  <Field label="Mínimo a elegir" hint="0 = opcional" error={errors[`optionGroups.${g}.min`]}>
                    <input
                      className="adm-input"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={20}
                      value={group.min}
                      onChange={(e) => updateGroup(g, { min: e.target.value })}
                    />
                  </Field>
                  <Field label="Máximo" hint="Vacío = sin límite" error={errors[`optionGroups.${g}.max`]}>
                    <input
                      className="adm-input"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={20}
                      value={group.max}
                      onChange={(e) => updateGroup(g, { max: e.target.value })}
                    />
                  </Field>
                </div>
                <p className="adm-rule">
                  El cliente ve: <strong>{ruleText(group)}</strong>
                  {Number(group.min) > 0 && " (obligatorio)"}
                </p>
                <div className="adm-rows">
                  <div className="adm-row adm-row--option adm-row--labels" aria-hidden>
                    <span>Opción</span>
                    <span>Precio extra</span>
                    <span>Cantidad</span>
                    <span />
                  </div>
                  {group.options.map((option, o) => (
                    <div key={option.id ?? `opcion-${o}`} className="adm-row adm-row--option">
                      <input
                        className="adm-input"
                        aria-label={`Opción ${o + 1}`}
                        placeholder="Ej: Cheddar"
                        value={option.name}
                        maxLength={40}
                        onChange={(e) => updateOption(g, o, { name: e.target.value })}
                      />
                      <MoneyInput
                        aria-label={`Precio extra de la opción ${o + 1}`}
                        placeholder="0"
                        value={option.price}
                        onChange={(price) => updateOption(g, o, { price })}
                      />
                      {/* "máx." queda a la vista: en el celular no hay títulos de columna. */}
                      <span className="adm-unit adm-unit--before">
                        <span aria-hidden>máx.</span>
                        <input
                          className="adm-input adm-input--qty"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={20}
                          placeholder="1"
                          aria-label={`Cuántas veces se puede elegir la opción ${o + 1}`}
                          value={option.maxQty}
                          onChange={(e) => updateOption(g, o, { maxQty: e.target.value })}
                        />
                      </span>
                      <button
                        type="button"
                        className="adm-icon-btn"
                        aria-label="Quitar opción"
                        onClick={() => updateGroup(g, { options: group.options.filter((_, i) => i !== o) })}
                      >
                        <Trash3 />
                      </button>
                      {(errors[`optionGroups.${g}.options.${o}.name`] ||
                        errors[`optionGroups.${g}.options.${o}.price`] ||
                        errors[`optionGroups.${g}.options.${o}.maxQty`]) && (
                        <p className="adm-error adm-row-error">
                          {errors[`optionGroups.${g}.options.${o}.name`] ??
                            errors[`optionGroups.${g}.options.${o}.price`] ??
                            errors[`optionGroups.${g}.options.${o}.maxQty`]}
                        </p>
                      )}
                    </div>
                  ))}
                  {errors[`optionGroups.${g}.options`] && <p className="adm-error">{errors[`optionGroups.${g}.options`]}</p>}
                  <button
                    type="button"
                    className="adm-btn adm-btn--dashed"
                    onClick={() => updateGroup(g, { options: [...group.options, emptyOption()] })}
                  >
                    <PlusLg aria-hidden /> Agregar opción
                  </button>
                </div>
              </div>
            ))}
            {errors.optionGroups && <p className="adm-error">{errors.optionGroups}</p>}
            <button
              type="button"
              className="adm-btn adm-btn--dashed adm-btn--block"
              disabled={draft.optionGroups.length >= 10}
              onClick={() => update({ optionGroups: [...draft.optionGroups, emptyGroup()] })}
            >
              <PlusLg aria-hidden /> Agregar grupo de opciones
            </button>
          </Panel>

          <Panel title="Visibilidad">
            <div className="adm-switches">
              <Switch
                checked={!draft.soldOut}
                onChange={(available) => update({ soldOut: !available })}
                label="Disponible"
                description="Si lo apagás, aparece como agotado y no se puede pedir."
              />
              {isOffer && (
                <Switch
                  checked={draft.featured}
                  onChange={(featured) => update({ featured })}
                  label="Destacada"
                  description='Aparece arriba de todo, en "Ofertas destacadas".'
                />
              )}
            </div>
          </Panel>
        </div>

        <aside className="adm-editor-side">
          <div className="adm-preview">
            <p className="adm-eyebrow">Así se ve en tu tienda</p>
            {/* Vista previa sin interacción: es la misma tarjeta que ve el cliente. */}
            <div inert className="adm-preview-card">
              <ProductCard slug={slug} product={preview} sectionLabel="" offer={offer ?? undefined} isOffer={isOffer} />
            </div>
          </div>
        </aside>
      </div>

      <div className="adm-editor-bar">
        {!isNew && (
          <button type="button" className="adm-btn adm-btn--ghost-danger" onClick={remove}>
            <Trash3 aria-hidden /> Borrar
          </button>
        )}
        <span className="adm-savebar-state">{dirty ? "Cambios sin guardar" : ""}</span>
        <Link href="/admin/menu" className="adm-btn">
          Cancelar
        </Link>
        <button type="button" className="adm-btn adm-btn--primary" onClick={save} disabled={saving || (!dirty && !isNew)}>
          {saving ? "Guardando…" : isNew ? "Crear producto" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
