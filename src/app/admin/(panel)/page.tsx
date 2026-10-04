import OrdersBoard from "@/components/admin/OrdersBoard";
import { requireAdminStore } from "@/lib/server/session";

export default async function OrdersPage() {
  // El layout no se vuelve a ejecutar al navegar: cada página verifica la sesión.
  await requireAdminStore();
  return <OrdersBoard />;
}
