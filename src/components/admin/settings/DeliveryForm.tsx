"use client";

import { PlusLg, Trash3 } from "react-bootstrap-icons";
import { saveDeliverySettings } from "@/app/admin/actions";
import type { Business } from "@/lib/types";
import { Field, MoneyInput, Panel, SaveBar, Switch } from "../ui";
import { useSettingsForm } from "./useSettingsForm";

export default function DeliveryForm({ business }: { business: Business }) {
  const { delivery } = business;
  const form = useSettingsForm(
    {
      pickup: delivery.pickup,
      delivery: delivery.delivery,
      zones: delivery.zones.map((z) => ({ upToKm: String(z.upToKm), cost: String(z.cost) })),
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
          description="Con costo según la distancia."
        />
      </div>
      {errors.methods && <p className="adm-error">{errors.methods}</p>}

      {value.delivery && (
        <>
          <h3 className="adm-subheading">Zonas de envío</h3>
          <p className="adm-hint">
            Se miden en línea recta desde el local. Más lejos que la última zona no se hacen envíos. Sin zonas, el costo se
            arregla por WhatsApp.
          </p>
          <div className="adm-rows">
            {value.zones.map((zone, index) => (
              <div key={index} className="adm-row adm-row--zone">
                <span className="adm-muted">Hasta</span>
                <span className="adm-unit">
                  <input
                    className="adm-input"
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="0.1"
                    max="50"
                    aria-label={`Distancia de la zona ${index + 1}`}
                    value={zone.upToKm}
                    onChange={(e) => setZone(index, { upToKm: e.target.value })}
                  />
                  <span aria-hidden>km</span>
                </span>
                <MoneyInput
                  aria-label={`Costo de la zona ${index + 1}`}
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
                {(errors[`zones.${index}.upToKm`] || errors[`zones.${index}.cost`]) && (
                  <p className="adm-error adm-row-error">{errors[`zones.${index}.upToKm`] ?? errors[`zones.${index}.cost`]}</p>
                )}
              </div>
            ))}
            {errors.zones && <p className="adm-error">{errors.zones}</p>}
            <button
              type="button"
              className="adm-btn adm-btn--dashed"
              disabled={value.zones.length >= 8}
              onClick={() => {
                const last = Number(value.zones.at(-1)?.upToKm) || 0;
                update({ zones: [...value.zones, { upToKm: String(last + 2), cost: "" }] });
              }}
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
