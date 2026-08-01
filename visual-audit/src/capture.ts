import path from "node:path";

import type {
  Browser,
  BrowserContext,
  Page,
  Response,
} from "playwright";
import sharp from "sharp";

import { inspectAccessibility } from "./accessibility.js";
import type { StoredAuthStates } from "./auth.js";
import type { AuditConfig } from "./config.js";
import { VIEWPORTS } from "./config.js";
import { classifyCaptureRequest } from "./policy.js";
import { settlePage } from "./settle.js";
import {
  captureScrollableElement,
  overlappingPositions,
  stitchVerticalTiles,
  tileRecords,
  TILE_OVERLAP_RATIO,
  type CapturedTile,
} from "./stitch.js";
import type {
  CaptureRecord,
  CoveragePlan,
  DiagnosticRecord,
  RequestSecuritySummary,
  RouteTarget,
  ThemeMode,
  TileManifest,
  ViewportProfile,
} from "./types.js";
import {
  ensureDirectory,
  fileSha256,
  relativePosix,
  safeKey,
  sha256,
  writeJson,
} from "./util.js";

interface CaptureJob {
  key: string;
  target: RouteTarget;
  theme: ThemeMode;
  viewport: ViewportProfile;
}

interface CaptureAccumulator {
  captures: CaptureRecord[];
  diagnostics: DiagnosticRecord[];
  renderedLinks: Set<string>;
}

function now() {
  return new Date().toISOString();
}

function addDiagnostic(
  accumulator: CaptureAccumulator,
  job: CaptureJob,
  kind: DiagnosticRecord["kind"],
  severity: DiagnosticRecord["severity"],
  message: string,
  expected = false,
) {
  accumulator.diagnostics.push({
    timestamp: now(),
    route: job.target.route,
    captureKey: job.key,
    kind,
    severity,
    message,
    expected,
  });
}

export function expandCaptureJobs(plan: CoveragePlan): CaptureJob[] {
  const viewports = new Map(VIEWPORTS.map((viewport) => [viewport.name, viewport]));
  return plan.targets.flatMap((target) => target.themes.flatMap((theme) => (
    target.viewports.map((viewportName) => {
      const viewport = viewports.get(viewportName);
      if (!viewport) throw new Error(`Coverage plan references unknown viewport ${viewportName}.`);
      return {
        key: safeKey(`${target.key}-${theme}-${viewport.name}`),
        target,
        theme,
        viewport,
      };
    })
  ))).sort((left, right) => left.key.localeCompare(right.key));
}

async function installCapturePolicy(
  context: BrowserContext,
  config: AuditConfig,
  security: RequestSecuritySummary,
  accumulator: CaptureAccumulator,
) {
  await context.route("**/*", async (route) => {
    const request = route.request();
    const classification = classifyCaptureRequest({
      method: request.method(),
      requestUrl: request.url(),
      baseUrl: config.baseUrl,
      allowedCrossOriginHosts: config.allowedCrossOriginHosts,
    });
    if (classification.action === "block-unsafe") {
      security.blockedUnsafeRequests += 1;
      accumulator.diagnostics.push({
        timestamp: now(),
        route: new URL(request.url()).pathname,
        captureKey: null,
        kind: "unsafe-request",
        severity: "serious",
        message: `Blocked ${request.method()} ${request.url()} before network dispatch.`,
        expected: false,
      });
      await route.abort("blockedbyclient");
      return;
    }
    if (classification.action === "block-cross-origin") {
      security.blockedCrossOriginRequests += 1;
      accumulator.diagnostics.push({
        timestamp: now(),
        route: new URL(request.url()).pathname,
        captureKey: null,
        kind: "cross-origin-request",
        severity: "info",
        message: `Blocked cross-origin request to ${new URL(request.url()).origin}.`,
        expected: true,
      });
      await route.abort("blockedbyclient");
      return;
    }
    if (!classification.attachAuditHeaders) {
      security.allowedCrossOriginRequests += 1;
      await route.continue();
      return;
    }
    const headers = {
      ...request.headers(),
      "x-kenmatch-audit-readonly": "1",
      "x-kenmatch-audit-token": config.auditToken,
    };
    await route.continue({ headers });
  });
}

