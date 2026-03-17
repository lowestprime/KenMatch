import { cookies } from "next/headers";

import { getViewerSessionByToken } from "@/lib/db";
import { env } from "@/lib/env";

export const ACTIVE_SESSION_COOKIE = env.KENMATCH_SESSION_COOKIE;

function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function getViewerSession() {
  const store = await cookies();
  const token = store.get(ACTIVE_SESSION_COOKIE)?.value;
  return token ? getViewerSessionByToken(token) : null;
}

export async function getViewerProfileId() {
  const session = await getViewerSession();
  return session?.profile.id ?? null;
}

export async function setViewerSessionCookie(token: string) {
  const store = await cookies();
  store.set(ACTIVE_SESSION_COOKIE, token, cookieOptions(env.KENMATCH_SESSION_DAYS * 24 * 60 * 60));
}

export async function clearViewerSessionCookie() {
  const store = await cookies();
  store.set(ACTIVE_SESSION_COOKIE, "", cookieOptions(0));
}

export async function getViewerToken() {
  const store = await cookies();
  return store.get(ACTIVE_SESSION_COOKIE)?.value ?? null;
}
