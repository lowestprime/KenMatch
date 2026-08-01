import type { BrowserContext } from "playwright";

import type { AuditConfig } from "./config.js";
import type { CaptureRecord, ProtectedInventory } from "./types.js";
import { sha256 } from "./util.js";

function normalizeAssetUrl(value: string) {
  const url = new URL(value, "https://audit.invalid");
  return url.pathname;
}

export async function verifyAssetInventory(input: {
  context: BrowserContext;
  config: AuditConfig;
  inventory: ProtectedInventory;
  captures: CaptureRecord[];
}) {
  const observed = [...new Set(input.captures.flatMap((capture) => capture.assetUrls))]
    .sort();
  const expectedByUrl = new Map(
    input.inventory.assets.map((asset) => [normalizeAssetUrl(asset.url), asset]),
  );
  const checks = [];
  for (const asset of input.inventory.assets) {
    const response = await input.context.request.get(new URL(asset.url, input.config.baseUrl).toString(), {
      headers: {
        "x-kenmatch-audit-readonly": "1",
        "x-kenmatch-audit-token": input.config.auditToken,
      },
      failOnStatusCode: false,
    });
    const bytes = Buffer.from(await response.body());
    const digest = sha256(bytes);
    checks.push({
      url: asset.url,
      expectedBytes: asset.bytes,
      actualBytes: bytes.byteLength,
      expectedSha256: asset.sha256,
      actualSha256: digest,
      status: response.status(),
      passed: response.status() === 200
        && bytes.byteLength === asset.bytes
        && digest === asset.sha256,
    });
  }

  const unregisteredObserved = observed.filter((value) => {
    const pathname = normalizeAssetUrl(value);
    return !pathname.startsWith("/_next/")
      && !expectedByUrl.has(pathname);
  });
  const dynamicAssets = observed.filter((value) => normalizeAssetUrl(value).startsWith("/_next/"));
  return {
    schemaVersion: 1,
    runId: input.config.runId,
    generatedAt: new Date().toISOString(),
    expected: input.inventory.assets,
    observed,
    dynamicAssets,
    unregisteredObserved,
    checks,
    failures: [
      ...checks.filter((check) => !check.passed).map((check) => `Asset verification failed: ${check.url}`),
      ...unregisteredObserved.map((url) => `Rendered asset is absent from protected inventory: ${url}`),
    ],
    passed: checks.every((check) => check.passed) && unregisteredObserved.length === 0,
  };
}

export function buildPlaceholderReport(input: {
  runId: string;
  diagnostics: Array<{
    kind: string;
    expected: boolean;
    route: string;
    captureKey: string | null;
    message: string;
  }>;
}) {
  const entries = input.diagnostics
    .filter((diagnostic) => diagnostic.kind === "placeholder")
    .map((diagnostic) => ({
      route: diagnostic.route,
      captureKey: diagnostic.captureKey,
      description: diagnostic.message,
      allowed: diagnostic.expected,
    }));
  const unexpected = entries.filter((entry) => !entry.allowed);
  return {
    schemaVersion: 1,
    runId: input.runId,
    generatedAt: new Date().toISOString(),
    observed: entries.length,
    allowed: entries.filter((entry) => entry.allowed).length,
    unexpected: unexpected.length,
    entries,
    failures: unexpected.map((entry) => `Unexpected visible placeholder: ${entry.route} ${entry.description}`),
    passed: unexpected.length === 0,
  };
}
