"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowRight, Bag, Check2, Whatsapp } from "react-bootstrap-icons";
import AppBar from "@/components/store/AppBar";
import { useCart, useStore } from "@/components/store/StoreProvider";
import {
  evaluateCheckout,
  maxReachableStep,
  STEP_FIELDS,
  stepIsValid,
  type CheckoutDraft,
  type Step,
} from "@/lib/checkout";
import { openWhatsApp } from "@/lib/browser";
import { useIsClient, useNow } from "@/lib/client-hooks";
import { formatMoney } from "@/lib/format";
import { describeStatus, getOpenStatus } from "@/lib/hours";
import { buildOrderMessage, generateOrderRef, whatsappUrl } from "@/lib/order";
import { submitOrder } from "@/lib/order-actions";
import { orderLinesFromCart, type OrderInput } from "@/lib/order-pricing";
import { loadCustomer, loadDelivery, saveCustomer, saveDelivery } from "@/lib/profile";
import type { Business, DeliveryMethod, Fulfillment, Order, PaymentMethod } from "@/lib/types";
import OrderSent, { type SentOrder } from "./OrderSent";
import StepCart from "./StepCart";
import StepDelivery from "./StepDelivery";
import StepPayment from "./StepPayment";

const STEPS: { step: Step; label: string }[] = [
  { step: 1, label: "Pedido" },
  { step: 2, label: "Entrega" },
  { step: 3, label: "Pago" },
];
const TITLES: Record<Step, string> = { 1: "Tu pedido", 2: "Entrega", 3: "Pago" };

function initialDraft(business: Business): CheckoutDraft {
  const customer = loadCustomer();
  const saved = loadDelivery(business.slug);
  const methods: DeliveryMethod[] = [];
  if (business.delivery.pickup) methods.push("pickup");
  if (business.delivery.delivery) methods.push("delivery");
  const payments: PaymentMethod[] = [];
  if (business.payments.cash) payments.push("cash");
  if (business.payments.transfer) payments.push("transfer");
  return {
    name: customer.name,
    phone: customer.phone,
    method: saved.method && methods.includes(saved.method) ? saved.method : methods.length === 1 ? methods[0] : null,
    address: saved.address,
    buildingType: saved.buildingType,
    floor: saved.floor,
    apartment: saved.apartment,
    references: saved.references,
    payment: payments.length === 1 ? payments[0] : null,
    cashInput: "",
    coupon: null,
  };
}

export function CheckoutLoading({ storeHref }: { storeHref: string }) {
  return (
    <>
      <AppBar title="Tu pedido" backHref={storeHref} />
      <div className="checkout-loading">Cargando tu pedido…</div>
    </>
  );
}

export default function CheckoutView() {
  const { slug } = useStore();
  const isClient = useIsClient();
  // El pedido y los datos guardados viven en el navegador: en el servidor solo hay un esqueleto.
  if (!isClient) return <CheckoutLoading storeHref={`/${slug}`} />;
  return <CheckoutFlow />;
}

function EmptyCart({ storeHref }: { storeHref: string }) {
  return (
    <>
      <AppBar title="Tu pedido" backHref={storeHref} />
      <main className="empty-cart">
        <span className="empty-cart-icon" aria-hidden>
          <Bag size={32} />
        </span>
        <h2>Todavía no elegiste nada</h2>
        <p>Recorré el menú, sumá lo que tengas ganas y volvé acá para mandarlo por WhatsApp.</p>
        <Link href={storeHref} className="btn-main">
          Ver el menú
        </Link>
      </main>
    </>
  );
}

