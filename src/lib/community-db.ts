import "server-only";

import { existsSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";

import { createClient, type Client, type Value } from "@libsql/client";

import { ensureDatabaseReady } from "@/lib/db";
import { env } from "@/lib/env";

const databaseFilePath = isAbsolute(env.KENMATCH_DB_FILE)
  ? env.KENMATCH_DB_FILE
  : join(process.cwd(), env.KENMATCH_DB_FILE);
const databaseUrl = env.DATABASE_URL?.trim() || `file:${databaseFilePath.replace(/\\/g, "/")}`;

declare global {
  var __kenmatchCommunityDbClient: Client | undefined;
  var __kenmatchCommunityDbReady: Promise<void> | undefined;
}

export type CommunityDbRow = Record<string, Value>;

function ensureDatabaseDirectory() {
  if (!databaseUrl.startsWith("file:")) return;
  const directory = dirname(databaseFilePath);
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true });
}

export function getCommunityClient() {
  if (!globalThis.__kenmatchCommunityDbClient) {
    ensureDatabaseDirectory();
    globalThis.__kenmatchCommunityDbClient = createClient({
      url: databaseUrl,
      authToken: env.DATABASE_AUTH_TOKEN || undefined,
    });
  }
  return globalThis.__kenmatchCommunityDbClient;
}

async function initializeCommunityTables() {
  await ensureDatabaseReady();
  await getCommunityClient().batch([
    "PRAGMA foreign_keys = ON",
    `CREATE TABLE IF NOT EXISTS category_visual_overrides (
      categoryId TEXT PRIMARY KEY,
      symbolKey TEXT NOT NULL DEFAULT '',
      motif TEXT NOT NULL DEFAULT 'prism',
      primaryColor TEXT NOT NULL DEFAULT '#6d28d9',
      secondaryColor TEXT NOT NULL DEFAULT '#1d4ed8',
      tertiaryColor TEXT NOT NULL DEFAULT '#b08d1a',
      backgroundColor TEXT NOT NULL DEFAULT '#03020a',
      customSvg TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      updatedAt TEXT NOT NULL,
      updatedBy TEXT,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
    )`,
    "CREATE INDEX IF NOT EXISTS idx_category_visual_overrides_updatedAt ON category_visual_overrides(updatedAt)",
  ], "write");
}

export async function ensureCommunityDatabase() {
  if (!globalThis.__kenmatchCommunityDbReady) {
    globalThis.__kenmatchCommunityDbReady = initializeCommunityTables();
  }
  await globalThis.__kenmatchCommunityDbReady;
}

export async function communityExecute(sql: string, args: Value[] = []) {
  await ensureCommunityDatabase();
  return getCommunityClient().execute({ sql, args });
}

export async function communityRows(sql: string, args: Value[] = []) {
  const result = await communityExecute(sql, args);
  return result.rows as CommunityDbRow[];
}

export async function communityOne(sql: string, args: Value[] = []) {
  const rows = await communityRows(sql, args);
  return rows[0] ?? null;
}

export function rowString(row: CommunityDbRow, key: string) {
  const value = row[key];
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  return "";
}

export function rowNullableString(row: CommunityDbRow, key: string) {
  const value = row[key];
  return value === null || value === undefined ? null : rowString(row, key);
}

export function rowNumber(row: CommunityDbRow, key: string) {
  const value = row[key];
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && value.trim()) return Number(value);
  return 0;
}
