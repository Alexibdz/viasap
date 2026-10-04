"use client";

import { ChevronRight } from "react-bootstrap-icons";
import { useNow } from "@/lib/client-hooks";
import { getOpenStatus, shortStatus } from "@/lib/hours";
import { useStore } from "./StoreProvider";

/** "Abierto · cierra 00:30" / "Cerrado · abre hoy 20:00". En el servidor muestra solo "Horarios". */
export default function StatusPill({ onClick }: { onClick?: () => void }) {
  const business = useStore();
  const now = useNow();
  const status = now === null ? null : getOpenStatus(business.schedule, business.timezone, new Date(now));
  const tone = status === null ? "" : status.open ? " is-open" : " is-closed";

  return (
    <button type="button" className={`status-pill${tone}`} onClick={onClick}>
      <span className="status-pill-dot" aria-hidden />
      {status ? shortStatus(status) : "Horarios"}
      <ChevronRight size={12} aria-hidden />
    </button>
  );
}
