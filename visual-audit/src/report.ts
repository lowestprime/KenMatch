import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import PDFDocument from "pdfkit";
import sharp from "sharp";

import { loadConfig, type AuditConfig } from "./config.js";
import type {
  CaptureRecord,
  ComparisonReport,
  CoveragePlan,
  RunManifest,
} from "./types.js";
import {
  ensureDirectory,
  readJson,
  sha256,
  writeJson,
} from "./util.js";

interface ShareableApproval {
  reviewer: string;
  reviewedAt: string;
  captureKeys: string[];
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pickPrivateAtlasCaptures(captures: CaptureRecord[]) {
  const preferred = captures.filter((capture) => (
    capture.state !== "default"
    || ["desktop-1440", "mobile-390"].includes(capture.viewport)
  ));
  const selected = new Map<string, CaptureRecord>();
  for (const capture of preferred) {
    const key = capture.state !== "default"
      ? `state:${capture.state}:${capture.theme}:${capture.viewport}`
      : `route:${capture.route}:${capture.theme}:${capture.viewport}`;
    if (!selected.has(key)) selected.set(key, capture);
  }
  return [...selected.values()]
    .sort((left, right) => left.key.localeCompare(right.key))
    .slice(0, 180);
}

function readApproval(config: AuditConfig): ShareableApproval | null {
  if (!config.shareableApprovalFile || !fs.existsSync(config.shareableApprovalFile)) return null;
  const value = readJson<Partial<ShareableApproval>>(config.shareableApprovalFile);
  if (
    typeof value.reviewer !== "string"
    || !value.reviewer.trim()
    || typeof value.reviewedAt !== "string"
    || Number.isNaN(Date.parse(value.reviewedAt))
    || !Array.isArray(value.captureKeys)
    || value.captureKeys.some((key) => typeof key !== "string")
  ) {
    throw new Error("AUDIT_SHAREABLE_APPROVAL_FILE has an invalid structure.");
  }
  return {
    reviewer: value.reviewer.trim(),
    reviewedAt: value.reviewedAt,
    captureKeys: [...new Set(value.captureKeys)],
  };
}

function reportStyles() {
  return `
    :root{color-scheme:dark;background:#000;color:#f7f7fb;font-family:Inter,Arial,sans-serif}
    *{box-sizing:border-box}body{margin:0;background:#000;color:#f7f7fb}
    header{position:sticky;top:0;z-index:2;padding:18px 24px;border-bottom:1px solid #292534;background:#050507eF}
    h1,h2,h3,p{margin-top:0}h1{font-size:clamp(1.5rem,3vw,2.4rem)}
    main{padding:24px;max-width:1680px;margin:auto}.meta{color:#afb3c5;line-height:1.6}
    .toolbar{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
    input,select{background:#09090d;color:#fff;border:1px solid #3a3547;padding:10px;border-radius:6px}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,330px),1fr));gap:16px}
    article{min-width:0;border:1px solid #302a3b;background:#08080c;padding:12px;border-radius:6px}
    article img{display:block;width:100%;height:260px;object-fit:contain;background:#000;border:1px solid #211d29}
    code{overflow-wrap:anywhere;color:#9fc3ff}.badge{display:inline-block;margin:2px 4px 2px 0;padding:3px 7px;border:1px solid #4a3d64;border-radius:999px;color:#d8c9ff;font-size:.75rem}
    table{border-collapse:collapse;width:100%;font-size:.84rem}th,td{text-align:left;vertical-align:top;padding:8px;border-bottom:1px solid #2a2632;overflow-wrap:anywhere}
    .serious{color:#ff8f9f}.warning{color:#ffd67d}.passed{color:#8ec5ff}
    @media print{header{position:static}.toolbar{display:none}article{break-inside:avoid}.grid{display:block}article{margin-bottom:14px}article img{height:auto;max-height:720px}}
  `;
}

function captureCard(capture: CaptureRecord, imagePrefix: string) {
  return `<article data-route="${escapeHtml(capture.route)}" data-theme="${capture.theme}" data-viewport="${capture.viewport}" data-state="${escapeHtml(capture.state)}">
    <img src="${imagePrefix}${escapeHtml(capture.stitchedFile)}" alt="Visual archive capture of ${escapeHtml(capture.route)} in ${capture.theme} at ${capture.viewport}" loading="lazy">
    <h3>${escapeHtml(capture.route)}</h3>
    <p><span class="badge">${capture.theme}</span><span class="badge">${capture.viewport}</span><span class="badge">${escapeHtml(capture.auth)}</span><span class="badge">${escapeHtml(capture.state)}</span></p>
    <p class="meta"><code>${escapeHtml(capture.key)}</code><br>${capture.width} x ${capture.height}px · HTTP ${capture.status ?? "unknown"}</p>
  </article>`;
}

function privateIndexHtml(input: {
  manifest: RunManifest;
  plan: CoveragePlan;
  comparison: ComparisonReport | null;
}) {
  const diagnostics = input.manifest.diagnostics.map((diagnostic) => (
    `<tr><td class="${diagnostic.severity}">${diagnostic.severity}</td><td>${escapeHtml(diagnostic.kind)}</td><td>${escapeHtml(diagnostic.route)}</td><td>${escapeHtml(diagnostic.message)}</td><td>${diagnostic.expected ? "expected" : ""}</td></tr>`
  )).join("");
  const cards = input.manifest.captures.map((capture) => captureCard(capture, "../")).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KenMatch visual archive ${escapeHtml(input.manifest.runId)}</title><style>${reportStyles()}</style></head>
  <body><header><h1>KenMatch deterministic visual archive</h1><p class="meta">${escapeHtml(input.manifest.runId)} · ${input.manifest.evidenceTier} · ${input.manifest.mode} · commit ${escapeHtml(input.manifest.expectedCommit)} · ${input.manifest.captures.length}/${input.plan.expectedCaptureCount} captures</p>
  <div class="toolbar"><input id="search" type="search" placeholder="Filter route or state" aria-label="Filter captures"><select id="theme"><option value="">All themes</option><option>light</option><option>oled</option></select><select id="viewport"><option value="">All viewports</option>${[...new Set(input.manifest.captures.map((capture) => capture.viewport))].map((value) => `<option>${value}</option>`).join("")}</select></div></header>
  <main><section><h2>Provenance</h2><p class="meta">Browser ${escapeHtml(input.manifest.browserName)} ${escapeHtml(input.manifest.browserVersion)} · Playwright ${escapeHtml(input.manifest.playwrightVersion)} · data ${input.manifest.dataProvenance} · inventory ${input.manifest.inventoryDigest} · comparison ${input.comparison?.passed === false ? "changed" : "passed/no baseline"}</p></section>
  <section><h2>Captures</h2><div id="captures" class="grid">${cards}</div></section>
  <section><h2>Diagnostics</h2><table><thead><tr><th>Severity</th><th>Kind</th><th>Route</th><th>Message</th><th>Classification</th></tr></thead><tbody>${diagnostics || '<tr><td colspan="5" class="passed">No diagnostics.</td></tr>'}</tbody></table></section></main>
  <script>(()=>{const q=document.querySelector('#search'),t=document.querySelector('#theme'),v=document.querySelector('#viewport'),cards=[...document.querySelectorAll('article')];function f(){const query=q.value.toLowerCase();for(const card of cards){card.hidden=!!((query&&!card.textContent.toLowerCase().includes(query))||(t.value&&card.dataset.theme!==t.value)||(v.value&&card.dataset.viewport!==v.value))}}q.addEventListener('input',f);t.addEventListener('change',f);v.addEventListener('change',f)})();</script></body></html>`;
}

export async function writeAtlasPdf(input: {
  outputFile: string;
  title: string;
  subtitle: string;
  generatedAt: string;
  captures: Array<{ capture: CaptureRecord; imageFile: string; label: string }>;
}) {
  ensureDirectory(path.dirname(input.outputFile));
  const generatedAt = new Date(input.generatedAt);
  if (Number.isNaN(generatedAt.getTime())) {
    throw new Error(`Invalid PDF generation timestamp: ${input.generatedAt}`);
  }
  const document = new PDFDocument({
    autoFirstPage: false,
    info: {
      Title: input.title,
      Subject: input.subtitle,
      Creator: "KenMatch visual archive",
      CreationDate: generatedAt,
      ModDate: generatedAt,
    },
    margin: 36,
  });
  const stream = fs.createWriteStream(input.outputFile, { mode: 0o600 });
  document.pipe(stream);
  document.addPage({ size: "LETTER", layout: "landscape", margin: 48 });
  document.outline.addItem("Archive overview", { expanded: true });
  document.fontSize(28).fillColor("#111111").text(input.title);
  document.moveDown().fontSize(12).fillColor("#444444").text(input.subtitle);
  document.moveDown(2).fontSize(10).text(`Generated ${input.generatedAt}`);

  const bookmarks = [{
    title: "Archive overview",
    page: 1,
    captureKey: null as string | null,
  }];
  for (const item of input.captures) {
    const preview = await sharp(item.imageFile)
      .resize({ width: 1500, height: 900, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#000000" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    document.addPage({ size: "LETTER", layout: "landscape", margin: 30 });
    document.outline.addItem(item.label);
    bookmarks.push({
      title: item.label,
      page: bookmarks.length + 1,
      captureKey: item.capture.key,
    });
    document.fontSize(12).fillColor("#111111").text(item.label, 30, 20, { width: 730 });
    document.image(preview, 30, 42, { fit: [732, 528], align: "center", valign: "center" });
    document.fontSize(8).fillColor("#555555").text(
      `${item.capture.theme} · ${item.capture.viewport} · ${item.capture.state}`,
      30,
      575,
      { width: 730 },
    );
  }
  document.end();
  await new Promise<void>((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
  if (process.platform !== "win32") fs.chmodSync(input.outputFile, 0o600);
  return bookmarks;
}

export async function generateReport(config: AuditConfig) {
  const manifest = readJson<RunManifest>(path.join(config.runRoot, "manifest.json"));
  const plan = readJson<CoveragePlan>(path.join(config.runRoot, "coverage-plan.json"));
  const comparisonFile = path.join(config.runRoot, "comparison.json");
  const comparison = fs.existsSync(comparisonFile)
    ? readJson<ComparisonReport>(comparisonFile)
    : null;
  const reportDirectory = path.join(config.runRoot, "report");
  const shareableDirectory = path.join(config.runRoot, "shareable");
  ensureDirectory(reportDirectory);
  ensureDirectory(shareableDirectory);

  const privateSelection = pickPrivateAtlasCaptures(manifest.captures);
  const approval = readApproval(config);
  const approvedKeys = new Set(approval?.captureKeys ?? []);
  const shareableSelection = manifest.captures.filter(
    (capture) => !capture.sensitive && approvedKeys.has(capture.key),
  );
  const rejectedApprovalKeys = [...approvedKeys].filter(
    (key) => !manifest.captures.some((capture) => capture.key === key && !capture.sensitive),
  );
  const selection = {
    schemaVersion: 1,
    runId: config.runId,
    generatedAt: new Date().toISOString(),
    privateAtlasCaptureKeys: privateSelection.map((capture) => capture.key),
    shareableReview: approval
      ? {
        reviewer: approval.reviewer,
        reviewedAt: approval.reviewedAt,
        approvedCaptureKeys: shareableSelection.map((capture) => capture.key),
        rejectedApprovalKeys,
      }
      : null,
  };
  writeJson(path.join(reportDirectory, "selection.json"), selection);

  fs.writeFileSync(
    path.join(reportDirectory, "index.html"),
    privateIndexHtml({ manifest, plan, comparison }),
    { encoding: "utf8", mode: 0o600 },
  );
  const printCards = privateSelection.map((capture) => captureCard(capture, "../")).join("");
  fs.writeFileSync(
    path.join(reportDirectory, "print.html"),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>KenMatch visual atlas</title><style>${reportStyles()}</style></head><body><main><h1>KenMatch visual atlas</h1><p class="meta">${escapeHtml(config.runId)} · ${escapeHtml(config.expectedCommit)}</p><div class="grid">${printCards}</div></main></body></html>`,
    { encoding: "utf8", mode: 0o600 },
  );
  const reportGeneratedAt = manifest.completedAt ?? manifest.startedAt;
  const privateBookmarks = await writeAtlasPdf({
    outputFile: path.join(config.runRoot, "kenmatch-visual-atlas.pdf"),
    title: "KenMatch Visual Atlas",
    subtitle: `${config.evidenceTier} · ${config.expectedCommit} · private deterministic archive`,
    generatedAt: reportGeneratedAt,
    captures: privateSelection.map((capture) => ({
      capture,
      imageFile: path.join(config.runRoot, capture.stitchedFile),
      label: `${capture.route} · ${capture.auth}`,
    })),
  });

