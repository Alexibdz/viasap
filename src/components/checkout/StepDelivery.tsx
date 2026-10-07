"use client";

import { Bicycle, GeoAltFill, Shop, SignTurnRight } from "react-bootstrap-icons";
import { useStore } from "@/components/store/StoreProvider";
import type { CheckoutDraft, CheckoutField, CheckoutSummary } from "@/lib/checkout";
import { formatMoney } from "@/lib/format";
import { googleMapsUrl } from "@/lib/geo";
import { shippingFrom } from "@/lib/shipping";
import type { BuildingType } from "@/lib/types";
import AddressPicker from "./AddressPicker";
import { Field, FieldError, Segmented, SelectCard } from "./FormParts";
import ShippingPrices from "./ShippingPrices";

const BUILDING_OPTIONS: { value: BuildingType; label: string }[] = [
  { value: "house", label: "Casa" },
  { value: "apartment", label: "Depto" },
  { value: "other", label: "Otro" },
];

interface StepDeliveryProps {
  draft: CheckoutDraft;
  summary: CheckoutSummary;
  update: (patch: Partial<CheckoutDraft>) => void;
  showErrors: boolean;
}

export default function StepDelivery({ draft, summary, update, showErrors }: StepDeliveryProps) {
  const business = useStore();
  const { delivery, address } = business;
  const error = (field: CheckoutField) => (showErrors ? summary.errors[field] : undefined);
  const from = shippingFrom(delivery);
  const { quote } = summary;

  return (
    <>
      <section className="panel" id="campo-method">
        <h2 className="panel-title">¿Cómo lo querés recibir?</h2>
        <div className="select-grid">
          {delivery.pickup && (
            <SelectCard
              name="entrega"
              selected={draft.method === "pickup"}
              onSelect={() => update({ method: "pickup" })}
              icon={<Shop size={22} />}
              title="Lo retiro"
              subtitle="En el local, sin costo"
            />
          )}
          {delivery.delivery && (
            <SelectCard
              name="entrega"
              selected={draft.method === "delivery"}
              onSelect={() => update({ method: "delivery" })}
              icon={<Bicycle size={22} />}
              title="Envío a domicilio"
              subtitle={
                from === null ? "Costo a coordinar" : `${from.varies ? "Desde " : ""}${formatMoney(from.cost)}`
              }
            />
          )}
        </div>
        <FieldError message={error("method")} />

        {draft.method === "pickup" && (
          <div className="pickup-card">
            <GeoAltFill size={18} aria-hidden className="flex-shrink-0" />
            <span className="flex-grow-1">
              <strong>
                {address.street}, {address.city}
              </strong>
              <small>Te avisamos por WhatsApp cuando esté listo.</small>
            </span>
            <a href={googleMapsUrl(address)} target="_blank" rel="noopener noreferrer" className="text-btn">
              <SignTurnRight aria-hidden /> Ir
            </a>
          </div>
        )}
      </section>

      {draft.method === "delivery" && (
        <section className="panel">
          <h2 className="panel-title">¿Adónde te lo llevamos?</h2>
          <ShippingPrices />
          <div id="campo-address">
            <AddressPicker
              value={draft.address}
              onChange={(value) => update({ address: value })}
              invalid={Boolean(error("address"))}
            />
            <FieldError message={error("address")} />
          </div>

          {quote?.status === "to-agree" && delivery.zones.length === 0 && (
            <p className="shipping-line">
              <Bicycle aria-hidden /> El costo del envío lo coordinamos por WhatsApp.
            </p>
          )}
          {summary.errors.minOrder && (
            <p className="notice notice--warn" id="campo-minOrder">
              {summary.errors.minOrder} Te faltan {formatMoney((delivery.minOrder ?? 0) - summary.subtotal)}.
            </p>
          )}

          <div className="field" id="campo-unit">
            <span className="field-label">Tipo de lugar</span>
            <Segmented
              name="edificacion"
              label="Tipo de lugar"
              value={draft.buildingType}
              options={BUILDING_OPTIONS}
              onChange={(buildingType) => update({ buildingType })}
            />
            {draft.buildingType === "apartment" && (
              <div className="field-pair">
                <input
                  className="input"
                  aria-label="Piso"
                  placeholder="Piso"
                  value={draft.floor}
                  maxLength={10}
                  onChange={(e) => update({ floor: e.target.value })}
                />
                <input
                  className="input"
                  aria-label="Departamento"
                  placeholder="Depto"
                  value={draft.apartment}
                  maxLength={10}
                  onChange={(e) => update({ apartment: e.target.value })}
                />
              </div>
            )}
            <FieldError message={error("unit")} />
          </div>

          <Field id="referencias" label="Referencias" optional hint="Calles que cruzan, color del portón, timbre…">
            <textarea
              id="referencias"
              className="input"
              rows={2}
              maxLength={150}
              value={draft.references}
              onChange={(e) => update({ references: e.target.value })}
              placeholder="Ej: frente a la plaza, portón verde"
            />
          </Field>
        </section>
      )}

      <section className="panel">
        <h2 className="panel-title">Tus datos</h2>
        <Field id="name" label="Nombre y apellido" error={error("name")}>
          <input
            id="name"
            className="input"
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="¿Cómo te llamás?"
            autoComplete="name"
            maxLength={60}
          />
        </Field>
        <Field id="phone" label="Teléfono" error={error("phone")} hint="Por si el local necesita avisarte algo.">
          <input
            id="phone"
            className="input"
            type="tel"
            inputMode="tel"
            value={draft.phone}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="Ej: 343 412 3456"
            autoComplete="tel"
            maxLength={25}
          />
        </Field>
      </section>
    </>
  );
}
