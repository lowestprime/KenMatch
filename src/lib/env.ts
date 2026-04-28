import { z } from "zod";

const booleanish = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") {
      return true;
    }
    if (normalized === "false" || normalized === "0") {
      return false;
    }
  }

  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().optional(),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  KENMATCH_DB_FILE: z.string().default("data/kenmatch.sqlite"),
  KENMATCH_SESSION_COOKIE: z.string().default("kenmatch-session"),
  KENMATCH_SESSION_DAYS: z.coerce.number().int().min(1).default(14),
  KENMATCH_ALLOW_SIGNUPS: booleanish.default(true),
  KENMATCH_REQUIRE_EMAIL_VERIFICATION: booleanish.default(false),
  KENMATCH_ENABLE_DEMO_PROFILE_SWITCHER: booleanish.default(false),
  KENMATCH_ENABLE_TEST_AUTH_BYPASS: booleanish.default(false),
  KENMATCH_TEST_AUTH_BYPASS_TOKEN: z.string().optional(),
  KENMATCH_PUBLIC_ORIGIN: z.string().url().optional(),
  KENMATCH_CANONICAL_ORIGIN: z.string().url().default("https://kmat.ch"),
  KENMATCH_ALLOWED_HOSTS: z.string().optional(),
  KENMATCH_HEALTH_TOKEN: z.string().optional(),
  KENMATCH_TURNSTILE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  KENMATCH_TREASURY_TARGET_MONTHS: z.coerce.number().min(1).max(24).default(6),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  KENMATCH_OWNER_EMAIL: z.string().email().optional(),
  KENMATCH_ADMIN_EMAILS: z.string().optional(),
  KENMATCH_NOTIFICATION_EMAILS: z.string().default(""),
  KENMATCH_SMTP_HOST: z.string().optional(),
  KENMATCH_SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  KENMATCH_SMTP_USER: z.string().optional(),
  KENMATCH_SMTP_PASS: z.string().optional(),
  KENMATCH_SMTP_SECURE: booleanish.default(true),
  KENMATCH_SMTP_FROM: z.string().default("KenMatch <no-reply@kmat.ch>"),
  KENMATCH_CONFIG_ENCRYPTION_KEY: z.string().optional(),
  KENMATCH_VISITOR_HASH_SALT: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export const allowedHosts = (env.KENMATCH_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export const adminEmails = (env.KENMATCH_ADMIN_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

function requireProductionValue(name: string, value: string | undefined) {
  const normalized = value?.trim() ?? "";
  if (env.NODE_ENV === "production" && !normalized) {
    throw new Error(`${name} must be set in production.`);
  }
  return normalized;
}

export const notificationEmails = (env.KENMATCH_NOTIFICATION_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export const ownerEmail = requireProductionValue("KENMATCH_OWNER_EMAIL", env.KENMATCH_OWNER_EMAIL).toLowerCase();

export const visitorHashSalt =
  requireProductionValue("KENMATCH_VISITOR_HASH_SALT", env.KENMATCH_VISITOR_HASH_SALT) || "dev-only-visitor-salt";

export const canonicalOrigin = env.KENMATCH_CANONICAL_ORIGIN.replace(/\/$/, "");

export const smtpConfigured = Boolean(
  env.KENMATCH_SMTP_HOST && env.KENMATCH_SMTP_PORT && env.KENMATCH_SMTP_USER && env.KENMATCH_SMTP_PASS,
);

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email || !ownerEmail) return false;
  return email.toLowerCase() === ownerEmail;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase();
  if (normalized === ownerEmail) return true;
  return adminEmails.includes(normalized);
}
