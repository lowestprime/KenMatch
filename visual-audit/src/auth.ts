import fs from "node:fs";
import path from "node:path";

import type {
  Browser,
  BrowserContext,
} from "playwright";

import type { AuditConfig } from "./config.js";
import type { AuthState, RequestSecuritySummary } from "./types.js";
import { ensureDirectory, restrictPermissions } from "./util.js";

export type StorageState = Awaited<ReturnType<BrowserContext["storageState"]>>;
export type StoredAuthStates = Record<AuthState, StorageState>;

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isLiveLoginMutation(method: string, requestUrl: string, baseUrl: string) {
  if (!unsafeMethods.has(method.toUpperCase())) return false;
  try {
    return new URL(requestUrl).origin === new URL(baseUrl).origin;
  } catch {
    return false;
  }
}

async function snapshotLabLogin(
  browser: Browser,
  config: AuditConfig,
  mode: Exclude<AuthState, "anonymous">,
) {
  const context = await browser.newContext();
  try {
    const response = await context.request.post(`${config.baseUrl}/api/test-auth/bypass`, {
      form: {
        token: config.testAuthToken ?? "",
        mode,
        responseMode: "storage-state",
      },
      maxRedirects: 0,
    });
    if (response.status() !== 204) {
      throw new Error(`Snapshot-lab ${mode} storage-state login failed with HTTP ${response.status()}.`);
    }
    return await context.storageState();
  } finally {
    await context.close();
  }
}

async function liveLogin(browser: Browser, config: AuditConfig) {
  const context = await browser.newContext();
  let unsafeRequests = 0;
  const page = await context.newPage();
  page.on("request", (request) => {
    if (isLiveLoginMutation(request.method(), request.url(), config.baseUrl)) {
      unsafeRequests += 1;
    }
  });
  try {
    await page.goto(`${config.baseUrl}/auth`, { waitUntil: "domcontentloaded" });
    await page.locator('input[name="identifier"]').fill(config.adminEmail ?? "");
    await page.locator('input[name="password"]').fill(config.adminPassword ?? "");
    const turnstileToken = page.locator('input[name="turnstileToken"]');
    if (await turnstileToken.count()) {
      await page.waitForFunction(() => {
        const input = document.querySelector<HTMLInputElement>('input[name="turnstileToken"]');
        return Boolean(input?.value.trim());
      }, undefined, { timeout: 30_000 });
    }
    await Promise.all([
      page.waitForURL((url) => url.pathname !== "/auth", { timeout: 30_000 }),
      page.getByRole("button", { name: "Sign in", exact: true }).click(),
    ]);
    if (unsafeRequests !== 1) {
      throw new Error(`Live login emitted ${unsafeRequests} unsafe requests; exactly one is required.`);
    }
    return await context.storageState();
  } finally {
    await context.close();
  }
}

export async function establishAuthStates(
  browser: Browser,
  config: AuditConfig,
  security: RequestSecuritySummary,
): Promise<StoredAuthStates> {
  const anonymous = { cookies: [], origins: [] };
  let user: StorageState;
  let moderator: StorageState;
  let admin: StorageState;
  let owner: StorageState;

  if (config.targetMode === "snapshot-lab") {
    [user, moderator, admin, owner] = await Promise.all([
      snapshotLabLogin(browser, config, "user"),
      snapshotLabLogin(browser, config, "moderator"),
      snapshotLabLogin(browser, config, "admin"),
      snapshotLabLogin(browser, config, "owner"),
    ]);
    security.loginMutations += 4;
  } else {
    owner = await liveLogin(browser, config);
    user = owner;
    moderator = owner;
    admin = owner;
    security.loginMutations += 1;
  }

  ensureDirectory(path.join(config.tmpRoot, "auth"));
  const stateFile = path.join(config.tmpRoot, "auth", "owner-state.json");
  fs.writeFileSync(stateFile, `${JSON.stringify(owner)}\n`, { encoding: "utf8", mode: 0o600 });
  restrictPermissions(stateFile, 0o600);
  return { anonymous, user, moderator, admin, owner };
}

export async function proveServerMutationGuard(
  browser: Browser,
  config: AuditConfig,
  storageState: StorageState,
  security: RequestSecuritySummary,
) {
  const context = await browser.newContext({ storageState });
  try {
    const response = await context.request.post(`${config.baseUrl}/api/visual-audit/inventory`, {
      headers: {
        "x-kenmatch-audit-readonly": "1",
        "x-kenmatch-audit-token": config.auditToken,
      },
      data: { proof: "server-side-readonly-guard" },
      failOnStatusCode: false,
    });
    if (response.status() !== 409 || response.headers()["x-kenmatch-audit-blocked"] !== "1") {
      throw new Error(`Server mutation guard proof returned HTTP ${response.status()} without the audit block header.`);
    }
    security.blockedUnsafeRequests += 1;
  } finally {
    await context.close();
  }
}
