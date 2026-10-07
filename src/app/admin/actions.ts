"use server";

import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  applyCategory,
  buildCoupon,
  buildDelivery,
  buildPayments,
  buildProduct,
  buildSchedule,
  buildStoreInfo,
  moveCategory as moveCategoryInMenu,
  moveProduct as moveProductInMenu,
  placeProduct,
  removeCategory,
  removeProduct,
  updateProductFlags,
  type FieldErrors,
} from "@/lib/admin-forms";
import { allProducts } from "@/lib/menu";
import { offersIncluding } from "@/lib/offers";
import { canTransition } from "@/lib/order-status";
import { updateOrder } from "@/lib/server/orders";
import { verifyPassword } from "@/lib/server/password";
import { createSession, destroySession, getAdminStore } from "@/lib/server/session";
import { dataPath } from "@/lib/server/storage";
import { findStoreByAdminEmail, updateStore } from "@/lib/server/stores";
import type { OrderStatus, StoredOrder, StoreSeed } from "@/lib/types";
import { cleanText } from "@/lib/validation";

// Acciones del panel. Cada una es un endpoint público: verifica la sesión y
// valida todo lo que recibe antes de tocar los datos.

export type ActionResult = { ok: true } | { ok: false; error?: string; errors?: FieldErrors };
export type OrderActionResult = { ok: true; order: StoredOrder } | { ok: false; error: string };

const SESSION_EXPIRED = { ok: false, error: "Tu sesión venció. Volvé a ingresar." } as const;
const SAVE_FAILED = { ok: false, error: "No pudimos guardar los cambios. Probá de nuevo." } as const;
const isDirection = (value: unknown): value is -1 | 1 => value === -1 || value === 1;

/** Refresca la tienda pública, la portada y el panel después de un cambio. */
function refresh() {
  // Las páginas de las tiendas son estáticas y Next las guarda por archivo de ruta
  // (app/[slug]/layout.tsx): con la URL literal ("/rotiseria-alexis") no encuentra nada.
  // El patrón invalida todas las tiendas, que se regeneran en la próxima visita.
  revalidatePath("/[slug]", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/");
}

/** Modifica la tienda de la sesión. Si `change` devuelve un error, no se guarda nada. */
async function editStore(change: (store: StoreSeed) => ActionResult): Promise<ActionResult> {
  const session = await getAdminStore();
  if (!session) return SESSION_EXPIRED;
  const outcome: { result: ActionResult } = { result: { ok: true } };
  try {
    await updateStore(session.business.slug, (store) => {
      outcome.result = change(store);
      return outcome.result.ok;
    });
  } catch {
    return SAVE_FAILED;
  }
  if (outcome.result.ok) refresh();
  return outcome.result;
}

/* --------------------------------------------------------------------- Sesión */

export type LoginState = { error?: string; email?: string };

const failedLogins = new Map<string, { count: number; until: number }>();
// Hash de una contraseña cualquiera: si el email no existe igual se verifica algo,
// así la respuesta tarda lo mismo y no delata qué emails están registrados.
const DECOY_HASH =
  "scrypt$qPfViTmrQ6dX37p72rEYpQ$Hq1WOyEzU79jfwvd3UPApRVnfmzUI51VN7iAyoV1pMYcEHFZcinGN1UmMhgDoyJzBvBOqb-SI7w0AVE9686l5g";

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = cleanText(formData.get("email"), 120).toLowerCase();
  const rawPassword = formData.get("password");
  const password = typeof rawPassword === "string" ? rawPassword.slice(0, 200) : "";
  if (!email || !password) return { error: "Completá tu email y tu contraseña.", email };

  const throttle = failedLogins.get(email);
  if (throttle && throttle.until > Date.now()) {
    return { error: "Demasiados intentos. Esperá unos minutos y probá de nuevo.", email };
  }

  const store = await findStoreByAdminEmail(email);
  const valid = await verifyPassword(password, store?.admin.passwordHash ?? DECOY_HASH);
  if (!store || !valid) {
    const count = (throttle?.count ?? 0) + 1;
    failedLogins.set(email, { count: count >= 5 ? 0 : count, until: count >= 5 ? Date.now() + 10 * 60_000 : 0 });
    return { error: "El email o la contraseña no coinciden.", email };
  }

  failedLogins.delete(email);
  await createSession(store.business.slug);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/ingresar");
}

