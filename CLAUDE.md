@AGENTS.md

# viasap: notas del proyecto

- Textos de la interfaz en español rioplatense (voseo). Código en inglés, comentarios en español.
- Diseño propio: Pedix es referencia de funcionalidad, no de estética. Respetar el sistema visual de
  `src/app/globals.css` (papel cálido, tarjetas, color de marca por tienda vía `src/lib/theme.ts`).
- Los datos se leen solo desde `src/lib/data.ts` (server-only). Beta sin base de datos: menús en `src/data/stores/`.
- Reglas de negocio puras en `src/lib/*` con tests (mensaje de WhatsApp, horarios, precios, checkout).
- Panel del local en `/admin`: estilos en `src/app/admin/admin.css` (clases `adm-*`, mismos tokens que la tienda).
  Lo que se edita y los pedidos se guardan en `data/` (`src/lib/server/`). Las páginas de las tiendas son
  estáticas: después de guardar, `revalidatePath("/[slug]", "layout")` (el patrón; la URL literal no invalida).
- ESLint de Next 16 incluye las reglas del React Compiler: nada de `setState` directo en efectos ni `Date.now()`
  en el render. Usar `useNow`, `useIsClient` y stores externos con `useSyncExternalStore` (ver `src/lib/cart.ts`).
- Antes de dar un cambio por terminado: `npm test`, `npm run lint` y `npm run build`.
