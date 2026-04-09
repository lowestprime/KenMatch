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
  KENMATCH_ENABLE_DEMO_PROFILE_SWITCHER: booleanish.default(false),
  KENMATCH_PUBLIC_ORIGIN: z.string().url().optional(),
  KENMATCH_ALLOWED_HOSTS: z.string().optional(),
  KENMATCH_HEALTH_TOKEN: z.string().optional(),
  KENMATCH_TURNSTILE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  KENMATCH_TREASURY_TARGET_MONTHS: z.coerce.number().min(1).max(24).default(6),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export const allowedHosts = (env.KENMATCH_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
