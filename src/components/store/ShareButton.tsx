"use client";

import type { ReactNode } from "react";
import { BoxArrowUp } from "react-bootstrap-icons";
import { copyText } from "@/lib/browser";
import { useToast } from "./ToastProvider";

interface ShareButtonProps {
  title: string;
  className?: string;
  /** Ícono del botón (por defecto, la flecha de compartir). */
  children?: ReactNode;
}

/** Comparte el link con el menú del celular; si no hay, lo copia. */
export default function ShareButton({ title, className, children }: ShareButtonProps) {
  const notify = useToast();

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }
    notify((await copyText(url)) ? "Link copiado" : "No pudimos copiar el link");
  }

  return (
    <button type="button" className={className} aria-label="Compartir" onClick={share}>
      {children ?? <BoxArrowUp size={18} />}
    </button>
  );
}
