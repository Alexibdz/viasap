"use client";

import { useEffect, useState } from "react";
import type { OrderStatus } from "./types";

const FIRST_CHECK_MS = 1500;
const CHECK_EVERY_MS = 6000;

/** Estado del pedido según el local. null mientras no se sabe (o si no quedó registrado). */
export function useOrderStatus(slug: string, code: string): OrderStatus | null {
  const [status, setStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;
    async function check() {
      try {
        const params = new URLSearchParams({ tienda: slug });
        const response = await fetch(`/api/pedidos/${encodeURIComponent(code)}?${params}`, { cache: "no-store" });
        if (response.ok) {
          const data: { status: OrderStatus } = await response.json();
          if (stopped) return;
          setStatus(data.status);
          // Un pedido entregado o cancelado ya no cambia.
          if (data.status === "delivered" || data.status === "cancelled") return;
        }
      } catch {
        // Sin conexión: se vuelve a intentar.
      }
      if (!stopped) timer = window.setTimeout(check, CHECK_EVERY_MS);
    }
    timer = window.setTimeout(check, FIRST_CHECK_MS);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [slug, code]);

  return status;
}
