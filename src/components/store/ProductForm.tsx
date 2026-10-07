"use client";

import Image from "next/image";
import { useState } from "react";
import { Check2, XLg } from "react-bootstrap-icons";
import { createId } from "@/lib/browser";
import { formatMoney } from "@/lib/format";
import { offerIncludesText } from "@/lib/offers";
import { describeGroupRule, hasNamedVariants, optionsTotal, priceFrom, productVariants, showsPriceFrom } from "@/lib/pricing";
import type { CartOption, Option, OptionGroup, ProductContext } from "@/lib/types";
import QtyStepper from "./QtyStepper";
import { useCart } from "./StoreProvider";
import { useToast } from "./ToastProvider";

/** groupId → optionId → cantidad por unidad. */
type Selection = Record<string, Record<string, number>>;

const MAX_UNITS = 50;
const NOTES_MAX = 150;

function groupCount(selection: Selection, group: OptionGroup): number {
  return Object.values(selection[group.id] ?? {}).reduce((sum, qty) => sum + qty, 0);
}

interface ProductFormProps {
  context: ProductContext;
  /** "sheet": dentro de la hoja deslizable; "page": página propia del producto. */
  layout: "sheet" | "page";
  onAdded: () => void;
  onClose?: () => void;
}

export default function ProductForm({ context, layout, onAdded, onClose }: ProductFormProps) {
  const { product, sectionLabel, offer, allowsNotes } = context;
  const { add } = useCart();
  const notify = useToast();

  const variants = productVariants(product);
  const named = hasNamedVariants(product);
  const groups = product.optionGroups ?? [];
  const soldOut = Boolean(product.soldOut);
  const Title = layout === "page" ? "h1" : "h2";

  const [variantId, setVariantId] = useState(variants[0].id);
  const [qty, setQty] = useState(1);
  const [selection, setSelection] = useState<Selection>({});
  const [notes, setNotes] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const chosenOptions: CartOption[] = groups.flatMap((group) =>
    group.options
      .filter((option) => (selection[group.id]?.[option.id] ?? 0) > 0)
      .map((option) => ({
        groupId: group.id,
        groupName: group.name,
        optionId: option.id,
        name: option.name,
        price: option.price,
        qty: selection[group.id][option.id],
      })),
  );
  const total = (variant.price + optionsTotal(chosenOptions)) * qty;
  const missing = groups.filter((group) => groupCount(selection, group) < group.min);

  function setOption(group: OptionGroup, option: Option, value: number) {
    setSelection((prev) => {
      const current = prev[group.id] ?? {};
      let next: Record<string, number>;
      if (group.max === 1) {
        // En grupos de una sola opción, elegir otra reemplaza la anterior.
        next = value > 0 ? { [option.id]: 1 } : {};
      } else {
        const others = groupCount(prev, group) - (current[option.id] ?? 0);
        const cap = Math.min(option.maxQty ?? 1, (group.max ?? Infinity) - others);
        const clamped = Math.max(0, Math.min(value, cap));
        next = { ...current, [option.id]: clamped };
        if (clamped === 0) delete next[option.id];
      }
      return { ...prev, [group.id]: next };
    });
  }

  function handleAdd() {
    if (soldOut) return;
    if (missing.length) {
      setShowErrors(true);
      document.getElementById(`grupo-${missing[0].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    add([
      {
        key: createId(),
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        sectionLabel,
        variantId: named ? variant.id : undefined,
        variantName: named ? variant.name : undefined,
        unitPrice: variant.price,
        options: chosenOptions,
        includes: offer ? offerIncludesText(offer.lines) : undefined,
        notes: (allowsNotes && notes.trim()) || undefined,
        qty,
      },
    ]);
    notify(qty === 1 ? `${product.name} al pedido` : `${qty} × ${product.name} al pedido`);
    onAdded();
  }

  return (
    <div className={`pf pf--${layout}`}>
      <div className="pf-scroll">
        {product.imageUrl ? (
          <div className="pf-media">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 600px) 100vw, 560px"
              loading="eager"
              fetchPriority="high"
            />
            {onClose && (
              <button type="button" className="round-btn pf-close" aria-label="Cerrar" onClick={onClose}>
                <XLg size={16} />
              </button>
            )}
          </div>
        ) : (
          onClose && (
            <div className="pf-close-row">
              <button type="button" className="round-btn round-btn--soft" aria-label="Cerrar" onClick={onClose}>
                <XLg size={16} />
              </button>
            </div>
          )
        )}

        <div className="pf-body">
          <Title id="product-title" className="pf-title">
            {product.name}
          </Title>
          {product.description && <p className="pf-desc">{product.description}</p>}
          <p className="pf-price">
            {showsPriceFrom(product) && <small>desde</small>}
            {formatMoney(named ? priceFrom(product) : variant.price)}
          </p>
          {soldOut && <p className="pf-soldout">Este producto está agotado por ahora.</p>}

          {offer && (
            <section className="pf-offer" aria-labelledby="pf-offer-title">
              <h3 id="pf-offer-title" className="pf-group-name">
                Incluye
              </h3>
              <ul className="pf-offer-lines">
                {offer.lines.map((line, index) => (
                  <li key={index}>
                    <strong>{line.qty}×</strong> {line.name}
                  </li>
                ))}
              </ul>
              {offer.savings > 0 && (
                <p className="pf-offer-save">
                  Por separado <s>{formatMoney(offer.regularPrice)}</s> · Ahorrás {formatMoney(offer.savings)}
                </p>
              )}
            </section>
          )}

          {named && (
            <fieldset className="pf-group" disabled={soldOut}>
              <legend className="pf-group-head">
                <span>
                  <span className="pf-group-name">Elegí una opción</span>
                  <span className="pf-group-rule">Tamaño o presentación.</span>
                </span>
              </legend>
              <div className="choices">
                {variants.map((v) => (
                  <label key={v.id} className={`choice${variantId === v.id ? " is-on" : ""}`}>
                    <input
                      type="radio"
                      name="variante"
                      className="choice-input"
                      checked={variantId === v.id}
                      onChange={() => setVariantId(v.id)}
                    />
                    <span className="choice-mark choice-mark--radio" aria-hidden />
                    <span className="choice-name">{v.name}</span>
                    <span className="choice-price">{formatMoney(v.price)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {groups.map((group) => {
            const count = groupCount(selection, group);
            const satisfied = count >= group.min;
            const full = group.max !== undefined && count >= group.max;
            const radio = group.min === 1 && group.max === 1;
            return (
              <fieldset
                key={group.id}
                id={`grupo-${group.id}`}
                className={`pf-group${showErrors && !satisfied ? " is-invalid" : ""}`}
                disabled={soldOut}
              >
                <legend className="pf-group-head">
                  <span>
                    <span className="pf-group-name">{group.name}</span>
                    <span className="pf-group-rule">{describeGroupRule(group)}</span>
                  </span>
                  {group.min > 0 ? (
                    <span className={`pill${satisfied ? " pill--ok" : " pill--required"}`}>
                      {satisfied ? (
                        <>
                          <Check2 aria-hidden /> Listo
                        </>
                      ) : (
                        "Obligatorio"
                      )}
                    </span>
                  ) : (
                    <span className={`pill${count ? " pill--ok" : ""}`}>{count ? `${count} elegida${count > 1 ? "s" : ""}` : "Opcional"}</span>
                  )}
                </legend>
                <div className="choices">
                  {group.options.map((option) => {
                    const optionQty = selection[group.id]?.[option.id] ?? 0;
                    const maxQty = option.maxQty ?? 1;
                    const blocked = optionQty === 0 && full && group.max !== 1;
                    return (
                      <div
                        key={option.id}
                        className={`choice${optionQty ? " is-on" : ""}${blocked ? " is-blocked" : ""}`}
                      >
                        <label className="choice-main">
                          <input
                            type={radio ? "radio" : "checkbox"}
                            name={`grupo-${group.id}`}
                            className="choice-input"
                            checked={optionQty > 0}
                            disabled={blocked}
                            onChange={(e) => setOption(group, option, e.target.checked ? 1 : 0)}
                          />
                          <span className={`choice-mark choice-mark--${radio ? "radio" : "check"}`} aria-hidden>
                            {!radio && <Check2 size={14} />}
                          </span>
                          <span className="choice-name">{option.name}</span>
                        </label>
                        {maxQty > 1 && optionQty > 0 && (
                          <QtyStepper
                            value={optionQty}
                            max={full ? optionQty : maxQty}
                            label={option.name}
                            onChange={(value) => setOption(group, option, value)}
                          />
                        )}
                        {option.price > 0 && <span className="choice-price">+{formatMoney(option.price)}</span>}
                      </div>
                    );
                  })}
                </div>
                {showErrors && !satisfied && <p className="field-error">{describeGroupRule(group)}</p>}
              </fieldset>
            );
          })}

          {allowsNotes && (
            <div className="pf-notes">
              <div className="pf-notes-head">
                <label htmlFor="aclaraciones" className="pf-group-name">
                  ¿Alguna aclaración?
                </label>
                <span className="pf-counter">
                  {notes.length}/{NOTES_MAX}
                </span>
              </div>
              <textarea
                id="aclaraciones"
                className="input"
                rows={2}
                maxLength={NOTES_MAX}
                value={notes}
                disabled={soldOut}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: sin sal, la carne bien cocida…"
              />
            </div>
          )}
        </div>
      </div>

      <div className="pf-footer">
        <QtyStepper size="lg" value={qty} min={1} max={MAX_UNITS} label="unidad" onChange={setQty} />
        <button type="button" className="btn-main" disabled={soldOut} onClick={handleAdd}>
          {soldOut ? (
            "Agotado"
          ) : (
            <>
              Agregar <span className="btn-main-price">{formatMoney(total)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
