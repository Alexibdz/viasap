import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { listRecentOrders } from "@/lib/server/orders";
import { requireAdminStore } from "@/lib/server/session";
import { themeCss } from "@/lib/theme";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const store = await requireAdminStore();
  const orders = await listRecentOrders(store.business.slug);
  return (
    <>
      {/* Los colores del local, para las vistas previas del menú. */}
      <style>{themeCss(store.business.theme)}</style>
      <AdminShell business={store.business} initialOrders={orders}>
        {children}
      </AdminShell>
    </>
  );
}
