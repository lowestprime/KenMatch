export type TargetMode = "live-readonly" | "snapshot-lab";
export type AuditScope = "smoke" | "full";
export type EvidenceTier =
  | "tier-1-synthetic"
  | "tier-2-production-clone"
  | "tier-3-live-production";
export type DataProvenance =
  | "synthetic-fixture"
  | "production-clone"
  | "production-live";
export type AuthState = "anonymous" | "user" | "moderator" | "admin" | "owner";
export type ThemeMode = "light" | "oled";
export type CoverageTier = "canonical" | "discovered" | "special";

export interface ViewportProfile {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
  archival: boolean;
}

export interface PublicAssetDigest {
  url: string;
  bytes: number;
  sha256: string;
}

export interface ProtectedInventory {
  schemaVersion: number;
  complete: true;
  generatedAt: string;
  lastModified: string | null;
  build: {
    sha: string | null;
    tier: EvidenceTier | null;
    dataProvenance: DataProvenance | "unverified";
    labMode: boolean;
  };
  counts: {
    kens: number;
    profiles: number;
    categories: number;
    discussions: number;
    assets: number;
  };
  routes: {
    static: string[];
    kens: string[];
    profiles: string[];
    discussions: string[];
  };
  taxonomy: {
    categories: string[];
    lanes: string[];
  };
  states: {
    taskStages: string[];
    safetyStates: string[];
    hasComments: boolean;
    hasUploadedIllustration: boolean;
    hasFallbackIllustration: boolean;
  };
  kens: Array<{
    slug: string;
    stage: string;
    safetyStatus: string;
    requestedLane: string;
    categorySlug: string;
    illustrationUrl: string | null;
    illustrationSource: string | null;
    hasComments: boolean;
  }>;
  discussions: Array<{ slug: string; topic: string }>;
  assets: PublicAssetDigest[];
}

export interface RouteTarget {
  key: string;
  route: string;
  auth: AuthState;
  coverageTier: CoverageTier;
  state: string;
  source: "source" | "database" | "rendered" | "required";
  themes: ThemeMode[];
  viewports: string[];
  interaction?: string;
}

export type CoveragePlanPhase = "initial" | "converging" | "converged";

export interface CoveragePlanBinding {
  phase: CoveragePlanPhase;
  seedCaptureCount: number;
  expectedCaptureCount: number;
  convergenceIterations: number;
  planDigest: string;
  targetKeysDigest: string;
}

export interface CoveragePlan {
  schemaVersion: 2;
  runId: string;
  generatedAt: string;
  mode: TargetMode;
  scope: AuditScope;
  evidenceTier: EvidenceTier;
  dataProvenance: DataProvenance;
  expectedCommit: string;
  viewportMatrixDigest: string;
  acceleratorRecord: string;
  browserVersion: string;
  inventoryDigest: string;
  phase: CoveragePlanPhase;
  seedCaptureCount: number;
  convergenceIteration: number;
  planDigest: string;
  targetKeysDigest: string;
  sourceRoutes: string[];
  databaseRoutes: string[];
  renderedRoutes: string[];
  assetRoutes: string[];
  unresolvedDynamicPatterns: string[];
  routeDispositions: Array<{
    route: string;
    disposition: "captured" | "equivalent";
    representativeRoute: string;
    reason: string;
  }>;
  samplingRationale: string;
  requiredStates: string[];
  targets: RouteTarget[];
  expectedCaptureCount: number;
}

export type DiagnosticKind =
  | "console"
  | "pageerror"
  | "requestfailed"
  | "http-error"
  | "unsafe-request"
  | "cross-origin-request"
  | "horizontal-overflow"
  | "touch-target"
  | "focus"
  | "keyboard-trap"
  | "reduced-motion"
  | "forced-colors"
  | "blank"
  | "duplicate"
  | "seam"
  | "asset"
  | "placeholder"
  | "security";

