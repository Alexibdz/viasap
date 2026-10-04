import { listRecentOrders } from "@/lib/server/orders";
import { getAdminStore } from "@/lib/server/session";

// Pedidos del local de la sesión, para que el tablero se actualice solo.
export async function GET() {
  const store = await getAdminStore();
  if (!store) return Response.json({ error: "Sesión vencida." }, { status: 401 });
  const orders = await listRecentOrders(store.business.slug);
  return Response.json({ orders }, { headers: { "Cache-Control": "no-store" } });
}
