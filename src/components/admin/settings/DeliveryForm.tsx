"use client";

import { PlusLg, Trash3 } from "react-bootstrap-icons";
import { saveDeliverySettings } from "@/app/admin/actions";
import { SUGGESTED_ZONES } from "@/lib/shipping";
import type { Business } from "@/lib/types";
import { Field, MoneyInput, Panel, SaveBar, Switch } from "../ui";
import { useSettingsForm } from "./useSettingsForm";

export default function DeliveryForm({ business }: { business: Business }) {
  const { delivery } = business;
  const form = useSettingsForm(
    {
      pickup: delivery.pickup,
      delivery: delivery.delivery,
      zones: delivery.zones.map((z) => ({ id: z.id as string | null, name: z.name, cost: String(z.cost) })),
      minOrder: delivery.minOrder ? String(delivery.minOrder) : "",
    },
    saveDeliverySettings,
    "Entregas guardadas",
  );
  const { value, update, errors } = form;
  const setZone = (index: number, patch: Partial<(typeof value.zones)[number]>) =>
    update({ zones: value.zones.map((z, i) => (i === index ? { ...z, ...patch } : z)) });

  return (
    <Panel title="Entregas" description="Cómo reciben los pedidos tus clientes.">
      <div className="adm-switches">
        <Switch
          checked={value.pickup}
          onChange={(pickup) => update({ pickup })}
          label="Retiro en el local"
          description="El cliente pasa a buscar el pedido."
        />
        <Switch
          checked={value.delivery}
          onChange={(on) => update({ delivery: on })}
          label="Envío a domicilio"
          description="Con costo según la zona."
        />
      </div>
      {errors.methods && <p className="adm-error">{errors.methods}</p>}

      {value.delivery && (
        <>
          <h3 className="adm-subheading">Zonas de envío</h3>
          <p className="adm-hint">
            Por ejemplo, dentro y fuera de boulevard. El cliente elige su zona al hacer el pedido y ve el costo. Sin zonas,
            el costo se arregla por WhatsApp.
          </p>
          <div className="adm-rows">
            {value.zones.map((zone, index) => (
              <div key={zone.id ?? `nueva-${index}`} className="adm-row adm-row--zone">
                <input
                  className="adm-input"
                  aria-label={`Nombre de la zona ${index + 1}`}
                  placeholder="Ej: Dentro de boulevard"
                  maxLength={40}
                  value={zone.name}
                  onChange={(e) => setZone(index, { name: e.target.value })}
                />
                <MoneyInput
                  aria-label={`Costo de envío a ${zone.name || `la zona ${index + 1}`}`}
                  placeholder="0"
                  value={zone.cost}
                  onChange={(cost) => setZone(index, { cost })}
                />
                <button
                  type="button"
                  className="adm-icon-btn"
                  aria-label="Quitar zona"
                  onClick={() => update({ zones: value.zones.filter((_, i) => i !== index) })}
                >
                  <Trash3 />
                </button>
                {(errors[`zones.${index}.name`] || errors[`zones.${index}.cost`]) && (
                  <p className="adm-error adm-row-error">{errors[`zones.${index}.name`] ?? errors[`zones.${index}.cost`]}</p>
                )}
              </div>
            ))}
            {errors.zones && <p className="adm-error">{errors.zones}</p>}
            {value.zones.length === 0 && (
              <button
                type="button"
                className="adm-btn adm-btn--dashed"
                onClick={() => update({ zones: SUGGESTED_ZONES.map((name) => ({ id: null, name, cost: "" })) })}
              >
                <PlusLg aria-hidden /> Usar dentro y fuera de boulevard, y zona rural
              </button>
            )}
            <button
              type="button"
              className="adm-btn adm-btn--dashed"
              disabled={value.zones.length >= 8}
              onClick={() => update({ zones: [...value.zones, { id: null, name: "", cost: "" }] })}
            >
              <PlusLg aria-hidden /> Agregar zona
            </button>
          </div>
          <Field label="Pedido mínimo para envíos" htmlFor="d-min" hint="Vacío = sin mínimo." error={errors.minOrder}>
            <MoneyInput id="d-min" placeholder="0" value={value.minOrder} onChange={(minOrder) => update({ minOrder })} />
          </Field>
        </>
      )}

      <SaveBar saving={form.saving} dirty={form.dirty} onSave={form.save} />
    </Panel>
  );
}
