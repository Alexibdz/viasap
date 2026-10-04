"use client";

import { useState } from "react";
import type { Business } from "@/lib/types";
import AppearanceForm from "./AppearanceForm";
import DeliveryForm from "./DeliveryForm";
import PaymentsForm from "./PaymentsForm";
import ScheduleForm from "./ScheduleForm";
import StoreInfoForm from "./StoreInfoForm";

const TABS = [
  { id: "local", label: "Local" },
  { id: "horarios", label: "Horarios" },
  { id: "entregas", label: "Entregas" },
  { id: "pagos", label: "Pagos" },
  { id: "apariencia", label: "Apariencia" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsTabs({ business }: { business: Business }) {
  const [tab, setTab] = useState<TabId>("local");
  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <div>
          <h1 className="adm-title">Ajustes</h1>
          <p className="adm-subtitle">Cada sección se guarda por separado.</p>
        </div>
      </header>
      <div className="adm-tabs" role="tablist" aria-label="Secciones de ajustes">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`adm-tab${tab === item.id ? " is-active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === "local" && <StoreInfoForm business={business} />}
      {tab === "horarios" && <ScheduleForm business={business} />}
      {tab === "entregas" && <DeliveryForm business={business} />}
      {tab === "pagos" && <PaymentsForm business={business} />}
      {tab === "apariencia" && <AppearanceForm business={business} />}
    </div>
  );
}
