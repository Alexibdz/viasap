"use client";

import { PlusLg } from "react-bootstrap-icons";
import { createId } from "@/lib/browser";
import type { CartItem, Product } from "@/lib/types";
import { useCart } from "./StoreProvider";
import { useToast } from "./ToastProvider";

function qtyInCart(items: CartItem[], productId: string): number {
  return items.reduce((sum, item) => (item.productId === productId ? sum + item.qty : sum), 0);
}

/** Indicador del "+" dentro de una tarjeta: muestra cuántos hay en el pedido. */
export function CardPlus({ productId }: { productId: string }) {
  const { items } = useCart();
  const qty = qtyInCart(items, productId);
  return (
    <span className={`card-action${qty ? " has-qty" : ""}`} aria-hidden>
      {qty || <PlusLg size={16} />}
    </span>
  );
}

interface QuickAddButtonProps {
  product: Product;
  sectionLabel: string;
  /** Lo que incluye, si es una oferta (va al mensaje del pedido). */
  includes?: string;
}

/** Agrega directo al pedido los productos que no tienen nada para elegir. */
export function QuickAddButton({ product, sectionLabel, includes }: QuickAddButtonProps) {
  const { items, add } = useCart();
  const notify = useToast();
  const qty = qtyInCart(items, product.id);

  function addOne() {
    add([
      {
        key: createId(),
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        sectionLabel,
        unitPrice: product.price ?? 0,
        options: [],
        includes,
        qty: 1,
      },
    ]);
    notify(`${product.name} al pedido`);
  }

  return (
    <button
      type="button"
      className={`card-action card-action--button${qty ? " has-qty" : ""}`}
      aria-label={qty ? `Sumar otro ${product.name} (tenés ${qty})` : `Agregar ${product.name}`}
      onClick={addOne}
    >
      {qty || <PlusLg size={16} />}
    </button>
  );
}
