import CouponsManager from "@/components/admin/CouponsManager";
import { listOrders } from "@/lib/server/orders";
import { requireAdminStore } from "@/lib/server/session";

export default async function CouponsPage() {
  const store = await requireAdminStore();
  // Cuántas veces se usó cada cupón (sin contar pedidos cancelados).
  const usage: Record<string, number> = {};
  for (const order of await listOrders(store.business.slug)) {
    if (order.coupon && order.status !== "cancelled") usage[order.coupon.code] = (usage[order.coupon.code] ?? 0) + 1;
  }
  return <CouponsManager coupons={store.coupons} usage={usage} />;
}