function CheckoutFlow() {
  const business = useStore();
  const { items, subtotal, clear } = useCart();
  const now = useNow();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const storeHref = `/${business.slug}`;
  // Cuántos pasos agregamos al historial en esta visita (para saber si "volver" puede usar history.back).
  const pushedSteps = useRef(0);

  const [draft, setDraft] = useState(() => initialDraft(business));
  const [attempted, setAttempted] = useState<Record<Step, boolean>>({ 1: false, 2: false, 3: false });
  const [sent, setSent] = useState<SentOrder | null>(null);

  const status = now === null ? null : getOpenStatus(business.schedule, business.timezone, new Date(now));
  const summary = evaluateCheckout(draft, subtotal, business, status ? status.open : null);
  const requested = Number(searchParams.get("paso"));
  const step = Math.min(requested === 2 || requested === 3 ? requested : 1, maxReachableStep(summary.errors)) as Step;
  const update = (patch: Partial<CheckoutDraft>) => setDraft((current) => ({ ...current, ...patch }));

  if (sent) return <OrderSent order={sent} />;
  if (!items.length) return <EmptyCart storeHref={storeHref} />;

  let closedMessage: string | null = null;
  if (business.ordersPaused) {
    closedMessage = "El local pausó los pedidos por un rato. Probá de nuevo en unos minutos.";
  } else if (status && !status.open) {
    closedMessage = business.acceptOrdersWhenClosed
      ? `Ahora estamos cerrados (${describeStatus(status).toLowerCase()}). Podés enviar el pedido igual: te respondemos apenas abramos.`
      : `${summary.errors.closed} ${describeStatus(status)}.`;
  }

  function goToStep(next: Step) {
    pushedSteps.current += 1;
    window.history.pushState(null, "", `${pathname}?paso=${next}`);
    window.scrollTo({ top: 0 });
  }

  function goBack() {
    if (pushedSteps.current > 0) {
      pushedSteps.current -= 1;
      window.history.back();
    } else {
      window.history.replaceState(null, "", step === 2 ? pathname : `${pathname}?paso=${step - 1}`);
    }
    window.scrollTo({ top: 0 });
  }

  function showStepErrors(current: Step) {
    setAttempted((previous) => ({ ...previous, [current]: true }));
    const field = STEP_FIELDS[current].find((f) => summary.errors[f]);
    if (field) document.getElementById(`campo-${field}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function persist() {
    saveCustomer({ name: draft.name.trim(), phone: draft.phone.trim() });
    saveDelivery(business.slug, {
      method: draft.method,
      address: draft.address,
      buildingType: draft.buildingType,
      floor: draft.floor,
      apartment: draft.apartment,
      references: draft.references,
    });
  }

  function next() {
    if (!stepIsValid(step, summary.errors)) {
      showStepErrors(step);
      return;
    }
    if (step === 2) persist();
    goToStep((step + 1) as Step);
  }

  function send() {
    if (!stepIsValid(3, summary.errors) || !draft.method || !draft.payment) {
      showStepErrors(3);
      return;
    }
    const fulfillment: Fulfillment =
      draft.method === "delivery" && draft.address
        ? {
            method: "delivery",
            address: draft.address.label,
            location: draft.address.location,
            buildingType: draft.buildingType,
            floor: draft.buildingType === "apartment" ? draft.floor.trim() : undefined,
            apartment: draft.buildingType === "apartment" ? draft.apartment.trim() : undefined,
            references: draft.references.trim() || undefined,
            cost: summary.quote?.status === "ok" ? summary.quote.cost : null,
          }
        : { method: "pickup" };
    const ref = generateOrderRef();
    const order: Order = {
      ...ref,
      createdAt: new Date(),
      customer: { name: draft.name.trim(), phone: draft.phone.trim() },
      items,
      fulfillment,
      payment: {
        method: draft.payment,
        cashAmount: draft.payment === "transfer" ? undefined : summary.cashAmount || undefined,
      },
      coupon: draft.coupon && summary.discount > 0 ? { code: draft.coupon.code, discount: summary.discount } : undefined,
      totals: {
        subtotal: summary.subtotal,
        discount: summary.discount,
        shipping: summary.shipping,
        total: summary.total,
      },
    };
    const message = buildOrderMessage(order, business);
    const url = whatsappUrl(business.whatsapp, message);
    const input: OrderInput = {
      ...ref,
      customer: order.customer,
      lines: orderLinesFromCart(items),
      fulfillment:
        fulfillment.method === "delivery"
          ? {
              method: "delivery",
              address: fulfillment.address,
              location: fulfillment.location,
              buildingType: fulfillment.buildingType,
              floor: fulfillment.floor,
              apartment: fulfillment.apartment,
              references: fulfillment.references,
            }
          : { method: "pickup" },
      payment: order.payment,
      couponCode: order.coupon?.code,
      clientTotal: summary.total,
    };

    persist();
    // Registrarlo para el panel va en segundo plano: el pedido sale por WhatsApp.
    void submitOrder(business.slug, input);
    clear();
    setSent({ ...ref, message, url, total: summary.total, method: fulfillment.method, items });
    window.history.replaceState(null, "", pathname);
    window.scrollTo({ top: 0 });
    // Al final y en el mismo click: así el navegador no lo bloquea y nada lo interrumpe.
    openWhatsApp(url);
  }

  // En el primer paso todavía no hay envío elegido.
  const shownTotal = step === 1 ? summary.subtotal - summary.discount : summary.total;
  const shippingToAgree = step > 1 && summary.quote?.status === "to-agree";

  return (
    <>
      <AppBar title={TITLES[step]} backHref={storeHref} onBack={step > 1 ? goBack : undefined}>
        <span className="step-count">{step}/3</span>
      </AppBar>
      <ol className="steps" aria-label="Pasos del pedido">
        {STEPS.map(({ step: s, label }) => (
          <li
            key={s}
            className={s === step ? "is-current" : s < step ? "is-done" : undefined}
            aria-current={s === step ? "step" : undefined}
          >
            <span className="steps-dot">{s < step ? <Check2 size={12} aria-hidden /> : s}</span>
            {label}
          </li>
        ))}
      </ol>

      <main className="checkout">
        {step === 1 && (
          <StepCart summary={summary} coupon={draft.coupon} onCouponChange={(coupon) => update({ coupon })} />
        )}
        {step === 2 && <StepDelivery draft={draft} summary={summary} update={update} showErrors={attempted[2]} />}
        {step === 3 && (
          <StepPayment
            draft={draft}
            summary={summary}
            update={update}
            showErrors={attempted[3]}
            closedMessage={closedMessage}
          />
        )}
      </main>

      <div className="dock dock--bar">
        <div className="dock-inner">
          <div className="dock-total">
            <span>{step === 1 ? "Subtotal" : "Total"}</span>
            <strong>
              {formatMoney(shownTotal)}
              {shippingToAgree && <small> + envío</small>}
            </strong>
          </div>
          {step < 3 ? (
            <button type="button" className="btn-main" onClick={next}>
              Continuar <ArrowRight aria-hidden />
            </button>
          ) : (
            <button type="button" className="btn-whatsapp" onClick={send} disabled={Boolean(summary.errors.closed)}>
              <Whatsapp size={20} aria-hidden /> Enviar pedido
            </button>
          )}
        </div>
      </div>
    </>
  );
}