async function performInteraction(page: Page, target: RouteTarget) {
  switch (target.interaction) {
    case "mobile-menu":
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("dialog", { name: "Site navigation" }).waitFor({ state: "visible" });
      break;
    case "profile-menu":
      await page.getByRole("button", { name: /Open account menu/ }).click();
      await page.getByRole("menu", { name: "Account menu" }).waitFor({ state: "visible" });
      break;
    case "header-search":
      await page.getByRole("button", { name: "Open search" }).click();
      await page.getByRole("dialog", { name: "Sitewide search" }).waitFor({ state: "visible" });
      break;
    case "header-search-results": {
      await page.getByRole("button", { name: "Open search" }).click();
      const dialog = page.getByRole("dialog", { name: "Sitewide search" });
      await dialog.getByRole("textbox", { name: "Sitewide search" }).fill("Ken");
      await dialog.locator(".search-result").first().waitFor({ state: "visible" });
      break;
    }
    case "header-search-empty": {
      await page.getByRole("button", { name: "Open search" }).click();
      const dialog = page.getByRole("dialog", { name: "Sitewide search" });
      await dialog.getByRole("textbox", { name: "Sitewide search" }).fill("visual-audit-definitely-no-match");
      await dialog.getByText("No matches. Try a different keyword.").waitFor({ state: "visible" });
      break;
    }
    case "feed-filters": {
      const input = page.getByRole("textbox", { name: "Search Kens" });
      await input.fill("safety");
      await page.waitForTimeout(450);
      break;
    }
    case "feed-filter-reset":
      await page.getByRole("button", { name: "Reset filters" }).click();
      await page.waitForURL((url) => !url.searchParams.has("q") && !url.searchParams.has("tier"));
      break;
    case "faq-search": {
      const input = page.getByRole("textbox", { name: "Search FAQ" });
      await input.fill("lane");
      const first = page.locator(".faq-list details").first();
      if (await first.count()) await first.locator("summary").click();
      break;
    }
    case "faq-category":
      await page.getByRole("button", { name: "Safety", exact: true }).click();
      await page.locator(".faq-list details").first().waitFor({ state: "visible" });
      break;
    case "glossary-search":
      await page.getByRole("textbox", { name: "Search glossary" }).fill("checkpoint");
      break;
    case "glossary-status":
      await page.getByRole("button", { name: "Operational", exact: true }).click();
      await page.locator(".glossary-list details").first().waitFor({ state: "visible" });
      break;
    case "contact-form": {
      const form = page.locator("#contact form, form").last();
      await form.scrollIntoViewIfNeeded();
      const title = form.locator('input[name="title"]').first();
      if (await title.count()) await title.focus();
      break;
    }
    case "ken-proposal-validation":
      await page.getByRole("button", { name: "Submit Ken for review" }).click();
      await page.locator("form").first().locator(":invalid").first().waitFor({ state: "visible" });
      break;
    case "category-proposal-form":
      await page.locator("form.category-proposal-panel").scrollIntoViewIfNeeded();
      await page.locator('form.category-proposal-panel input[name="name"]').focus();
      break;
    case "category-proposal-validation":
      await page.getByRole("button", { name: "Propose category" }).click();
      await page.locator("form.category-proposal-panel :invalid").first().waitFor({ state: "visible" });
      break;
    case "comments":
      await page.getByText(/discussion|comments/i).last().scrollIntoViewIfNeeded().catch(() => undefined);
      break;
    case "comment-reply":
      await page.getByRole("button", { name: "Reply", exact: true }).first().click();
      await page.getByRole("textbox", { name: "Reply text" }).first().waitFor({ state: "visible" });
      break;
    case "comment-collapse":
      await page.getByTitle("Collapse thread").first().click();
      await page.getByTitle("Expand thread").first().waitFor({ state: "visible" });
      break;
    case "comment-sort":
      await page.getByRole("button", { name: "New", exact: true }).click();
      await page.locator(".comment-tree").scrollIntoViewIfNeeded();
      break;
    case "votes":
      await page.getByText(/voice|vote/i).first().scrollIntoViewIfNeeded().catch(() => undefined);
      break;
    case "pulse-controls":
      await page.getByRole("heading", { name: "Forum-style signal" }).scrollIntoViewIfNeeded();
      break;
    case "voice-controls": {
      await page.getByRole("heading", { name: /Spend limited voice/ }).scrollIntoViewIfNeeded();
      const range = page.locator('input[type="range"]').first();
      if (await range.isEnabled()) await range.fill("2");
      break;
    }
    case "sponsor":
      await page.getByText(/sponsor|backing/i).last().scrollIntoViewIfNeeded().catch(() => undefined);
      break;
    case "sponsor-modes": {
      const form = page.getByRole("heading", { name: "Fund useful work without buying rank" }).locator("xpath=ancestor::form");
      await form.scrollIntoViewIfNeeded();
      await form.getByLabel("Restriction scope").selectOption("safety-reserve");
      break;
    }
    case "visitor-map": {
      const map = page.getByRole("region", { name: "Interactive visitor geography" });
      await map.scrollIntoViewIfNeeded();
      const country = map.locator(".visitor-country-list button").first();
      if (await country.count()) await country.click();
      break;
    }
    case "audit-filter":
      await page.getByLabel("Search events").fill("auth");
      await page.getByLabel("Rows per page").selectOption("25");
      break;
    case "audit-details": {
      const section = page.locator("#audit-log");
      await section.scrollIntoViewIfNeeded();
      const disclosure = section.locator("details").first();
      if (await disclosure.count()) await disclosure.locator("summary").click();
      break;
    }
    case "abstract": {
      const map = page.locator(".ken-lifecycle-map").first();
      await map.scrollIntoViewIfNeeded();
      await map.locator(".lifecycle-stage-button").nth(3).click();
      break;
    }
    case "focus-visible":
      await page.keyboard.press("Tab");
      break;
    case "skip-link":
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      break;
    default:
      break;
  }
}

