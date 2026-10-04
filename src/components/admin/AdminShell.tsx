"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOptimistic, useTransition, type ReactNode } from "react";
import { BoxArrowRight, BoxArrowUpRight, ChatDots, Gear, JournalText, Receipt, TicketPerforated } from "react-bootstrap-icons";
import { logout, setOrdersPaused } from "@/app/admin/actions";
import { StoreProvider, useStore } from "@/components/store/StoreProvider";
import { ToastProvider, useToast } from "@/components/store/ToastProvider";
import type { Business, StoredOrder } from "@/lib/types";
import { AdminOrdersProvider, useAdminOrders } from "./AdminOrdersProvider";

const NAV = [
  { href: "/admin", label: "Pedidos", icon: Receipt },
  { href: "/admin/menu", label: "Menú", icon: JournalText },
  { href: "/admin/cupones", label: "Cupones", icon: TicketPerforated },
  { href: "/admin/ajustes", label: "Ajustes", icon: Gear },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/** "Recibiendo pedidos" / "Pedidos pausados": pausa manual, sin importar el horario. */
function OrdersSwitch({ compact = false }: { compact?: boolean }) {
  const business = useStore();
  const notify = useToast();
  const [paused, setPausedOptimistic] = useOptimistic(Boolean(business.ordersPaused));
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !paused;
    startTransition(async () => {
      setPausedOptimistic(next);
      const result = await setOrdersPaused(next);
      if (!result.ok) notify(result.error ?? "No pudimos cambiarlo.");
      else notify(next ? "Pausaste los pedidos" : "Volviste a recibir pedidos");
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={!paused}
      className={`adm-live${paused ? " is-paused" : ""}${compact ? " adm-live--compact" : ""}`}
      onClick={toggle}
    >
      <span className="adm-live-dot" aria-hidden />
      {paused ? "Pedidos pausados" : "Recibiendo pedidos"}
    </button>
  );
}

function Navigation({ variant }: { variant: "side" | "tabs" }) {
  const pathname = usePathname();
  const { pendingCount } = useAdminOrders();
  return (
    <nav className={variant === "side" ? "adm-nav" : "adm-tabbar"} aria-label="Secciones del panel">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`adm-nav-link${isActive(pathname, href) ? " is-active" : ""}`}
          aria-current={isActive(pathname, href) ? "page" : undefined}
        >
          <span className="adm-nav-icon">
            <Icon size={variant === "side" ? 18 : 20} aria-hidden />
            {href === "/admin" && pendingCount > 0 && <span className="adm-nav-badge">{pendingCount}</span>}
          </span>
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const business = useStore();
  return (
    <div className="adm-shell">
      <aside className="adm-sidebar">
        <Link href="/admin" className="adm-brand">
          <ChatDots aria-hidden /> viasap
        </Link>
        <div className="adm-store">
          <Image src={business.logoUrl} alt="" width={40} height={40} className="adm-store-logo" />
          <div className="min-w-0">
            <strong className="adm-store-name">{business.name}</strong>
            <a href={`/${business.slug}`} target="_blank" rel="noopener noreferrer" className="adm-store-link">
              Ver mi tienda <BoxArrowUpRight size={11} aria-hidden />
            </a>
          </div>
        </div>
        <OrdersSwitch />
        <Navigation variant="side" />
        <form action={logout} className="adm-sidebar-foot">
          <button type="submit" className="adm-nav-link">
            <span className="adm-nav-icon">
              <BoxArrowRight size={18} aria-hidden />
            </span>
            Salir
          </button>
        </form>
      </aside>

      <div className="adm-main">
        <header className="adm-topbar">
          <Image src={business.logoUrl} alt="" width={34} height={34} className="adm-store-logo" />
          <strong className="adm-store-name">{business.name}</strong>
          <OrdersSwitch compact />
        </header>
        <main className="adm-content">{children}</main>
      </div>

      <Navigation variant="tabs" />
    </div>
  );
}

export default function AdminShell({
  business,
  initialOrders,
  children,
}: {
  business: Business;
  initialOrders: StoredOrder[];
  children: ReactNode;
}) {
  return (
    <StoreProvider business={business}>
      <ToastProvider>
        <AdminOrdersProvider initialOrders={initialOrders}>
          <Shell>{children}</Shell>
        </AdminOrdersProvider>
      </ToastProvider>
    </StoreProvider>
  );
}
