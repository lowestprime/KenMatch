import assert from "node:assert/strict";
import test from "node:test";

import {
  CaptureCoordinator,
  newCaptureSecurityDelta,
  runBounded,
} from "./capture-coordinator.js";
import {
  captureJobRequiresSerialBarrier,
  groupCaptureJobs,
  type CaptureJob,
} from "./capture.js";
import { VIEWPORTS } from "./config.js";
import type {
  CaptureRecord,
  DiagnosticRecord,
  RequestSecuritySummary,
  RouteTarget,
} from "./types.js";

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function capture(key: string): CaptureRecord {
  return { key } as CaptureRecord;
}

function diagnostic(key: string, message = key): DiagnosticRecord {
  return {
    timestamp: `2026-08-01T00:00:0${key.length}.000Z`,
    route: `/${key}`,
    captureKey: key,
    kind: "console",
    severity: "warning",
    message,
    expected: false,
  };
}

function securitySummary(): RequestSecuritySummary {
  return {
    loginMutations: 4,
    blockedUnsafeRequests: 1,
    successfulUnsafeRequests: 0,
    blockedCrossOriginRequests: 0,
    allowedCrossOriginRequests: 0,
    telemetrySuppressed: true,
    inventoryRequests: 1,
  };
}

function job(key: string, interaction?: string): CaptureJob {
  const target: RouteTarget = {
    key,
    route: `/${key}`,
    auth: "user",
    coverageTier: "canonical",
    state: interaction ?? "default",
    source: "required",
    themes: ["oled"],
    viewports: ["desktop-1440"],
    ...(interaction ? { interaction } : {}),
  };
  return {
    key,
    target,
    theme: "oled",
    viewport: VIEWPORTS.find((viewport) => viewport.name === "desktop-1440")!,
  };
}

test("capture groups isolate serialized interactions from parallel context groups", () => {
  const parallel = job("parallel-default");
  const categoryValidation = job("category-validation", "category-proposal-validation");
  const voice = job("voice", "voice-controls");
  assert.equal(captureJobRequiresSerialBarrier(parallel), false);
  assert.equal(captureJobRequiresSerialBarrier(categoryValidation), true);
  assert.equal(captureJobRequiresSerialBarrier(voice), true);

  const groups = groupCaptureJobs([voice, parallel, categoryValidation]);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups.map((group) => group.serialized), [false, true]);
  assert.deepEqual(groups[0]?.jobs.map((item) => item.key), [parallel.key]);
  assert.deepEqual(groups[1]?.jobs.map((item) => item.key), [categoryValidation.key, voice.key]);
});

test("bounded execution honors worker limits 1, 2, and 4 with equivalent results", async () => {
  const expected = Array.from({ length: 12 }, (_, index) => `capture-${String(index).padStart(2, "0")}`);
  let baseline: string[] | null = null;
  for (const limit of [1, 2, 4]) {
    let active = 0;
    let maximum = 0;
    const observed: string[] = [];
    await runBounded({
      items: expected,
      limit,
      worker: async (item, index) => {
        active += 1;
        maximum = Math.max(maximum, active);
        await delay((index % 3) + 1);
        observed.push(item);
        active -= 1;
      },
    });
    assert.ok(maximum <= limit, `observed ${maximum} active workers with limit ${limit}`);
    const normalized = observed.sort();
    baseline ??= normalized;
    assert.deepEqual(normalized, baseline);
  }
});

test("bounded execution reports the lowest indexed concurrent failure deterministically", async () => {
  await assert.rejects(runBounded({
    items: [0, 1, 2, 3],
    limit: 4,
    worker: async (_item, index) => {
      if (index === 1) {
        await delay(8);
        throw new Error("failure-one");
      }
      if (index === 2) {
        await delay(1);
        throw new Error("failure-two");
      }
      await delay(10);
    },
  }), /failure-one/);
});

test("cancellation stops new scheduling while allowing active work to settle", async () => {
  const controller = new AbortController();
  const started: number[] = [];
  await assert.rejects(runBounded({
    items: Array.from({ length: 10 }, (_, index) => index),
    limit: 2,
    signal: controller.signal,
    worker: async (_item, index) => {
      started.push(index);
      if (index === 0) setTimeout(() => controller.abort(new Error("operator-cancelled")), 1);
      await delay(8);
    },
  }), /operator-cancelled/);
  assert.deepEqual(started.sort((left, right) => left - right), [0, 1]);
});

