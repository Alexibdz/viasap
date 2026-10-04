"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowCounterclockwise, Check2, Copy, HourglassSplit, Whatsapp, XLg } from "react-bootstrap-icons";
import { useCart, useStore } from "@/components/store/StoreProvider";
import { useToast } from "@/components/store/ToastProvider";
import { copyText, createId } from "@/lib/browser";
import { formatMoney } from "@/lib/format";
import { cancelOrder } from "@/lib/order-actions";
import { whatsappUrl } from "@/lib/order";
import { customerStatus } from "@/lib/order-status";
import type { CartItem, DeliveryMethod } from "@/lib/types";
import { useOrderStatus } from "@/lib/use-order-status";

export interface SentOrder {
  number: string;
  code: string;
  message: string;
  url: string;
  total: number;
  method: DeliveryMethod;
  /** Para volver a armar el pedido si lo cancela. */
  items: CartItem[];
}

type View = "sent" | "confirm-cancel" | "cancelled" | "too-late";

/** Pantalla final: el pedido ya está en WhatsApp. Muestra el estado y permite cancelarlo. */
export default function OrderSent({ order }: { order: SentOrder }) {
  const business = useStore();
  const notify = useToast();
  const router = useRouter();
  const { add } = useCart();
  const status = useOrderStatus(business.slug, order.code);
  const [view, setView] = useState<View>("sent");
  const [cancelling, setCancelling] = useState(false);

  const cancelRequest = whatsappUrl(
    business.whatsapp,
    `Hola, quiero cancelar el pedido #${order.number} (código ${order.code}). ¡Disculpen!`,
  );

  async function copyOrder() {
    notify((await copyText(order.message)) ? "Pedido copiado" : "No pudimos copiar el pedido");
  }

  async function cancel() {
    setCancelling(true);
    const result = await cancelOrder(business.slug, order.code);
    setCancelling(false);
    // Si el pedido no quedó registrado, igual lo damos por cancelado y le pedimos que avise por WhatsApp.
    setView(result.ok || result.reason === "not-found" ? "cancelled" : "too-late");
  }

  function rebuild() {
    add(order.items.map((item) => ({ ...item, key: createId() })));
    router.push(`/${business.slug}/pedido`);
  }

  if (view === "cancelled") {
    return (
      <main className="sent">
        <div className="sent-check sent-check--muted" aria-hidden>
          <XLg size={40} />
        </div>
        <h1 className="sent-title">Cancelaste el pedido #{order.number}</h1>
        <p className="sent-text">
          Si ya le habías mandado el mensaje a {business.name}, avisales que lo cancelaste para que no lo preparen.
        </p>
        <div className="sent-actions">
          <a href={cancelRequest} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
            <Whatsapp size={20} aria-hidden /> Avisar por WhatsApp
          </a>
          <button type="button" className="btn-ghost" onClick={rebuild}>
            <ArrowCounterclockwise aria-hidden /> Volver a armar el pedido
          </button>
        </div>
        <Link href={`/${business.slug}`} className="text-btn sent-back">
          Volver al menú
        </Link>
      </main>
    );
  }

  const tracking = status ? customerStatus(status, order.method) : null;
  const canCancel = status === null || status === "pending";

  return (
    <main className="sent">
      <div className="sent-check" aria-hidden>
        <Check2 size={46} />
      </div>
      <h1 className="sent-title">¡Tu pedido está listo!</h1>
      <p className="sent-text">
        Abrimos WhatsApp con el mensaje para <strong>{business.name}</strong>. Solo falta que toques{" "}
        <strong>Enviar</strong> en el chat.
      </p>

      <div className="sent-stub">
        <span className="eyebrow">Pedido</span>
        <span className="sent-number">#{order.number}</span>
        <code className="sent-code">{order.code}</code>
        <span className="sent-total">{formatMoney(order.total)}</span>
        {tracking && (
          <span className={`sent-status is-${status}`} role="status">
            {status === "pending" ? <HourglassSplit aria-hidden /> : <span className="sent-status-dot" aria-hidden />}
            <span>
              <strong>{tracking.title}</strong>
              {tracking.detail}
            </span>
          </span>
        )}
      </div>

      <div className="sent-actions">
        <a href={order.url} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
          <Whatsapp size={20} aria-hidden /> Abrir WhatsApp de nuevo
        </a>
        <button type="button" className="btn-ghost" onClick={copyOrder}>
          <Copy aria-hidden /> Copiar pedido
        </button>
      </div>
      <p className="sent-help">
        ¿No se abre WhatsApp? Copiá el pedido y mandalo al <strong>+{business.whatsapp}</strong>.
      </p>
      <Link href={`/${business.slug}`} className="text-btn">
        Volver al menú
      </Link>

      {view === "too-late" ? (
        <div className="sent-cancel" role="status">
          <p>
            <strong>El local ya está preparando tu pedido.</strong> Para cancelarlo, escribiles:
          </p>
          <a href={cancelRequest} target="_blank" rel="noopener noreferrer" className="btn-ghost">
            <Whatsapp aria-hidden /> Escribir al local
          </a>
        </div>
      ) : view === "confirm-cancel" ? (
        <div className="sent-cancel">
          <p>
            <strong>¿Cancelar el pedido #{order.number}?</strong> Si ya mandaste el mensaje, después avisale al local.
          </p>
          <div className="sent-cancel-actions">
            <button type="button" className="btn-ghost" onClick={() => setView("sent")}>
              No, dejarlo
            </button>
            <button type="button" className="btn-danger" onClick={cancel} disabled={cancelling}>
              {cancelling ? "Cancelando…" : "Sí, cancelar"}
            </button>
          </div>
        </div>
      ) : (
        canCancel && (
          <p className="sent-mistake">
            ¿Te equivocaste?{" "}
            <button type="button" className="text-btn text-btn--danger" onClick={() => setView("confirm-cancel")}>
              Cancelar pedido
            </button>
          </p>
        )
      )}
    </main>
  );
}
