import type { NextRequest } from "next/server";
import { getOrder } from "@/lib/server/orders";

// Estado de un pedido para la pantalla del cliente. El código (12 caracteres al
// azar) hace de llave: solo devuelve el estado, ningún dato personal.
export async function GET(request: NextRequest, context: RouteContext<"/api/pedidos/[code]">) {
  const { code } = await context.params;
  const slug = request.nextUrl.searchParams.get("tienda") ?? "";
  const order = await getOrder(slug, code);
  const headers = { "Cache-Control": "no-store" };
  if (!order) return Response.json({ status: null }, { status: 404, headers });
  return Response.json({ status: order.status, method: order.fulfillment.method }, { headers });
}
