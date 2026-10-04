# viasap

Catálogo online y pedidos por WhatsApp para rotiserías y locales de comida. Cada local tiene su link
(`/doble-queso`), el cliente arma el pedido desde el celular y lo manda por WhatsApp con todo resuelto:
productos y opciones, entrega (con mapa y costo por zona), forma de pago y total.

**Beta 1:** sin base de datos. Los locales y sus menús están en `src/data/stores/`.

## Cómo correrlo

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # mensaje de WhatsApp, horarios, precios, checkout y datos de las tiendas
npm run lint
npm run build && npm start
```

### Probar desde el celular

1. `npm run dev -- -H 0.0.0.0`
2. En el celular (misma red Wi-Fi) abrí `http://<IP-de-tu-PC>:3000/doble-queso`.

`next.config.ts` ya permite las IPs `192.168.x.x` y `10.x.x.x`. "Usar mi ubicación actual" necesita HTTPS,
así que en la red local no anda: usá el buscador de direcciones.

### Probar el envío por WhatsApp

Los números de las tiendas de ejemplo son inválidos a propósito. Poné el tuyo en el campo `whatsapp` de
`src/data/stores/doble-queso.ts`, en formato internacional y solo dígitos: `549` + característica sin el 0 +
número sin el 15 (por ejemplo `5493434123456`).

## Tiendas de ejemplo

| Link | Qué muestra | Cupones |
| --- | --- | --- |
| `/doble-queso` | Hamburguesería. Acepta pedidos con el local cerrado. | `BIENVENIDA` (10 %), `FINDE2000` ($2.000 desde $15.000) |
| `/la-esquina` | Rotisería. No toma pedidos fuera de horario. | `ESQUINA15` (15 % desde $12.000) |

Los locales, direcciones y datos bancarios son ficticios. Fotos de ejemplo: Unsplash.

## Sumar una tienda

1. Copiá `src/data/stores/doble-queso.ts` y cambiá slug, datos, colores (`theme`), horarios, zonas de envío,
   formas de pago, cupones y menú.
2. Agregala a la lista de `src/data/stores/index.ts`.
3. Las fotos van en `public/` (para usar URLs externas hay que configurar `images.remotePatterns`).
4. `npm test` revisa ids repetidos, precios, horarios, colores y que las imágenes existan.

## Cómo está armado

```
src/
  app/
    page.tsx                         portada de la plataforma
    [slug]/page.tsx                  menú del local: portada, "Lo más pedido", pestañas y secciones
    [slug]/@modal/(.)producto/[id]/  producto como hoja sobre el menú (ruta interceptada, con URL propia)
    [slug]/producto/[id]/            producto como página completa (link directo o compartido)
    [slug]/pedido/                   checkout en 3 pasos (?paso=2, ?paso=3)
    api/geocode/                     buscador de direcciones (OpenStreetMap / Nominatim)
  components/store/                  tienda, producto, búsqueda, info del local
  components/checkout/               pasos del pedido, mapa, ticket, pantalla final
  lib/
    data.ts       acceso a datos: lo único que cambia al pasar a Supabase
    order.ts      arma el mensaje de WhatsApp
    checkout.ts   totales y validaciones de cada paso
    hours.ts      abierto/cerrado según horario y zona horaria del local
    cart.ts       carrito por tienda en localStorage
  data/stores/    tiendas de ejemplo
```

Algunas decisiones:

- El carrito se guarda en el navegador, por tienda. Nombre, teléfono y dirección se recuerdan para el próximo pedido.
- El envío se cobra por zonas: radio en km (línea recta) desde el local.
- Los cupones se validan en el servidor; la lista nunca llega al navegador.
- El mensaje no usa emojis: algunos llegan rotos en los links `wa.me`.
- Nominatim es gratis pero limitado (1 consulta por segundo). Para producción conviene Google Places,
  Mapbox o Geoapify; solo cambia `src/app/api/geocode/route.ts`.

## Variables de entorno

Copiá `.env.example` a `.env.local`:

- `NEXT_PUBLIC_SITE_URL`: URL pública, para las vistas previas al compartir el link.
- `GEOCODER_USER_AGENT`: identificación para Nominatim (nombre de la app y un contacto).

## Próximo paso: Supabase

Los tipos de `src/lib/types.ts` ya siguen la forma de las tablas: `businesses`, `delivery_zones`,
`categories`, `subcategories`, `products`, `product_variants`, `option_groups`, `options`, `coupons`,
`orders` y `order_items`. Con RLS por `business_id`, Auth para el panel de cada local y Storage para las fotos.
La migración consiste en reemplazar las funciones de `src/lib/data.ts` y guardar el pedido en `orders`
antes de abrir WhatsApp (así el mensaje puede incluir un link al pedido).
