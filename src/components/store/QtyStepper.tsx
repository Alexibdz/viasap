"use client";

import { DashLg, PlusLg, Trash3 } from "react-bootstrap-icons";

interface QtyStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Nombre de lo que se cuenta, para lectores de pantalla. */
  label: string;
  size?: "sm" | "lg";
  /** Con value = 1, el botón de restar se convierte en "quitar" (lleva a 0). */
  removable?: boolean;
}

export default function QtyStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
  size = "sm",
  removable = false,
}: QtyStepperProps) {
  const iconSize = size === "lg" ? 20 : 16;
  const removing = removable && value === 1;
  return (
    <div className={`qty-stepper qty-stepper--${size}`}>
      <button
        type="button"
        aria-label={removing ? `Quitar ${label}` : `Restar ${label}`}
        disabled={!removing && value <= min}
        onClick={() => onChange(removing ? 0 : value - 1)}
      >
        {removing ? <Trash3 size={iconSize - 2} /> : <DashLg size={iconSize} />}
      </button>
      <span className="qty-value" aria-live="polite">
        {value}
      </span>
      <button type="button" aria-label={`Sumar ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <PlusLg size={iconSize} />
      </button>
    </div>
  );
}