/* -------------------------------------------------------------------- Pedidos */

const STATUSES: OrderStatus[] = ["pending", "preparing", "ready", "delivered", "cancelled"];

export async function changeOrderStatus(code: unknown, status: unknown, reason?: unknown): Promise<OrderActionResult> {
  const store = await getAdminStore();
  if (!store) return SESSION_EXPIRED;
  if (typeof code !== "string" || !STATUSES.includes(status as OrderStatus)) {
    return { ok: false, error: "Pedido inválido." };
  }
  const next = status as OrderStatus;
  const outcome = { allowed: true };
  const order = await updateOrder(store.business.slug, code, (current) => {
    if (!canTransition(current.status, next)) {
      outcome.allowed = false;
      return false;
    }
    current.status = next;
    current.history.push({ status: next, at: new Date().toISOString() });
    if (next === "cancelled") {
      current.cancelledBy = "store";
      const why = cleanText(reason, 80);
      if (why) current.cancelReason = why;
    }
    return true;
  });
  if (!order) return { ok: false, error: "No encontramos el pedido." };
  if (!outcome.allowed) return { ok: false, error: "El pedido cambió mientras tanto. Ya lo actualizamos." };
  return { ok: true, order };
}

export async function setOrdersPaused(paused: unknown): Promise<ActionResult> {
  if (typeof paused !== "boolean") return { ok: false, error: "Valor inválido." };
  return editStore((store) => {
    if (paused) store.business.ordersPaused = true;
    else delete store.business.ordersPaused;
    return { ok: true };
  });
}

/* ----------------------------------------------------------------------- Menú */

export async function saveProduct(draft: unknown): Promise<ActionResult & { productId?: string }> {
  let productId: string | undefined;
  const result = await editStore((store) => {
    const built = buildProduct(draft, store.menu);
    if (!built.ok) return { ok: false, errors: built.errors };
    placeProduct(store.menu, built.value);
    productId = built.value.product.id;
    return { ok: true };
  });
  return result.ok ? { ...result, productId } : result;
}

export async function deleteProduct(productId: unknown): Promise<ActionResult> {
  if (typeof productId !== "string") return { ok: false, error: "Producto inválido." };
  return editStore((store) => {
    const [offer] = offersIncluding(allProducts(store.menu), productId);
    if (offer) return { ok: false, error: `Está incluido en la oferta "${offer.name}": sacalo de ahí primero.` };
    return removeProduct(store.menu, productId) ? { ok: true } : { ok: false, error: "El producto ya no existe." };
  });
}

export async function setProductFlags(productId: unknown, flags: unknown): Promise<ActionResult> {
  if (typeof productId !== "string" || typeof flags !== "object" || flags === null) {
    return { ok: false, error: "Datos inválidos." };
  }
  const { soldOut, featured } = flags as Record<string, unknown>;
  return editStore((store) =>
    updateProductFlags(store.menu, productId, {
      soldOut: typeof soldOut === "boolean" ? soldOut : undefined,
      featured: typeof featured === "boolean" ? featured : undefined,
    })
      ? { ok: true }
      : { ok: false, error: "El producto ya no existe." },
  );
}

export async function moveProduct(productId: unknown, direction: unknown): Promise<ActionResult> {
  if (typeof productId !== "string" || !isDirection(direction)) return { ok: false, error: "Datos inválidos." };
  return editStore((store) =>
    moveProductInMenu(store.menu, productId, direction) ? { ok: true } : { ok: false, error: "No se puede mover más." },
  );
}

export async function saveCategory(draft: unknown): Promise<ActionResult> {
  return editStore((store) => {
    const result = applyCategory(store.menu, draft);
    return result.ok ? { ok: true } : { ok: false, errors: result.errors };
  });
}

