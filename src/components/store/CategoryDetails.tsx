"use client";

import { useRef, type ReactNode } from "react";

/** Categoría desplegable del menú: el encabezado abre y cierra sus productos. */
export default function CategoryDetails({ id, summary, children }: { id: string; summary: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);

  // Al cerrarla desde el encabezado fijo (ya bajando por sus productos), se vuelve a su lugar.
  function handleToggle() {
    const details = ref.current;
    if (details && !details.open && details.getBoundingClientRect().top < 0) {
      details.scrollIntoView({ block: "start" });
    }
  }

  return (
    <details ref={ref} id={id} className="menu-category" onToggle={handleToggle}>
      <summary className="menu-category-head">{summary}</summary>
      <div className="menu-category-body">{children}</div>
    </details>
  );
}
