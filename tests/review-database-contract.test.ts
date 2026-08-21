import assert from "node:assert/strict";
import test from "node:test";

import { createClient } from "@libsql/client";

import { isSameFinalDecision } from "../src/lib/review-policy.ts";
import {
  INSERT_APPROVED_CATEGORY_SQL,
  INSERT_REVIEW_EVENT_SQL,
  REVIEW_SCHEMA_STATEMENTS,
} from "../src/lib/review-schema.ts";

test("review event dedupe key makes repeated decision writes idempotent", async () => {
  const client = createClient({ url: "file::memory:" });
  await client.batch([...REVIEW_SCHEMA_STATEMENTS], "write");
  const args = [
    "event-a",
    "ken-submission:submission-a:approved:admin-a",
    "ken-submission",
    "submission-a",
    "approved",
    "pending",
    "approved",
    "admin-a",
    "Meets the published review requirements.",
    null,
    null,
    1,
    "2026-07-27T12:00:00.000Z",
  ];
  await client.execute({ sql: INSERT_REVIEW_EVENT_SQL, args });
  await client.execute({ sql: INSERT_REVIEW_EVENT_SQL, args: ["event-b", ...args.slice(1)] });
  const result = await client.execute("SELECT COUNT(*) AS count FROM review_events");
  assert.equal(Number(result.rows[0]?.count), 1);
  client.close();
});

test("category uniqueness and final-decision guard prevent duplicate approval", async () => {
  const client = createClient({ url: "file::memory:" });
  await client.execute(`CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    thesis TEXT NOT NULL,
    symbolKey TEXT NOT NULL DEFAULT ''
  )`);
  const args = [
    "public-health",
    "public-health",
    "Public Health",
    "A bounded category.",
    "Auditable public benefit.",
    "public-health",
  ];
  await client.execute({ sql: INSERT_APPROVED_CATEGORY_SQL, args });
  await assert.rejects(
    client.execute({ sql: INSERT_APPROVED_CATEGORY_SQL, args }),
    /UNIQUE constraint failed/,
  );
  const result = await client.execute("SELECT COUNT(*) AS count FROM categories WHERE slug = 'public-health'");
  assert.equal(Number(result.rows[0]?.count), 1);
  assert.equal(isSameFinalDecision("approved", "approve"), true);
  assert.equal(isSameFinalDecision("approved", "reject"), false);
  client.close();
});