export interface DiagnosticRecord {
  timestamp: string;
  route: string;
  captureKey: string | null;
  kind: DiagnosticKind;
  severity: "info" | "warning" | "serious";
  message: string;
  expected: boolean;
}

export interface AccessibilityResult {
  skipLinkPresent: boolean;
  skipLinkTargetValid: boolean;
  skipLinkActivationValid: boolean;
  keyboardReachable: boolean;
  keyboardTrapDetected: boolean;
  focusVisible: boolean;
  horizontalOverflowPx: number;
  undersizedTouchTargets: number;
  reducedMotionStable: boolean;
  forcedColorsUsable: boolean;
  headingOrderValid: boolean;
  unlabeledControls: number;
  seriousViolations: string[];
}

export interface TileRecord {
  file: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScrollContainerRecord {
  selector: string;
  stitchedFile: string;
  sourceWidth: number;
  sourceHeight: number;
  tiles: TileRecord[];
  seamCorrelations: Array<{
    first: string;
    second: string;
    score: number;
    passed: boolean;
  }>;
}

export interface TileManifest {
  schemaVersion: 1;
  createdAt: string;
  captureKey: string;
  sourceWidth: number;
  sourceHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  deviceScaleFactor: number;
  overlapRatio: number;
  tiles: TileRecord[];
  scrollContainers: ScrollContainerRecord[];
  seamCorrelations: Array<{
    first: string;
    second: string;
    score: number;
    passed: boolean;
  }>;
  stitchedFile: string;
}

export interface CaptureRecord {
  key: string;
  createdAt: string;
  route: string;
  finalUrl: string;
  status: number | null;
  auth: AuthState;
  theme: ThemeMode;
  viewport: string;
  state: string;
  coverageTier: CoverageTier;
  sensitive: boolean;
  stitchedFile: string;
  tileManifestFile: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  pageHeight: number;
  contentDigest: string;
  accessibility: AccessibilityResult;
  discoveredLinks: string[];
  assetUrls: string[];
}

export interface RequestSecuritySummary {
  loginMutations: number;
  blockedUnsafeRequests: number;
  successfulUnsafeRequests: number;
  blockedCrossOriginRequests: number;
  allowedCrossOriginRequests: number;
  telemetrySuppressed: boolean;
  inventoryRequests: number;
}

export interface RunManifest {
  schemaVersion: 2;
  runId: string;
  startedAt: string;
  completedAt: string | null;
  mode: TargetMode;
  scope: AuditScope;
  evidenceTier: EvidenceTier;
  dataProvenance: DataProvenance;
  baseUrl: string;
  expectedCommit: string;
  deployedCommit: string;
  viewportMatrixDigest: string;
  acceleratorRecord: string;
  captureWorkers: number;
  browserName: string;
  browserVersion: string;
  playwrightVersion: string;
  inventoryDigest: string;
  coveragePlan: CoveragePlanBinding;
  captures: CaptureRecord[];
  completedKeys: string[];
  diagnostics: DiagnosticRecord[];
  renderedLinks: string[];
  security: RequestSecuritySummary;
  sourceEvidence: {
    databaseSha256Before: string | null;
    databaseSha256After: string | null;
    dataTreeSha256Before: string | null;
    dataTreeSha256After: string | null;
    sourceUnchanged: boolean | null;
    cleanupComplete: boolean | null;
  };
}

export interface ComparisonReport {
  schemaVersion: 1;
  runId: string;
  generatedAt: string;
  baselineRoot: string | null;
  compared: number;
  added: string[];
  removed: string[];
  changed: Array<{
    key: string;
    pixelDifferenceRatio: number;
    perceptualDifference: number;
    passed: boolean;
    diffFile: string | null;
  }>;
  passed: boolean;
}

export interface ValidationReport {
  schemaVersion: 1;
  runId: string;
  generatedAt: string;
  checks: Array<{ name: string; passed: boolean; detail: string }>;
  failures: string[];
  warnings: string[];
  passed: boolean;
}
