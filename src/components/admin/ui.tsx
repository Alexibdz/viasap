"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

/** Interruptor accesible (checkbox con role="switch"). */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={`adm-switch${disabled ? " is-disabled" : ""}`}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="adm-switch-track" aria-hidden />
      <span className="adm-switch-text">
        <span className="adm-switch-label">{label}</span>
        {description && <span className="adm-switch-desc">{description}</span>}
      </span>
    </label>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`adm-field${error ? " has-error" : ""}${className ? ` ${className}` : ""}`}>
      <label className="adm-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="adm-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="adm-hint">{hint}</p>
      ) : null}
    </div>
  );
}

/** Tarjeta de sección del panel. */
export function Panel({
  title,
  description,
  actions,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="adm-panel">
      <header className="adm-panel-head">
        <div>
          <h2 className="adm-panel-title">{title}</h2>
          {description && <p className="adm-panel-desc">{description}</p>}
        </div>
        {actions && <div className="adm-panel-actions">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

/** Monto en pesos: muestra "$" adelante y solo acepta números. */
export function MoneyInput({
  value,
  onChange,
  ...props
}: { value: string; onChange: (value: string) => void } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
>) {
  return (
    <span className="adm-money">
      <span aria-hidden>$</span>
      <input
        {...props}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 9))}
      />
    </span>
  );
}

/** Barra de guardado al pie de un formulario. */
export function SaveBar({
  saving,
  dirty,
  onSave,
  label = "Guardar cambios",
}: {
  saving: boolean;
  dirty: boolean;
  onSave: () => void;
  label?: string;
}) {
  return (
    <div className="adm-savebar">
      <span className="adm-savebar-state">{dirty ? "Tenés cambios sin guardar" : "Todo guardado"}</span>
      <button type="button" className="adm-btn adm-btn--primary" onClick={onSave} disabled={saving || !dirty}>
        {saving ? "Guardando…" : label}
      </button>
    </div>
  );
}
