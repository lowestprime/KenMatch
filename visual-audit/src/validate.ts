import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { generateChecksums } from "./checksums.js";
import { expandCaptureJobs } from "./capture.js";
import {
  loadConfig,
  VIEWPORTS,
  type AuditConfig,
} from "./config.js";
import {
  assertCoveragePlanIdentity,
  coverageBindingsMatch,
  coveragePlanBinding,
} from "./plan-identity.js";
import { renderedRouteEquivalenceKey } from "./rendered-routes.js";
import type {
  CaptureRecord,
  ComparisonReport,
  CoveragePlan,
  PublicAssetDigest,
  RunManifest,
  TileManifest,
  ValidationReport,
} from "./types.js";
import { expectedLegacyRedirectLocation } from "./legacy-redirect.js";
import {
  delegatesPermissionsToWindowsHost,
  fileSha256,
  hardenPermissions,
  readJson,
  sha256,
  writeJson,
} from "./util.js";

interface AssetReport {
  schemaVersion: number;
  passed: boolean;
  failures: string[];
  expected: PublicAssetDigest[];
  observed: string[];
  dynamicAssets: string[];
  unregisteredObserved: string[];
  checks: Array<{
    url: string;
    expectedBytes: number;
    actualBytes: number;
    expectedSha256: string;
    actualSha256: string;
    status: number;
    passed: boolean;
  }>;
}

interface PlaceholderReport {
  passed: boolean;
  failures: string[];
}

interface RedactedManifest {
  schemaVersion: number;
  captures: Array<{
    id: string;
    route: string;
    image: string;
  }>;
}

interface ReportSelection {
  schemaVersion: number;
  runId: string;
  privateAtlasCaptureKeys: string[];
  shareableReview: null | {
    reviewer: string;
    reviewedAt: string;
    approvedCaptureKeys: string[];
    rejectedApprovalKeys: string[];
  };
}

interface ReportIndex {
  schemaVersion: number;
  runId: string;
  captures: Array<{
    key: string;
    stitchedFile: string;
  }>;
  privateAtlas: {
    file: string;
    captureKeys: string[];
    bookmarks: Array<{
      title: string;
      page: number;
      captureKey: string | null;
    }>;
  };
  shareableAtlas: {
    file: string;
    captureIds: string[];
    bookmarks: Array<{
      title: string;
      page: number;
      captureKey: string | null;
    }>;
  };
}

interface SnapshotEvidence {
  sourceUnchanged?: boolean | null;
  cleanupComplete?: boolean | null;
  databaseSha256Before?: string | null;
  databaseSha256After?: string | null;
  dataTreeSha256Before?: string | null;
  dataTreeSha256After?: string | null;
}

const REQUIRED_ARTIFACTS = [
  "coverage-plan.json",
  "manifest.json",
  "asset-inventory.json",
  "placeholder-report.json",
  "comparison.json",
  "report/index.html",
  "report/print.html",
  "report/selection.json",
  "report/report-index.json",
  "kenmatch-visual-atlas.pdf",
  "shareable/index.html",
  "shareable/manifest.redacted.json",
  "shareable/kenmatch-visual-atlas-redacted.pdf",
] as const;

function uniqueStrings(values: readonly string[]) {
  return new Set(values).size === values.length;
}

function sameStringSet(left: readonly string[], right: readonly string[]) {
  return left.length === right.length
    && uniqueStrings(left)
    && uniqueStrings(right)
    && left.every((value) => right.includes(value));
}

type RenderedRouteDisposition = CoveragePlan["routeDispositions"][number];

export function renderedRouteDispositionFailures(input: {
  scope: AuditConfig["scope"];
  renderedRoutes: readonly string[];
  manifestRenderedRoutes: readonly string[];
  routeDispositions: readonly RenderedRouteDisposition[];
  plannedRoutes: ReadonlySet<string>;
}) {
  const failures: string[] = [];
  const renderedRoutes = [...new Set(input.renderedRoutes)].sort();
  const manifestRenderedRoutes = [...new Set(input.manifestRenderedRoutes)].sort();
  const dispositionRoutes = input.routeDispositions.map((entry) => entry.route);
  const dispositionsByRoute = new Map(input.routeDispositions.map((entry) => [entry.route, entry]));

  if (!uniqueStrings(input.renderedRoutes)) {
    failures.push("coverage plan contains duplicate rendered routes");
  }
  if (!uniqueStrings(input.manifestRenderedRoutes)) {
    failures.push("manifest contains duplicate rendered routes");
  }
  if (!sameStringSet(renderedRoutes, manifestRenderedRoutes)) {
    failures.push("coverage-plan and manifest rendered-link inventories differ");
  }
  if (!uniqueStrings(dispositionRoutes)) {
    failures.push("coverage plan contains duplicate rendered-route dispositions");
  }
  if (!sameStringSet(renderedRoutes, dispositionRoutes)) {
    failures.push("rendered-link inventory and dispositions differ");
  }

  for (const route of renderedRoutes) {
    const disposition = dispositionsByRoute.get(route);
    if (!disposition || !disposition.reason.trim()) {
      failures.push(`${route} has no documented disposition`);
      continue;
    }

    const representativeIsPlanned = input.plannedRoutes.has(disposition.representativeRoute);
    if (!representativeIsPlanned) {
      failures.push(`${route} names an uncaptured representative`);
    }

    if (disposition.disposition === "captured") {
      if (disposition.representativeRoute !== route || !input.plannedRoutes.has(route)) {
        failures.push(`${route} captured disposition does not name its exact target`);
      }
      continue;
    }

    if (disposition.disposition !== "equivalent") {
      failures.push(`${route} has an invalid disposition`);
      continue;
    }

    const sameQueryShape = renderedRouteEquivalenceKey(disposition.representativeRoute)
      === renderedRouteEquivalenceKey(route);
    if (input.scope === "full" && !sameQueryShape) {
      failures.push(`${route} does not share its representative's query shape in full scope`);
      continue;
    }
  }

  return failures;
}

