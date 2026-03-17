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
});

export const env = envSchema.parse(process.env);
