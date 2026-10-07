"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { Bag } from "react-bootstrap-icons";
import { saveAppearance } from "@/app/admin/actions";
import { readableText, shade } from "@/lib/theme";
import type { Business } from "@/lib/types";
import { HEX_COLOR } from "@/lib/validation";
import ImageField from "../ImageField";
import { Field, Panel, SaveBar } from "../ui";
import { useSettingsForm } from "./useSettingsForm";

const PRESETS = ["#e8590c", "#c92a2a", "#d6336c", "#7048e8", "#1c7ed6", "#0c8599", "#2f6b4f", "#5c940d", "#191714"];
const ACCENTS = ["#ffd43b", "#f2c14e", "#ffa94d", "#63e6be", "#74c0fc", "#ffffff"];

function ColorField({
  label,
  value,
  presets,
  onChange,
  error,
}: {
  label: string;
  value: string;
  presets: string[];
  onChange: (color: string) => void;
  error?: string;
}) {
  return (
    <Field label={label} error={error}>
      <div className="adm-colors">
        <input type="color" aria-label={label} value={HEX_COLOR.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} />
        {presets.map((color) => (
          <button
            key={color}
            type="button"
            className={`adm-swatch${value.toLowerCase() === color ? " is-on" : ""}`}
            style={{ background: color }}
            aria-label={`Usar ${color}`}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
    </Field>
  );
}

export default function AppearanceForm({ business }: { business: Business }) {
  const form = useSettingsForm(
    {
      primary: business.theme.primary,
      accent: business.theme.accent,
      logoUrl: business.logoUrl,
      coverUrl: business.coverUrl ?? "",
    },
    saveAppearance,
    "Apariencia guardada",
  );
  const { value, update, errors } = form;
  const primary = HEX_COLOR.test(value.primary) ? value.primary : business.theme.primary;
  const accent = HEX_COLOR.test(value.accent) ? value.accent : business.theme.accent;
  // La vista previa usa las mismas variables que la tienda, con los colores sin guardar.
  const previewStyle = {
    "--brand": primary,
    "--brand-ink": readableText(primary),
    "--brand-press": shade(primary, -0.14),
    "--brand-wash": shade(primary, 0.9),
    "--accent": accent,
    "--accent-ink": readableText(accent),
  } as CSSProperties;

  return (
    <Panel title="Apariencia" description="El logo, la foto para compartir y los colores de tu tienda.">
      <div className="adm-appearance">
        <div className="adm-appearance-fields">
          <div className="adm-grid-2">
            <Field label="Logo" error={errors.logoUrl} hint="Se ve grande en la portada de tu tienda.">
              <ImageField value={value.logoUrl} onChange={(logoUrl) => update({ logoUrl })} label="logo" />
            </Field>
            <Field label="Foto para compartir" hint="Opcional. Aparece cuando mandás el link por WhatsApp o Instagram.">
              <ImageField value={value.coverUrl} onChange={(coverUrl) => update({ coverUrl })} shape="wide" label="portada" />
            </Field>
          </div>
          <ColorField
            label="Color principal (botones y selección)"
            value={value.primary}
            presets={PRESETS}
            onChange={(color) => update({ primary: color })}
            error={errors.primary}
          />
          <ColorField
            label="Color de acento (etiquetas y contador)"
            value={value.accent}
            presets={ACCENTS}
            onChange={(color) => update({ accent: color })}
            error={errors.accent}
          />
        </div>

        <div className="adm-appearance-preview" style={previewStyle} aria-label="Vista previa">
          <p className="adm-eyebrow">Vista previa</p>
          <div className="adm-mini-store">
            {/* Como la portada de la tienda: el nombre grande y el logo al lado. */}
            <div className="adm-mini-hero">
              <strong>{business.name}</strong>
              <span className="adm-mini-logo">
                {value.logoUrl && <Image src={value.logoUrl} alt="" fill sizes="64px" />}
              </span>
            </div>
            <div className="adm-mini-body">
              <span className="pill pill--required">Obligatorio</span>
              <button type="button" className="btn-main" tabIndex={-1}>
                Agregar <span>$9.000</span>
              </button>
              <span className="adm-mini-cart">
                <span className="cart-pill-icon">
                  <Bag size={18} aria-hidden />
                  <span className="cart-pill-count">2</span>
                </span>
                Ver mi pedido
              </span>
            </div>
          </div>
        </div>
      </div>

      <SaveBar saving={form.saving} dirty={form.dirty} onSave={form.save} />
    </Panel>
  );
}
