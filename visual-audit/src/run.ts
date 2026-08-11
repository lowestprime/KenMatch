import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";

import {
  establishAuthStates,
  proveServerMutationGuard,
} from "./auth.js";
import {
  buildPlaceholderReport,
  verifyAssetInventory,
} from "./assets.js";
import { runCaptures } from "./capture.js";
import { loadConfig, type AuditConfig } from "./config.js";
import { buildCoveragePlan } from "./coverage.js";
import { evaluateCoverageConvergence } from "./convergence.js";
import { fetchProtectedInventory } from "./inventory.js";
import {
  assertCoveragePlanIdentity,
  coverageBindingsMatch,
  coverageCaptureKeys,
  coveragePlanBinding,
} from "./plan-identity.js";
import {
  persistCoveragePlanState,
  recoverCoveragePlanState,
} from "./plan-state.js";
import { restoreResumeSecurity } from "./security-state.js";
import type {
  CoveragePlan,
  RequestSecuritySummary,
  RunManifest,
} from "./types.js";
import {
  ensureDirectory,
  hardenPermissions,
  readJson,
  writeJson,
  writeJsonAtomic,
} from "./util.js";

const require = createRequire(import.meta.url);
const playwrightPackage = require("playwright/package.json") as { version: string };

interface SnapshotEvidence {
  databaseSha256Before?: string | null;
  databaseSha256After?: string | null;
  dataTreeSha256Before?: string | null;
  dataTreeSha256After?: string | null;
  sourceUnchanged?: boolean | null;
  cleanupComplete?: boolean | null;
}

function sourceEvidence(config: AuditConfig): RunManifest["sourceEvidence"] {
  const fallback: RunManifest["sourceEvidence"] = {
    databaseSha256Before: null,
    databaseSha256After: null,
    dataTreeSha256Before: null,
    dataTreeSha256After: null,
    sourceUnchanged: config.targetMode === "live-readonly" ? null : false,
    cleanupComplete: config.targetMode === "live-readonly" ? null : false,
  };
  if (!config.snapshotEvidenceFile || !fs.existsSync(config.snapshotEvidenceFile)) return fallback;
  const value = readJson<SnapshotEvidence>(config.snapshotEvidenceFile);
  return {
    databaseSha256Before: value.databaseSha256Before ?? null,
    databaseSha256After: value.databaseSha256After ?? null,
    dataTreeSha256Before: value.dataTreeSha256Before ?? null,
    dataTreeSha256After: value.dataTreeSha256After ?? null,
    sourceUnchanged: value.sourceUnchanged ?? false,
    cleanupComplete: value.cleanupComplete ?? false,
  };
}

