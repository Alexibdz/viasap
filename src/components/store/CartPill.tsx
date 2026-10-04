"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bag } from "react-bootstrap-icons";
import { formatMoney } from "@/lib/format";
import { useCart, useStore } from "./StoreProvider";

/** Botón flotante "Ver mi pedido". Solo en el menú: el producto y el checkout tienen su propia barra. */
export default function CartPill() {
  const { slug } = useStore();
  const { count, subtotal } = useCart();
  const pathname = usePathname();

  if (!count || pathname !== `/${slug}`) return null;

  return (
    <div className="dock">
      <Link href={`/${slug}/pedido`} className="cart-pill">
        <span className="cart-pill-icon">
          <Bag size={20} aria-hidden />
          <span className="cart-pill-count">{count}</span>
        </span>
        <span className="cart-pill-label">
          Ver mi pedido
          <small>
            {count} {count === 1 ? "producto" : "productos"}
          </small>
        </span>
        <span className="cart-pill-total">{formatMoney(subtotal)}</span>
      </Link>
    </div>
  );
}
