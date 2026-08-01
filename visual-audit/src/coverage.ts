import type { AuditConfig } from "./config.js";
import { VIEWPORTS } from "./config.js";
import {
  expandSourceRoutes,
  scanSourceRoutes,
} from "./inventory.js";
import { stampCoveragePlan } from "./plan-identity.js";
import type {
  AuthState,
  CoveragePlanPhase,
  CoveragePlan,
  ProtectedInventory,
  RouteTarget,
  ThemeMode,
} from "./types.js";
import { safeKey } from "./util.js";

export const REQUIRED_VISUAL_STATES = [
  "light-theme",
  "oled-theme",
  "anonymous",
  "signed-in-user",
  "signed-in-moderator",
  "signed-in-admin",
  "signed-in-owner",
  "moderation-review",
  "admin-dashboard",
  "owner-controls",
  "mobile-menu-open",
  "profile-menu-open",
  "header-search-open",
  "header-search-results",
  "header-search-empty",
  "feed-filters",
  "feed-filter-reset",
  "faq-search",
  "faq-category",
  "faq-deep-link",
  "faq-empty",
  "glossary-search",
  "glossary-status",
  "glossary-deep-link",
  "glossary-empty",
  "contact-form",
  "ken-proposal-validation",
  "category-proposal-form",
  "category-proposal-validation",
  "review-queue",
  "ken-review-queue",
  "category-review-queue",
  "appeal-state",
  "visitor-map",
  "historical-analytics",
  "audit-history",
  "audit-filter",
  "audit-details",
  "maintenance",
  "maintenance-controls",
  "changelog",
  "changelog-controls",
  "smtp-unavailable",
  "ken-stage",
  "lane-state",
  "category-symbol",
  "illustration-fallback",
  "empty",
  "error",
  "validation",
  "loading",
  "partial",
  "success",
  "comments",
  "comment-reply",
  "comment-collapse",
  "comment-sort",
  "votes",
  "pulse-controls",
  "voice-controls",
  "sponsor",
  "sponsor-modes",
  "abstract",
  "focus-visible",
  "skip-link",
] as const;

const REQUIRED_ROUTES = [
  "/",
  "/kens",
  "/submit",
  "/discuss",
  "/profiles",
  "/governance",
  "/economics",
  "/faq",
  "/glossary",
  "/about#changelog",
  "/verification",
  "/auth",
  "/forgot-password",
  "/reset?token=visual-audit-invalid",
  "/verify?token=visual-audit-invalid",
  "/account",
  "/admin",
  "/reviews",
  "/changelog",
  "/about/changelog",
  "/visual-audit-not-found",
] as const;

function authForRoute(route: string): AuthState {
  if (route.startsWith("/admin")) return "admin";
  if (route.startsWith("/account")) return "user";
  return "anonymous";
}

function routeTarget(input: {
  route: string;
  state?: string;
  auth?: AuthState;
  source: RouteTarget["source"];
  coverageTier?: RouteTarget["coverageTier"];
  themes: ThemeMode[];
  viewports: string[];
  interaction?: string;
}): RouteTarget {
  const state = input.state ?? "default";
  const auth = input.auth ?? authForRoute(input.route);
  return {
    key: safeKey(`${auth}-${input.route}-${state}`),
    route: input.route,
    auth,
    coverageTier: input.coverageTier ?? "canonical",
    state,
    source: input.source,
    themes: input.themes,
    viewports: input.viewports,
    ...(input.interaction ? { interaction: input.interaction } : {}),
  };
}

