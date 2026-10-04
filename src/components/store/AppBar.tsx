"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "react-bootstrap-icons";
import { useStoreNavigation } from "@/lib/navigation";

interface AppBarProps {
  title: string;
  /** Página "padre": si venimos de ahí, vuelve con el historial. */
  backHref: string;
  /** Reemplaza la navegación de la flecha (por ejemplo, para volver un paso del checkout). */
  onBack?: () => void;
  children?: ReactNode;
}

export default function AppBar({ title, backHref, onBack, children }: AppBarProps) {
  const { backIfFrom } = useStoreNavigation();
  return (
    <header className="app-bar">
      <div className="app-bar-inner">
        {onBack ? (
          <button type="button" className="round-btn round-btn--soft" aria-label="Volver" onClick={onBack}>
            <ArrowLeft size={18} />
          </button>
        ) : (
          <Link
            href={backHref}
            className="round-btn round-btn--soft"
            aria-label="Volver"
            onClick={(event) => {
              if (backIfFrom(backHref)) event.preventDefault();
            }}
          >
            <ArrowLeft size={18} />
          </Link>
        )}
        <h1 className="app-bar-title">{title}</h1>
        <div className="app-bar-end">{children}</div>
      </div>
    </header>
  );
}
