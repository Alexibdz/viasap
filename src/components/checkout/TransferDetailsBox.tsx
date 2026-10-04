"use client";

import { Bank, Copy } from "react-bootstrap-icons";
import { useToast } from "@/components/store/ToastProvider";
import { copyText } from "@/lib/browser";
import type { TransferDetails } from "@/lib/types";

export default function TransferDetailsBox({ transfer }: { transfer: TransferDetails }) {
  const notify = useToast();

  async function copy(value: string, label: string) {
    notify((await copyText(value)) ? `${label} copiado` : "No pudimos copiar");
  }

  const rows = [
    { label: "Alias", value: transfer.alias, copyable: true },
    { label: "CBU/CVU", value: transfer.cbu, copyable: true },
    { label: "Titular", value: transfer.bank ? `${transfer.holder} · ${transfer.bank}` : transfer.holder, copyable: false },
  ];

  return (
    <div className="transfer">
      <p className="transfer-title">
        <Bank aria-hidden /> Datos para transferir
      </p>
      {rows.map((row) => (
        <div key={row.label} className="transfer-row">
          <span className="transfer-text">
            <span className="transfer-key">{row.label}</span>
            <span className="transfer-value">{row.value}</span>
          </span>
          {row.copyable && (
            <button
              type="button"
              className="copy-btn"
              aria-label={`Copiar ${row.label}`}
              onClick={() => copy(row.value, row.label)}
            >
              <Copy size={15} />
            </button>
          )}
        </div>
      ))}
      <p className="transfer-note">Después de enviar el pedido, mandá el comprobante por el mismo chat.</p>
    </div>
  );
}