async function collectRenderedLinks(page: Page, baseUrl: string) {
  return page.evaluate((origin) => {
    const base = new URL(origin);
    return [...document.querySelectorAll<HTMLAnchorElement>("a[href]")]
      .map((anchor) => {
        try {
          const url = new URL(anchor.href, base);
          if (url.origin !== base.origin || url.pathname.startsWith("/api/")) return null;
          const preservedHash = url.pathname === "/about" && url.hash === "#changelog"
            ? url.hash
            : "";
          return `${url.pathname}${url.search}${preservedHash}`;
        } catch {
          return null;
        }
      })
      .filter((value): value is string => Boolean(value));
  }, baseUrl).then((links) => [...new Set(links)].sort());
}

async function collectAssetUrls(page: Page, baseUrl: string) {
  return page.evaluate((origin) => {
    const base = new URL(origin);
    const urls = new Set<string>();
    for (const element of document.querySelectorAll<HTMLImageElement | HTMLSourceElement | HTMLVideoElement>(
      "img[src],source[src],video[src],video[poster]",
    )) {
      const raw = element.getAttribute("src") ?? element.getAttribute("poster");
      if (!raw) continue;
      try {
        const url = new URL(raw, base);
        if (url.origin === base.origin) urls.add(`${url.pathname}${url.search}`);
      } catch {
        // Invalid URLs are reported by broken-asset diagnostics.
      }
    }
    return [...urls].sort();
  }, baseUrl);
}

async function inspectRenderedAssets(page: Page) {
  return page.evaluate(() => {
    const visible = (element: Element) => {
      const node = element as HTMLElement;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return rect.width > 0
        && rect.height > 0
        && style.display !== "none"
        && style.visibility !== "hidden";
    };
    const broken = [...document.querySelectorAll<HTMLImageElement>("img")]
      .filter((image) => visible(image) && (!image.complete || image.naturalWidth === 0))
      .map((image) => image.currentSrc || image.src || "(missing src)");
    const placeholders = [...document.querySelectorAll<HTMLElement>(
      '[class*="placeholder"],[data-placeholder],.skeleton',
    )]
      .filter(visible)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: element.className,
        text: element.textContent?.trim().slice(0, 120) ?? "",
      }));
    return { broken, placeholders };
  });
}

