import assert from "node:assert/strict";
import test from "node:test";

import { assertResumeCompatible } from "./run.js";
import type { AuditConfig } from "./config.js";
import type { CoveragePlan, RunManifest } from "./types.js";

const config = {
  runId: "run-one",
  targetMode: "snapshot-lab",
  scope: "smoke",
  evidenceTier: "tier-1-synthetic",
  dataProvenance: "synthetic-fixture",
  baseUrl: "http://127.0.0.1:3100",
  expectedCommit: "abcdef1",
  viewportMatrixDigest: "viewport-matrix",
  acceleratorRecord: "chromium-headless-software",
} as AuditConfig;
const manifest = {
  schemaVersion: 2,
  runId: config.runId,
  mode: config.targetMode,
  scope: config.scope,
  evidenceTier: config.evidenceTier,
  dataProvenance: config.dataProvenance,
  baseUrl: config.baseUrl,
  expectedCommit: config.expectedCommit,
  viewportMatrixDigest: config.viewportMatrixDigest,
  acceleratorRecord: config.acceleratorRecord,
  inventoryDigest: "inventory",
  browserVersion: "1.2.3",
} as RunManifest;
const plan = {
  schemaVersion: 2,
  dataProvenance: config.dataProvenance,
  expectedCommit: config.expectedCommit,
  viewportMatrixDigest: config.viewportMatrixDigest,
  acceleratorRecord: config.acceleratorRecord,
  inventoryDigest: "inventory",
} as CoveragePlan;

test("resume accepts identical immutable provenance", () => {
  assert.doesNotThrow(() => assertResumeCompatible({
    config,
    manifest,
    plan,
    inventoryDigest: "inventory",
    browserVersion: "1.2.3",
  }));
});

test("resume rejects build or inventory drift", () => {
  assert.throws(() => assertResumeCompatible({
    config,
    manifest,
    plan,
    inventoryDigest: "changed",
    browserVersion: "1.2.3",
  }), /immutable run identity changed/);
});

test("resume rejects viewport, provenance, or accelerator drift", () => {
  assert.throws(() => assertResumeCompatible({
    config: { ...config, acceleratorRecord: "gpu-different" },
    manifest,
    plan,
    inventoryDigest: "inventory",
    browserVersion: "1.2.3",
  }), /accelerator record/);
  assert.throws(() => assertResumeCompatible({
    config: { ...config, viewportMatrixDigest: "changed-viewports" },
    manifest,
    plan,
    inventoryDigest: "inventory",
    browserVersion: "1.2.3",
  }), /viewport matrix/);
  assert.throws(() => assertResumeCompatible({
    config: {
      ...config,
      evidenceTier: "tier-2-production-clone",
      dataProvenance: "production-clone",
    },
    manifest,
    plan,
    inventoryDigest: "inventory",
    browserVersion: "1.2.3",
  }), /evidence tier|data provenance/);
});
