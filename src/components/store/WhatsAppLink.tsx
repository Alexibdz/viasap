"use client";

import type { MouseEvent, ReactNode } from "react";
import { isHandheld } from "@/lib/browser";

interface WhatsAppLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

/** Link a un chat de WhatsApp sin dejar una pestaña en blanco en el celular (ver openWhatsApp). */
export default function WhatsAppLink({ href, className, children }: WhatsAppLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!isHandheld()) return;
    event.preventDefault();
    window.location.href = href;
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
