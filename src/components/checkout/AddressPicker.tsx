"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Spinner from "react-bootstrap/Spinner";
import { ChevronRight, Crosshair, GeoAlt, GeoAltFill } from "react-bootstrap-icons";
import { useStore } from "@/components/store/StoreProvider";
import type { AddressValue, GeoPoint } from "@/lib/types";

// Leaflet usa `window`: el mapa se carga solo en el navegador.
const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => <div className="map-box map-box--loading">Cargando mapa…</div>,
});

interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
  approximate: boolean;
}

interface AddressPickerProps {
  value: AddressValue | null;
  onChange: (value: AddressValue | null) => void;
  invalid?: boolean;
}

export default function AddressPicker({ value, onChange, invalid }: AddressPickerProps) {
  const business = useStore();
  const [editing, setEditing] = useState(!value);
  const [query, setQuery] = useState(value?.label ?? "");
  const [results, setResults] = useState<GeocodeResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function choose(next: AddressValue) {
    onChange(next);
    setEditing(false);
    setResults(null);
    setError(null);
  }

  async function search() {
    const q = query.trim();
    if (q.length < 3) {
      setError("Escribí la calle y el número.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ slug: business.slug, q });
      const response = await fetch(`/api/geocode?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResults(data.results);
    } catch {
      setResults([]);
      setError("No pudimos buscar la dirección. Probá de nuevo o marcala en el mapa.");
    } finally {
      setLoading(false);
    }
  }

  function locateMe() {
    if (!window.isSecureContext || !navigator.geolocation) {
      setError("Tu navegador no nos deja usar tu ubicación acá. Buscá tu dirección.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const location = { lat: coords.latitude, lng: coords.longitude };
        let label = query.trim() || "Mi ubicación actual";
        try {
          const params = new URLSearchParams({ slug: business.slug, lat: String(location.lat), lng: String(location.lng) });
          const response = await fetch(`/api/geocode?${params}`);
          const data = await response.json();
          if (response.ok && data.label) label = data.label;
        } catch {
          // Nos quedamos con la ubicación aunque no tengamos el nombre de la calle.
        }
        setLoading(false);
        choose({ label, location, approximate: false });
      },
      (geoError) => {
        setLoading(false);
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "No diste permiso para usar tu ubicación. Buscá tu dirección."
            : "No pudimos obtener tu ubicación. Buscá tu dirección.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  function placeOnMap() {
    if (query.trim().length < 3) {
      setError("Escribí tu dirección (calle y número) y después marcala en el mapa.");
      return;
    }
    choose({ label: query.trim(), location: null, approximate: true });
  }

  if (!editing && value) {
    const hint = !value.location
      ? "Tocá el mapa para marcar dónde entregamos."
      : value.approximate
        ? "Ubicación aproximada: mové el pin hasta tu puerta."
        : "Si el pin no está en tu puerta, tocá el mapa o arrastralo.";
    return (
      <div className="address-picker">
        <div className={`address-chosen${invalid && !value.location ? " is-invalid" : ""}`}>
          <span className="address-chosen-icon" aria-hidden>
            <GeoAltFill size={18} />
          </span>
          <span className="address-chosen-text">
            <strong>{value.label}</strong>
            <small>{hint}</small>
          </span>
          <button
            type="button"
            className="text-btn"
            onClick={() => {
              setQuery(value.label);
              setEditing(true);
            }}
          >
            Cambiar
          </button>
        </div>
        <MapPicker
          center={business.address}
          value={value.location}
          onChange={(location: GeoPoint) => onChange({ ...value, location, approximate: false })}
        />
      </div>
    );
  }

  return (
    <div className="address-picker">
      <label htmlFor="address-query" className="field-label">
        Calle y número
      </label>
      <div className={`search-input${invalid ? " is-invalid" : ""}`}>
        <GeoAlt size={18} aria-hidden />
        <input
          id="address-query"
          className="search-input-field"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
          placeholder="Ej: San Martín 1234"
          autoComplete="street-address"
        />
        <button type="button" className="search-input-btn" onClick={search} disabled={loading}>
          {loading ? <Spinner size="sm" aria-label="Buscando" /> : "Buscar"}
        </button>
      </div>
      <button type="button" className="text-btn mt-2" onClick={locateMe} disabled={loading}>
        <Crosshair aria-hidden /> Usar mi ubicación actual
      </button>
      {error && <p className="field-error">{error}</p>}

      {results && results.length > 0 && (
        <div className="address-results">
          <p className="eyebrow">Elegí tu dirección</p>
          {results.map((result, index) => (
            <button
              key={`${result.label}-${index}`}
              type="button"
              className="address-result"
              onClick={() =>
                choose({ label: result.label, location: { lat: result.lat, lng: result.lng }, approximate: result.approximate })
              }
            >
              <GeoAltFill aria-hidden className="flex-shrink-0" />
              <span>{result.label}</span>
              <ChevronRight aria-hidden className="flex-shrink-0 ms-auto" />
            </button>
          ))}
        </div>
      )}
      {results && results.length === 0 && !error && <p className="field-error">No encontramos esa dirección.</p>}
      {results && (
        <p className="hint-box">
          ¿No aparece? Probá escribirla distinto o{" "}
          <button type="button" className="text-btn" onClick={placeOnMap}>
            marcala en el mapa
          </button>
          .
        </p>
      )}
    </div>
  );
}
