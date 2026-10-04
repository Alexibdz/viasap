"use client";

import { BoxArrowUp } from "react-bootstrap-icons";
import { copyText } from "@/lib/browser";
import { useToast } from "./ToastProvider";

export default function ShareButton({ title, className }: { title: string; className?: string }) {
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
      <BoxArrowUp size={18} />
    </button>
  );
}
