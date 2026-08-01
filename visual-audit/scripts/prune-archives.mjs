import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.env.VISUAL_AUDIT_ROOT ?? "");
const apply = ["1", "true", "yes"].includes((process.env.VISUAL_AUDIT_PRUNE_APPLY ?? "").toLowerCase());
const minimumDays = Number.parseInt(process.env.VISUAL_AUDIT_RETENTION_DAYS ?? "90", 10);
if (!root || path.basename(root) !== "visual-audits" || root === path.parse(root).root) {
  throw new Error("VISUAL_AUDIT_ROOT must be an absolute directory named visual-audits.");
}
if (!Number.isInteger(minimumDays) || minimumDays < 30) {
  throw new Error("VISUAL_AUDIT_RETENTION_DAYS must be at least 30.");
}
if (!fs.existsSync(root)) throw new Error(`Archive root does not exist: ${root}`);

const runs = fs.readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,127}$/.test(entry.name))
  .map((entry) => {
    const directory = path.join(root, entry.name);
    const validationFile = path.join(directory, "validation.json");
    const manifestFile = path.join(directory, "manifest.json");
    const validation = fs.existsSync(validationFile) ? JSON.parse(fs.readFileSync(validationFile, "utf8")) : null;
    const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, "utf8")) : null;
    return {
      name: entry.name,
      directory,
      modifiedAt: fs.statSync(directory).mtimeMs,
      passed: validation?.passed === true,
      tier: manifest?.evidenceTier ?? "unknown",
    };
  });
const protectedRuns = new Set();
for (const tier of ["tier-1-synthetic", "tier-2-production-clone", "tier-3-live-production"]) {
  const latest = runs.filter((run) => run.passed && run.tier === tier).sort((a, b) => b.modifiedAt - a.modifiedAt)[0];
  if (latest) protectedRuns.add(latest.name);
}
for (const value of (process.env.APPROVED_BASELINE_RUN_IDS ?? "").split(",").map((item) => item.trim()).filter(Boolean)) {
  protectedRuns.add(value);
}
const cutoff = Date.now() - minimumDays * 24 * 60 * 60 * 1_000;
const candidates = runs.filter((run) => run.modifiedAt < cutoff && !protectedRuns.has(run.name));
for (const run of candidates) {
  console.log(`${apply ? "DELETE" : "DRY-RUN"} ${run.directory}`);
  if (apply) fs.rmSync(run.directory, { recursive: true, force: false });
}
console.log(`${apply ? "Pruned" : "Would prune"} ${candidates.length} archive run(s); retained newest successful run per tier.`);