  const redactedCaptures = [];
  ensureDirectory(path.join(shareableDirectory, "assets"));
  for (const capture of shareableSelection) {
    const opaqueName = `capture-${sha256(capture.key).slice(0, 20)}.png`;
    fs.copyFileSync(
      path.join(config.runRoot, capture.stitchedFile),
      path.join(shareableDirectory, "assets", opaqueName),
    );
    redactedCaptures.push({
      id: opaqueName.replace(/\.png$/, ""),
      route: capture.route,
      theme: capture.theme,
      viewport: capture.viewport,
      state: capture.state,
      image: `assets/${opaqueName}`,
      dimensions: { width: capture.width, height: capture.height },
    });
  }
  const redactedManifest = {
    schemaVersion: 1,
    archive: "KenMatch visual atlas",
    evidenceTier: config.evidenceTier,
    dataProvenance: config.dataProvenance,
    commit: config.expectedCommit,
    reviewedAt: approval?.reviewedAt ?? null,
    captures: redactedCaptures,
  };
  writeJson(path.join(shareableDirectory, "manifest.redacted.json"), redactedManifest);
  const shareableCards = redactedCaptures.map((capture) => (
    `<article><img src="${capture.image}" alt="Reviewed KenMatch capture of ${escapeHtml(capture.route)}"><h2>${escapeHtml(capture.route)}</h2><p><span class="badge">${capture.theme}</span><span class="badge">${capture.viewport}</span><span class="badge">${escapeHtml(capture.state)}</span></p></article>`
  )).join("");
  fs.writeFileSync(
    path.join(shareableDirectory, "index.html"),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KenMatch visual atlas</title><style>${reportStyles()}</style></head><body><main><h1>KenMatch visual atlas</h1><p class="meta">Reviewed anonymous captures · ${escapeHtml(config.evidenceTier)} · commit ${escapeHtml(config.expectedCommit)}</p><div class="grid">${shareableCards || "<p>No captures have been approved for sharing.</p>"}</div></main></body></html>`,
    { encoding: "utf8", mode: 0o600 },
  );
  const shareableBookmarks = await writeAtlasPdf({
    outputFile: path.join(shareableDirectory, "kenmatch-visual-atlas-redacted.pdf"),
    title: "KenMatch Visual Atlas",
    subtitle: `${config.evidenceTier} · reviewed anonymous captures`,
    generatedAt: reportGeneratedAt,
    captures: redactedCaptures.map((entry) => {
      const capture = shareableSelection.find((candidate) => sha256(candidate.key).startsWith(entry.id.slice("capture-".length)));
      if (!capture) throw new Error(`Unable to resolve redacted capture ${entry.id}.`);
      return {
        capture,
        imageFile: path.join(shareableDirectory, entry.image),
        label: capture.route,
      };
    }),
  });
  writeJson(path.join(reportDirectory, "report-index.json"), {
    schemaVersion: 2,
    runId: config.runId,
    generatedAt: reportGeneratedAt,
    captures: manifest.captures.map((capture) => ({
      key: capture.key,
      route: capture.route,
      theme: capture.theme,
      viewport: capture.viewport,
      state: capture.state,
      sensitive: capture.sensitive,
      stitchedFile: capture.stitchedFile,
    })),
    privateAtlas: {
      file: "../kenmatch-visual-atlas.pdf",
      captureKeys: privateSelection.map((capture) => capture.key),
      bookmarks: privateBookmarks,
    },
    shareableAtlas: {
      file: "../shareable/kenmatch-visual-atlas-redacted.pdf",
      captureIds: redactedCaptures.map((capture) => capture.id),
      bookmarks: shareableBookmarks,
    },
  });
  return { selection, redactedManifest };
}

async function main() {
  await generateReport(loadConfig());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
