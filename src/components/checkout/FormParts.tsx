"use client";

import type { ReactNode } from "react";
import { Check2 } from "react-bootstrap-icons";

export function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="field-error" role="alert">
      {message}
    </p>
  ) : null;
}

interface FieldProps {
  /** id del input; el contenedor queda como "campo-{id}" para poder scrollear al error. */
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ id, label, optional, hint, error, children }: FieldProps) {
  return (
    <div className="field" id={`campo-${id}`}>
      <label htmlFor={id} className="field-label">
        {label}
        {optional && <span className="optional"> (opcional)</span>}
      </label>
      {children}
      {error ? <FieldError message={error} /> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

interface SelectCardProps {
  name: string;
  selected: boolean;
  onSelect: () => void;
  icon: ReactNode;
  title: string;
  subtitle?: string;
}

/** Opción grande con ícono (forma de entrega, forma de pago). Es un radio nativo por dentro. */
export function SelectCard({ name, selected, onSelect, icon, title, subtitle }: SelectCardProps) {
  return (
    <label className={`select-card${selected ? " is-on" : ""}`}>
      <input type="radio" name={name} className="choice-input" checked={selected} onChange={onSelect} />
      <span className="select-card-icon" aria-hidden>
        {icon}
      </span>
      <span className="select-card-text">
        <strong>{title}</strong>
        {subtitle && <small>{subtitle}</small>}
      </span>
      <span className="select-card-mark" aria-hidden>
        <Check2 size={14} />
      </span>
    </label>
  );
}

interface SegmentedProps<T extends string> {
  name: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ name, label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <label key={option.value} className={`segmented-item${value === option.value ? " is-on" : ""}`}>
          <input
            type="radio"
            name={name}
            className="choice-input"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
