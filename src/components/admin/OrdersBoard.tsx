"use client";

import { useState } from "react";
import { Inbox, VolumeMute, VolumeUp } from "react-bootstrap-icons";
import { useStore } from "@/components/store/StoreProvider";
import { formatDayTitle, formatTime, isSameDay } from "@/lib/admin-format";
import { useNow } from "@/lib/client-hooks";
import { formatMoney } from "@/lib/format";
import { ACTIVE_STATUSES, nextStatus, statusLabel } from "@/lib/order-status";
import type { OrderStatus } from "@/lib/types";
import { useAdminOrders } from "./AdminOrdersProvider";
import OrderCard from "./OrderCard";
import OrderDrawer from "./OrderDrawer";
import { useOrderActions } from "./useOrderActions";

const COLUMNS: { status: OrderStatus; title: string; empty: string }[] = [
  { status: "pending", title: "Nuevos", empty: "Cuando entre un pedido lo vas a ver acá (y vas a escuchar un aviso)." },
  { status: "preparing", title: "En preparación", empty: "Nada en la cocina por ahora." },
  { status: "ready", title: "Listos / en camino", empty: "Ningún pedido esperando." },
];

export default function OrdersBoard() {
  const business = useStore();
  const { orders, soundOn, setSoundOn } = useAdminOrders();
  const { moveTo, busyCode } = useOrderActions();
  const now = useNow();
  const [tab, setTab] = useState<OrderStatus>("pending");
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const tz = business.timezone;

  const today = now === null ? [] : orders.filter((order) => isSameDay(order.createdAt, now, tz));
  const sold = today.filter((order) => order.status !== "cancelled");
  const revenue = sold.reduce((sum, order) => sum + order.totals.total, 0);
  const inProgress = orders.filter((order) => ACTIVE_STATUSES.includes(order.status)).length;
  const finished = today.filter((order) => order.status === "delivered" || order.status === "cancelled");
  const openOrder = orders.find((order) => order.code === openCode) ?? null;

  function open(code: string) {
    setOpenCode(code);
    setDrawerVisible(true);
  }

  const kpis = [
    { label: "Pedidos hoy", value: now === null ? "—" : String(sold.length) },
    { label: "Vendido hoy", value: now === null ? "—" : formatMoney(revenue) },
    { label: "Ticket promedio", value: sold.length ? formatMoney(revenue / sold.length) : "—" },
    { label: "En curso", value: String(inProgress) },
  ];

  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <div>
          <h1 className="adm-title">Pedidos</h1>
          <p className="adm-subtitle">{now === null ? "Hoy" : formatDayTitle(now, tz)}</p>
        </div>
        <button
          type="button"
          className={`adm-btn${soundOn ? "" : " adm-btn--muted"}`}
          onClick={() => setSoundOn(!soundOn)}
          aria-pressed={soundOn}
        >
          {soundOn ? <VolumeUp aria-hidden /> : <VolumeMute aria-hidden />}
          {soundOn ? "Sonido activado" : "Sin sonido"}
        </button>
      </header>

      <section className="adm-kpis" aria-label="Resumen del día">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="adm-kpi">
            <span className="adm-kpi-label">{kpi.label}</span>
            <strong className="adm-kpi-value">{kpi.value}</strong>
          </div>
        ))}
      </section>

      <div className="adm-board-tabs" role="tablist" aria-label="Estado">
        {COLUMNS.map((column) => {
          const count = orders.filter((order) => order.status === column.status).length;
          return (
            <button
              key={column.status}
              type="button"
              role="tab"
              aria-selected={tab === column.status}
              className={`adm-board-tab is-${column.status}${tab === column.status ? " is-active" : ""}`}
              onClick={() => setTab(column.status)}
            >
              {column.title}
              <span className="adm-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="adm-board">
        {COLUMNS.map((column) => {
          const columnOrders = orders
            .filter((order) => order.status === column.status)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          return (
            <section
              key={column.status}
              className={`adm-column is-${column.status}${tab === column.status ? " is-visible" : ""}`}
              aria-label={column.title}
            >
              <h2 className="adm-column-title">
                {column.title}
                <span className="adm-count">{columnOrders.length}</span>
              </h2>
              {columnOrders.length === 0 ? (
                <p className="adm-empty">
                  <Inbox size={22} aria-hidden />
                  {column.empty}
                </p>
              ) : (
                columnOrders.map((order) => (
                  <OrderCard
                    key={order.code}
                    order={order}
                    now={now}
                    busy={busyCode === order.code}
                    onOpen={() => open(order.code)}
                    onAdvance={() => {
                      const next = nextStatus(order.status);
                      if (next) void moveTo(order, next);
                    }}
                  />
                ))
              )}
            </section>
          );
        })}
      </div>

      <section className="adm-history" aria-label="Finalizados hoy">
        <h2 className="adm-section-title">Finalizados hoy</h2>
        {finished.length === 0 ? (
          <p className="adm-muted">Todavía no se entregó ni canceló ningún pedido hoy.</p>
        ) : (
          <ul className="adm-history-list">
            {finished.map((order) => (
              <li key={order.code}>
                <button type="button" className="adm-history-row" onClick={() => open(order.code)}>
                  <span className="adm-history-number">#{order.number}</span>
                  <span className="adm-history-name">{order.customer.name}</span>
                  <span className={`adm-status is-${order.status}`}>
                    {statusLabel(order.status, order.fulfillment.method)}
                  </span>
                  <span className="adm-history-time">{formatTime(order.createdAt, tz)}</span>
                  <strong>{formatMoney(order.totals.total)}</strong>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <OrderDrawer
        order={openOrder}
        show={drawerVisible}
        onHide={() => setDrawerVisible(false)}
        onExited={() => setOpenCode(null)}
      />
    </div>
  );
}