function isLegacyRedirect(route: string) {
  return expectedLegacyRedirectLocation(route) !== null;
}

function resolveArchiveFile(runRoot: string, relativeFile: string) {
  if (
    !relativeFile
    || path.isAbsolute(relativeFile)
    || relativeFile.split(/[\\/]/).includes("..")
  ) {
    return null;
  }
  const root = path.resolve(runRoot);
  const resolved = path.resolve(root, relativeFile);
  return resolved.startsWith(`${root}${path.sep}`) ? resolved : null;
}

function pngDimensions(file: string) {
  const bytes = fs.readFileSync(file);
  const signature = "89504e470d0a1a0a";
  if (bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== signature) return null;
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function tileCoverageFailures(
  tiles: TileManifest["tiles"],
  sourceHeight: number,
  label: string,
) {
  const failures: string[] = [];
  if (!tiles.length) return [`${label} has no raw tiles.`];
  const ordered = [...tiles].sort((left, right) => left.y - right.y);
  if ((ordered[0]?.y ?? 1) !== 0) failures.push(`${label} does not begin at scroll position zero.`);
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    if (previous && current && current.y > previous.y + previous.height) {
      failures.push(`${label} has a tile gap before y=${current.y}.`);
    }
  }
  const last = ordered.at(-1);
  if (!last || last.y + last.height < sourceHeight) {
    failures.push(`${label} does not cover source height ${sourceHeight}.`);
  }
  return failures;
}

function captureArtifactFailures(config: AuditConfig, captures: CaptureRecord[]) {
  const failures: string[] = [];
  const viewportByName = new Map(VIEWPORTS.map((viewport) => [viewport.name, viewport]));
  for (const capture of captures) {
    const imageFile = resolveArchiveFile(config.runRoot, capture.stitchedFile);
    const manifestFile = resolveArchiveFile(config.runRoot, capture.tileManifestFile);
    if (!imageFile || !fs.existsSync(imageFile)) {
      failures.push(`${capture.key} is missing stitched image ${capture.stitchedFile}.`);
      continue;
    }
    const dimensions = pngDimensions(imageFile);
    if (!dimensions || dimensions.width !== capture.width || dimensions.height !== capture.height) {
      failures.push(`${capture.key} stitched PNG dimensions do not match its capture record.`);
    }
    if (!manifestFile || !fs.existsSync(manifestFile)) {
      failures.push(`${capture.key} is missing tile manifest ${capture.tileManifestFile}.`);
      continue;
    }
    const tiles = readJson<TileManifest>(manifestFile);
    const viewport = viewportByName.get(capture.viewport);
    if (
      tiles.schemaVersion !== 1
      || tiles.captureKey !== capture.key
      || tiles.stitchedFile !== capture.stitchedFile
      || !viewport
      || tiles.viewportWidth !== viewport.width
      || tiles.viewportHeight !== viewport.height
      || tiles.deviceScaleFactor !== viewport.deviceScaleFactor
      || Math.abs(tiles.overlapRatio - 0.12) > 0.001
    ) {
      failures.push(`${capture.key} has inconsistent tile-manifest identity or viewport metadata.`);
    }
    failures.push(...tileCoverageFailures(tiles.tiles, tiles.sourceHeight, `${capture.key} page`));
    if (
      tiles.seamCorrelations.length !== Math.max(0, tiles.tiles.length - 1)
      || tiles.seamCorrelations.some((seam) => !seam.passed)
    ) {
      failures.push(`${capture.key} has missing or failed page seam correlations.`);
    }
    for (const tile of tiles.tiles) {
      const tileFile = resolveArchiveFile(config.runRoot, tile.file);
      if (!tileFile || !fs.existsSync(tileFile)) {
        failures.push(`${capture.key} is missing raw tile ${tile.file}.`);
      }
    }
    for (const container of tiles.scrollContainers) {
      const containerFile = resolveArchiveFile(config.runRoot, container.stitchedFile);
      if (!containerFile || !fs.existsSync(containerFile)) {
        failures.push(`${capture.key} is missing scroll-container image ${container.stitchedFile}.`);
      }
      failures.push(...tileCoverageFailures(
        container.tiles,
        container.sourceHeight,
        `${capture.key} ${container.selector}`,
      ));
      if (
        container.seamCorrelations.length !== Math.max(0, container.tiles.length - 1)
        || container.seamCorrelations.some((seam) => !seam.passed)
      ) {
        failures.push(`${capture.key} ${container.selector} has missing or failed seam correlations.`);
      }
      for (const tile of container.tiles) {
        const tileFile = resolveArchiveFile(config.runRoot, tile.file);
        if (!tileFile || !fs.existsSync(tileFile)) {
          failures.push(`${capture.key} is missing scroll-container tile ${tile.file}.`);
        }
      }
    }
  }
  return failures;
}