async function markScrollContainers(page: Page) {
  return page.evaluate(() => {
    const scrollables = [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((element) => {
        const style = getComputedStyle(element);
        return element.scrollHeight > element.clientHeight + 2
          && ["auto", "scroll"].includes(style.overflowY)
          && element.clientHeight >= 80
          && element.clientWidth >= 120;
      })
      .slice(0, 12);
    return scrollables.map((element, index) => {
      const selector = `audit-scroll-${index}`;
      element.dataset.visualAuditScroll = selector;
      return selector;
    });
  });
}

async function captureTiles(
  page: Page,
  config: AuditConfig,
  job: CaptureJob,
) {
  const rawDirectory = path.join(config.runRoot, "png", "raw", job.key);
  const stitchedFile = path.join(config.runRoot, "png", `${job.key}.png`);
  ensureDirectory(rawDirectory);
  ensureDirectory(path.dirname(stitchedFile));

  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    height: Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      document.documentElement.clientHeight,
    ),
  }));
  if (dimensions.height > config.maxPageCssHeight) {
    throw new Error(`Page height ${dimensions.height}px exceeds MAX_PAGE_CSS_HEIGHT=${config.maxPageCssHeight}.`);
  }
  const viewportOnly = Boolean(
    job.target.interaction
    || job.target.route.includes("#")
    || ["loading", "error", "maintenance", "partial", "success"].includes(job.target.state),
  );
  const captureHeight = viewportOnly ? job.viewport.height : dimensions.height;
  const positions = viewportOnly ? [0] : overlappingPositions(captureHeight, job.viewport.height);
  const tiles: CapturedTile[] = [];
  for (let index = 0; index < positions.length; index += 1) {
    const position = positions[index] ?? 0;
    if (!viewportOnly) await page.evaluate((top) => window.scrollTo(0, top), position);
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    });
    const file = path.join(rawDirectory, `page-${String(index).padStart(4, "0")}.png`);
    await page.screenshot({
      path: file,
      animations: "disabled",
      caret: "hide",
      fullPage: false,
    });
    const metadata = await sharp(file).metadata();
    tiles.push({
      file,
      position,
      width: metadata.width ?? Math.ceil(job.viewport.width * job.viewport.deviceScaleFactor),
      height: metadata.height ?? Math.ceil(job.viewport.height * job.viewport.deviceScaleFactor),
    });
  }
  if (!viewportOnly) await page.evaluate(() => window.scrollTo(0, 0));
  const stitched = await stitchVerticalTiles({
    tiles,
    sourceCssHeight: captureHeight,
    viewportCssHeight: job.viewport.height,
    deviceScaleFactor: job.viewport.deviceScaleFactor,
    outputFile: stitchedFile,
    runRoot: config.runRoot,
  });

  const scrollContainers = [];
  const selectors = viewportOnly ? [] : await markScrollContainers(page);
  for (let index = 0; index < selectors.length; index += 1) {
    const selector = selectors[index];
    if (!selector) continue;
    const container = await captureScrollableElement({
      element: page.locator(`[data-visual-audit-scroll="${selector}"]`),
      selector: `[data-visual-audit-scroll="${selector}"]`,
      outputDirectory: path.join(rawDirectory, `scroll-${String(index).padStart(2, "0")}`),
      outputFile: path.join(config.runRoot, "png", "scroll-containers", `${job.key}-${String(index).padStart(2, "0")}.png`),
      runRoot: config.runRoot,
      deviceScaleFactor: job.viewport.deviceScaleFactor,
    });
    if (container) scrollContainers.push(container);
  }
  const tileManifest: TileManifest = {
    schemaVersion: 1,
    createdAt: now(),
    captureKey: job.key,
    sourceWidth: dimensions.width,
    sourceHeight: captureHeight,
    viewportWidth: job.viewport.width,
    viewportHeight: job.viewport.height,
    deviceScaleFactor: job.viewport.deviceScaleFactor,
    overlapRatio: TILE_OVERLAP_RATIO,
    tiles: tileRecords(tiles, config.runRoot, job.viewport.width, job.viewport.height),
    scrollContainers,
    seamCorrelations: stitched.seams,
    stitchedFile: relativePosix(config.runRoot, stitchedFile),
  };
  const tileManifestFile = path.join(rawDirectory, "tiles.json");
  writeJson(tileManifestFile, tileManifest);
  return {
    stitchedFile,
    tileManifestFile,
    pageHeight: dimensions.height,
    stitched,
  };
}

function expectedHttpError(route: string, status: number) {
  return status === 404 && (
    route.startsWith("/visual-audit-not-found")
    || route.startsWith("/reset?")
    || route.startsWith("/verify?")
  );
}

