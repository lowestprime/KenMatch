import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import sharp from "sharp";

import { loadConfig, type AuditConfig } from "./config.js";
import type { ComparisonReport, RunManifest } from "./types.js";
import { ensureDirectory, readJson, writeJson } from "./util.js";

async function normalizedPixels(file: string) {
  return sharp(file)
    .resize(512, 512, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer();
}

async function compareImages(current: string, baseline: string, diffFile: string) {
  const [left, right] = await Promise.all([normalizedPixels(current), normalizedPixels(baseline)]);
  const length = Math.min(left.length, right.length);
  let changed = 0;
  let totalDifference = 0;
  const diff = Buffer.alloc(length);
  for (let index = 0; index < length; index += 1) {
    const delta = Math.abs((left[index] ?? 0) - (right[index] ?? 0));
    if (delta > 12) changed += 1;
    totalDifference += delta;
    diff[index] = delta;
  }
  ensureDirectory(path.dirname(diffFile));
  await sharp(diff, { raw: { width: 512, height: 512, channels: 3 } })
    .png()
    .toFile(diffFile);
  return {
    pixelDifferenceRatio: length ? changed / length : 1,
    perceptualDifference: length ? totalDifference / (length * 255) : 1,
  };
}

export async function generateComparison(config: AuditConfig): Promise<ComparisonReport> {
  const manifest = readJson<RunManifest>(path.join(config.runRoot, "manifest.json"));
  if (!config.baselineRoot) {
    const report: ComparisonReport = {
      schemaVersion: 1,
      runId: config.runId,
      generatedAt: new Date().toISOString(),
      baselineRoot: null,
      compared: 0,
      added: manifest.captures.map((capture) => capture.key),
      removed: [],
      changed: [],
      passed: true,
    };
    writeJson(path.join(config.runRoot, "comparison.json"), report);
    return report;
  }

  const baselineManifestFile = path.join(config.baselineRoot, "manifest.json");
  if (!fs.existsSync(baselineManifestFile)) {
    throw new Error(`Baseline manifest is missing: ${baselineManifestFile}`);
  }
  const baseline = readJson<RunManifest>(baselineManifestFile);
  const baselineByKey = new Map(baseline.captures.map((capture) => [capture.key, capture]));
  const currentByKey = new Map(manifest.captures.map((capture) => [capture.key, capture]));
  const added = [...currentByKey.keys()].filter((key) => !baselineByKey.has(key)).sort();
  const removed = [...baselineByKey.keys()].filter((key) => !currentByKey.has(key)).sort();
  const changed: ComparisonReport["changed"] = [];
  for (const [key, capture] of currentByKey) {
    const baselineCapture = baselineByKey.get(key);
    if (!baselineCapture) continue;
    const diffFile = path.join(config.runRoot, "png", "diff", `${key}.png`);
    const metrics = await compareImages(
      path.join(config.runRoot, capture.stitchedFile),
      path.join(config.baselineRoot, baselineCapture.stitchedFile),
      diffFile,
    );
    const passed = metrics.pixelDifferenceRatio <= 0.005
      && metrics.perceptualDifference <= 0.003;
    if (!passed) {
      changed.push({
        key,
        ...metrics,
        passed,
        diffFile: path.relative(config.runRoot, diffFile).split(path.sep).join("/"),
      });
    }
  }
  const report: ComparisonReport = {
    schemaVersion: 1,
    runId: config.runId,
    generatedAt: new Date().toISOString(),
    baselineRoot: config.baselineRoot,
    compared: [...currentByKey.keys()].filter((key) => baselineByKey.has(key)).length,
    added,
    removed,
    changed,
    passed: removed.length === 0 && changed.length === 0,
  };
  writeJson(path.join(config.runRoot, "comparison.json"), report);
  return report;
}

async function main() {
  await generateComparison(loadConfig());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
