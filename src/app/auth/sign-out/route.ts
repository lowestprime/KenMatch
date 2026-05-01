import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

import { deleteSessionByToken } from "@/lib/db";
import { ACTIVE_SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ACTIVE_SESSION_COOKIE)?.value;
  if (token) {
    await deleteSessionByToken(token);
  }

  const destination = new URL("/", request.nextUrl.origin);
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
