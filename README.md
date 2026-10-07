# viasap

Catálogo online y pedidos por WhatsApp para rotiserías y locales de comida. Cada local tiene su link
(`/rotiseria-alexis`), el cliente arma el pedido desde el celular y lo manda por WhatsApp con todo resuelto:
productos y opciones, entrega (con mapa y costo según la zona: dentro o fuera de boulevard), forma de pago y total. El local los recibe
también en su panel (`/admin`), donde los confirma y edita el menú, los cupones y los ajustes.

**Beta 1:** sin base de datos. Los menús de ejemplo están en `src/data/stores/`; lo que se cambia desde el
panel y los pedidos se guardan como archivos JSON en `data/` (ver [Datos de la beta](#datos-de-la-beta)).

## Cómo correrlo

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # mensaje de WhatsApp, horarios, precios, envíos, ofertas, checkout, formularios del panel y datos
npm run lint
npm run build && npm start
```

### Probar desde el celular

1. `npm run dev -- -H 0.0.0.0`
2. En el celular (misma red Wi-Fi) abrí `http://<IP-de-tu-PC>:3000/rotiseria-alexis`.

`next.config.ts` ya permite las IPs `192.168.x.x` y `10.x.x.x`. "Usar mi ubicación actual" necesita HTTPS,
así que en la red local no anda: usá el buscador de direcciones.

### Probar el envío por WhatsApp

Las dos tiendas de ejemplo mandan los pedidos al WhatsApp real de Rotisería Alexis (343 661-7446). Para probar sin
molestar, poné el tuyo en el campo `whatsapp` de `src/data/stores/rotiseria-alexis.ts` (o `costanera-burgers.ts`), en
formato internacional y solo dígitos: `549` + característica sin el 0 + número sin el 15 (por ejemplo `5493434123456`).

## Panel del local

Entrá a `/admin` (te lleva a `/admin/ingresar`). Cuentas de prueba, con contraseña `demo1234`:
`admin@rotiseriaalexis.demo` y `admin@costaneraburgers.demo`. Cada cuenta ve solo su local.

- **Pedidos:** tablero con nuevos, en preparación y listos. Se actualiza solo cada pocos segundos y avisa
  con un sonido y en la pestaña del navegador ("(2) Pedidos nuevos"). Desde el detalle se confirma, se marca
  listo o entregado, se cancela con un motivo y se imprime la comanda; si querés, abre WhatsApp con el aviso
  para el cliente. El cliente ve el estado en la pantalla final de su pedido.
- **Menú:** productos con presentaciones y opciones, foto opcional, agotado y orden; categorías y grupos.
  Cada categoría lleva un emoji de decoración (🍕) y en la tienda se despliega al tocarla, con los productos
  adentro; con "Desplegada al entrar" arranca abierta. Las que no tienen productos no se muestran.
  Una categoría puede ser **de ofertas**: no se lista como categoría, sus productos van arriba en el carrusel
  de ofertas y se arman con el **armador de ofertas** (productos del menú, presentación y cantidad); la
  tienda muestra qué incluye, con la etiqueta "Oferta" (sin % ni precio tachado; el panel sí muestra cuánto se
  ahorra, para armarla). Una oferta también puede estar dentro de cualquier
  categoría ("Es una oferta o promo", por ejemplo las promos de pizzas dentro de Pizzas); si se marca como
  **destacada**, además aparece en el carrusel. Un producto incluido en una oferta no se puede borrar sin sacarlo
  antes de la oferta.
- **Cupones** y **Ajustes** (datos del local, horarios, entregas y pagos). El logo, los colores y las fuentes no
  se configuran desde el panel: son parte del diseño del local (ver "Diseño de cada local").
- **Pausar pedidos:** el interruptor "Recibiendo pedidos" corta los pedidos por un rato, sin tocar el horario.

## Tiendas de ejemplo

| Link | Qué muestra | Cupones |
| --- | --- | --- |
| `/rotiseria-alexis` | Rotisería Alexis: parrilla, pizzas y promos, hamburguesas, panchos, torpedos, sándwiches, minutas, pastas, empanadas XXL, rabas, bebidas y postres, todo sin fotos; ofertas y envío dentro / fuera de boulevard y zona rural. Acepta pedidos con el local cerrado. | `BIENVENIDA` (10 %), `FINDE2000` ($2.000 desde $15.000) |
| `/costanera-burgers` | Costanera Burgers, en la costanera de Victoria: hamburguesas smash, torpedos, panchos, papas y ensaladas (torpedos y panchos todavía sin foto); tres ofertas en el carrusel. Diseño "Brasa" (oscuro, productos en tiles). | `BIENVENIDA` (10 %), `FINDE2000` ($2.000 desde $15.000) |

El catálogo de Rotisería Alexis y sus precios salen de dos listas reales que las rotiserías mandan por WhatsApp (donde
un producto estaba en las dos, quedó el precio de Rotisería Alexis). Las fotos de ejemplo están todas en Costanera
Burgers. Las bebidas no llevan "¿Alguna aclaración?": se configura
por categoría ("Sin aclaraciones"). La dirección y los datos bancarios son ficticios; el WhatsApp es el de la rotisería. El link viejo (`/doble-queso`)
redirige al nuevo. Los productos nuevos no tienen foto a propósito: se prioriza la foto
real del producto antes que una de referencia. Fotos de ejemplo: Unsplash.

## Sumar una tienda

1. Copiá `src/data/stores/rotiseria-alexis.ts` y cambiá slug, datos, horarios, zonas de envío, formas de pago,
   cupones y menú. Sin diseño propio usa el de base; para darle uno, ver "Diseño de cada local".
2. Agregala a la lista de `src/data/stores/index.ts`.
3. Las fotos van en `public/` (para usar URLs externas hay que configurar `images.remotePatterns`).
4. Poné el email del panel y el hash de su contraseña en `admin`. Para generar el hash:
   `node -e 'const c=require("crypto"),s=c.randomBytes(16);console.log("scrypt$"+s.toString("base64url")+"$"+c.scryptSync(process.argv[1],s,64).toString("base64url"))' "la-contraseña"`
5. `npm test` revisa ids repetidos, precios, horarios y que las imágenes existan.

## Diseño de cada local

Cada local tiene su diseño, armado en el código (el local no elige colores ni fuentes). La estructura y el
comportamiento son los mismos para todos: cabecera, carrusel de ofertas, categorías desplegables, barra del pedido,
producto y checkout. El diseño cambia cómo se ven:

- `src/designs/<diseño>.ts`: color de marca, variables CSS (fondo, superficies, texto, estados, fuentes y radios),
  color de la barra del navegador y cómo se muestran los productos (`tiles` con foto o `rows` en lista). Las
  variables pisan las de `globals.css` en `:root`, así las toman también las hojas y el checkout.
- `src/designs/<diseño>.css`: lo que cambia de forma, todo bajo `[data-design="<id>"]`.
- `src/designs/index.ts`: qué diseño usa cada local (por slug). Las fuentes se cargan en `src/designs/fonts.ts`.

| Local | Diseño |
| --- | --- |
| Costanera Burgers | **Brasa**: oscuro, Instrument Serif para el nombre (la última palabra en cursiva naranja), Space Mono para las etiquetas; categorías en tarjetas con emoji que se despliegan, con los productos en tiles de a dos. Hamburguesas arranca abierta. |
| Rotisería Alexis | **Tipográfico**: papel cálido, el nombre en Anton con la última palabra resaltada en amarillo, categorías en tarjetas con emoji y productos en lista. |

## Cómo está armado

```
src/
  app/
    page.tsx                         portada de la plataforma
    [slug]/page.tsx                  menú del local: cabecera, carrusel de ofertas y categorías desplegables
    [slug]/@modal/(.)producto/[id]/  producto como hoja sobre el menú (ruta interceptada, con URL propia)
    [slug]/producto/[id]/            producto como página completa (link directo o compartido)
    [slug]/pedido/                   checkout en 3 pasos (?paso=2, ?paso=3)
    admin/                           panel del local: pedidos, menú, cupones, ajustes e ingreso
    admin/actions.ts                 acciones del panel (cada una verifica la sesión y valida)
    api/geocode/                     buscador de direcciones (OpenStreetMap / Nominatim)
    api/admin/pedidos/               pedidos del local para el tablero (se consulta cada 8 s)
    api/pedidos/[code]/              estado de un pedido para la pantalla del cliente
    media/[...path]/                 fotos subidas desde el panel
  components/store/                  tienda (cabecera, ofertas, categorías, tiles o filas, barra del pedido),
                                     producto, horarios y envíos
  designs/                           diseño de cada local: variables (.ts) y estilos propios (.css)
  components/checkout/               pasos del pedido, mapa, ticket, pantalla final
  components/admin/                  panel (estilos en app/admin/admin.css, clases adm-*)
  lib/
    data.ts          lectura pública de las tiendas (sin categorías vacías ni datos privados)
    order.ts         arma el mensaje de WhatsApp
    order-pricing.ts recalcula en el servidor los precios del pedido que manda el navegador
    order-status.ts  estados del pedido y avisos para el cliente
    admin-forms.ts   validación de los formularios del panel
    checkout.ts      totales y validaciones de cada paso
    shipping.ts      costo de envío según la zona que elige el cliente
    offers.ts        qué incluye cada oferta (y el ahorro, que solo ve el panel)
    hero.ts          nombre de la cabecera (última palabra aparte y tamaño para que entre)
    store-upgrade.ts actualiza tiendas guardadas con un formato anterior
    hours.ts         abierto/cerrado según horario y zona horaria del local
    cart.ts          carrito por tienda en localStorage
    server/          archivos de data/, tiendas, pedidos, sesión del panel y contraseñas
  data/stores/       tiendas de ejemplo
```

Algunas decisiones:

- El carrito se guarda en el navegador, por tienda. Nombre, teléfono y dirección se recuerdan para el próximo pedido.
- El envío se cobra por zonas con nombre (dentro de boulevard, fuera de boulevard, zona rural…): el cliente elige
  la suya al pedir y ve el costo. No se calcula la distancia; el mapa queda para que el local encuentre la casa.
- La cabecera es la misma para todos: logo, ciudad, nombre (la última palabra en su renglón), descripción, la
  tarjeta de estado ("Abierto ahora · Cierra a las 00:30", "Cerrado ahora · Abre hoy a las 20:00" o "Pedidos en
  pausa"), que abre los horarios, y las etiquetas de envío (abre las zonas) y retiro (abre el mapa). La barra del
  pedido aparece abajo con el primer producto y lleva al pedido. La vista previa al compartir
  el link (WhatsApp, Instagram) muestra el logo.
- Los cupones se validan en el servidor; la lista nunca llega al navegador.
- El mensaje no usa emojis: algunos llegan rotos en los links `wa.me`.
- Nominatim es gratis pero limitado (1 consulta por segundo). Para producción conviene Google Places,
  Mapbox o Geoapify; solo cambia `src/app/api/geocode/route.ts`.
- El pedido sale primero por WhatsApp y después se registra para el panel, con los precios recalculados en el
  servidor. Si el total no coincide con el que vio el cliente, el panel lo avisa.
- La sesión del panel es una cookie firmada (HMAC) que dura 14 días. Después de 5 intentos fallidos, ese
  email queda bloqueado 10 minutos.

## Datos de la beta

Todo lo que cambia mientras la app corre se guarda en `data/` (está en `.gitignore`):

- `data/stores/<slug>.json`: la tienda editada desde el panel. Si no existe, se usa la de `src/data/stores/`.
  Para volver a los datos de ejemplo, borrá ese archivo. Las zonas de envío guardadas con el formato anterior (por km)
  se leen como zonas con nombre ("Hasta 3 km") y se pueden renombrar desde Ajustes.
- `data/orders/<slug>.json`: los pedidos (hasta 3000 por tienda).
- `data/uploads/<slug>/`: las fotos subidas, achicadas en el navegador antes de subirse.

Funciona en tu PC o en un servidor con disco propio (hacé copias de `data/`). En plataformas sin disco
persistente, como Vercel, los cambios se pierden: ahí corresponde pasar a Supabase.

## Variables de entorno

Copiá `.env.example` a `.env.local`:

- `NEXT_PUBLIC_SITE_URL`: URL pública, para las vistas previas al compartir el link.
- `GEOCODER_USER_AGENT`: identificación para Nominatim (nombre de la app y un contacto).
- `ADMIN_SESSION_SECRET`: firma la sesión del panel. **Obligatoria en producción** (`npm start`); en desarrollo
  se usa una de prueba. En producción la cookie es `Secure`: el panel necesita HTTPS (o `localhost`).
- `VIASAP_DATA_DIR` (opcional): carpeta de datos, si no querés usar `data/` dentro del proyecto.

## Próximo paso: Supabase

Los tipos de `src/lib/types.ts` ya siguen la forma de las tablas: `businesses`, `delivery_zones`,
`categories`, `subcategories`, `products`, `product_variants`, `option_groups`, `options`, `coupons`,
`orders` y `order_items`. Con RLS por `business_id`, Auth para el panel de cada local y Storage para las fotos.
La migración consiste en reemplazar `src/lib/data.ts` y los módulos de `src/lib/server/` (tiendas, pedidos,
sesión y fotos), y guardar el pedido en `orders` antes de abrir WhatsApp (así el mensaje puede incluir un link
al pedido).
