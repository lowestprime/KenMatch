import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type {
  AuditScope,
  DataProvenance,
  EvidenceTier,
  TargetMode,
  ViewportProfile,
} from "./types.js";

const TIERS: EvidenceTier[] = [
  "tier-1-synthetic",
  "tier-2-production-clone",
  "tier-3-live-production",
];
const MODES: TargetMode[] = ["live-readonly", "snapshot-lab"];
const PROVENANCE: DataProvenance[] = [
  "synthetic-fixture",
  "production-clone",
  "production-live",
];

function required(environment: NodeJS.ProcessEnv, name: string) {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`${name} must be set.`);
  return value;
}

function booleanValue(environment: NodeJS.ProcessEnv, name: string, fallback: boolean) {
  const value = environment[name]?.trim().toLowerCase();
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value);
}

function positiveInteger(environment: NodeJS.ProcessEnv, name: string, fallback: number) {
  const parsed = Number.parseInt(environment[name] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readSecret(environment: NodeJS.ProcessEnv, name: string, pattern?: RegExp) {
  const file = path.resolve(required(environment, name));
  const stats = fs.statSync(file);
  if (!stats.isFile()) throw new Error(`${name} must point to a regular file.`);
  if (process.platform !== "win32" && (stats.mode & 0o077) !== 0) {
    throw new Error(`${name} must not be readable or writable by group/other.`);
  }
  const value = fs.readFileSync(file, "utf8").trim();
  if (!value) throw new Error(`${name} points to an empty secret file.`);
  if (pattern && !pattern.test(value)) throw new Error(`${name} has an invalid value.`);
  return value;
}

function safeRunId(value: string) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,127}$/.test(value)) {
    throw new Error("AUDIT_RUN_ID contains unsupported characters.");
  }
  return value;
}

function assertSafeOutputRoot(outputRoot: string, repoRoot: string) {
  const parsed = path.parse(outputRoot);
  if (outputRoot === parsed.root) throw new Error("RUN_OUTPUT_ROOT cannot be a filesystem root.");
  const expectedParent = path.resolve(repoRoot, "visual-audits");
  if (outputRoot !== expectedParent) {
    throw new Error(`RUN_OUTPUT_ROOT must resolve to ${expectedParent}.`);
  }
}