export function assertResumeCompatible(input: {
  config: AuditConfig;
  manifest: RunManifest;
  plan: CoveragePlan;
  inventoryDigest: string;
  browserVersion: string;
}) {
  const failures: string[] = [];
  let expectedKeys = new Set<string>();
  let expectedBinding: ReturnType<typeof coveragePlanBinding> | null = null;
  try {
    assertCoveragePlanIdentity(input.plan);
    expectedBinding = coveragePlanBinding(input.plan);
    expectedKeys = new Set(coverageCaptureKeys(input.plan));
  } catch (error) {
    failures.push(error instanceof Error ? error.message : "coverage plan identity");
  }
  if (input.manifest.schemaVersion !== 2) failures.push("manifest schema version");
  if (input.plan.schemaVersion !== 2) failures.push("coverage schema version");
  if (input.manifest.runId !== input.config.runId) failures.push("run id");
  if (input.manifest.mode !== input.config.targetMode) failures.push("mode");
  if (input.manifest.scope !== input.config.scope) failures.push("scope");
  if (input.manifest.evidenceTier !== input.config.evidenceTier) failures.push("evidence tier");
  if (input.manifest.dataProvenance !== input.config.dataProvenance) failures.push("data provenance");
  if (input.plan.dataProvenance !== input.config.dataProvenance) failures.push("coverage data provenance");
  if (input.manifest.baseUrl !== input.config.baseUrl) failures.push("base URL");
  if (input.manifest.expectedCommit !== input.config.expectedCommit) failures.push("expected commit");
  if (input.manifest.viewportMatrixDigest !== input.config.viewportMatrixDigest) failures.push("viewport matrix");
  if (input.manifest.acceleratorRecord !== input.config.acceleratorRecord) failures.push("accelerator record");
  if (input.manifest.captureWorkers !== input.config.captureWorkers) failures.push("capture workers");
  if (input.manifest.inventoryDigest !== input.inventoryDigest) failures.push("inventory digest");
  if (input.manifest.browserVersion !== input.browserVersion) failures.push("browser version");
  if (input.plan.browserVersion !== input.browserVersion) failures.push("coverage browser version");
  if (input.plan.expectedCommit !== input.config.expectedCommit) failures.push("coverage commit");
  if (input.plan.viewportMatrixDigest !== input.config.viewportMatrixDigest) failures.push("coverage viewport matrix");
  if (input.plan.acceleratorRecord !== input.config.acceleratorRecord) failures.push("coverage accelerator record");
  if (input.plan.inventoryDigest !== input.inventoryDigest) failures.push("coverage inventory");
  if (
    !input.manifest.coveragePlan
    || !expectedBinding
    || !coverageBindingsMatch(input.manifest.coveragePlan, expectedBinding)
  ) failures.push("manifest coverage-plan binding");
  const captureKeys = (input.manifest.captures ?? []).map((capture) => capture.key);
  const completedKeys = input.manifest.completedKeys ?? [];
  if (new Set(captureKeys).size !== captureKeys.length) failures.push("duplicate manifest captures");
  if (new Set(completedKeys).size !== completedKeys.length) failures.push("duplicate completed keys");
  if (
    captureKeys.some((key) => !expectedKeys.has(key))
    || completedKeys.some((key) => !expectedKeys.has(key))
  ) failures.push("persisted capture target set");
  if (
    captureKeys.length !== completedKeys.length
    || captureKeys.some((key) => !completedKeys.includes(key))
  ) failures.push("completed key checkpoint");
  if (input.plan.phase === "initial" && captureKeys.length > 0) failures.push("initial phase captures");
  if (failures.length) {
    throw new Error(`Resume refused because immutable run identity changed: ${failures.join(", ")}.`);
  }
}