function specialTargets(
  inventory: ProtectedInventory,
  viewportNames: string[],
  scope: AuditConfig["scope"],
): RouteTarget[] {
  const mobile = viewportNames.filter((name) => name.startsWith("mobile-"));
  const desktop = viewportNames.filter((name) => name.startsWith("desktop-") || name === "tablet-portrait");
  const focused = desktop.includes("desktop-1440") ? ["desktop-1440"] : desktop.slice(0, 1);
  const compact = mobile.includes("mobile-390") ? ["mobile-390"] : mobile.slice(0, 1);
  const sampleKen = inventory.routes.kens[0] ?? "/kens";
  const discussionKen = inventory.kens.find((ken) => ken.hasComments);
  const commentRoute = discussionKen ? `/kens/${encodeURIComponent(discussionKen.slug)}` : sampleKen;
  const fallbackKen = inventory.kens.find((ken) => !ken.illustrationUrl);
  const uploadedKen = inventory.kens.find((ken) => ken.illustrationSource === "uploaded");
  const examples: RouteTarget[] = [
    routeTarget({ route: "/", auth: "user", state: "signed-in-user", source: "required", themes: ["oled"], viewports: [...focused, ...compact] }),
    routeTarget({ route: "/", auth: "moderator", state: "signed-in-moderator", source: "required", themes: ["oled"], viewports: focused }),
    routeTarget({ route: "/", auth: "admin", state: "signed-in-admin", source: "required", themes: ["oled"], viewports: focused }),
    routeTarget({ route: "/", auth: "owner", state: "signed-in-owner", source: "required", themes: ["oled"], viewports: focused }),
    routeTarget({ route: "/", state: "mobile-menu-open", source: "required", themes: ["light", "oled"], viewports: compact, interaction: "mobile-menu" }),
    routeTarget({ route: "/", auth: "user", state: "profile-menu-open", source: "required", themes: ["light", "oled"], viewports: focused, interaction: "profile-menu" }),
    routeTarget({ route: "/", state: "header-search-open", source: "required", themes: ["oled"], viewports: [...focused, ...compact], interaction: "header-search" }),
    routeTarget({ route: "/", state: "header-search-results", source: "required", themes: ["light", "oled"], viewports: focused, interaction: "header-search-results" }),
    routeTarget({ route: "/", state: "header-search-empty", source: "required", themes: ["oled"], viewports: compact, interaction: "header-search-empty" }),
    routeTarget({ route: "/kens", state: "feed-filters", source: "required", themes: ["light", "oled"], viewports: [...focused, ...compact], interaction: "feed-filters" }),
    routeTarget({ route: "/kens?q=safety&tier=months", state: "feed-filter-reset", source: "required", themes: ["oled"], viewports: [...focused, ...compact], interaction: "feed-filter-reset" }),
    routeTarget({ route: "/faq", state: "faq-search", source: "required", themes: ["light", "oled"], viewports: [...focused, ...compact], interaction: "faq-search" }),
    routeTarget({ route: "/faq", state: "faq-category", source: "required", themes: ["oled"], viewports: focused, interaction: "faq-category" }),
    routeTarget({ route: "/faq#what-is-a-ken", state: "faq-deep-link", source: "required", themes: ["light", "oled"], viewports: [...focused, ...compact] }),
    routeTarget({ route: "/faq?q=visual-audit-definitely-no-match", state: "faq-empty", source: "required", themes: ["oled"], viewports: focused }),
    routeTarget({ route: "/glossary", state: "glossary-search", source: "required", themes: ["light", "oled"], viewports: [...focused, ...compact], interaction: "glossary-search" }),
    routeTarget({ route: "/glossary", state: "glossary-status", source: "required", themes: ["oled"], viewports: focused, interaction: "glossary-status" }),
    routeTarget({ route: "/glossary#ken", state: "glossary-deep-link", source: "required", themes: ["light", "oled"], viewports: [...focused, ...compact] }),
    routeTarget({ route: "/glossary?q=visual-audit-definitely-no-match", state: "glossary-empty", source: "required", themes: ["oled"], viewports: focused }),
    routeTarget({ route: "/faq#contact", state: "contact-form", source: "required", themes: ["oled"], viewports: [...focused, ...compact], interaction: "contact-form" }),
    routeTarget({ route: "/admin", auth: "moderator", state: "moderation-review", source: "required", themes: ["oled"], viewports: focused }),
    routeTarget({ route: "/admin#category-proposals", auth: "moderator", state: "review-queue", source: "required", themes: ["light"], viewports: focused }),
    routeTarget({ route: "/admin#ken-submissions", auth: "admin", state: "ken-review-queue", source: "required", themes: ["oled"], viewports: focused }),
    routeTarget({ route: "/admin#category-proposals", auth: "moderator", state: "category-review-queue", source: "required", themes: ["oled"], viewports: focused }),
    routeTarget({ route: "/reviews", state: "appeal-state", source: "required", themes: ["light", "oled"], viewports: focused }),
    routeTarget({ route: "/admin", auth: "admin", state: "admin-dashboard", source: "required", themes: ["light", "oled"], viewports: [...focused, ...compact] }),
    routeTarget({ route: "/admin", auth: "owner", state: "owner-controls", source: "required", themes: ["oled"], viewports: focused }),
    routeTarget({ route: "/admin#visitor-map", auth: "admin", state: "visitor-map", source: "required", themes: ["light", "oled"], viewports: [...focused, ...compact], interaction: "visitor-map" }),
    routeTarget({ route: "/admin#historical-analytics", auth: "admin", state: "historical-analytics", source: "required", themes: ["oled"], viewports: [...focused, ...compact] }),
    routeTarget({ route: "/admin#audit-log", auth: "owner", state: "audit-history", source: "required", themes: ["light"], viewports: focused, interaction: "audit-details" }),
    routeTarget({ route: "/admin#audit-log", auth: "admin", state: "audit-filter", source: "required", themes: ["oled"], viewports: focused, interaction: "audit-filter" }),
    routeTarget({ route: "/admin#audit-log", auth: "owner", state: "audit-details", source: "required", themes: ["oled"], viewports: focused, interaction: "audit-details" }),
    routeTarget({ route: "/admin#maintenance-controls", auth: "owner", state: "maintenance-controls", source: "required", themes: ["oled"], viewports: focused }),
    routeTarget({ route: "/about#changelog", state: "changelog", source: "required", themes: ["light", "oled"], viewports: [...focused, ...compact] }),
    routeTarget({ route: "/admin#changelog-controls", auth: "owner", state: "changelog-controls", source: "required", themes: ["oled"], viewports: focused }),
    routeTarget({ route: "/admin#smtp-status", auth: "owner", state: "smtp-unavailable", source: "required", themes: ["oled"], viewports: focused }),
    routeTarget({ route: "/visual-audit/loading", state: "loading", source: "required", themes: ["light", "oled"], viewports: [...focused, ...compact] }),
    routeTarget({ route: "/visual-audit/error", state: "error", source: "required", themes: ["light", "oled"], viewports: [...focused, ...compact] }),
    routeTarget({ route: "/visual-audit/maintenance", state: "maintenance", source: "required", themes: ["oled"], viewports: [...focused, ...compact] }),
    routeTarget({ route: "/visual-audit/validation", state: "validation", source: "required", themes: ["light", "oled"], viewports: [...focused, ...compact] }),
    routeTarget({ route: "/visual-audit/partial", state: "partial", source: "required", themes: ["oled"], viewports: focused }),
    routeTarget({ route: "/visual-audit/success", state: "success", source: "required", themes: ["oled"], viewports: focused }),
    routeTarget({ route: "/kens?q=visual-audit-definitely-no-match", state: "empty", source: "required", themes: ["light", "oled"], viewports: [...focused, ...compact] }),
    routeTarget({ route: commentRoute, state: "comments", source: "required", themes: ["oled"], viewports: focused, interaction: "comments" }),
    routeTarget({ route: commentRoute, auth: "user", state: "comment-reply", source: "required", themes: ["oled"], viewports: focused, interaction: "comment-reply" }),
    routeTarget({ route: commentRoute, state: "comment-collapse", source: "required", themes: ["light"], viewports: focused, interaction: "comment-collapse" }),
    routeTarget({ route: commentRoute, state: "comment-sort", source: "required", themes: ["oled"], viewports: focused, interaction: "comment-sort" }),
    routeTarget({ route: sampleKen, auth: "user", state: "votes", source: "required", themes: ["light"], viewports: focused, interaction: "votes" }),
    routeTarget({ route: sampleKen, auth: "user", state: "pulse-controls", source: "required", themes: ["oled"], viewports: focused, interaction: "pulse-controls" }),
    routeTarget({ route: sampleKen, auth: "user", state: "voice-controls", source: "required", themes: ["light"], viewports: focused, interaction: "voice-controls" }),
    routeTarget({ route: "/economics", state: "sponsor", source: "required", themes: ["oled"], viewports: focused, interaction: "sponsor" }),
    routeTarget({ route: "/economics", state: "sponsor-modes", source: "required", themes: ["light", "oled"], viewports: [...focused, ...compact], interaction: "sponsor-modes" }),
    routeTarget({ route: sampleKen, state: "category-symbol", source: "required", themes: ["light", "oled"], viewports: [...focused, ...compact] }),
    routeTarget({ route: "/submit", auth: "user", state: "ken-proposal-validation", source: "required", themes: ["oled"], viewports: focused, interaction: "ken-proposal-validation" }),
    routeTarget({ route: "/submit", auth: "user", state: "category-proposal-form", source: "required", themes: ["light", "oled"], viewports: [...focused, ...compact], interaction: "category-proposal-form" }),
    routeTarget({ route: "/submit", auth: "user", state: "category-proposal-validation", source: "required", themes: ["oled"], viewports: focused, interaction: "category-proposal-validation" }),
    routeTarget({ route: "/governance", state: "abstract", source: "required", themes: ["light", "oled"], viewports: [...focused, ...compact], interaction: "abstract" }),
    routeTarget({ route: "/", state: "focus-visible", source: "required", themes: ["light", "oled"], viewports: [...focused, ...compact], interaction: "focus-visible" }),
    routeTarget({ route: "/", state: "skip-link", source: "required", themes: ["oled"], viewports: focused, interaction: "skip-link" }),
  ];
  if (fallbackKen) examples.push(routeTarget({
    route: `/kens/${encodeURIComponent(fallbackKen.slug)}`,
    state: "illustration-fallback",
    source: "database",
    themes: ["light", "oled"],
    viewports: [...focused, ...compact],
  }));
  if (uploadedKen) examples.push(routeTarget({
    route: `/kens/${encodeURIComponent(uploadedKen.slug)}`,
    state: "illustration-uploaded",
    source: "database",
    themes: ["light", "oled"],
    viewports: [...focused, ...compact],
  }));

  for (const stage of inventory.states.taskStages) {
    const ken = inventory.kens.find((candidate) => candidate.stage === stage);
    if (ken) examples.push(routeTarget({
      route: `/kens/${encodeURIComponent(ken.slug)}`,
      state: `ken-stage:${stage}`,
      source: "database",
      themes: ["oled"],
      viewports: focused,
    }));
  }
  for (const lane of inventory.taxonomy.lanes) {
    examples.push(routeTarget({
      route: `/kens?tier=${encodeURIComponent(lane)}`,
      state: `lane-state:${lane}`,
      source: "database",
      themes: ["oled"],
      viewports: focused,
    }));
  }
  if (scope === "smoke") {
    const smokeStates = new Set([
      "signed-in-user",
      "mobile-menu-open",
      "header-search-open",
      "feed-filters",
      "faq-search",
      "admin-dashboard",
      "loading",
      "error",
      "maintenance",
      "empty",
      "focus-visible",
    ]);
    return examples.filter((target) => smokeStates.has(target.state));
  }
  return examples;
}