export async function deleteCategory(categoryId: unknown): Promise<ActionResult> {
  if (typeof categoryId !== "string") return { ok: false, error: "Categoría inválida." };
  return editStore((store) => {
    const result = removeCategory(store.menu, categoryId);
    return result.ok ? { ok: true } : { ok: false, error: result.errors.id };
  });
}

export async function moveCategory(categoryId: unknown, direction: unknown): Promise<ActionResult> {
  if (typeof categoryId !== "string" || !isDirection(direction)) return { ok: false, error: "Datos inválidos." };
  return editStore((store) =>
    moveCategoryInMenu(store.menu, categoryId, direction) ? { ok: true } : { ok: false, error: "No se puede mover más." },
  );
}

/* -------------------------------------------------------------------- Ajustes */

export async function saveStoreInfo(input: unknown): Promise<ActionResult> {
  return editStore((store) => {
    const result = buildStoreInfo(input);
    if (!result.ok) return { ok: false, errors: result.errors };
    Object.assign(store.business, result.value);
    return { ok: true };
  });
}

export async function saveSchedule(input: unknown): Promise<ActionResult> {
  return editStore((store) => {
    const result = buildSchedule(input);
    if (!result.ok) return { ok: false, errors: result.errors };
    Object.assign(store.business, result.value);
    return { ok: true };
  });
}

export async function saveDeliverySettings(input: unknown): Promise<ActionResult> {
  return editStore((store) => {
    const result = buildDelivery(input);
    if (!result.ok) return { ok: false, errors: result.errors };
    store.business.delivery = result.value;
    return { ok: true };
  });
}

export async function savePaymentSettings(input: unknown): Promise<ActionResult> {
  return editStore((store) => {
    const result = buildPayments(input);
    if (!result.ok) return { ok: false, errors: result.errors };
    store.business.payments = result.value;
    return { ok: true };
  });
}

/* -------------------------------------------------------------------- Cupones */

export async function saveCoupon(input: unknown, originalCode: unknown): Promise<ActionResult> {
  const original = typeof originalCode === "string" ? originalCode : null;
  return editStore((store) => {
    const result = buildCoupon(input, store.coupons, original);
    if (!result.ok) return { ok: false, errors: result.errors };
    const index = original ? store.coupons.findIndex((c) => c.code === original) : -1;
    if (index >= 0) store.coupons[index] = result.value;
    else store.coupons.push(result.value);
    return { ok: true };
  });
}

export async function deleteCoupon(code: unknown): Promise<ActionResult> {
  if (typeof code !== "string") return { ok: false, error: "Cupón inválido." };
  return editStore((store) => {
    const before = store.coupons.length;
    store.coupons = store.coupons.filter((c) => c.code !== code);
    return store.coupons.length < before ? { ok: true } : { ok: false, error: "El cupón ya no existe." };
  });
}

export async function setCouponActive(code: unknown, active: unknown): Promise<ActionResult> {
  if (typeof code !== "string" || typeof active !== "boolean") return { ok: false, error: "Datos inválidos." };
  return editStore((store) => {
    const coupon = store.coupons.find((c) => c.code === code);
    if (!coupon) return { ok: false, error: "El cupón ya no existe." };
    coupon.active = active;
    return { ok: true };
  });
}

/* ---------------------------------------------------------------------- Fotos */

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/** Reconoce el formato por los primeros bytes, no por el nombre del archivo. */
function imageExtension(bytes: Uint8Array): "jpg" | "png" | "webp" | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return "png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

export async function uploadImage(formData: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const store = await getAdminStore();
  if (!store) return SESSION_EXPIRED;
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Elegí una foto." };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "La foto es muy pesada (máximo 3 MB)." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = imageExtension(bytes);
  if (!extension) return { ok: false, error: "Usá una foto JPG, PNG o WebP." };

  const slug = store.business.slug;
  const name = `${randomBytes(8).toString("hex")}.${extension}`;
  await mkdir(dataPath("uploads", slug), { recursive: true });
  await writeFile(dataPath("uploads", slug, name), bytes);
  return { ok: true, url: `/media/${slug}/${name}` };
}
