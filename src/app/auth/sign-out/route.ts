import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

import { deleteSessionByToken } from "@/lib/db";
import { env } from "@/lib/env";
import { trustedRouteOrigin } from "@/lib/request-origin";
import { ACTIVE_SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ACTIVE_SESSION_COOKIE)?.value;
  if (token) {
    await deleteSessionByToken(token);
  }

  const routeOrigin = trustedRouteOrigin({
    forwardedHost: request.headers.get("x-forwarded-host"),
    host: request.headers.get("host"),
    forwardedProto: request.headers.get("x-forwarded-proto"),
    fallbackProtocol: request.nextUrl.protocol,
    publicOrigin: env.KENMATCH_PUBLIC_ORIGIN,
    production: env.NODE_ENV === "production",
  });
  if (!routeOrigin) {
    return new NextResponse("Invalid request origin.", { status: 400 });
  }
  const destination = new URL("/", routeOrigin);
  const response = NextResponse.redirect(destination, 303);
  response.cookies.set(ACTIVE_SESSION_COOKIE, "", sessionCookieOptions(0));
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/auth");
  revalidatePath("/account");
  revalidatePath("/admin");
  revalidatePath("/kens");
  return response;
}