export interface AuditConfig {
  targetMode: TargetMode;
  scope: AuditScope;
  evidenceTier: EvidenceTier;
  dataProvenance: DataProvenance;
  baseUrl: string;
  expectedCommit: string;
  viewportMatrixDigest: string;
  acceleratorRecord: string;
  runId: string;
  repoRoot: string;
  outputRoot: string;
  runRoot: string;
  tmpRoot: string;
  auditToken: string;
  adminEmail: string | null;
  adminPassword: string | null;
  testAuthToken: string | null;
  resume: boolean;
  strictDiagnostics: boolean;
  baselineRoot: string | null;
  snapshotEvidenceFile: string | null;
  shareableApprovalFile: string | null;
  captureWorkers: number;
  maxPageCssHeight: number;
  allowedCrossOriginHosts: string[];
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AuditConfig {
  const targetMode = required(environment, "TARGET_MODE") as TargetMode;
  if (!MODES.includes(targetMode)) throw new Error("TARGET_MODE is invalid.");
  const scope = (environment.AUDIT_SCOPE?.trim() || "full") as AuditScope;
  if (scope !== "smoke" && scope !== "full") throw new Error("AUDIT_SCOPE is invalid.");
  const evidenceTier = required(environment, "AUDIT_EVIDENCE_TIER") as EvidenceTier;
  if (!TIERS.includes(evidenceTier)) throw new Error("AUDIT_EVIDENCE_TIER is invalid.");
  const dataProvenance = required(environment, "AUDIT_DATA_PROVENANCE") as DataProvenance;
  if (!PROVENANCE.includes(dataProvenance)) throw new Error("AUDIT_DATA_PROVENANCE is invalid.");

  const expectedMode: TargetMode = evidenceTier === "tier-3-live-production"
    ? "live-readonly"
    : "snapshot-lab";
  if (targetMode !== expectedMode) throw new Error(`${evidenceTier} requires TARGET_MODE=${expectedMode}.`);
  const expectedProvenance: DataProvenance = evidenceTier === "tier-1-synthetic"
    ? "synthetic-fixture"
    : evidenceTier === "tier-2-production-clone"
      ? "production-clone"
      : "production-live";
  if (dataProvenance !== expectedProvenance) {
    throw new Error(`${evidenceTier} requires AUDIT_DATA_PROVENANCE=${expectedProvenance}.`);
  }

  const base = new URL(required(environment, "BASE_URL"));
  const loopback = ["127.0.0.1", "localhost", "::1"].includes(base.hostname);
  if (targetMode === "live-readonly" && base.protocol !== "https:" && !loopback) {
    throw new Error("live-readonly requires HTTPS.");
  }
  if (evidenceTier === "tier-3-live-production" && (base.protocol !== "https:" || loopback)) {
    throw new Error("tier-3-live-production requires a non-loopback HTTPS origin.");
  }

  const expectedCommit = required(environment, "TARGET_COMMIT_SHA").toLowerCase();
  if (!/^[a-f0-9]{7,64}$/.test(expectedCommit)) throw new Error("TARGET_COMMIT_SHA must be a Git SHA.");
  const repoRoot = path.resolve(required(environment, "REPO_ROOT"));
  const runId = safeRunId(required(environment, "AUDIT_RUN_ID"));
  const outputRoot = path.resolve(environment.RUN_OUTPUT_ROOT?.trim() || path.join(repoRoot, "visual-audits"));
  assertSafeOutputRoot(outputRoot, repoRoot);
  const runRoot = path.join(outputRoot, runId);
  const tmpRoot = path.resolve(environment.AUDIT_TMP_ROOT?.trim() || path.join(repoRoot, "tmp", `kenmatch-audit-${runId}`));
  if (runRoot === tmpRoot || tmpRoot.startsWith(`${runRoot}${path.sep}`)) {
    throw new Error("AUDIT_TMP_ROOT must be outside the durable run directory.");
  }

  const auditToken = readSecret(environment, "AUDIT_TOKEN_FILE", /^[a-f0-9]{64}$/i);
  const acceleratorRecord = environment.AUDIT_ACCELERATOR_RECORD?.trim() || "chromium-headless-software";
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,127}$/.test(acceleratorRecord)) {
    throw new Error("AUDIT_ACCELERATOR_RECORD contains unsupported characters.");
  }
  const adminPasswordFile = environment.ADMIN_PASSWORD_FILE?.trim();
  const testAuthTokenFile = environment.TEST_AUTH_TOKEN_FILE?.trim();
  const adminEmail = environment.KENMATCH_ADMIN_EMAIL?.trim() || null;
  const adminPassword = adminPasswordFile
    ? readSecret(environment, "ADMIN_PASSWORD_FILE")
    : null;
  const testAuthToken = testAuthTokenFile
    ? readSecret(environment, "TEST_AUTH_TOKEN_FILE")
    : null;

  if (targetMode === "snapshot-lab" && !testAuthToken) {
    throw new Error("snapshot-lab requires TEST_AUTH_TOKEN_FILE.");
  }
  if (targetMode === "live-readonly" && (!adminEmail || !adminPassword)) {
    throw new Error("live-readonly requires KENMATCH_ADMIN_EMAIL and ADMIN_PASSWORD_FILE.");
  }

  return {
    targetMode,
    scope,
    evidenceTier,
    dataProvenance,
    baseUrl: base.toString().replace(/\/$/, ""),
    expectedCommit,
    viewportMatrixDigest: viewportMatrixDigest(),
    acceleratorRecord,
    runId,
    repoRoot,
    outputRoot,
    runRoot,
    tmpRoot,
    auditToken,
    adminEmail,
    adminPassword,
    testAuthToken,
    resume: booleanValue(environment, "AUDIT_RESUME", true),
    strictDiagnostics: booleanValue(environment, "AUDIT_STRICT_DIAGNOSTICS", true),
    baselineRoot: environment.APPROVED_BASELINE_ROOT?.trim()
      ? path.resolve(environment.APPROVED_BASELINE_ROOT)
      : null,
    snapshotEvidenceFile: environment.AUDIT_SNAPSHOT_EVIDENCE_FILE?.trim()
      ? path.resolve(environment.AUDIT_SNAPSHOT_EVIDENCE_FILE)
      : null,
    shareableApprovalFile: environment.AUDIT_SHAREABLE_APPROVAL_FILE?.trim()
      ? path.resolve(environment.AUDIT_SHAREABLE_APPROVAL_FILE)
      : null,
    captureWorkers: Math.min(4, positiveInteger(environment, "VISUAL_AUDIT_CAPTURE_WORKERS", 1)),
    maxPageCssHeight: positiveInteger(environment, "MAX_PAGE_CSS_HEIGHT", 60_000),
    allowedCrossOriginHosts: (environment.AUDIT_ALLOWED_CROSS_ORIGIN_HOSTS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  };
}

export const VIEWPORTS: ViewportProfile[] = [
  { name: "desktop-1440", width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, archival: false },
  { name: "desktop-1280", width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, archival: false },
  { name: "desktop-1024", width: 1024, height: 768, deviceScaleFactor: 1, isMobile: false, archival: false },
  { name: "tablet-portrait", width: 1024, height: 1366, deviceScaleFactor: 2, isMobile: false, archival: false },
  { name: "mobile-430", width: 430, height: 932, deviceScaleFactor: 3, isMobile: true, archival: false },
  { name: "mobile-390", width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, archival: false },
  { name: "mobile-375", width: 375, height: 812, deviceScaleFactor: 3, isMobile: true, archival: false },
  { name: "mobile-320", width: 320, height: 720, deviceScaleFactor: 3, isMobile: true, archival: false },
  { name: "desktop-archival", width: 2560, height: 1440, deviceScaleFactor: 2, isMobile: false, archival: true },
];

export function viewportMatrixDigest() {
  return createHash("sha256").update(JSON.stringify(VIEWPORTS)).digest("hex");
}
