import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { StoreSeed } from "@/lib/types";
import { loadStore } from "./stores";

// Sesión del panel: una cookie httpOnly con el slug del local y el vencimiento,
// firmada con HMAC. No guarda nada sensible; la firma evita que se falsifique.

const COOKIE = "viasap_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Falta ADMIN_SESSION_SECRET: configurala para usar el panel en producción.");
  }
  return "viasap-solo-para-desarrollo";
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function encodeSession(slug: string, expiresAt: number): string {
  const payload = Buffer.from(JSON.stringify({ slug, exp: expiresAt })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined, now = Date.now()): { slug: string } | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.slug !== "string" || typeof data.exp !== "number" || data.exp < now) return null;
    return { slug: data.slug };
  } catch {
    return null;
  }
}

export async function createSession(slug: string) {
  const store = await cookies();
  store.set(COOKIE, encodeSession(slug, Date.now() + MAX_AGE_SECONDS * 1000), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** El local de la sesión actual, o null. Se memoriza durante el render. */
export const getAdminStore = cache(async (): Promise<StoreSeed | null> => {
  const session = decodeSession((await cookies()).get(COOKIE)?.value);
  return session ? loadStore(session.slug) : null;
});

/** Para páginas del panel: sin sesión, al login. */
export async function requireAdminStore(): Promise<StoreSeed> {
  const store = await getAdminStore();
  if (!store) redirect("/admin/ingresar");
  return store;
}
