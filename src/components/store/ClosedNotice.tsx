"use client";

import { MoonStars, PauseCircle } from "react-bootstrap-icons";
import { useNow } from "@/lib/client-hooks";
import { describeStatus, getOpenStatus } from "@/lib/hours";
import { useStore } from "./StoreProvider";

/** Aviso dentro de la ficha del local cuando está cerrado o pausó los pedidos. */
export default function ClosedNotice() {
  const business = useStore();
  const now = useNow();

  if (business.ordersPaused) {
    return (
      <div className="closed-notice" role="status">
        <PauseCircle size={20} aria-hidden className="flex-shrink-0" />
        <div>
          <strong>Pausamos los pedidos por un rato</strong>
          <p>Podés mirar el menú; en unos minutos volvemos a tomar pedidos.</p>
        </div>
      </div>
    );
  }

  if (now === null) return null;
  const status = getOpenStatus(business.schedule, business.timezone, new Date(now));
  if (status.open) return null;

  return (
    <div className="closed-notice" role="status">
      <MoonStars size={20} aria-hidden className="flex-shrink-0" />
      <div>
        <strong>Ahora estamos cerrados</strong>
        <p>
          {describeStatus(status)}.{" "}
          {business.acceptOrdersWhenClosed
            ? "Igual podés armar tu pedido y enviarlo: te respondemos apenas abramos."
            : "Podés mirar el menú; los pedidos se toman en horario de atención."}
        </p>
      </div>
    </div>
  );
}
