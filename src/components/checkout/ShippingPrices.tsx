"use client";

import { useStore } from "@/components/store/StoreProvider";
import { formatMoney } from "@/lib/format";
import { quoteShipping } from "@/lib/shipping";

/**
 * Precios del envío por zona, para que el cliente sepa cuánto le sale. No elige la zona:
 * si los precios cambian según la zona, el local se lo confirma por WhatsApp.
 */
export default function ShippingPrices() {
  const { delivery } = useStore();
  if (!delivery.zones.length) return null;
  const known = quoteShipping(delivery).status === "ok";

  return (
    <div className="shipping-prices">
      <p className="field-label">Costo del envío</p>
      <ul className="zones">
        {delivery.zones.map((zone) => (
          <li key={zone.id}>
            <span>{zone.name}</span>
            <strong>{zone.cost ? formatMoney(zone.cost) : "Gratis"}</strong>
          </li>
        ))}
      </ul>
      {!known && <p className="shipping-prices-note">Se suma al total según tu zona: te lo confirmamos por WhatsApp.</p>}
    </div>
  );
}