async function main() {
  const config = loadConfig();
  ensureDirectory(config.outputRoot);
  ensureDirectory(config.runRoot);
  ensureDirectory(config.tmpRoot);
  if (!config.resume && fs.readdirSync(config.runRoot).length > 0) {
    throw new Error(`AUDIT_RESUME=false requires an empty run directory: ${config.runRoot}`);
  }

  const browser = await chromium.launch({ headless: true });
  const browserVersion = browser.version();
  const security: RequestSecuritySummary = {
    loginMutations: 0,
    blockedUnsafeRequests: 0,
    successfulUnsafeRequests: 0,
    blockedCrossOriginRequests: 0,
    allowedCrossOriginRequests: 0,
    telemetrySuppressed: true,
    inventoryRequests: 0,
  };
  let manifest: RunManifest | null = null;
  try {
    const authStates = await establishAuthStates(browser, config, security);
    await proveServerMutationGuard(browser, config, authStates.admin, security);
    const inventoryContext = await browser.newContext({ storageState: authStates.admin });
    try {
      const { inventory, digest: inventoryDigest } = await fetchProtectedInventory(inventoryContext, config);
      security.inventoryRequests += 1;
      const manifestFile = path.join(config.runRoot, "manifest.json");
      const planFile = path.join(config.runRoot, "coverage-plan.json");
      const journalFile = path.join(config.runRoot, ".coverage-transition.json");
      if (config.resume) {
        recoverCoveragePlanState({
          manifestFile,
          planFile,
          journalFile,
          validate: (journalManifest, journalPlan) => assertResumeCompatible({
            config,
            manifest: journalManifest,
            plan: journalPlan,
            inventoryDigest,
            browserVersion,
          }),
        });
      }
      const hasManifest = fs.existsSync(manifestFile);
      const hasPlan = fs.existsSync(planFile);
      if (config.resume && hasManifest !== hasPlan) {
        throw new Error("Resume refused because manifest.json and coverage-plan.json are not both present.");
      }
      const resumed = config.resume && hasManifest && hasPlan;
      let plan: CoveragePlan;
      if (resumed) {
        manifest = readJson<RunManifest>(manifestFile);
        plan = readJson<CoveragePlan>(planFile);
        assertResumeCompatible({
          config,
          manifest,
          plan,
          inventoryDigest,
          browserVersion,
        });
        if (manifest.completedAt) {
          throw new Error(`Run ${manifest.runId} is already complete and will not be mutated by resume.`);
        }
      } else {
        plan = buildCoveragePlan({ config, inventory, inventoryDigest, browserVersion });
        manifest = {
          schemaVersion: 2,
          runId: config.runId,
          startedAt: new Date().toISOString(),
          completedAt: null,
          mode: config.targetMode,
          scope: config.scope,
          evidenceTier: config.evidenceTier,
          dataProvenance: config.dataProvenance,
          baseUrl: config.baseUrl,
          expectedCommit: config.expectedCommit,
          deployedCommit: inventory.build.sha ?? "",
          viewportMatrixDigest: config.viewportMatrixDigest,
          acceleratorRecord: config.acceleratorRecord,
          captureWorkers: config.captureWorkers,
          browserName: "chromium",
          browserVersion,
          playwrightVersion: playwrightPackage.version,
          inventoryDigest,
          coveragePlan: coveragePlanBinding(plan),
          captures: [],
          completedKeys: [],
          diagnostics: [],
          renderedLinks: [],
          security,
          sourceEvidence: sourceEvidence(config),
        };
        manifest = persistCoveragePlanState({
          planFile,
          manifestFile,
          journalFile,
          plan,
          manifest,
        });
      }
      if (!manifest) throw new Error("Run manifest initialization failed.");
      if (resumed) restoreResumeSecurity(security, manifest.security);
      let checkpointManifest: RunManifest = manifest;

      const persistPlan = (nextPlan: CoveragePlan) => {
        checkpointManifest = persistCoveragePlanState({
          planFile,
          manifestFile,
          journalFile,
          plan: nextPlan,
          manifest: checkpointManifest,
        });
        manifest = checkpointManifest;
        plan = nextPlan;
      };

      let finalPass = {
        captures: checkpointManifest.captures,
        diagnostics: checkpointManifest.diagnostics,
        renderedLinks: checkpointManifest.renderedLinks,
      };
      const runCurrentPlan = async () => runCaptures({
        browser,
        config,
        plan,
        authStates,
        security,
        existingCaptures: finalPass.captures,
        existingDiagnostics: finalPass.diagnostics,
        existingRenderedLinks: finalPass.renderedLinks,
        onProgress: (progress) => {
          checkpointManifest.captures = [...progress.captures]
            .sort((left, right) => left.key.localeCompare(right.key));
          checkpointManifest.completedKeys = checkpointManifest.captures.map((capture) => capture.key);
          checkpointManifest.diagnostics = progress.diagnostics;
          checkpointManifest.renderedLinks = [...new Set(progress.renderedLinks)].sort();
          checkpointManifest.security = { ...security };
          writeJsonAtomic(manifestFile, checkpointManifest);
          manifest = checkpointManifest;
        },
      });

      if (plan.phase === "initial") {
        const retainedRenderedCaptureRoutes = plan.targets
          .filter((target) => target.source === "rendered")
          .map((target) => target.route);
        persistPlan(buildCoveragePlan({
          config,
          inventory,
          inventoryDigest,
          browserVersion,
          renderedRoutes: finalPass.renderedLinks,
          retainedRenderedCaptureRoutes,
          phase: "converging",
          seedCaptureCount: plan.seedCaptureCount,
          convergenceIteration: 1,
        }));
      }

      while (plan.phase === "converging") {
        finalPass = await runCurrentPlan();
        const retainedRenderedCaptureRoutes = plan.targets
          .filter((target) => target.source === "rendered")
          .map((target) => target.route);
        const reconciledPlan = buildCoveragePlan({
          config,
          inventory,
          inventoryDigest,
          browserVersion,
          renderedRoutes: finalPass.renderedLinks,
          retainedRenderedCaptureRoutes,
          phase: "converging",
          seedCaptureCount: plan.seedCaptureCount,
          convergenceIteration: plan.convergenceIteration + 1,
        });
        const convergence = evaluateCoverageConvergence({
          currentPlan: plan,
          reconciledPlan,
          capturedKeys: new Set(finalPass.captures.map((capture) => capture.key)),
        });
        if (convergence.missingKeys.length > 0) {
          persistPlan(reconciledPlan);
          continue;
        }
        persistPlan(buildCoveragePlan({
          config,
          inventory,
          inventoryDigest,
          browserVersion,
          renderedRoutes: finalPass.renderedLinks,
          retainedRenderedCaptureRoutes,
          phase: "converged",
          seedCaptureCount: plan.seedCaptureCount,
          convergenceIteration: plan.convergenceIteration,
        }));
      }

      if (plan.phase !== "converged") {
        throw new Error(`Coverage plan stopped in unexpected ${plan.phase} phase.`);
      }
      let expectedKeys = new Set(coverageCaptureKeys(plan));
      let capturedKeys = new Set(finalPass.captures.map((capture) => capture.key));
      if ([...capturedKeys].some((key) => !expectedKeys.has(key))) {
        throw new Error("Persisted captures include keys outside the converged coverage plan.");
      }
      if ([...expectedKeys].some((key) => !capturedKeys.has(key))) {
        finalPass = await runCurrentPlan();
        expectedKeys = new Set(coverageCaptureKeys(plan));
        capturedKeys = new Set(finalPass.captures.map((capture) => capture.key));
      }
      if (
        expectedKeys.size !== capturedKeys.size
        || finalPass.captures.length !== capturedKeys.size
        || [...expectedKeys].some((key) => !capturedKeys.has(key))
      ) {
        throw new Error(
          `Converged coverage is incomplete: captured ${capturedKeys.size}/${expectedKeys.size} unique keys.`,
        );
      }

      const assetInventory = await verifyAssetInventory({
        context: inventoryContext,
        config,
        inventory,
        captures: finalPass.captures,
      });
      writeJson(path.join(config.runRoot, "asset-inventory.json"), assetInventory);
      writeJson(path.join(config.runRoot, "placeholder-report.json"), buildPlaceholderReport({
        runId: config.runId,
        diagnostics: finalPass.diagnostics,
      }));

      manifest = {
        ...checkpointManifest,
        completedAt: new Date().toISOString(),
        coveragePlan: coveragePlanBinding(plan),
        captures: [...finalPass.captures].sort((left, right) => left.key.localeCompare(right.key)),
        completedKeys: finalPass.captures.map((capture) => capture.key).sort(),
        diagnostics: finalPass.diagnostics,
        renderedLinks: [...new Set(finalPass.renderedLinks)].sort(),
        security: { ...security },
        sourceEvidence: sourceEvidence(config),
      };
      writeJsonAtomic(manifestFile, manifest);
      hardenPermissions(config.runRoot);
      console.log(
        `Captured ${manifest.captures.length}/${plan.expectedCaptureCount} KenMatch visual states; seed=${plan.seedCaptureCount}; convergenceIterations=${plan.convergenceIteration}; planDigest=${plan.planDigest}.`,
      );
    } finally {
      await inventoryContext.close();
    }
  } finally {
    await browser.close();
    fs.rmSync(path.join(config.tmpRoot, "auth"), { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