function htmlTargetFailures(runRoot: string, relativeHtml: string) {
  const file = path.join(runRoot, relativeHtml);
  if (!fs.existsSync(file)) return [`${relativeHtml} is missing.`];
  const content = fs.readFileSync(file, "utf8");
  const references = [...content.matchAll(/\b(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1] ?? "")
    .filter((value) => value && !value.startsWith("#") && !/^(?:data|https?|javascript):/i.test(value));
  const failures: string[] = [];
  for (const reference of references) {
    const clean = reference.split(/[?#]/, 1)[0] ?? "";
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(clean));
    const root = path.resolve(runRoot);
    if (
      (resolved !== root && !resolved.startsWith(`${root}${path.sep}`))
      || !fs.existsSync(resolved)
    ) {
      failures.push(`${relativeHtml} has a missing or escaping target: ${reference}.`);
    }
  }
  return failures;
}

function pdfTargetCount(file: string) {
  if (!fs.existsSync(file) || fs.statSync(file).size < 1_000) return 0;
  const content = fs.readFileSync(file).toString("latin1");
  if (!content.includes("/Outlines")) return 0;
  return content.match(/\/Dest\s*\[/g)?.length ?? 0;
}

export function stateCovered(required: string, captures: CaptureRecord[]) {
  if (required === "light-theme") return captures.some((capture) => capture.theme === "light");
  if (required === "oled-theme") return captures.some((capture) => capture.theme === "oled");
  if (required === "anonymous") return captures.some((capture) => capture.auth === "anonymous");
  if (required === "signed-in-user") return captures.some((capture) => capture.auth === "user");
  if (required === "ken-stage") return captures.some((capture) => capture.state.startsWith("ken-stage:"));
  if (required === "lane-state") return captures.some((capture) => capture.state.startsWith("lane-state:"));
  return captures.some((capture) => capture.state === required);
}

function readSnapshotEvidence(config: AuditConfig, manifest: RunManifest): SnapshotEvidence {
  if (config.snapshotEvidenceFile && fs.existsSync(config.snapshotEvidenceFile)) {
    return readJson<SnapshotEvidence>(config.snapshotEvidenceFile);
  }
  return manifest.sourceEvidence;
}

function scanTextFiles(root: string) {
  const extensions = new Set([".html", ".json", ".txt", ".sha256", ".js", ".css"]);
  const files: string[] = [];
  const walk = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile() && extensions.has(path.extname(file).toLowerCase())) files.push(file);
    }
  };
  if (fs.existsSync(root)) walk(root);
  return files;
}

function secretLeaks(config: AuditConfig) {
  const needles = [
    config.auditToken,
    config.adminPassword ?? "",
    config.testAuthToken ?? "",
    config.adminEmail ?? "",
    config.repoRoot,
    config.tmpRoot,
    "kenmatch-session=",
    "x-kenmatch-audit-token",
  ].filter((value) => value.length >= 4);
  const leaks: string[] = [];
  for (const file of scanTextFiles(path.join(config.runRoot, "shareable"))) {
    const content = fs.readFileSync(file, "utf8");
    for (const needle of needles) {
      if (content.toLowerCase().includes(needle.toLowerCase())) {
        leaks.push(`${path.relative(config.runRoot, file)} contains forbidden value ${needle === config.auditToken ? "audit-token" : "private-data"}.`);
      }
    }
    const emailMatches = content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
    if (emailMatches.length) leaks.push(`${path.relative(config.runRoot, file)} contains an email address.`);
  }
  return leaks;
}

