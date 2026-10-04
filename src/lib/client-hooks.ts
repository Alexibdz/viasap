import { useCallback, useSyncExternalStore } from "react";

const subscribeNothing = () => () => {};

/** false en el servidor y durante la hidratación; true una vez en el navegador. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}

const CLOCK_STEP_MS = 30_000;

function subscribeClock(onTick: () => void) {
  const interval = window.setInterval(onTick, CLOCK_STEP_MS);
  const onVisible = () => {
    if (document.visibilityState === "visible") onTick();
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.clearInterval(interval);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

const readClock = () => Math.floor(Date.now() / CLOCK_STEP_MS) * CLOCK_STEP_MS;

/** Hora actual (ms) redondeada a 30 s. null en el servidor, donde la hora no sirve. */
export function useNow(): number | null {
  return useSyncExternalStore(subscribeClock, readClock, () => null);
}

const flagListeners = new Set<() => void>();

function subscribeFlags(listener: () => void) {
  flagListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    flagListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readFlag(key: string, fallback: boolean): boolean {
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? fallback : stored === "1";
  } catch {
    return fallback;
  }
}

/** Preferencia booleana guardada en el navegador (por ejemplo, "sonido de pedidos"). */
export function usePersistentFlag(key: string, fallback: boolean): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(
    subscribeFlags,
    () => readFlag(key, fallback),
    () => fallback,
  );
  const setValue = useCallback(
    (next: boolean) => {
      try {
        window.localStorage.setItem(key, next ? "1" : "0");
      } catch {
        // Sin persistencia: vale para esta visita.
      }
      flagListeners.forEach((listener) => listener());
    },
    [key],
  );
  return [value, setValue];
}
