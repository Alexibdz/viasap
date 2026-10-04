"use client";

import { ArrowLeftRight, Bank, Cash, MoonStars } from "react-bootstrap-icons";
import { useStore } from "@/components/store/StoreProvider";
import { suggestCashAmounts, type CheckoutDraft, type CheckoutField, type CheckoutSummary } from "@/lib/checkout";
import { formatMoney, onlyDigits } from "@/lib/format";
import { FieldError, SelectCard } from "./FormParts";
import OrderTicket from "./OrderTicket";
import TransferDetailsBox from "./TransferDetailsBox";

interface StepPaymentProps {
  draft: CheckoutDraft;
  summary: CheckoutSummary;
  update: (patch: Partial<CheckoutDraft>) => void;
  showErrors: boolean;
  closedMessage: string | null;
}

export default function StepPayment({ draft, summary, update, showErrors, closedMessage }: StepPaymentProps) {
  const business = useStore();
  const { payments } = business;
  const { total, cashAmount } = summary;
  const error = (field: CheckoutField) => (showErrors ? summary.errors[field] : undefined);
  const cashValue = draft.cashInput && formatMoney(cashAmount).slice(1);

  return (
    <>
      {closedMessage && (
        <div
          id="campo-closed"
          className={`notice ${summary.errors.closed ? "notice--danger" : "notice--warn"}`}
          role="status"
        >
          <MoonStars aria-hidden className="flex-shrink-0 mt-1" />
          <span>{closedMessage}</span>
        </div>
      )}

      <section className="panel" id="campo-payment">
        <h2 className="panel-title">¿Cómo vas a pagar?</h2>
        <div className="select-list">
          {payments.cash && (
            <SelectCard
              name="pago"
              selected={draft.payment === "cash"}
              onSelect={() => update({ payment: "cash", cashInput: "" })}
              icon={<Cash size={22} />}
              title="Efectivo"
              subtitle={draft.method === "delivery" ? "Le pagás a quien te lo lleva" : "Pagás cuando lo retirás"}
            />
          )}
          {payments.transfer && (
            <SelectCard
              name="pago"
              selected={draft.payment === "transfer"}
              onSelect={() => update({ payment: "transfer", cashInput: "" })}
              icon={<Bank size={22} />}
              title="Transferencia"
              subtitle="Al alias o CBU del local"
            />
          )}
          {payments.mixed && payments.cash && payments.transfer && (
            <SelectCard
              name="pago"
              selected={draft.payment === "mixed"}
              onSelect={() => update({ payment: "mixed", cashInput: "" })}
              icon={<ArrowLeftRight size={22} />}
              title="Efectivo + transferencia"
              subtitle="Una parte de cada forma"
            />
          )}
        </div>
        <FieldError message={error("payment")} />

        {draft.payment === "cash" && (
          <div className="field" id="campo-cash">
            <span className="field-label">
              ¿Con cuánto pagás? <span className="optional">(para llevarte el vuelto)</span>
            </span>
            <div className="chips">
              <button
                type="button"
                className={`chip${draft.cashInput ? "" : " is-on"}`}
                onClick={() => update({ cashInput: "" })}
              >
                Justo
              </button>
              {suggestCashAmounts(total).map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className={`chip${cashAmount === amount ? " is-on" : ""}`}
                  onClick={() => update({ cashInput: String(amount) })}
                >
                  {formatMoney(amount)}
                </button>
              ))}
            </div>
            <label className="input-money">
              <span aria-hidden>$</span>
              <input
                inputMode="numeric"
                aria-label="Otro monto"
                placeholder="Otro monto"
                value={cashValue}
                onChange={(e) => update({ cashInput: onlyDigits(e.target.value) })}
              />
            </label>
            {cashAmount > total && <p className="field-hint">Tu vuelto: {formatMoney(cashAmount - total)}</p>}
            <FieldError message={error("cash")} />
          </div>
        )}

        {draft.payment === "mixed" && (
          <div className="field" id="campo-cash">
            <span className="field-label">¿Cuánto pagás en efectivo?</span>
            <label className="input-money">
              <span aria-hidden>$</span>
              <input
                inputMode="numeric"
                aria-label="Monto en efectivo"
                placeholder="0"
                value={cashValue}
                onChange={(e) => update({ cashInput: onlyDigits(e.target.value) })}
              />
            </label>
            {cashAmount > 0 && cashAmount < total && (
              <p className="field-hint">Por transferencia: {formatMoney(total - cashAmount)}</p>
            )}
            <FieldError message={error("cash")} />
          </div>
        )}

        {(draft.payment === "transfer" || draft.payment === "mixed") && payments.transfer && (
          <TransferDetailsBox transfer={payments.transfer} />
        )}
      </section>

      <OrderTicket draft={draft} summary={summary} />
    </>
  );
}
