"use client";

import { useState } from "react";
import { PencilSquare, PlusLg, TicketPerforated, Trash3 } from "react-bootstrap-icons";
import { deleteCoupon, saveCoupon, setCouponActive } from "@/app/admin/actions";
import { useToast } from "@/components/store/ToastProvider";
import type { FieldErrors } from "@/lib/admin-forms";
import { formatMoney } from "@/lib/format";
import { describeCoupon } from "@/lib/pricing";
import type { Coupon } from "@/lib/types";
import { Field, MoneyInput, Switch } from "./ui";

interface CouponDraft {
  code: string;
  type: "percent" | "fixed";
  value: string;
  minSubtotal: string;
  active: boolean;
}

const toDraft = (coupon?: Coupon): CouponDraft => ({
  code: coupon?.code ?? "",
  type: coupon?.type ?? "percent",
  value: coupon ? String(coupon.value) : "",
  minSubtotal: coupon?.minSubtotal ? String(coupon.minSubtotal) : "",
  active: coupon?.active ?? true,
});

function CouponForm({
  original,
  onDone,
}: {
  original: Coupon | null;
  onDone: () => void;
}) {
  const notify = useToast();
  const [draft, setDraft] = useState(() => toDraft(original ?? undefined));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const update = (patch: Partial<CouponDraft>) => setDraft((d) => ({ ...d, ...patch }));

  async function save() {
    setSaving(true);
    const result = await saveCoupon(draft, original?.code ?? null);
    setSaving(false);
    if (result.ok) {
      notify(original ? "Cupón guardado" : "Cupón creado");
      onDone();
    } else {
      setErrors(result.errors ?? {});
      if (result.error) notify(result.error);
    }
  }

  return (
    <div className="adm-panel adm-coupon-form">
      <h2 className="adm-panel-title">{original ? `Editar ${original.code}` : "Nuevo cupón"}</h2>
      <div className="adm-grid-2">
        <Field label="Código" htmlFor="c-code" hint="Lo que escribe el cliente. Sin espacios." error={errors.code}>
          <input
            id="c-code"
            className="adm-input adm-input--code"
            value={draft.code}
            maxLength={20}
            autoCapitalize="characters"
            placeholder="BIENVENIDA"
            onChange={(e) => update({ code: e.target.value.toUpperCase().replace(/\s/g, "") })}
          />
        </Field>
        <Field label="Descuento" error={errors.value}>
          <div className="adm-inline">
            <div className="adm-segmented adm-segmented--small" role="radiogroup" aria-label="Tipo de descuento">
              <button type="button" role="radio" aria-checked={draft.type === "percent"} className={draft.type === "percent" ? "is-on" : undefined} onClick={() => update({ type: "percent" })}>
                %
              </button>
              <button type="button" role="radio" aria-checked={draft.type === "fixed"} className={draft.type === "fixed" ? "is-on" : undefined} onClick={() => update({ type: "fixed" })}>
                $
              </button>
            </div>
            {draft.type === "percent" ? (
              <span className="adm-unit">
                <input
                  className="adm-input"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={90}
                  aria-label="Porcentaje"
                  value={draft.value}
                  onChange={(e) => update({ value: e.target.value })}
                />
                <span aria-hidden>%</span>
              </span>
            ) : (
              <MoneyInput aria-label="Monto" placeholder="0" value={draft.value} onChange={(value) => update({ value })} />
            )}
          </div>
        </Field>
        <Field label="Pedido mínimo" htmlFor="c-min" hint="Vacío = sin mínimo." error={errors.minSubtotal}>
          <MoneyInput id="c-min" placeholder="0" value={draft.minSubtotal} onChange={(minSubtotal) => update({ minSubtotal })} />
        </Field>
        <div className="adm-field adm-field--switch">
          <Switch checked={draft.active} onChange={(active) => update({ active })} label="Activo" description="Si lo apagás, deja de funcionar." />
        </div>
      </div>
      <div className="adm-form-actions">
        <button type="button" className="adm-btn" onClick={onDone}>
          Cancelar
        </button>
        <button type="button" className="adm-btn adm-btn--primary" onClick={save} disabled={saving}>
          {saving ? "Guardando…" : original ? "Guardar" : "Crear cupón"}
        </button>
      </div>
    </div>
  );
}

export default function CouponsManager({ coupons, usage }: { coupons: Coupon[]; usage: Record<string, number> }) {
  const notify = useToast();
  // null: sin formulario; "nuevo": creando; un código: editando ese cupón.
  const [editing, setEditing] = useState<string | null>(null);
  const editingCoupon = coupons.find((c) => c.code === editing) ?? null;

  async function remove(coupon: Coupon) {
    if (!window.confirm(`¿Borrar el cupón ${coupon.code}?`)) return;
    const result = await deleteCoupon(coupon.code);
    notify(result.ok ? "Cupón borrado" : (result.error ?? "No se pudo borrar."));
  }

  async function toggle(coupon: Coupon, active: boolean) {
    const result = await setCouponActive(coupon.code, active);
    notify(result.ok ? (active ? `${coupon.code} activado` : `${coupon.code} pausado`) : (result.error ?? "No se pudo cambiar."));
  }

  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <div>
          <h1 className="adm-title">Cupones</h1>
          <p className="adm-subtitle">Descuentos que tus clientes cargan al hacer el pedido.</p>
        </div>
        <button type="button" className="adm-btn adm-btn--primary" onClick={() => setEditing("nuevo")}>
          <PlusLg aria-hidden /> Nuevo cupón
        </button>
      </header>

      {editing && <CouponForm key={editing} original={editingCoupon} onDone={() => setEditing(null)} />}

      {coupons.length === 0 ? (
        <p className="adm-empty">
          <TicketPerforated size={22} aria-hidden />
          Todavía no creaste cupones. Probá con uno de bienvenida para compartir en Instagram.
        </p>
      ) : (
        <ul className="adm-coupons">
          {coupons.map((coupon) => (
            <li key={coupon.code} className={`adm-coupon${coupon.active ? "" : " is-off"}`}>
              <div className="adm-coupon-code">{coupon.code}</div>
              <div className="adm-coupon-text">
                <strong>{describeCoupon(coupon)}</strong>
                <span className="adm-muted">
                  {coupon.minSubtotal ? `Pedidos desde ${formatMoney(coupon.minSubtotal)}` : "Sin mínimo"} · usado{" "}
                  {usage[coupon.code] ?? 0} {usage[coupon.code] === 1 ? "vez" : "veces"}
                </span>
              </div>
              <Switch checked={coupon.active} onChange={(active) => toggle(coupon, active)} label={coupon.active ? "Activo" : "Pausado"} />
              <div className="adm-coupon-actions">
                <button type="button" className="adm-icon-btn" aria-label={`Editar ${coupon.code}`} onClick={() => setEditing(coupon.code)}>
                  <PencilSquare />
                </button>
                <button type="button" className="adm-icon-btn" aria-label={`Borrar ${coupon.code}`} onClick={() => remove(coupon)}>
                  <Trash3 />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