export function buildCoveragePlan(input: {
  config: AuditConfig;
  inventory: ProtectedInventory;
  inventoryDigest: string;
  browserVersion: string;
  renderedRoutes?: string[];
  retainedRenderedCaptureRoutes?: string[];
  phase?: CoveragePlanPhase;
  seedCaptureCount?: number;
  convergenceIteration?: number;
}): CoveragePlan {
  const source = scanSourceRoutes(input.config.repoRoot);
  const expanded = expandSourceRoutes(source, input.inventory);
  const allViewportNames = VIEWPORTS.map((viewport) => viewport.name);
  const viewportNames = input.config.scope === "full"
    ? allViewportNames
    : ["desktop-1440", "mobile-390"];
  const themes: ThemeMode[] = ["light", "oled"];
  const isLegacyRedirect = (route: string) => (
    route === "/changelog"
    || route === "/about/changelog"
    || route === "/people"
    || route === "/tasks"
    || route.startsWith("/tasks/")
  );

  const databaseRoutes = [
    ...input.inventory.routes.kens,
    ...input.inventory.routes.profiles,
    ...input.inventory.routes.discussions,
    ...input.inventory.taxonomy.categories.map((slug) => `/kens?category=${encodeURIComponent(slug)}`),
    ...input.inventory.taxonomy.lanes.map((slug) => `/kens?tier=${encodeURIComponent(slug)}`),
  ];
  const canonical = new Map<string, RouteTarget>();
  const canonicalCandidates = input.config.scope === "full"
    ? [...REQUIRED_ROUTES, ...expanded.routes, ...databaseRoutes]
    : [
      "/",
      "/kens",
      input.inventory.routes.kens[0] ?? "/kens",
      "/faq",
      "/about#changelog",
      "/auth",
      "/admin",
      "/visual-audit-not-found",
    ];
  for (const route of canonicalCandidates) {
    const sourceType = databaseRoutes.includes(route) ? "database" : "source";
    const legacyRedirect = isLegacyRedirect(route);
    const target = routeTarget({
      route,
      ...(legacyRedirect ? { state: "legacy-redirect" } : {}),
      source: sourceType,
      coverageTier: legacyRedirect ? "special" : "canonical",
      themes: legacyRedirect ? ["oled"] : themes,
      viewports: legacyRedirect ? ["desktop-1440"] : viewportNames,
    });
    canonical.set(target.key, target);
  }
  for (const target of specialTargets(input.inventory, viewportNames, input.config.scope)) {
    canonical.set(target.key, target);
  }

  const renderedRoutes = [...new Set(input.renderedRoutes ?? [])].sort();
  const uncoveredRenderedRoutes = renderedRoutes
    .filter((route) => ![...canonical.values()].some((target) => target.route === route));
  const discoveredViewports = viewportNames.includes("mobile-390")
    ? ["desktop-1440", "mobile-390"]
    : [viewportNames[0] ?? "desktop-1440"];
  const retainedRenderedCaptureRoutes = [...new Set(input.retainedRenderedCaptureRoutes ?? [])]
    .sort((left, right) => left.localeCompare(right))
    .filter((route) => uncoveredRenderedRoutes.includes(route));
  const renderedCaptureRoutes = input.config.scope === "full"
    ? uncoveredRenderedRoutes
    : [
      ...retainedRenderedCaptureRoutes,
      ...uncoveredRenderedRoutes.filter((route) => !retainedRenderedCaptureRoutes.includes(route)),
    ].slice(0, 4);
  for (const route of renderedCaptureRoutes) {
    const target = routeTarget({
      route,
      source: "rendered",
      coverageTier: "discovered",
      themes: ["oled"],
      viewports: discoveredViewports,
    });
    canonical.set(target.key, target);
  }

  const targets = [...canonical.values()].sort((left, right) => left.key.localeCompare(right.key));
  const targetRoutes = new Set(targets.map((target) => target.route));
  const routeDispositions = renderedRoutes.map((route) => {
    if (targetRoutes.has(route)) {
      return {
        route,
        disposition: "captured" as const,
        representativeRoute: route,
        reason: "Exact source, database, required, or rendered-link target.",
      };
    }
    let pathname = "/";
    try {
      pathname = new URL(route, "https://audit.invalid").pathname;
    } catch {
      // The rendered-link collector emits URL-safe paths; root is a conservative representative.
    }
    const representativeRoute = [...targetRoutes].find((candidate) => {
      try {
        return new URL(candidate, "https://audit.invalid").pathname === pathname;
      } catch {
        return false;
      }
    }) ?? "/";
    return {
      route,
      disposition: "equivalent" as const,
      representativeRoute,
      reason: "Smoke scope samples one representative for equivalent rendered-link query or anchor states.",
    };
  });
  const requiredStates: string[] = [
    ...REQUIRED_VISUAL_STATES,
    ...input.inventory.states.taskStages.map((stage) => `ken-stage:${stage}`),
    ...input.inventory.taxonomy.lanes.map((lane) => `lane-state:${lane}`),
  ];
  if (input.inventory.states.hasUploadedIllustration) requiredStates.push("illustration-uploaded");
  if (!input.inventory.states.hasFallbackIllustration) {
    requiredStates.splice(requiredStates.indexOf("illustration-fallback"), 1);
  }
  if (!input.inventory.states.hasComments) {
    for (const state of ["comments", "comment-reply", "comment-collapse", "comment-sort"] as const) {
      const index = requiredStates.indexOf(state);
      if (index >= 0) requiredStates.splice(index, 1);
    }
  }
  const expectedCaptureCount = targets.reduce(
    (total, target) => total + target.themes.length * target.viewports.length,
    0,
  );
  const phase = input.phase ?? "initial";
  return stampCoveragePlan({
    schemaVersion: 2,
    runId: input.config.runId,
    generatedAt: new Date().toISOString(),
    mode: input.config.targetMode,
    scope: input.config.scope,
    evidenceTier: input.config.evidenceTier,
    dataProvenance: input.config.dataProvenance,
    expectedCommit: input.config.expectedCommit,
    viewportMatrixDigest: input.config.viewportMatrixDigest,
    acceleratorRecord: input.config.acceleratorRecord,
    browserVersion: input.browserVersion,
    inventoryDigest: input.inventoryDigest,
    phase,
    seedCaptureCount: input.seedCaptureCount ?? expectedCaptureCount,
    convergenceIteration: input.convergenceIteration ?? (phase === "initial" ? 0 : 1),
    sourceRoutes: [...new Set(expanded.routes)].sort(),
    databaseRoutes: [...new Set(databaseRoutes)].sort(),
    renderedRoutes,
    assetRoutes: input.inventory.assets.map((asset) => asset.url).sort(),
    unresolvedDynamicPatterns: [...new Set(expanded.unresolved)].sort(),
    routeDispositions,
    samplingRationale: input.config.scope === "full"
      ? "Every discovered same-origin link not already represented by an exact target receives OLED desktop/mobile capture; exact canonical source/database routes receive the full Light/OLED viewport matrix."
      : "Smoke scope captures four otherwise-uncovered rendered links and records pathname-equivalent representatives for the remainder; it is not release evidence.",
    requiredStates: input.config.scope === "full"
      ? [...new Set(requiredStates)].sort()
      : [
        "light-theme",
        "oled-theme",
        "anonymous",
        "signed-in-user",
        "admin-dashboard",
        "mobile-menu-open",
        "header-search-open",
        "feed-filters",
        "faq-search",
        "loading",
        "error",
        "maintenance",
        "empty",
        "focus-visible",
      ],
    targets,
    expectedCaptureCount,
  });
}
