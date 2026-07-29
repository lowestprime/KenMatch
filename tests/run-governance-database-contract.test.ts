import assert from "node:assert/strict";
import test from "node:test";

import { createClient } from "@libsql/client";

import {
  INSERT_RUN_DECISION_SQL,
  RUN_DECISION_SCHEMA_STATEMENTS,
} from "../src/lib/run-governance-schema.ts";

test("run decisions are inserted as append-only rows with relational ownership", async () => {
  const client = createClient({ url: "file::memory:" });
  await client.batch([
    "PRAGMA foreign_keys = ON",
    "CREATE TABLE tasks (id TEXT PRIMARY KEY)",
    "CREATE TABLE checkpoints (id TEXT PRIMARY KEY, taskId TEXT NOT NULL)",
    "CREATE TABLE accounts (id TEXT PRIMARY KEY)",
    ...RUN_DECISION_SCHEMA_STATEMENTS,
  ], "write");
  await client.execute("INSERT INTO tasks (id) VALUES ('ken-a')");
  await client.execute("INSERT INTO checkpoints (id, taskId) VALUES ('checkpoint-a', 'ken-a')");
  await client.execute("INSERT INTO accounts (id) VALUES ('admin-a')");

  const args = [
    "decision-a",
    "ken-a",
    "checkpoint-a",
    "checkpoint",
    "checkpoint-approved",
    "The published gate passed with the required evidence and reviewer approval.",
    "Evidence table",
    "/artifacts/evidence-table",
    `sha256:${"a".repeat(64)}`,
    "admin-a",
    "admin",
    "2026-07-29T12:00:00.000Z",
  ];
  await client.execute({ sql: INSERT_RUN_DECISION_SQL, args });
  await assert.rejects(
    client.execute({ sql: INSERT_RUN_DECISION_SQL, args }),
    /UNIQUE constraint failed/,
  );
  await assert.rejects(
    client.execute({
      sql: INSERT_RUN_DECISION_SQL,
      args: ["decision-b", "missing-task", null, "stop", "scope-invalidation", "A sufficiently long public reason for stopping.", null, null, null, "admin-a", "admin", "2026-07-29T12:01:00.000Z"],
    }),
    /FOREIGN KEY constraint failed/,
  );

  const result = await client.execute("SELECT decisionCode, publicReason FROM run_decision_events");
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0]?.decisionCode, "checkpoint-approved");
  client.close();
});