async function captureOne(input: {
  page: Page;
  config: AuditConfig;
  job: CaptureJob;
  accumulator: CaptureAccumulator;
  security: RequestSecuritySummary;
}) {
  const { page, config, job, accumulator, security } = input;
  let documentResponse: Response | null = null;
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      const expected = job.target.route.startsWith("/visual-audit-not-found")
        && message.text().includes("404");
      addDiagnostic(
        accumulator,
        job,
        "console",
        expected ? "info" : message.type() === "error" ? "serious" : "warning",
        message.text(),
        expected,
      );
    }
  });
  page.on("pageerror", (error) => {
    addDiagnostic(accumulator, job, "pageerror", "serious", error.message);
  });
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "unknown failure";
    const expected = failure.includes("ERR_BLOCKED_BY_CLIENT");
    addDiagnostic(
      accumulator,
      job,
      "requestfailed",
      expected ? "info" : "serious",
      `${request.method()} ${request.url()}: ${failure}`,
      expected,
    );
  });
  page.on("response", (response) => {
    if (response.request().resourceType() === "document") documentResponse = response;
    if (
      ["POST", "PUT", "PATCH", "DELETE"].includes(response.request().method().toUpperCase())
      && response.status() < 400
    ) {
      security.successfulUnsafeRequests += 1;
    }
    if (response.status() >= 400) {
      const expected = expectedHttpError(job.target.route, response.status());
      addDiagnostic(
        accumulator,
        job,
        "http-error",
        expected ? "info" : "serious",
        `HTTP ${response.status()} ${response.url()}`,
        expected,
      );
    }
  });

  const destination = new URL(job.target.route, config.baseUrl).toString();
  const navigation = await page.goto(destination, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });
  documentResponse = navigation ?? documentResponse;
  if (documentResponse?.headers()["x-kenmatch-audit-telemetry-suppressed"] !== "1") {
    security.telemetrySuppressed = false;
    addDiagnostic(
      accumulator,
      job,
      "security",
      "serious",
      "Document response did not attest audit telemetry suppression.",
    );
  }

  await settlePage(page);
  await performInteraction(page, job.target);
  const targetHash = new URL(destination).hash;
  if (targetHash && !job.target.interaction) {
    await page.locator(targetHash).first().scrollIntoViewIfNeeded().catch(() => undefined);
  }
  await page.waitForLoadState("networkidle", { timeout: 3_000 }).catch(() => undefined);
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });

  const [links, assetUrls, text, renderedAssets] = await Promise.all([
    collectRenderedLinks(page, config.baseUrl),
    collectAssetUrls(page, config.baseUrl),
    page.locator("body").innerText().catch(() => ""),
    inspectRenderedAssets(page),
  ]);
  for (const broken of renderedAssets.broken) {
    addDiagnostic(accumulator, job, "asset", "serious", `Visible image failed to load: ${broken}.`);
  }
  for (const placeholder of renderedAssets.placeholders) {
    const expected = job.target.state === "loading";
    addDiagnostic(
      accumulator,
      job,
      "placeholder",
      expected ? "info" : "serious",
      `Visible placeholder ${placeholder.tag}.${placeholder.className}: ${placeholder.text}`,
      expected,
    );
  }
  links.forEach((link) => accumulator.renderedLinks.add(link));
  const tileCapture = await captureTiles(page, config, job);
  const accessibility = await inspectAccessibility(page, job.viewport.isMobile);
  if (accessibility.horizontalOverflowPx > 1) {
    addDiagnostic(
      accumulator,
      job,
      "horizontal-overflow",
      "serious",
      `Document overflows horizontally by ${accessibility.horizontalOverflowPx}px.`,
    );
  }
  if (accessibility.undersizedTouchTargets > 0) {
    addDiagnostic(
      accumulator,
      job,
      "touch-target",
      "warning",
      `${accessibility.undersizedTouchTargets} visible controls are smaller than 44px in one dimension.`,
    );
  }
  for (const violation of accessibility.seriousViolations) {
    addDiagnostic(accumulator, job, "focus", "serious", `Accessibility violation: ${violation}.`);
  }
  const stats = await sharp(tileCapture.stitchedFile).stats();
  const colorSpread = stats.channels.slice(0, 3).reduce((sum, channel) => sum + channel.stdev, 0);
  if (text.trim().length < 20 || colorSpread < 1.5) {
    addDiagnostic(accumulator, job, "blank", "serious", `Capture appears blank (text=${text.trim().length}, spread=${colorSpread.toFixed(3)}).`);
  }
  for (const seam of tileCapture.stitched.seams) {
    if (!seam.passed) {
      addDiagnostic(accumulator, job, "seam", "serious", `Tile seam correlation ${seam.score.toFixed(4)} failed.`);
    }
  }

  const record: CaptureRecord = {
    key: job.key,
    createdAt: now(),
    route: job.target.route,
    finalUrl: page.url(),
    status: documentResponse?.status() ?? null,
    auth: job.target.auth,
    theme: job.theme,
    viewport: job.viewport.name,
    state: job.target.state,
    coverageTier: job.target.coverageTier,
    sensitive: job.target.auth !== "anonymous",
    stitchedFile: relativePosix(config.runRoot, tileCapture.stitchedFile),
    tileManifestFile: relativePosix(config.runRoot, tileCapture.tileManifestFile),
    width: tileCapture.stitched.width,
    height: tileCapture.stitched.height,
    deviceScaleFactor: job.viewport.deviceScaleFactor,
    pageHeight: tileCapture.pageHeight,
    contentDigest: sha256(`${text.replace(/\s+/g, " ").trim()}\n${assetUrls.join("\n")}`),
    accessibility,
    discoveredLinks: links,
    assetUrls,
  };
  accumulator.captures.push(record);
}

