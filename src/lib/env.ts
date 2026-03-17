import { z } from "zod";

const booleanish = z
  .string()
  .optional()
  .transform((value) => value === "true" || value === "1");

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
