"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useEffectEvent, useRef } from "react";
import type { GeoPoint } from "@/lib/types";

// Pin con el ícono geo-alt-fill de Bootstrap Icons (evita las imágenes por defecto de Leaflet).
const pinIcon = L.divIcon({
  className: "map-pin",
  html: '<svg viewBox="0 0 16 16" width="36" height="36" fill="currentColor" aria-hidden="true"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/></svg>',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

interface MapPickerProps {
  /** Centro si todavía no hay pin (el local). Tiene que ser estable: cambiarlo recrea el mapa. */
  center: GeoPoint;
  value: GeoPoint | null;
  onChange: (point: GeoPoint) => void;
}

export default function MapPicker({ center, value, onChange }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const pick = useEffectEvent((point: GeoPoint) => onChange(point));

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { center: [center.lat, center.lng], zoom: 15 });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    map.on("click", (event) => pick({ lat: event.latlng.lat, lng: event.latlng.lng }));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [center.lat, center.lng]);

  const lat = value?.lat;
  const lng = value?.lng;

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (lat === undefined || lng === undefined) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    const position = L.latLng(lat, lng);
    if (!markerRef.current) {
      const marker = L.marker(position, { icon: pinIcon, draggable: true, autoPan: true }).addTo(map);
      marker.on("dragend", () => {
        const point = marker.getLatLng();
        pick({ lat: point.lat, lng: point.lng });
      });
      markerRef.current = marker;
      map.setView(position, Math.max(map.getZoom(), 16));
    } else {
      markerRef.current.setLatLng(position);
      if (!map.getBounds().contains(position)) map.panTo(position);
    }
  }, [lat, lng]);

  return <div ref={containerRef} className="map-box" role="application" aria-label="Mapa para ubicar la entrega" />;
}
