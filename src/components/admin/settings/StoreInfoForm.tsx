"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Copy, GeoAlt, Whatsapp } from "react-bootstrap-icons";
import { saveStoreInfo } from "@/app/admin/actions";
import { useToast } from "@/components/store/ToastProvider";
import { copyText } from "@/lib/browser";
import { useIsClient } from "@/lib/client-hooks";
import { whatsappUrl } from "@/lib/order";
import { toWhatsAppNumber } from "@/lib/phone";
import type { Business } from "@/lib/types";
import { Field, Panel, SaveBar } from "../ui";
import { useSettingsForm } from "./useSettingsForm";

const MapPicker = dynamic(() => import("@/components/checkout/MapPicker"), {
  ssr: false,
  loading: () => <div className="map-box map-box--loading">Cargando mapa…</div>,
});

export default function StoreInfoForm({ business }: { business: Business }) {
  const notify = useToast();
  const [locating, setLocating] = useState(false);
  const form = useSettingsForm(
    {
      name: business.name,
      description: business.description ?? "",
      highlight: business.highlight ?? "",
      whatsapp: business.whatsapp,
      instagram: business.instagram ?? "",
      address: { ...business.address },
    },
    saveStoreInfo,
  );
  const { value, update, errors } = form;
  const setAddress = (patch: Partial<Business["address"]>) => update({ address: { ...value.address, ...patch } });
  // El dominio se conoce recién en el navegador; en el servidor se muestra solo la ruta.
  const isClient = useIsClient();
  const storeUrl = isClient ? `${window.location.origin}/${business.slug}` : `/${business.slug}`;

  async function locate() {
    setLocating(true);
    try {
      const q = `${value.address.street}, ${value.address.city}`;
      const response = await fetch(`/api/geocode?${new URLSearchParams({ slug: business.slug, q })}`);
      const data = await response.json();
      const first = data.results?.[0];
      if (first) setAddress({ lat: first.lat, lng: first.lng });
      else notify("No encontramos esa dirección: marcala tocando el mapa.");
    } catch {
      notify("No pudimos buscar la dirección.");
    } finally {
      setLocating(false);
    }
  }

  return (
    <Panel title="Tu local" description="Lo que ven tus clientes arriba del menú y en el mensaje del pedido.">
      <div className="adm-linkbox">
        <span className="adm-linkbox-label">Tu link</span>
        <a href={`/${business.slug}`} target="_blank" rel="noopener noreferrer" className="adm-linkbox-url">
          {storeUrl.replace(/^https?:\/\//, "")}
        </a>
        <button
          type="button"
          className="adm-icon-btn"
          aria-label="Copiar link"
          onClick={async () => notify((await copyText(storeUrl)) ? "Link copiado" : "No se pudo copiar")}
        >
          <Copy />
        </button>
      </div>

      <Field label="Nombre del local" htmlFor="s-name" error={errors.name}>
        <input id="s-name" className="adm-input" value={value.name} maxLength={60} onChange={(e) => update({ name: e.target.value })} />
      </Field>
      <Field label="Descripción corta" htmlFor="s-desc" hint="Una línea: qué venden y algo que los distinga.">
        <textarea
          id="s-desc"
          className="adm-input"
          rows={2}
          maxLength={200}
          value={value.description}
          onChange={(e) => update({ description: e.target.value })}
        />
      </Field>
      <Field
        label="Frase destacada"
        htmlFor="s-highlight"
        hint="Opcional. Va resaltada después de la descripción. Ej: Todas las burgers vienen con papas."
      >
        <input
          id="s-highlight"
          className="adm-input"
          value={value.highlight}
          maxLength={80}
          onChange={(e) => update({ highlight: e.target.value })}
        />
      </Field>
      <div className="adm-grid-2">
        <Field
          label="WhatsApp que recibe los pedidos"
          htmlFor="s-wa"
          error={errors.whatsapp}
          hint={
            <a href={whatsappUrl(toWhatsAppNumber(value.whatsapp))} target="_blank" rel="noopener noreferrer" className="adm-link">
              <Whatsapp aria-hidden /> Probar el número
            </a>
          }
        >
          <input
            id="s-wa"
            className="adm-input"
            type="tel"
            inputMode="tel"
            placeholder="Ej: 343 412 3456"
            value={value.whatsapp}
            onChange={(e) => update({ whatsapp: e.target.value })}
          />
        </Field>
        <Field label="Instagram" htmlFor="s-ig" error={errors.instagram} hint="Opcional, sin la @.">
          <input
            id="s-ig"
            className="adm-input"
            value={value.instagram}
            maxLength={31}
            placeholder="milocal"
            onChange={(e) => update({ instagram: e.target.value })}
          />
        </Field>
      </div>

      <div className="adm-grid-3">
        <Field label="Dirección" htmlFor="s-street" error={errors["address.street"]}>
          <input
            id="s-street"
            className="adm-input"
            value={value.address.street}
            maxLength={80}
            onChange={(e) => setAddress({ street: e.target.value })}
          />
        </Field>
        <Field label="Ciudad" htmlFor="s-city" error={errors["address.city"]}>
          <input
            id="s-city"
            className="adm-input"
            value={value.address.city}
            maxLength={60}
            onChange={(e) => setAddress({ city: e.target.value })}
          />
        </Field>
        <Field label="Provincia" htmlFor="s-province" error={errors["address.province"]}>
          <input
            id="s-province"
            className="adm-input"
            value={value.address.province}
            maxLength={60}
            onChange={(e) => setAddress({ province: e.target.value })}
          />
        </Field>
      </div>
      <Field
        label="Ubicación en el mapa"
        hint="Desde acá se calculan las distancias de envío. Tocá el mapa o arrastrá el pin."
        error={errors["address.location"]}
      >
        <button type="button" className="adm-btn adm-btn--small" onClick={locate} disabled={locating}>
          <GeoAlt aria-hidden /> {locating ? "Buscando…" : "Ubicar según la dirección"}
        </button>
        <div className="adm-map">
          <MapPicker
            center={business.address}
            value={{ lat: value.address.lat, lng: value.address.lng }}
            onChange={({ lat, lng }) => setAddress({ lat, lng })}
          />
        </div>
      </Field>

      <SaveBar saving={form.saving} dirty={form.dirty} onSave={form.save} />
    </Panel>
  );
}