function groupJobs(jobs: CaptureJob[]) {
  const groups = new Map<string, CaptureJob[]>();
  for (const job of jobs) {
    const key = `${job.target.auth}:${job.theme}:${job.viewport.name}`;
    const group = groups.get(key) ?? [];
    group.push(job);
    groups.set(key, group);
  }
  return groups;
}

export async function runCaptures(input: {
  browser: Browser;
  config: AuditConfig;
  plan: CoveragePlan;
  authStates: StoredAuthStates;
  security: RequestSecuritySummary;
  existingCaptures?: CaptureRecord[];
  existingDiagnostics?: DiagnosticRecord[];
  existingRenderedLinks?: string[];
}) {
  const accumulator: CaptureAccumulator = {
    captures: [...(input.existingCaptures ?? [])],
    diagnostics: (input.existingDiagnostics ?? []).filter((diagnostic) => diagnostic.kind !== "duplicate"),
    renderedLinks: new Set<string>(input.existingRenderedLinks ?? []),
  };
  const completed = new Set(accumulator.captures.map((capture) => capture.key));
  const jobs = expandCaptureJobs(input.plan).filter((job) => !completed.has(job.key));

  for (const group of groupJobs(jobs).values()) {
    const first = group[0];
    if (!first) continue;
    const context = await input.browser.newContext({
      viewport: {
        width: first.viewport.width,
        height: first.viewport.height,
      },
      deviceScaleFactor: first.viewport.deviceScaleFactor,
      isMobile: first.viewport.isMobile,
      hasTouch: first.viewport.isMobile,
      colorScheme: first.theme === "light" ? "light" : "dark",
      reducedMotion: "no-preference",
      storageState: input.authStates[first.target.auth],
    });
    await context.addInitScript((theme) => {
      window.localStorage.setItem("kenmatch-theme", theme);
      if (document.documentElement) {
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme === "light" ? "light" : "dark";
      }
    }, first.theme);
    await installCapturePolicy(context, input.config, input.security, accumulator);
    try {
      for (const job of group) {
        const page = await context.newPage();
        try {
          await captureOne({
            page,
            config: input.config,
            job,
            accumulator,
            security: input.security,
          });
        } finally {
          await page.close();
        }
      }
    } finally {
      await context.close();
    }
  }

  const digestMap = new Map<string, CaptureRecord[]>();
  for (const capture of accumulator.captures) {
    const digest = fileSha256(path.join(input.config.runRoot, capture.stitchedFile));
    const matches = digestMap.get(digest) ?? [];
    matches.push(capture);
    digestMap.set(digest, matches);
  }
  for (const captures of digestMap.values()) {
    if (captures.length < 2) continue;
    const distinctRoutes = new Set(captures.map((capture) => capture.route));
    if (distinctRoutes.size < 2) continue;
    const expectedRedirectDuplicate = captures.some((capture) => (
      capture.route === "/changelog"
      || capture.route === "/about/changelog"
      || capture.route === "/people"
      || capture.route === "/tasks"
      || capture.route.startsWith("/tasks/")
    )) && new Set(captures.map((capture) => capture.finalUrl)).size === 1;
    for (const capture of captures) {
      accumulator.diagnostics.push({
        timestamp: now(),
        route: capture.route,
        captureKey: capture.key,
        kind: "duplicate",
        severity: expectedRedirectDuplicate ? "info" : "serious",
        message: expectedRedirectDuplicate
          ? `Pixel-identical capture is explained by a verified legacy redirect shared by ${captures.length} routes.`
          : `Pixel-identical capture shared by ${captures.length} distinct route captures.`,
        expected: expectedRedirectDuplicate,
      });
    }
  }
  return {
    captures: accumulator.captures.sort((left, right) => left.key.localeCompare(right.key)),
    diagnostics: accumulator.diagnostics,
    renderedLinks: [...accumulator.renderedLinks].sort(),
  };
}
