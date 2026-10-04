"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import { useStoreNavigation } from "@/lib/navigation";
import type { ProductContext } from "@/lib/types";
import ProductForm from "./ProductForm";

/** Producto abierto desde el menú: hoja que sube desde abajo, con su propia URL. */
export default function ProductSheet({ context }: { context: ProductContext }) {
  const router = useRouter();
  const [show, setShow] = useState(true);

  return (
    <Offcanvas
      show={show}
      onHide={() => setShow(false)}
      onExited={() => router.back()}
      placement="bottom"
      className="sheet sheet--product"
      aria-labelledby="product-title"
    >
      <div className="sheet-handle sheet-handle--over" aria-hidden />
      <ProductForm context={context} layout="sheet" onAdded={() => setShow(false)} onClose={() => setShow(false)} />
    </Offcanvas>
  );
}

/** Producto abierto desde un link directo: página completa. */
export function ProductPageForm({ context, storeHref }: { context: ProductContext; storeHref: string }) {
  const { leaveTo } = useStoreNavigation();
  return <ProductForm context={context} layout="page" onAdded={() => leaveTo(storeHref)} />;
}
