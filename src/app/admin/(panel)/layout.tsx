import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { listRecentOrders } from "@/lib/server/orders";
import { requireAdminStore } from "@/lib/server/session";
import { designFor } from "@/designs";
import { themeCss } from "@/lib/theme";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const store = await requireAdminStore();
  const orders = await listRecentOrders(store.business.slug);
  return (
    <>
      {/* El color de marca del diseño del local, para los botones y las vistas previas. */}
      <style>{themeCss(designFor(store.business.slug).theme)}</style>
      <AdminShell business={store.business} initialOrders={orders}>
        {children}
      </AdminShell>
    </>
  );
}
