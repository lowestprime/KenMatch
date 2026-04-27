import { timingSafeEqual } from "node:crypto";

export const TEST_AUTH_USERS = {
  user: {
    email: "test-user@kenmatch.local",
    username: "test-user",
    name: "Local Test Contributor",
    systemRole: "contributor",
  },
  admin: {
    email: "test-admin@kenmatch.local",
    username: "test-admin",
    name: "Local Test Owner",
    systemRole: "owner",
  },
} as const;

export type TestAuthMode = keyof typeof TEST_AUTH_USERS;

function booleanish(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized === "true" || normalized === "1";
}

export function normalizeRequestHost(value: string | null | undefined) {
  const host = (value ?? "").trim().toLowerCase();
  if (!host) return "";
  if (host.startsWith("[::1]")) return "::1";
  const withoutPort = host.replace(/:\d+$/, "");
  return withoutPort === "0:0:0:0:0:0:0:1" ? "::1" : withoutPort;
}

export function isLoopbackHost(value: string | null | undefined) {
  const host = normalizeRequestHost(value);
  return host === "localhost" || host === "::1" || host === "127.0.0.1" || host.startsWith("127.");
}

export function isTestAuthBypassAvailable(
  host: string | null | undefined,
  environment: Partial<
    Pick<NodeJS.ProcessEnv, "NODE_ENV" | "KENMATCH_ENABLE_TEST_AUTH_BYPASS" | "KENMATCH_TEST_AUTH_BYPASS_TOKEN">
  > = process.env,
) {
  return (
    environment.NODE_ENV !== "production" &&
    booleanish(environment.KENMATCH_ENABLE_TEST_AUTH_BYPASS) &&
    Boolean(environment.KENMATCH_TEST_AUTH_BYPASS_TOKEN?.trim()) &&
    isLoopbackHost(host)
  );
}

export function isValidTestAuthMode(value: FormDataEntryValue | null): value is TestAuthMode {
  return value === "user" || value === "admin";
}

export function isValidTestAuthBypassToken(
  presentedToken: FormDataEntryValue | null,
  configuredToken = process.env.KENMATCH_TEST_AUTH_BYPASS_TOKEN,
) {
  if (typeof presentedToken !== "string") return false;
  const expected = configuredToken?.trim();
  const actual = presentedToken.trim();
  if (!expected || !actual || expected.length !== actual.length) return false;

  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}
