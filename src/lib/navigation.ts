"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

// Recordamos la página anterior dentro del sitio para que "volver" use el
// historial cuando corresponde (sin recargar ni duplicar entradas) y nunca saque
// al cliente del sitio si entró directo desde un link compartido.
const visited = { previous: null as string | null, current: null as string | null };

export function NavigationTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (visited.current !== pathname) {
      visited.previous = visited.current;
      visited.current = pathname;
    }
  }, [pathname]);
  return null;
}

export function useStoreNavigation() {
  const router = useRouter();
  return useMemo(
    () => ({
      /** Si venimos de `href`, vuelve con el historial y devuelve true. */
      backIfFrom(href: string): boolean {
        if (visited.previous !== href) return false;
        router.back();
        return true;
      },
      /** Vuelve a la página anterior del sitio; si se entró directo, reemplaza por `fallback`. */
      leaveTo(fallback: string) {
        if (visited.previous) router.back();
        else router.replace(fallback);
      },
    }),
    [router],
  );
}
