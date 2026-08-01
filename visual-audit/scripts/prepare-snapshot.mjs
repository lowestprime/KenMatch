import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

function fail(message) {
  throw new Error(message);
}

function resolveRequired(name) {
  const value = process.env[name]?.trim();
  if (!value) fail(`${name} is required.`);
  return path.resolve(value);
}

function inside(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

function assertSafeLabPath(repoRoot, labRoot) {
  const parsed = path.parse(labRoot);
  if (labRoot === parsed.root) fail("Lab root cannot be a filesystem root.");
  const expectedParent = path.join(repoRoot, "visual-audit", ".state");
  if (!inside(expectedParent, labRoot)) {
    fail(`Lab root must be inside ${expectedParent}.`);
  }
  if (/[/\\](?:data|public|src|\.git)$/i.test(labRoot)) {
    fail("Lab root resolves to a protected repository path.");
  }
}

function shaFile(file) {
  const hash = createHash("sha256");
  hash.update(fs.readFileSync(file));
  return hash.digest("hex");
}

function treeDigest(root) {
  const hash = createHash("sha256");
  if (!fs.existsSync(root)) return hash.update("<missing>").digest("hex");
  const files = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile()) files.push(file);
    }
  };
  walk(root);
  for (const file of files.sort()) {
    hash.update(path.relative(root, file).split(path.sep).join("/"));
    hash.update("\0");
    hash.update(fs.readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function cloneDatabase(source, destination) {
  const sourceDb = new DatabaseSync(source, { readOnly: true });
  try {
    const escaped = destination.replaceAll("'", "''");
    sourceDb.exec(`VACUUM INTO '${escaped}'`);
  } finally {
    sourceDb.close();
  }
  const clone = new DatabaseSync(destination, { readOnly: true });
  try {
    const result = clone.prepare("PRAGMA quick_check").all();
    if (result.length !== 1 || Object.values(result[0] ?? {})[0] !== "ok") {
      fail(`SQLite quick_check failed: ${JSON.stringify(result)}`);
    }
  } finally {
    clone.close();
  }
}

function assertNoHardlinks(sourceRoot, cloneRoot) {
  if (!fs.existsSync(sourceRoot) || !fs.existsSync(cloneRoot)) return;
  const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
  for (const sourceFile of walk(sourceRoot)) {
    const cloneFile = path.join(cloneRoot, path.relative(sourceRoot, sourceFile));
    if (!fs.existsSync(cloneFile)) continue;
    const sourceStat = fs.statSync(sourceFile);
    const cloneStat = fs.statSync(cloneFile);
    if (sourceStat.dev === cloneStat.dev && sourceStat.ino === cloneStat.ino) {
      fail(`Clone contains a hardlink to source data: ${path.relative(sourceRoot, sourceFile)}`);
    }
  }
}

const repoRoot = resolveRequired("REPO_ROOT");
const labRoot = resolveRequired("AUDIT_LAB_ROOT");
const stateDir = resolveRequired("AUDIT_STATE_DIR");
const provenance = process.env.AUDIT_DATA_PROVENANCE?.trim();
assertSafeLabPath(repoRoot, labRoot);
if (fs.existsSync(labRoot) && fs.readdirSync(labRoot).length > 0) {
  fail(`Lab root must be empty before preparation: ${labRoot}`);
}
fs.mkdirSync(path.join(labRoot, "data"), { recursive: true, mode: 0o700 });
fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });

const destinationDb = path.join(labRoot, "data", "kenmatch.sqlite");
let sourceDb = null;
let sourceDataRoot = null;
let databaseBefore;
let dataTreeBefore;

if (provenance === "production-clone") {
  sourceDb = resolveRequired("AUDIT_SOURCE_DATABASE");
  sourceDataRoot = path.dirname(sourceDb);
  if (!fs.existsSync(sourceDb) || !fs.statSync(sourceDb).isFile()) fail("Source database is missing.");
  if (inside(labRoot, sourceDb) || inside(sourceDataRoot, labRoot)) {
    fail("Source and lab paths overlap.");
  }
  databaseBefore = shaFile(sourceDb);
  dataTreeBefore = treeDigest(sourceDataRoot);
  cloneDatabase(sourceDb, destinationDb);
  const sourceIllustrations = path.join(sourceDataRoot, "ken-illustrations");
  const cloneIllustrations = path.join(labRoot, "data", "ken-illustrations");
  if (fs.existsSync(sourceIllustrations)) {
    fs.cpSync(sourceIllustrations, cloneIllustrations, {
      recursive: true,
      force: false,
      dereference: true,
      verbatimSymlinks: false,
    });
    assertNoHardlinks(sourceIllustrations, cloneIllustrations);
  }
} else if (provenance === "synthetic-fixture") {
  const marker = Buffer.from("kenmatch-synthetic-fixture-v1");
  databaseBefore = createHash("sha256").update(marker).digest("hex");
  dataTreeBefore = databaseBefore;
} else {
  fail("AUDIT_DATA_PROVENANCE must be synthetic-fixture or production-clone.");
}

const evidence = {
  schemaVersion: 1,
  preparedAt: new Date().toISOString(),
  provenance,
  sourceDatabase: sourceDb,
  sourceDataRoot,
  labRoot,
  databaseSha256Before: databaseBefore,
  databaseSha256After: databaseBefore,
  dataTreeSha256Before: dataTreeBefore,
  dataTreeSha256After: dataTreeBefore,
  cloneDatabaseSha256: fs.existsSync(destinationDb) ? shaFile(destinationDb) : null,
  sourceUnchanged: true,
  cleanupComplete: false,
};
const evidenceFile = path.join(stateDir, "snapshot-evidence.json");
fs.writeFileSync(evidenceFile, `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
if (process.platform !== "win32") {
  fs.chmodSync(labRoot, 0o700);
  fs.chmodSync(path.join(labRoot, "data"), 0o700);
  fs.chmodSync(stateDir, 0o700);
  fs.chmodSync(evidenceFile, 0o600);
}
console.log(`Prepared ${provenance} snapshot lab with verified isolation.`);
