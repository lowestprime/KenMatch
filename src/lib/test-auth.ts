import { timingSafeEqual } from "node:crypto";

export const TEST_AUTH_USERS = {
  user: {
    email: "test-user@kenmatch.local",
    username: "test-user",
    name: "Local Test Contributor",
    systemRole: "contributor",
  },
  moderator: {
    email: "test-moderator@kenmatch.local",
    username: "test-moderator",
    name: "Local Test Moderator",
    systemRole: "moderator",
  },
  admin: {
    email: "test-admin@kenmatch.local",
    username: "test-admin",
    name: "Local Test Administrator",
    systemRole: "admin",
  },
  owner: {
    email: "test-owner@kenmatch.local",
    username: "test-owner",
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

function isIsolatedAuditLabHost(value: string | null | undefined) {
  return normalizeRequestHost(value) === "kenmatch-audit-app";
}

type AuditLabEnvironment = Partial<
  Pick<
    NodeJS.ProcessEnv,
    | "NODE_ENV"
    | "KENMATCH_AUDIT_LAB_MODE"
    | "KENMATCH_AUDIT_TIER"
    | "KENMATCH_AUDIT_DATA_PROVENANCE"
    | "KENMATCH_AUDIT_TOKEN"
    | "KENMATCH_PUBLIC_ORIGIN"
  >
>;

function isValidAuditLabIdentity(environment: AuditLabEnvironment) {
  const expectedProvenance = environment.KENMATCH_AUDIT_TIER === "tier-1-synthetic"
    ? "synthetic-fixture"
    : environment.KENMATCH_AUDIT_TIER === "tier-2-production-clone"
      ? "production-clone"
      : null;
  return (
    booleanish(environment.KENMATCH_AUDIT_LAB_MODE)
    && expectedProvenance !== null
    && environment.KENMATCH_AUDIT_DATA_PROVENANCE === expectedProvenance
    && /^[a-f0-9]{64}$/i.test(environment.KENMATCH_AUDIT_TOKEN?.trim() ?? "")
  );
}

export function isIsolatedAuditLabTestAuthContext(
  host: string | null | undefined,
  environment: AuditLabEnvironment = process.env,
) {
  return isValidAuditLabIdentity(environment) && isIsolatedAuditLabHost(host);
}

export function isIsolatedAuditLabOrigin(
  origin: string | undefined,
  environment: AuditLabEnvironment = process.env,
) {
  if (!origin || !isValidAuditLabIdentity(environment)) return false;
  try {
    const parsed = new URL(origin);
    return (
      parsed.protocol === "http:"
      && parsed.hostname.toLowerCase() === "kenmatch-audit-app"
      && (parsed.port === "" || parsed.port === "3000")
      && parsed.username === ""
      && parsed.password === ""
    );
  } catch {
    return false;
  }
}

export function shouldUseSecureSessionCookie(
  environment: AuditLabEnvironment = process.env,
) {
  if (environment.NODE_ENV !== "production") return false;
  return !isIsolatedAuditLabOrigin(environment.KENMATCH_PUBLIC_ORIGIN, environment);
}

export function isTestAuthBypassAvailable(
  host: string | null | undefined,
  environment: Partial<
    Pick<
      NodeJS.ProcessEnv,
      | "NODE_ENV"
      | "KENMATCH_ENABLE_TEST_AUTH_BYPASS"
      | "KENMATCH_TEST_AUTH_BYPASS_TOKEN"
      | "KENMATCH_AUDIT_LAB_MODE"
      | "KENMATCH_AUDIT_TIER"
      | "KENMATCH_AUDIT_DATA_PROVENANCE"
      | "KENMATCH_AUDIT_TOKEN"
    >
  > = process.env,
) {
  const isolatedLab = isIsolatedAuditLabTestAuthContext(host, environment);
  const localDevelopment = environment.NODE_ENV !== "production" && isLoopbackHost(host);
  return (
    booleanish(environment.KENMATCH_ENABLE_TEST_AUTH_BYPASS) &&
    Boolean(environment.KENMATCH_TEST_AUTH_BYPASS_TOKEN?.trim()) &&
    (localDevelopment || isolatedLab)
  );
}

export function isValidTestAuthMode(value: FormDataEntryValue | null): value is TestAuthMode {
  return value === "user" || value === "moderator" || value === "admin" || value === "owner";
}

export function isTestAuthStorageStateResponse(value: FormDataEntryValue | null) {
  return value === "storage-state";
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