async function simulatedCapture(limit: number) {
  const security = securitySummary();
  let activeWrites = 0;
  let maximumWrites = 0;
  const checkpointSizes: number[] = [];
  const coordinator = new CaptureCoordinator({
    security,
    onProgress: async (progress) => {
      activeWrites += 1;
      maximumWrites = Math.max(maximumWrites, activeWrites);
      checkpointSizes.push(progress.captures.length);
      await delay(2);
      activeWrites -= 1;
    },
  });
  const keys = ["delta", "alpha", "charlie", "bravo"];
  await runBounded({
    items: keys,
    limit,
    worker: async (key, index) => {
      await delay((keys.length - index) * 2);
      const delta = newCaptureSecurityDelta();
      delta.allowedCrossOriginRequests = 1;
      await coordinator.commit({
        capture: capture(key),
        diagnostics: [diagnostic(key)],
        renderedLinks: [`/${key}`, "/shared"],
        security: delta,
      });
    },
  });
  const result = await coordinator.drain();
  return { result, security, maximumWrites, checkpointSizes };
}

test("one coordinator serializes checkpoints and merges worker output canonically", async () => {
  const outcomes = await Promise.all([1, 2, 4].map((limit) => simulatedCapture(limit)));
  for (const outcome of outcomes) {
    assert.equal(outcome.maximumWrites, 1);
    assert.deepEqual(outcome.checkpointSizes, [1, 2, 3, 4]);
    assert.deepEqual(outcome.result.captures.map((item) => item.key), ["alpha", "bravo", "charlie", "delta"]);
    assert.deepEqual(outcome.result.diagnostics.map((item) => item.captureKey), ["alpha", "bravo", "charlie", "delta"]);
    assert.deepEqual(outcome.result.renderedLinks, ["/alpha", "/bravo", "/charlie", "/delta", "/shared"]);
    assert.equal(outcome.security.allowedCrossOriginRequests, 4);
    assert.equal(outcome.security.loginMutations, 4);
    assert.equal(outcome.security.inventoryRequests, 1);
  }
  assert.deepEqual(outcomes[1]?.result, outcomes[0]?.result);
  assert.deepEqual(outcomes[2]?.result, outcomes[0]?.result);
});

test("coordinator rejects duplicates and preserves resumable completed checkpoints", async () => {
  const existing = capture("completed");
  assert.throws(() => new CaptureCoordinator({
    security: securitySummary(),
    existingCaptures: [existing, existing],
  }), /Duplicate existing capture key/);

  const coordinator = new CaptureCoordinator({
    security: securitySummary(),
    existingCaptures: [existing],
    existingDiagnostics: [diagnostic("completed"), { ...diagnostic("duplicate"), kind: "duplicate" }],
    existingRenderedLinks: ["/completed"],
  });
  const delta = newCaptureSecurityDelta();
  await coordinator.commit({
    capture: capture("resumed"),
    diagnostics: [diagnostic("resumed")],
    renderedLinks: ["/resumed"],
    security: delta,
  });
  await assert.rejects(coordinator.commit({
    capture: capture("completed"),
    diagnostics: [],
    renderedLinks: [],
    security: delta,
  }), /Duplicate capture key completed/);
  await assert.rejects(coordinator.drain(), /Duplicate capture key completed/);

  const durable = new CaptureCoordinator({
    security: securitySummary(),
    existingCaptures: [existing],
    existingRenderedLinks: ["/completed"],
  });
  await durable.commit({
    capture: capture("resumed"),
    diagnostics: [diagnostic("resumed")],
    renderedLinks: ["/resumed", "/completed"],
    security: newCaptureSecurityDelta(),
  });
  const result = await durable.drain();
  assert.deepEqual(result.captures.map((item) => item.key), ["completed", "resumed"]);
  assert.deepEqual(result.renderedLinks, ["/completed", "/resumed"]);
});

test("checkpoint failure stops later commits and is surfaced by drain", async () => {
  let writes = 0;
  const coordinator = new CaptureCoordinator({
    security: securitySummary(),
    onProgress: () => {
      writes += 1;
      throw new Error("checkpoint-write-failed");
    },
  });

  await assert.rejects(coordinator.commit({
    capture: capture("first"),
    diagnostics: [],
    renderedLinks: [],
    security: newCaptureSecurityDelta(),
  }), /checkpoint-write-failed/);
  await assert.rejects(coordinator.commit({
    capture: capture("second"),
    diagnostics: [],
    renderedLinks: [],
    security: newCaptureSecurityDelta(),
  }), /checkpoint-write-failed/);
  await assert.rejects(coordinator.drain(), /checkpoint-write-failed/);
  assert.equal(writes, 1);
});