export function permissionFailures(root: string) {
  if (process.platform === "win32" || delegatesPermissionsToWindowsHost(root)) return [];
  const failures: string[] = [];
  const walk = (entryPath: string) => {
    const stats = fs.lstatSync(entryPath);
    if (stats.isSymbolicLink()) {
      failures.push(`Symbolic link is not allowed in archive output: ${entryPath}`);
      return;
    }
    const mode = stats.mode & 0o777;
    if (stats.isDirectory()) {
      if (mode !== 0o700) failures.push(`Directory mode must be 700: ${entryPath} (${mode.toString(8)})`);
      for (const child of fs.readdirSync(entryPath)) walk(path.join(entryPath, child));
    } else if (stats.isFile() && mode !== 0o600) {
      failures.push(`File mode must be 600: ${entryPath} (${mode.toString(8)})`);
    }
  };
  walk(root);
  return failures;
}

function addCheck(
  checks: ValidationReport["checks"],
  failures: string[],
  name: string,
  passed: boolean,
  detail: string,
) {
  checks.push({ name, passed, detail });
  if (!passed) failures.push(`${name}: ${detail}`);
}

export function validateRun(config: AuditConfig): ValidationReport {
  const manifest = readJson<RunManifest>(path.join(config.runRoot, "manifest.json"));
  const plan = readJson<CoveragePlan>(path.join(config.runRoot, "coverage-plan.json"));
  const assets = readJson<AssetReport>(path.join(config.runRoot, "asset-inventory.json"));
  const placeholders = readJson<PlaceholderReport>(path.join(config.runRoot, "placeholder-report.json"));
  const comparison = readJson<ComparisonReport>(path.join(config.runRoot, "comparison.json"));
  const checks: ValidationReport["checks"] = [];
  const failures: string[] = [];
  const warnings: string[] = [];

  const identityFailures: string[] = [];
  let planIdentityValid = true;
  try {
    assertCoveragePlanIdentity(plan);
  } catch (error) {
    planIdentityValid = false;
    identityFailures.push(error instanceof Error ? error.message : "coverage plan identity");
  }
  if (manifest.schemaVersion !== 2) identityFailures.push("manifest schemaVersion");
  if (plan.schemaVersion !== 2) identityFailures.push("coverage schemaVersion");
  if (manifest.runId !== config.runId || plan.runId !== config.runId) identityFailures.push("runId");
  if (manifest.mode !== config.targetMode || plan.mode !== config.targetMode) identityFailures.push("mode");
  if (manifest.scope !== config.scope || plan.scope !== config.scope) identityFailures.push("scope");
  if (
    manifest.evidenceTier !== config.evidenceTier
    || plan.evidenceTier !== config.evidenceTier
  ) identityFailures.push("evidence tier");
  if (
    manifest.dataProvenance !== config.dataProvenance
    || plan.dataProvenance !== config.dataProvenance
  ) identityFailures.push("data provenance");
  if (manifest.baseUrl !== config.baseUrl) identityFailures.push("origin");
  if (
    manifest.expectedCommit !== config.expectedCommit
    || manifest.deployedCommit !== config.expectedCommit
    || plan.expectedCommit !== config.expectedCommit
  ) identityFailures.push("build SHA");
  if (
    manifest.viewportMatrixDigest !== config.viewportMatrixDigest
    || plan.viewportMatrixDigest !== config.viewportMatrixDigest
  ) identityFailures.push("viewport matrix");
  if (
    manifest.acceleratorRecord !== config.acceleratorRecord
    || plan.acceleratorRecord !== config.acceleratorRecord
  ) identityFailures.push("accelerator record");
  if (manifest.captureWorkers !== config.captureWorkers) identityFailures.push("capture workers");
  if (plan.browserVersion !== manifest.browserVersion) identityFailures.push("coverage browser version");
  if (
    manifest.inventoryDigest !== plan.inventoryDigest
    || manifest.inventoryDigest.length !== 64
  ) identityFailures.push("inventory digest");
  if (
    !planIdentityValid
    || !manifest.coveragePlan
    || !coverageBindingsMatch(manifest.coveragePlan, coveragePlanBinding(plan))
  ) identityFailures.push("coverage-plan binding");
  addCheck(
    checks,
    failures,
    "immutable-identity",
    identityFailures.length === 0,
    identityFailures.length ? `mismatch: ${identityFailures.join(", ")}` : "schema, run, mode, origin, build, viewport, tier, provenance, inventory, and accelerator match",
  );
  const transitionJournalExists = fs.existsSync(path.join(config.runRoot, ".coverage-transition.json"));
  addCheck(
    checks,
    failures,
    "coverage-convergence",
    planIdentityValid
      && plan.phase === "converged"
      && plan.seedCaptureCount <= plan.expectedCaptureCount
      && plan.convergenceIteration >= 1
      && !transitionJournalExists,
    `phase=${plan.phase}; seed=${plan.seedCaptureCount}; converged=${plan.expectedCaptureCount}; iterations=${plan.convergenceIteration}; digest=${plan.planDigest}; transitionJournal=${transitionJournalExists ? "present" : "absent"}`,
  );
  addCheck(checks, failures, "run-complete", Boolean(manifest.completedAt), "manifest completedAt is present");
  addCheck(checks, failures, "playwright-version", manifest.playwrightVersion === "1.61.0", `Playwright ${manifest.playwrightVersion}`);
  addCheck(
    checks,
    failures,
    "browser-version",
    manifest.browserName === "chromium" && /^\d+\.\d+\.\d+\.\d+$/.test(manifest.browserVersion),
    `${manifest.browserName} ${manifest.browserVersion}`,
  );

  const expectedJobs = expandCaptureJobs(plan);
  const expectedKeys = new Set(expectedJobs.map((job) => job.key));
  const actualKeys = new Set(manifest.captures.map((capture) => capture.key));
  const missingCaptures = [...expectedKeys].filter((key) => !actualKeys.has(key));
  const extraCaptures = [...actualKeys].filter((key) => !expectedKeys.has(key));
  const planIsInternallyConsistent = plan.expectedCaptureCount === expectedJobs.length
    && uniqueStrings(plan.targets.map((target) => target.key))
    && expectedKeys.size === expectedJobs.length;
  addCheck(
    checks,
    failures,
    "capture-coverage",
    planIsInternallyConsistent
      && missingCaptures.length === 0
      && extraCaptures.length === 0
      && actualKeys.size === manifest.captures.length,
    `${manifest.captures.length}/${plan.expectedCaptureCount}; missing=${missingCaptures.length}; extra=${extraCaptures.length}`,
  );
  if (missingCaptures.length) failures.push(...missingCaptures.slice(0, 25).map((key) => `Missing capture ${key}`));
  if (extraCaptures.length) failures.push(...extraCaptures.slice(0, 25).map((key) => `Unexpected capture ${key}`));

  addCheck(
    checks,
    failures,
    "dynamic-route-reconciliation",
    plan.unresolvedDynamicPatterns.length === 0,
    `unresolved: ${plan.unresolvedDynamicPatterns.join(", ") || "none"}`,
  );

  const plannedRoutes = new Set(plan.targets.map((target) => target.route));
  const canonicalRoutes = [...new Set([...plan.sourceRoutes, ...plan.databaseRoutes])]
    .filter((route) => !isLegacyRedirect(route));
  const missingCanonicalRoutes = config.scope === "full"
    ? canonicalRoutes.filter((route) => (
      !plan.targets.some((target) => (
        target.route === route
        && target.state === "default"
        && target.coverageTier === "canonical"
      ))
    ))
    : [];
  const matrixViewports = VIEWPORTS.map((viewport) => viewport.name);
  const invalidCanonicalMatrix = config.scope === "full"
    ? plan.targets.filter((target) => (
      target.coverageTier === "canonical"
      && target.state === "default"
      && (
        !sameStringSet(target.themes, ["light", "oled"])
        || !sameStringSet(target.viewports, matrixViewports)
      )
    ))
    : [];
  addCheck(
    checks,
    failures,
    "canonical-route-matrix",
    missingCanonicalRoutes.length === 0 && invalidCanonicalMatrix.length === 0,
    `missing=${missingCanonicalRoutes.length}; invalid matrices=${invalidCanonicalMatrix.length}; scope=${config.scope}`,
  );

  const renderedRoutes = [...new Set(plan.renderedRoutes)].sort();
  const dispositionFailures = renderedRouteDispositionFailures({
    scope: config.scope,
    renderedRoutes: plan.renderedRoutes,
    manifestRenderedRoutes: manifest.renderedLinks,
    routeDispositions: plan.routeDispositions,
    plannedRoutes,
  });
  addCheck(
    checks,
    failures,
    "rendered-link-reconciliation",
    dispositionFailures.length === 0 && Boolean(plan.samplingRationale.trim()),
    dispositionFailures.slice(0, 10).join("; ") || `${renderedRoutes.length} links have explicit captured/equivalent dispositions`,
  );

  const missingStates = plan.requiredStates.filter((state) => !stateCovered(state, manifest.captures));
  addCheck(checks, failures, "state-coverage", missingStates.length === 0, `missing states: ${missingStates.join(", ") || "none"}`);

  const invalidStatuses = manifest.captures.filter((capture) => {
    if (capture.route.startsWith("/visual-audit-not-found")) return capture.status !== 404;
    if (capture.route.startsWith("/reset?") || capture.route.startsWith("/verify?")) {
      return capture.status === null || capture.status < 200 || capture.status >= 500;
    }
    return capture.status === null || capture.status < 200 || capture.status >= 400;
  });
  addCheck(checks, failures, "http-statuses", invalidStatuses.length === 0, `${invalidStatuses.length} invalid capture statuses`);

  const redirectFailures = manifest.captures.flatMap((capture) => {
    const expected = expectedLegacyRedirectLocation(capture.route);
    if (!expected) return [];
    let finalUrl: URL;
    try {
      finalUrl = new URL(capture.finalUrl);
    } catch {
      return [`${capture.route} has an invalid final URL.`];
    }
    if (
      finalUrl.origin !== new URL(config.baseUrl).origin
      || finalUrl.pathname !== expected.pathname
      || finalUrl.search !== expected.search
      || finalUrl.hash !== expected.hash
    ) {
      return [`${capture.route} ended at ${finalUrl.pathname}${finalUrl.search}${finalUrl.hash}.`];
    }
    return [];
  });
  addCheck(
    checks,
    failures,
    "legacy-redirects",
    redirectFailures.length === 0,
    redirectFailures.join("; ") || "all legacy routes reach their canonical targets",
  );

  const captureFiles = captureArtifactFailures(config, manifest.captures);
  addCheck(
    checks,
    failures,
    "tile-and-seam-integrity",
    captureFiles.length === 0,
    captureFiles.slice(0, 10).join("; ") || `${manifest.captures.length} stitched captures retain complete overlapping raw-tile evidence`,
  );

  const accessibilityFailures = manifest.captures.flatMap((capture) => {
    const result = capture.accessibility;
    const failed = [
      !result.skipLinkPresent && "skip link missing",
      !result.skipLinkTargetValid && "skip target invalid",
      !result.skipLinkActivationValid && "skip activation invalid",
      !result.keyboardReachable && "keyboard navigation failed",
      result.keyboardTrapDetected && "keyboard trap",
      !result.focusVisible && "focus indicator missing",
      result.horizontalOverflowPx > 1 && `horizontal overflow ${result.horizontalOverflowPx}px`,
      result.undersizedTouchTargets > 0 && `${result.undersizedTouchTargets} undersized controls`,
      !result.reducedMotionStable && "reduced-motion instability",
      !result.forcedColorsUsable && "forced-colors failure",
      !result.headingOrderValid && "heading order invalid",
      result.unlabeledControls > 0 && `${result.unlabeledControls} unlabeled controls`,
      result.seriousViolations.length > 0 && result.seriousViolations.join(", "),
    ].filter((value): value is string => typeof value === "string");
    return failed.map((value) => `${capture.key}: ${value}`);
  });
  addCheck(
    checks,
    failures,
    "accessibility-contract",
    accessibilityFailures.length === 0,
    accessibilityFailures.slice(0, 20).join("; ") || "skip, keyboard, focus, reflow, touch, motion, forced-colors, headings, and labels pass",
  );

  const unexpectedSerious = manifest.diagnostics.filter(
    (diagnostic) => diagnostic.severity === "serious" && !diagnostic.expected,
  );
  addCheck(checks, failures, "browser-diagnostics", unexpectedSerious.length === 0, `${unexpectedSerious.length} unexpected serious diagnostics`);
  if (unexpectedSerious.length) {
    failures.push(...unexpectedSerious.slice(0, 50).map(
      (diagnostic) => `${diagnostic.kind} ${diagnostic.route}: ${diagnostic.message}`,
    ));
  }

  const expectedLoginMutations = config.targetMode === "live-readonly" ? 1 : 4;
  addCheck(checks, failures, "login-mutation-bound", manifest.security.loginMutations === expectedLoginMutations, `${manifest.security.loginMutations}/${expectedLoginMutations}`);
  addCheck(checks, failures, "unsafe-request-proof", manifest.security.blockedUnsafeRequests >= 1 && manifest.security.successfulUnsafeRequests === 0, `blocked=${manifest.security.blockedUnsafeRequests}; successful=${manifest.security.successfulUnsafeRequests}`);
  addCheck(checks, failures, "telemetry-suppression", manifest.security.telemetrySuppressed, "validated audit documents attest suppression");
  addCheck(checks, failures, "inventory-request-bound", manifest.security.inventoryRequests === 1, `${manifest.security.inventoryRequests}/1 protected inventory requests`);

  const assetExpectedUrls = assets.expected.map((asset) => asset.url);
  const assetCheckUrls = assets.checks.map((asset) => asset.url);
  const assetContractPassed = assets.schemaVersion === 1
    && assets.passed
    && uniqueStrings(plan.assetRoutes)
    && sameStringSet(plan.assetRoutes, assetExpectedUrls)
    && sameStringSet(plan.assetRoutes, assetCheckUrls)
    && assets.checks.every((asset) => (
      asset.passed
      && asset.status === 200
      && asset.expectedBytes === asset.actualBytes
      && asset.expectedSha256 === asset.actualSha256
      && /^[a-f0-9]{64}$/.test(asset.actualSha256)
    ))
    && assets.unregisteredObserved.length === 0;
  addCheck(
    checks,
    failures,
    "asset-integrity",
    assetContractPassed,
    assets.failures.join("; ") || `${assets.checks.length} protected public asset responses match bytes and SHA-256`,
  );
  addCheck(checks, failures, "placeholder-policy", placeholders.passed, placeholders.failures.join("; ") || "no unexpected visible placeholders");
  addCheck(checks, failures, "baseline-comparison", comparison.passed, `changed=${comparison.changed.length}; removed=${comparison.removed.length}`);

  const missingArtifacts = REQUIRED_ARTIFACTS.filter(
    (file) => !fs.existsSync(path.join(config.runRoot, file)),
  );
  addCheck(checks, failures, "artifact-contract", missingArtifacts.length === 0, `missing: ${missingArtifacts.join(", ") || "none"}`);
  const redactedFile = path.join(config.runRoot, "shareable", "manifest.redacted.json");
  const selectionFile = path.join(config.runRoot, "report", "selection.json");
  const reportIndexFile = path.join(config.runRoot, "report", "report-index.json");
  const redacted = fs.existsSync(redactedFile)
    ? readJson<RedactedManifest>(redactedFile)
    : { schemaVersion: 0, captures: [] };
  const selection = fs.existsSync(selectionFile)
    ? readJson<ReportSelection>(selectionFile)
    : null;
  const reportIndex = fs.existsSync(reportIndexFile)
    ? readJson<ReportIndex>(reportIndexFile)
    : null;
  const privateByKey = new Map(manifest.captures.map((capture) => [capture.key, capture]));
  const redactedImagesPresent = redacted.captures.every((capture) => (
    /^capture-[a-f0-9]{20}$/.test(capture.id)
    && Boolean(resolveArchiveFile(config.runRoot, `shareable/${capture.image}`))
    && fs.existsSync(path.join(config.runRoot, "shareable", capture.image))
  ));
  const approvedKeys = selection?.shareableReview?.approvedCaptureKeys ?? [];
  const expectedRedactedIds = approvedKeys.map((key) => `capture-${sha256(key).slice(0, 20)}`);
  const shareableRoutesAnonymous = approvedKeys.every((key) => {
    const candidate = privateByKey.get(key);
    return candidate?.auth === "anonymous" && candidate.sensitive === false;
  });
  const explicitShareableReview = Boolean(
    selection
    && selection.schemaVersion === 1
    && selection.runId === config.runId
    && selection.shareableReview
    && selection.shareableReview.reviewer.trim()
    && !Number.isNaN(Date.parse(selection.shareableReview.reviewedAt))
    && selection.shareableReview.rejectedApprovalKeys.length === 0,
  );
  addCheck(
    checks,
    failures,
    "shareable-review",
    explicitShareableReview
      && redacted.schemaVersion === 1
      && redacted.captures.length > 0
      && redactedImagesPresent
      && shareableRoutesAnonymous
      && sameStringSet(expectedRedactedIds, redacted.captures.map((capture) => capture.id)),
    `${redacted.captures.length} explicitly reviewed anonymous captures`,
  );

  const leaks = secretLeaks(config);
  addCheck(checks, failures, "shareable-redaction", leaks.length === 0, leaks.join("; ") || "no secret, path, session, or email values found");

  const htmlFailures = [
    ...htmlTargetFailures(config.runRoot, "report/index.html"),
    ...htmlTargetFailures(config.runRoot, "report/print.html"),
    ...htmlTargetFailures(config.runRoot, "shareable/index.html"),
  ];
  const privatePdf = path.join(config.runRoot, "kenmatch-visual-atlas.pdf");
  const shareablePdf = path.join(config.runRoot, "shareable", "kenmatch-visual-atlas-redacted.pdf");
  const reportFailures: string[] = [...htmlFailures];
  if (!reportIndex || reportIndex.schemaVersion !== 2 || reportIndex.runId !== config.runId) {
    reportFailures.push("report/report-index.json has an invalid schema or run identity.");
  } else {
    if (
      reportIndex.captures.length !== manifest.captures.length
      || !sameStringSet(
        reportIndex.captures.map((capture) => capture.key),
        manifest.captures.map((capture) => capture.key),
      )
      || reportIndex.captures.some((capture) => (
        privateByKey.get(capture.key)?.stitchedFile !== capture.stitchedFile
      ))
    ) {
      reportFailures.push("report index does not resolve every private capture.");
    }
    if (
      reportIndex.privateAtlas.file !== "../kenmatch-visual-atlas.pdf"
      || !selection
      || !sameStringSet(reportIndex.privateAtlas.captureKeys, selection.privateAtlasCaptureKeys)
      || reportIndex.privateAtlas.bookmarks.length !== reportIndex.privateAtlas.captureKeys.length + 1
      || reportIndex.privateAtlas.bookmarks[0]?.captureKey !== null
      || !sameStringSet(
        reportIndex.privateAtlas.bookmarks.flatMap((bookmark) => bookmark.captureKey ? [bookmark.captureKey] : []),
        reportIndex.privateAtlas.captureKeys,
      )
      || reportIndex.privateAtlas.bookmarks.some((bookmark, index) => bookmark.page !== index + 1)
      || pdfTargetCount(privatePdf) < reportIndex.privateAtlas.bookmarks.length
    ) {
      reportFailures.push("private PDF is missing indexed capture pages or outline destinations.");
    }
    if (
      reportIndex.shareableAtlas.file !== "../shareable/kenmatch-visual-atlas-redacted.pdf"
      || !sameStringSet(reportIndex.shareableAtlas.captureIds, redacted.captures.map((capture) => capture.id))
      || reportIndex.shareableAtlas.bookmarks.length !== reportIndex.shareableAtlas.captureIds.length + 1
      || reportIndex.shareableAtlas.bookmarks[0]?.captureKey !== null
      || !sameStringSet(
        reportIndex.shareableAtlas.bookmarks.flatMap((bookmark) => bookmark.captureKey ? [bookmark.captureKey] : []),
        approvedKeys,
      )
      || reportIndex.shareableAtlas.bookmarks.some((bookmark, index) => bookmark.page !== index + 1)
      || pdfTargetCount(shareablePdf) < reportIndex.shareableAtlas.bookmarks.length
    ) {
      reportFailures.push("shareable PDF is missing reviewed pages or outline destinations.");
    }
  }
  addCheck(
    checks,
    failures,
    "report-targets",
    reportFailures.length === 0,
    reportFailures.slice(0, 20).join("; ") || "HTML images, report index entries, PDF pages, and outline destinations resolve",
  );

  if (config.targetMode === "snapshot-lab") {
    const evidence = readSnapshotEvidence(config, manifest);
    const hashesPresent = Boolean(
      evidence.databaseSha256Before
      && evidence.databaseSha256After
      && evidence.dataTreeSha256Before
      && evidence.dataTreeSha256After,
    );
    addCheck(checks, failures, "snapshot-source-integrity", evidence.sourceUnchanged === true && hashesPresent, "source database/data hashes are present and unchanged");
    addCheck(checks, failures, "snapshot-cleanup", evidence.cleanupComplete === true, "isolated clone and temporary data were removed");
  } else {
    addCheck(checks, failures, "live-readonly", manifest.security.successfulUnsafeRequests === 0, "no successful unsafe live capture request");
  }

  const permissions = permissionFailures(config.runRoot);
  addCheck(checks, failures, "restricted-permissions", permissions.length === 0, permissions.join("; ") || "directories 700 and files 600");

  const report: ValidationReport = {
    schemaVersion: 1,
    runId: config.runId,
    generatedAt: new Date().toISOString(),
    checks,
    failures: [...new Set(failures)],
    warnings,
    passed: failures.length === 0,
  };
  writeJson(path.join(config.runRoot, "validation.json"), report);
  hardenPermissions(config.runRoot);
  generateChecksums(config.runRoot);
  hardenPermissions(config.runRoot);

  const checksums = readJson<{ entries: Array<{ file: string; bytes: number; sha256: string }> }>(
    path.join(config.runRoot, "checksums.json"),
  );
  const checksumMismatches = checksums.entries.flatMap((entry) => {
    const file = resolveArchiveFile(config.runRoot, entry.file);
    if (
      !file
      || !fs.existsSync(file)
      || !/^[a-f0-9]{64}$/.test(entry.sha256)
      || fs.statSync(file).size !== entry.bytes
      || fileSha256(file) !== entry.sha256
    ) {
      return [entry.file];
    }
    return [];
  });
  addCheck(
    checks,
    failures,
    "checksums",
    checksumMismatches.length === 0
      && uniqueStrings(checksums.entries.map((entry) => entry.file))
      && fs.existsSync(path.join(config.runRoot, "checksums.sha256")),
    checksumMismatches.length
      ? `mismatch: ${checksumMismatches.slice(0, 20).join(", ")}`
      : `${checksums.entries.length} archive files have SHA-256 entries`,
  );
  report.failures = [...new Set(failures)];
  report.passed = report.failures.length === 0;
  writeJson(path.join(config.runRoot, "validation.json"), report);
  generateChecksums(config.runRoot);
  hardenPermissions(config.runRoot);
  return report;
}

async function main() {
  const report = validateRun(loadConfig());
  if (!report.passed) {
    console.error(report.failures.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`Validated visual archive ${report.runId}.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
