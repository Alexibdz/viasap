"use client";

import { useState } from "react";
import { changeOrderStatus } from "@/app/admin/actions";
import { useStore } from "@/components/store/StoreProvider";
import { useToast } from "@/components/store/ToastProvider";
import { openWhatsApp } from "@/lib/browser";
import { usePersistentFlag } from "@/lib/client-hooks";
import { whatsappUrl } from "@/lib/order";
import { customerNotice, statusLabel } from "@/lib/order-status";
import { toWhatsAppNumber } from "@/lib/phone";
import type { OrderStatus, StoredOrder } from "@/lib/types";
import { useAdminOrders } from "./AdminOrdersProvider";

/** Cambiar el estado de un pedido y, si está activado, avisarle al cliente por WhatsApp. */
export function useOrderActions() {
  const business = useStore();
  const { replaceOrder } = useAdminOrders();
  const notify = useToast();
  const [notifyCustomer, setNotifyCustomer] = usePersistentFlag("viasap:admin:notify", true);
  const [busyCode, setBusyCode] = useState<string | null>(null);

  function messageCustomer(order: StoredOrder, status: OrderStatus = order.status) {
    const text = customerNotice(order, business, status);
    openWhatsApp(whatsappUrl(toWhatsAppNumber(order.customer.phone), text));
  }

  async function moveTo(order: StoredOrder, status: OrderStatus, reason?: string) {
    // WhatsApp se abre en el mismo click: si se abre después de esperar al servidor, el navegador lo bloquea.
    if (notifyCustomer) messageCustomer({ ...order, cancelReason: reason ?? order.cancelReason }, status);
    setBusyCode(order.code);
    const result = await changeOrderStatus(order.code, status, reason);
    setBusyCode(null);
    if (result.ok) {
      replaceOrder(result.order);
      notify(`#${order.number}: ${statusLabel(status, order.fulfillment.method).toLowerCase()}`);
    } else {
      notify(result.error);
    }
  }

  return { moveTo, messageCustomer, notifyCustomer, setNotifyCustomer, busyCode };
}
