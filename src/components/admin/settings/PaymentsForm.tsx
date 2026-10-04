"use client";

import { savePaymentSettings } from "@/app/admin/actions";
import type { Business } from "@/lib/types";
import { Field, Panel, SaveBar, Switch } from "../ui";
import { useSettingsForm } from "./useSettingsForm";

export default function PaymentsForm({ business }: { business: Business }) {
  const { payments } = business;
  const form = useSettingsForm(
    {
      cash: payments.cash,
      transferEnabled: Boolean(payments.transfer),
      transfer: {
        alias: payments.transfer?.alias ?? "",
        cbu: payments.transfer?.cbu ?? "",
        holder: payments.transfer?.holder ?? "",
        bank: payments.transfer?.bank ?? "",
      },
      mixed: payments.mixed,
    },
    savePaymentSettings,
    "Formas de pago guardadas",
  );
  const { value, update, errors } = form;
  const setTransfer = (patch: Partial<typeof value.transfer>) => update({ transfer: { ...value.transfer, ...patch } });

  return (
    <Panel title="Formas de pago" description="Los datos de la transferencia se muestran al cliente y van en el mensaje.">
      <div className="adm-switches">
        <Switch checked={value.cash} onChange={(cash) => update({ cash })} label="Efectivo" />
        <Switch
          checked={value.transferEnabled}
          onChange={(transferEnabled) => update({ transferEnabled })}
          label="Transferencia"
        />
      </div>

      {value.transferEnabled && (
        <div className="adm-grid-2">
          <Field label="Alias" htmlFor="pay-alias" error={errors["transfer.alias"]}>
            <input
              id="pay-alias"
              className="adm-input"
              value={value.transfer.alias}
              maxLength={20}
              placeholder="MI.LOCAL.MP"
              onChange={(e) => setTransfer({ alias: e.target.value })}
            />
          </Field>
          <Field label="CBU / CVU" htmlFor="pay-cbu" error={errors["transfer.cbu"]}>
            <input
              id="pay-cbu"
              className="adm-input"
              inputMode="numeric"
              value={value.transfer.cbu}
              maxLength={26}
              placeholder="22 números"
              onChange={(e) => setTransfer({ cbu: e.target.value })}
            />
          </Field>
          <Field label="Titular" htmlFor="pay-holder" error={errors["transfer.holder"]}>
            <input
              id="pay-holder"
              className="adm-input"
              value={value.transfer.holder}
              maxLength={80}
              onChange={(e) => setTransfer({ holder: e.target.value })}
            />
          </Field>
          <Field label="Banco o billetera" htmlFor="pay-bank" hint="Opcional. Ej: Mercado Pago.">
            <input
              id="pay-bank"
              className="adm-input"
              value={value.transfer.bank}
              maxLength={40}
              onChange={(e) => setTransfer({ bank: e.target.value })}
            />
          </Field>
        </div>
      )}

      <div className="adm-switches">
        <Switch
          checked={value.mixed && value.cash && value.transferEnabled}
          disabled={!value.cash || !value.transferEnabled}
          onChange={(mixed) => update({ mixed })}
          label="Efectivo + transferencia"
          description="El cliente paga una parte de cada forma."
        />
      </div>
      {errors.methods && <p className="adm-error">{errors.methods}</p>}

      <SaveBar saving={form.saving} dirty={form.dirty} onSave={form.save} />
    </Panel>
  );
}
