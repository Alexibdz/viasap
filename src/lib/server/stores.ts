import "server-only";

import { stores as seeds } from "@/data/stores";
import type { StoreSeed } from "@/lib/types";
import { SAFE_NAME } from "@/lib/validation";
import { dataPath, listJsonNames, readJson, withFileLock, writeJson } from "./storage";

// Cada tienda vive en data/stores/<slug>.json. Si todavía no se editó desde el
// panel, se usan los datos iniciales de src/data/stores.

const storeFile = (slug: string) => dataPath("stores", `${slug}.json`);

export async function listStoreSlugs(): Promise<string[]> {
  const saved = await listJsonNames(dataPath("stores"));
  return [...new Set([...seeds.map((store) => store.business.slug), ...saved.filter((s) => SAFE_NAME.test(s))])];
}

export async function loadStore(slug: string): Promise<StoreSeed | null> {
  // El slug termina siendo un nombre de archivo: solo se aceptan letras, números y guiones.
  if (!SAFE_NAME.test(slug)) return null;
  const saved = await readJson<StoreSeed>(storeFile(slug));
  if (saved) return saved;
  const seed = seeds.find((store) => store.business.slug === slug);
  return seed ? structuredClone(seed) : null;
}

/**
 * Aplica un cambio a la tienda y lo guarda. `change` modifica el objeto recibido;
 * si devuelve false (por ejemplo, datos inválidos), no se guarda nada.
 */
export async function updateStore(slug: string, change: (store: StoreSeed) => boolean): Promise<StoreSeed> {
  return withFileLock(storeFile(slug), async () => {
    const store = await loadStore(slug);
    if (!store) throw new Error(`La tienda "${slug}" no existe.`);
    if (change(store)) await writeJson(storeFile(slug), store);
    return store;
  });
}

export async function findStoreByAdminEmail(email: string): Promise<StoreSeed | null> {
  const wanted = email.trim().toLowerCase();
  for (const slug of await listStoreSlugs()) {
    const store = await loadStore(slug);
    if (store?.admin.email.toLowerCase() === wanted) return store;
  }
  return null;
}
