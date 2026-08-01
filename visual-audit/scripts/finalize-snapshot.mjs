import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function fail(message) {
  throw new Error(message);
}

function shaFile(file) {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function treeDigest(root) {
  const hash = createHash("sha256");
  const files = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile()) files.push(file);
    }
  };
  if (!fs.existsSync(root)) return hash.update("<missing>").digest("hex");
  walk(root);
  for (const file of files.sort()) {
    hash.update(path.relative(root, file).split(path.sep).join("/"));
    hash.update("\0");
    hash.update(fs.readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

const evidenceFile = path.resolve(process.env.AUDIT_SNAPSHOT_EVIDENCE_FILE ?? "");
if (!evidenceFile || !fs.existsSync(evidenceFile)) fail("Snapshot evidence file is missing.");
const evidence = JSON.parse(fs.readFileSync(evidenceFile, "utf8"));
const stateRoot = path.dirname(evidenceFile);
const labRoot = path.resolve(evidence.labRoot ?? "");
if (!labRoot.startsWith(`${stateRoot}${path.sep}`) || labRoot === stateRoot) {
  fail("Refusing cleanup outside the run state directory.");
}

if (evidence.provenance === "production-clone") {
  const sourceDb = path.resolve(evidence.sourceDatabase ?? "");
  const sourceDataRoot = path.resolve(evidence.sourceDataRoot ?? "");
  evidence.databaseSha256After = shaFile(sourceDb);
  evidence.dataTreeSha256After = treeDigest(sourceDataRoot);
  evidence.sourceUnchanged = evidence.databaseSha256Before === evidence.databaseSha256After
    && evidence.dataTreeSha256Before === evidence.dataTreeSha256After;
} else {
  evidence.databaseSha256After = evidence.databaseSha256Before;
  evidence.dataTreeSha256After = evidence.dataTreeSha256Before;
  evidence.sourceUnchanged = true;
}

fs.rmSync(labRoot, { recursive: true, force: true });
evidence.cleanupComplete = !fs.existsSync(labRoot);
evidence.finalizedAt = new Date().toISOString();
fs.writeFileSync(evidenceFile, `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
const manifestFile = process.env.AUDIT_RUN_MANIFEST_FILE?.trim();
if (manifestFile) {
  const resolvedManifest = path.resolve(manifestFile);
  if (path.basename(resolvedManifest) !== "manifest.json" || path.basename(path.dirname(path.dirname(resolvedManifest))) !== "visual-audits") {
    fail("AUDIT_RUN_MANIFEST_FILE must be a run manifest immediately inside visual-audits.");
  }
  if (!fs.existsSync(resolvedManifest)) fail("Audit run manifest is missing.");
  const manifest = JSON.parse(fs.readFileSync(resolvedManifest, "utf8"));
  manifest.sourceEvidence = {
    databaseSha256Before: evidence.databaseSha256Before ?? null,
    databaseSha256After: evidence.databaseSha256After ?? null,
    dataTreeSha256Before: evidence.dataTreeSha256Before ?? null,
    dataTreeSha256After: evidence.dataTreeSha256After ?? null,
    sourceUnchanged: evidence.sourceUnchanged,
    cleanupComplete: evidence.cleanupComplete,
  };
  fs.writeFileSync(resolvedManifest, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
}
if (!evidence.sourceUnchanged) fail("Source data changed while snapshot lab was running.");
if (!evidence.cleanupComplete) fail("Snapshot lab cleanup could not be proven.");
console.log("Verified source immutability and removed the isolated snapshot lab.");
