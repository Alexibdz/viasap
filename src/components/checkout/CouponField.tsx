"use client";

import { useState, useTransition } from "react";
import { TicketPerforated } from "react-bootstrap-icons";
import { useStore } from "@/components/store/StoreProvider";
import { validateCoupon } from "@/lib/actions";
import { formatMoney } from "@/lib/format";
import { describeCoupon } from "@/lib/pricing";
import type { CouponRule } from "@/lib/types";
import { FieldError } from "./FormParts";

interface CouponFieldProps {
  subtotal: number;
  value: CouponRule | null;
  onChange: (coupon: CouponRule | null) => void;
}

export default function CouponField({ subtotal, value, onChange }: CouponFieldProps) {
  const { slug } = useStore();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validating, startValidation] = useTransition();

  function apply() {
    if (!code.trim()) return;
    startValidation(async () => {
      const result = await validateCoupon(slug, code, subtotal);
      if (result.ok) {
        onChange(result.coupon);
        setError(null);
        setCode("");
      } else {
        setError(result.error);
      }
    });
  }

  if (value) {
    const belowMinimum = Boolean(value.minSubtotal && subtotal < value.minSubtotal);
    return (
      <div>
        <div className="coupon-applied">
          <TicketPerforated size={18} aria-hidden />
          <span className="flex-grow-1">
            <strong>{value.code}</strong> · {describeCoupon(value)}
          </span>
          <button type="button" className="text-btn" onClick={() => onChange(null)}>
            Quitar
          </button>
        </div>
        {belowMinimum && (
          <FieldError
            message={`Para usar este cupón el pedido tiene que ser de al menos ${formatMoney(value.minSubtotal ?? 0)}.`}
          />
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" className="coupon-toggle" onClick={() => setOpen(true)}>
        <TicketPerforated size={18} aria-hidden /> ¿Tenés un cupón de descuento?
      </button>
    );
  }

  return (
    <div className="field">
      <label htmlFor="coupon" className="field-label">
        Cupón de descuento
      </label>
      <div className={`search-input${error ? " is-invalid" : ""}`}>
        <TicketPerforated size={18} aria-hidden />
        <input
          id="coupon"
          className="search-input-field"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          placeholder="Ej: BIENVENIDA"
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={40}
          autoFocus
        />
        <button type="button" className="search-input-btn" onClick={apply} disabled={!code.trim() || validating}>
          {validating ? "…" : "Aplicar"}
        </button>
      </div>
      <FieldError message={error ?? undefined} />
    </div>
  );
}
