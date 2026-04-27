import { NextResponse, type NextRequest } from "next/server";

import { createSession, ensureTestAuthAccount, recordAudit, updateAccountLastLogin } from "@/lib/db";
import {
  isTestAuthBypassAvailable,
  isValidTestAuthBypassToken,
  isValidTestAuthMode,
  TEST_AUTH_USERS,
} from "@/lib/test-auth";
import { ACTIVE_SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

function requestHost(request: NextRequest) {
  return request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
}

function unavailable() {
  return new NextResponse("Not found.", {
    status: 404,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function enabled(request: NextRequest) {
  return isTestAuthBypassAvailable(requestHost(request));
}

export async function GET(request: NextRequest) {
  if (!enabled(request)) return unavailable();

  return new NextResponse(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex,nofollow" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>KenMatch local test auth</title>
    <style>
      :root { color-scheme: dark; font-family: Arial, sans-serif; background:#000; color:#f7f8ff; }
      body { min-height:100vh; margin:0; display:grid; place-items:center; padding:24px; }
      main { width:min(440px,100%); border:1px solid #2d3444; border-radius:18px; padding:24px; background:#050507; }
      label, input, button { display:block; width:100%; box-sizing:border-box; font:inherit; }
      input { margin:10px 0 16px; border:1px solid #2d3444; border-radius:12px; background:#000; color:#fff; padding:12px; }
      button { border:1px solid #6e7dff; border-radius:12px; background:#92f1ff; color:#050507; font-weight:700; padding:12px; margin-top:10px; cursor:pointer; }
      p { color:#aeb6c8; line-height:1.5; }
    </style>
  </head>
  <body>
    <main>
      <h1>Local test auth</h1>
      <p>This route only exists on loopback development hosts when the local test-auth bypass is explicitly enabled.</p>
      <form method="post">
        <label for="token">Bypass token</label>
        <input id="token" name="token" type="password" autocomplete="off" required />
        <button name="mode" value="user" type="submit">Sign in as test contributor</button>
        <button name="mode" value="admin" type="submit">Sign in as test owner</button>
      </form>
    </main>
  </body>
</html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}

export async function POST(request: NextRequest) {
  if (!enabled(request)) return unavailable();

  const formData = await request.formData();
  const token = formData.get("token");
  const mode = formData.get("mode");
  if (!isValidTestAuthBypassToken(token) || !isValidTestAuthMode(mode)) {
    return unavailable();
  }

  const accountId = await ensureTestAuthAccount(mode);
  const session = await createSession(accountId);
  await updateAccountLastLogin(accountId);
  await recordAudit({
    accountId,
    action: "auth.test-bypass",
    detail: `Local-only test auth bypass for ${TEST_AUTH_USERS[mode].email}.`,
  });

  const destination = new URL(mode === "admin" ? "/admin" : "/account", request.nextUrl.origin);
  const response = NextResponse.redirect(destination, 303);
  response.cookies.set(ACTIVE_SESSION_COOKIE, session.token, sessionCookieOptions(env.KENMATCH_SESSION_DAYS * 24 * 60 * 60));
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
