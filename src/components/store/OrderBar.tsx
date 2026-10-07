"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { useCart, useStore } from "./StoreProvider";

/**
 * Barra del pedido abajo en el menú: aparece con el primer producto y lleva al pedido.
 * El producto y el checkout tienen su propia barra.
 */
export default function OrderBar() {
  const { slug } = useStore();
  const { count, subtotal } = useCart();
  const pathname = usePathname();

  if (!count || pathname !== `/${slug}`) return null;

  return (
    <div className="order-dock">
      <Link href={`/${slug}/pedido`} className="order-bar">
        <span className="order-bar-text">
          {count} {count === 1 ? "producto" : "productos"} · {formatMoney(subtotal)}
        </span>
        <span className="order-bar-btn">Ver pedido</span>
      </Link>
    </div>
  );
}
