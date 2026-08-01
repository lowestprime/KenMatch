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
import { expandCaptureJobs, runCaptures } from "./capture.js";
import { loadConfig, type AuditConfig } from "./config.js";
import { buildCoveragePlan } from "./coverage.js";
import { fetchProtectedInventory } from "./inventory.js";
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
  const failures = [];
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
  if (input.manifest.inventoryDigest !== input.inventoryDigest) failures.push("inventory digest");
  if (input.manifest.browserVersion !== input.browserVersion) failures.push("browser version");
  if (input.plan.expectedCommit !== input.config.expectedCommit) failures.push("coverage commit");
  if (input.plan.viewportMatrixDigest !== input.config.viewportMatrixDigest) failures.push("coverage viewport matrix");
  if (input.plan.acceleratorRecord !== input.config.acceleratorRecord) failures.push("coverage accelerator record");
  if (input.plan.inventoryDigest !== input.inventoryDigest) failures.push("coverage inventory");
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
      const resumed = config.resume && fs.existsSync(manifestFile) && fs.existsSync(planFile);
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
      } else {
        plan = buildCoveragePlan({ config, inventory, inventoryDigest });
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
          browserName: "chromium",
          browserVersion,
          playwrightVersion: playwrightPackage.version,
          inventoryDigest,
          captures: [],
          completedKeys: [],
          diagnostics: [],
          renderedLinks: [],
          security,
          sourceEvidence: sourceEvidence(config),
        };
        writeJson(planFile, plan);
        writeJson(manifestFile, manifest);
      }
      const checkpointManifest = manifest;

      let finalPass = {
        captures: manifest.captures,
        diagnostics: manifest.diagnostics,
        renderedLinks: manifest.renderedLinks,
      };
      let converged = false;
      for (let iteration = 0; iteration < 4; iteration += 1) {
        const retainedRenderedCaptureRoutes = plan.targets
          .filter((target) => target.source === "rendered")
          .map((target) => target.route);
        plan = buildCoveragePlan({
          config,
          inventory,
          inventoryDigest,
          renderedRoutes: finalPass.renderedLinks,
          retainedRenderedCaptureRoutes,
        });
        writeJson(planFile, plan);
        finalPass = await runCaptures({
          browser,
          config,
          plan,
          authStates,
          security,
          existingCaptures: finalPass.captures,
          existingDiagnostics: finalPass.diagnostics,
          existingRenderedLinks: finalPass.renderedLinks,
          onProgress: (progress) => {
            checkpointManifest.captures = progress.captures;
            checkpointManifest.completedKeys = progress.captures.map((capture) => capture.key).sort();
            checkpointManifest.diagnostics = progress.diagnostics;
            checkpointManifest.renderedLinks = progress.renderedLinks;
            checkpointManifest.security = { ...security };
            writeJson(manifestFile, checkpointManifest);
          },
        });
        const reconciledPlan = buildCoveragePlan({
          config,
          inventory,
          inventoryDigest,
          renderedRoutes: finalPass.renderedLinks,
          retainedRenderedCaptureRoutes: plan.targets
            .filter((target) => target.source === "rendered")
            .map((target) => target.route),
        });
        const capturedKeys = new Set(finalPass.captures.map((capture) => capture.key));
        const missing = expandCaptureJobs(reconciledPlan)
          .some((job) => !capturedKeys.has(job.key));
        if (!missing) {
          plan = reconciledPlan;
          writeJson(planFile, plan);
          converged = true;
          break;
        }
      }
      if (!converged) {
        throw new Error("Rendered-link reconciliation did not converge after four capture passes.");
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
        ...manifest,
        completedAt: new Date().toISOString(),
        captures: finalPass.captures,
        completedKeys: finalPass.captures.map((capture) => capture.key).sort(),
        diagnostics: finalPass.diagnostics,
        renderedLinks: finalPass.renderedLinks,
        security: { ...security },
        sourceEvidence: sourceEvidence(config),
      };
      writeJson(manifestFile, manifest);
      hardenPermissions(config.runRoot);
      console.log(`Captured ${manifest.captures.length}/${plan.expectedCaptureCount} KenMatch visual states.`);
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
