"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useToast } from "@/components/store/ToastProvider";
import { playChime } from "@/lib/chime";
import { usePersistentFlag } from "@/lib/client-hooks";
import type { StoredOrder } from "@/lib/types";

// Pedidos del local en el panel: se actualizan solos y avisan cuando entra uno nuevo,
// aunque el panel esté abierto en otra sección.

const POLL_MS = 8000;

interface AdminOrders {
  orders: StoredOrder[];
  pendingCount: number;
  /** Reemplaza un pedido en la lista (por ejemplo, después de cambiarle el estado). */
  replaceOrder: (order: StoredOrder) => void;
  soundOn: boolean;
  setSoundOn: (on: boolean) => void;
}

const AdminOrdersContext = createContext<AdminOrders | null>(null);

export function AdminOrdersProvider({ initialOrders, children }: { initialOrders: StoredOrder[]; children: ReactNode }) {
  const [orders, setOrders] = useState(initialOrders);
  const [soundOn, setSoundOn] = usePersistentFlag("viasap:admin:sound", true);
  const notify = useToast();
  const known = useRef<Set<string> | null>(null);

  const receive = useEffectEvent((fresh: StoredOrder[]) => {
    const seen = known.current ?? new Set(initialOrders.map((order) => order.code));
    const arrived = fresh.filter((order) => order.status === "pending" && !seen.has(order.code));
    for (const order of fresh) seen.add(order.code);
    known.current = seen;
    if (arrived.length) {
      if (soundOn) playChime();
      notify(arrived.length === 1 ? `Nuevo pedido #${arrived[0].number}` : `${arrived.length} pedidos nuevos`);
    }
    setOrders(fresh);
  });

  useEffect(() => {
    let stopped = false;
    async function poll() {
      try {
        const response = await fetch("/api/admin/pedidos", { cache: "no-store" });
        if (response.status === 401) {
          window.location.assign("/admin/ingresar");
          return;
        }
        if (response.ok && !stopped) receive((await response.json()).orders);
      } catch {
        // Sin conexión: se reintenta en el próximo ciclo.
      }
    }
    const interval = window.setInterval(poll, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const pendingCount = orders.filter((order) => order.status === "pending").length;

  // El contador en la pestaña del navegador se ve aunque el panel esté en segundo plano.
  useEffect(() => {
    document.title = pendingCount ? `(${pendingCount}) Pedidos nuevos · viasap` : "Panel · viasap";
  }, [pendingCount]);

  const replaceOrder = useCallback(
    (order: StoredOrder) => setOrders((list) => list.map((item) => (item.code === order.code ? order : item))),
    [],
  );

  const value = useMemo(
    () => ({ orders, pendingCount, replaceOrder, soundOn, setSoundOn }),
    [orders, pendingCount, replaceOrder, soundOn, setSoundOn],
  );

  return <AdminOrdersContext value={value}>{children}</AdminOrdersContext>;
}

export function useAdminOrders(): AdminOrders {
  const value = use(AdminOrdersContext);
  if (!value) throw new Error("useAdminOrders tiene que usarse dentro de <AdminOrdersProvider>.");
  return value;
}
