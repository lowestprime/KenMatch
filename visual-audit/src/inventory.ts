import fs from "node:fs";
import path from "node:path";

import type { BrowserContext } from "playwright";

import type { AuditConfig } from "./config.js";
import type { ProtectedInventory } from "./types.js";
import { sha256, stableJson } from "./util.js";

export interface SourceRouteInventory {
  staticRoutes: string[];
  dynamicPatterns: string[];
}

function walk(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

function pageFileToRoute(appRoot: string, file: string) {
  const relative = path.relative(appRoot, path.dirname(file)).split(path.sep);
  const routeSegments = relative
    .filter((segment) => segment && !segment.startsWith("@"))
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")));
  return `/${routeSegments.join("/")}`.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}

export function scanSourceRoutes(repoRoot: string): SourceRouteInventory {
  const appRoot = path.join(repoRoot, "src", "app");
  const routes = walk(appRoot)
    .filter((file) => path.basename(file) === "page.tsx")
    .map((file) => pageFileToRoute(appRoot, file))
    .filter((route) => !route.startsWith("/visual-audit"));
  return {
    staticRoutes: [...new Set(routes.filter((route) => !route.includes("[")))].sort(),
    dynamicPatterns: [...new Set(routes.filter((route) => route.includes("[")))].sort(),
  };
}

export function expandSourceRoutes(
  source: SourceRouteInventory,
  inventory: ProtectedInventory,
) {
  const expanded = new Set(source.staticRoutes);
  const unresolved: string[] = [];
  for (const pattern of source.dynamicPatterns) {
    if (pattern === "/kens/[slug]") {
      inventory.routes.kens.forEach((route) => expanded.add(route));
    } else if (pattern === "/people/[slug]") {
      inventory.routes.profiles.forEach((route) => expanded.add(route));
    } else if (pattern === "/discuss/[slug]") {
      inventory.routes.discussions.forEach((route) => expanded.add(route));
    } else if (pattern === "/tasks/[slug]") {
      inventory.routes.kens.forEach((route) => expanded.add(route.replace(/^\/kens\//, "/tasks/")));
    } else {
      unresolved.push(pattern);
    }
  }
  return { routes: [...expanded].sort(), unresolved: unresolved.sort() };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

function isUniqueStringArray(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.every(isNonEmptyString)
    && new Set(value).size === value.length;
}

export function validateInventoryShape(value: unknown): asserts value is ProtectedInventory {
  if (!value || typeof value !== "object") throw new Error("Protected inventory is not an object.");
  const inventory = value as Partial<ProtectedInventory>;
  if (inventory.schemaVersion !== 1) throw new Error("Protected inventory schemaVersion is unsupported.");
  if (
    inventory.complete !== true
    || !inventory.build
    || !inventory.routes
    || !inventory.counts
    || !inventory.assets
    || !inventory.taxonomy
    || !inventory.states
    || !inventory.kens
    || !inventory.discussions
  ) {
    throw new Error("Protected inventory is incomplete.");
  }
  const arrays = [
    inventory.routes.static,
    inventory.routes.kens,
    inventory.routes.profiles,
    inventory.routes.discussions,
    inventory.taxonomy.categories,
    inventory.taxonomy.lanes,
    inventory.states.taskStages,
    inventory.states.safetyStates,
    inventory.kens,
    inventory.discussions,
    inventory.assets,
  ];
  if (arrays.some((candidate) => !Array.isArray(candidate))) {
    throw new Error("Protected inventory contains a truncated or invalid collection.");
  }
  const taxonomy = inventory.taxonomy;
  const states = inventory.states;
  if (
    !Number.isFinite(Date.parse(inventory.generatedAt ?? ""))
    || (inventory.lastModified !== null && !Number.isFinite(Date.parse(inventory.lastModified ?? "")))
    || !isNonEmptyString(inventory.build.sha)
    || !/^[a-f0-9]{7,64}$/i.test(inventory.build.sha)
    || !isNonEmptyString(inventory.build.tier)
    || !isNonEmptyString(inventory.build.dataProvenance)
    || typeof inventory.build.labMode !== "boolean"
    || !Object.values(inventory.counts).every((count) => Number.isSafeInteger(count) && count >= 0)
  ) {
    throw new Error("Protected inventory provenance or counts are invalid.");
  }
  if (
    inventory.counts.kens !== inventory.routes.kens.length
    || inventory.counts.kens !== inventory.kens.length
    || inventory.counts.profiles !== inventory.routes.profiles.length
    || inventory.counts.categories !== inventory.taxonomy.categories.length
    || inventory.counts.discussions !== inventory.routes.discussions.length
    || inventory.counts.discussions !== inventory.discussions.length
    || inventory.counts.assets !== inventory.assets.length
  ) {
    throw new Error("Protected inventory counts do not match the complete collections.");
  }
  for (const routes of [
    inventory.routes.static,
    inventory.routes.kens,
    inventory.routes.profiles,
    inventory.routes.discussions,
  ]) {
    if (
      !isUniqueStringArray(routes)
      || routes.some((route) => !route.startsWith("/") || route.startsWith("//"))
    ) {
      throw new Error("Protected inventory routes must be unique absolute paths.");
    }
  }
  if (
    !isUniqueStringArray(taxonomy.categories)
    || !isUniqueStringArray(taxonomy.lanes)
    || !isUniqueStringArray(states.taskStages)
    || !isUniqueStringArray(states.safetyStates)
    || typeof states.hasComments !== "boolean"
    || typeof states.hasUploadedIllustration !== "boolean"
    || typeof states.hasFallbackIllustration !== "boolean"
  ) {
    throw new Error("Protected inventory taxonomy or state inventory is invalid.");
  }
  const kenSlugs = inventory.kens.map((ken) => ken?.slug);
  if (
    !isUniqueStringArray(kenSlugs)
    || inventory.kens.some((ken) => (
      !ken
      || !isNonEmptyString(ken.stage)
      || !isNonEmptyString(ken.safetyStatus)
      || !isNonEmptyString(ken.requestedLane)
      || !isNonEmptyString(ken.categorySlug)
      || typeof ken.hasComments !== "boolean"
      || (ken.illustrationUrl !== null && !ken.illustrationUrl.startsWith("/"))
      || (ken.illustrationSource !== null && !isNonEmptyString(ken.illustrationSource))
    ))
  ) {
    throw new Error("Protected inventory Ken records are invalid or duplicated.");
  }
  if (
    !sameRouteSlugs(inventory.routes.kens, kenSlugs, "/kens/")
    || inventory.kens.some((ken) => !taxonomy.categories.includes(ken.categorySlug))
    || inventory.kens.some((ken) => !taxonomy.lanes.includes(ken.requestedLane))
    || inventory.kens.some((ken) => !states.taskStages.includes(ken.stage))
    || inventory.kens.some((ken) => !states.safetyStates.includes(ken.safetyStatus))
  ) {
    throw new Error("Protected inventory Ken routes or taxonomy references are inconsistent.");
  }
  const discussionSlugs = inventory.discussions.map((discussion) => discussion?.slug);
  if (
    !isUniqueStringArray(discussionSlugs)
    || inventory.discussions.some((discussion) => !isNonEmptyString(discussion?.topic))
    || !sameRouteSlugs(inventory.routes.discussions, discussionSlugs, "/discuss/")
  ) {
    throw new Error("Protected inventory discussion records are invalid or inconsistent.");
  }
  if (inventory.assets.some((asset) => (
    !asset
    || !isNonEmptyString(asset.url)
    || !asset.url.startsWith("/")
    || asset.url.startsWith("//")
    || !Number.isSafeInteger(asset.bytes)
    || asset.bytes <= 0
    || !/^[a-f0-9]{64}$/.test(asset.sha256)
  )) || !isUniqueStringArray(inventory.assets.map((asset) => asset.url))) {
    throw new Error("Protected inventory asset records are invalid or duplicated.");
  }
}

function sameRouteSlugs(routes: string[], slugs: string[], prefix: string) {
  const expected = slugs.map((slug) => `${prefix}${encodeURIComponent(slug)}`).sort();
  const actual = [...routes].sort();
  return expected.length === actual.length
    && expected.every((route, index) => route === actual[index]);
}

export async function fetchProtectedInventory(
  context: BrowserContext,
  config: AuditConfig,
) {
  const response = await context.request.get(`${config.baseUrl}/api/visual-audit/inventory`, {
    headers: {
      "x-kenmatch-audit-token": config.auditToken,
      "x-kenmatch-audit-readonly": "1",
      Accept: "application/json",
    },
  });
  if (response.status() !== 200) {
    throw new Error(`Protected inventory returned HTTP ${response.status()}.`);
  }
  const value = await response.json() as unknown;
  validateInventoryShape(value);
  if (value.build.sha !== config.expectedCommit) {
    throw new Error(`Inventory build SHA ${value.build.sha ?? "(missing)"} does not match ${config.expectedCommit}.`);
  }
  if (value.build.tier !== config.evidenceTier) {
    throw new Error(`Inventory tier ${value.build.tier ?? "(missing)"} does not match ${config.evidenceTier}.`);
  }
  if (value.build.dataProvenance !== config.dataProvenance) {
    throw new Error(
      `Inventory provenance ${value.build.dataProvenance} does not match ${config.dataProvenance}.`,
    );
  }
  if (config.targetMode === "snapshot-lab" && value.build.labMode !== true) {
    throw new Error("Snapshot-lab inventory does not attest lab mode.");
  }
  if (config.targetMode === "live-readonly" && value.build.labMode !== false) {
    throw new Error("Live inventory unexpectedly attests lab mode.");
  }
  return {
    inventory: value,
    digest: sha256(stableJson({
      ...value,
      generatedAt: "<excluded-from-identity>",
    })),
  };
}
