import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "../..");

test("compose definitions never embed resolved secrets or destructive volume cleanup", () => {
  for (const name of ["docker-compose.visual-audit-lab.yml", "docker-compose.visual-audit-live.yml"]) {
    const content = fs.readFileSync(path.join(repoRoot, name), "utf8");
    assert.doesNotMatch(content, /down\s+-v/);
    assert.doesNotMatch(content, /[a-f0-9]{64}/i);
    assert.match(content, /AUDIT_TOKEN_FILE/);
    assert.match(content, /AUDIT_TOKEN_SOURCE_FILE/);
    assert.match(content, /AUDIT_OUTPUT_DIR/);
    assert.match(content, /\/audit-secrets:size=1m,[^\n]*mode=0700,[^\n]*uid=\$\{AUDIT_UID:-1000\},gid=\$\{AUDIT_GID:-1000\}/);
    assert.match(content, /AUDIT_HOST_FILESYSTEM: \$\{AUDIT_HOST_FILESYSTEM:-native\}/);
    assert.match(content, /read_only:\s+true/);
  }
});

test("container entrypoint stages only allowlisted secret files and audit commands", () => {
  const content = fs.readFileSync(
    path.join(repoRoot, "visual-audit", "scripts", "container-entrypoint.mjs"),
    "utf8",
  );
  assert.match(content, /const secretRoot = "\/audit-secrets"/);
  assert.match(content, /mode: 0o600/);
  assert.match(content, /sourceStats\.isSymbolicLink\(\)/);
  for (const script of ["run", "compare", "report", "validate"]) {
    assert.match(content, new RegExp(`dist/${script}\\.js`));
  }
});

test("Windows smoke exports every snapshot path before preparation", () => {
  const content = fs.readFileSync(
    path.join(repoRoot, "visual-audit", "scripts", "run-windows-smoke.ps1"),
    "utf8",
  );
  const preparation = content.indexOf("& node $prepareScript");
  assert.notEqual(preparation, -1);
  for (const name of ["REPO_ROOT", "AUDIT_STATE_DIR", "AUDIT_LAB_ROOT"]) {
    const assignment = content.indexOf(`$env:${name} =`);
    assert.notEqual(assignment, -1, `${name} must be exported`);
    assert.ok(assignment < preparation, `${name} must be exported before snapshot preparation`);
  }
  assert.match(content, /Protect-StateDirectory \$StateDir/);
  assert.match(content, /Protect-StateDirectory \$RunRoot/);
  assert.match(content, /\$env:AUDIT_OUTPUT_DIR = \$OutputRoot/);
  assert.match(content, /\[switch\]\$CaptureOnly/);
  assert.match(content, /capture-metrics\.json/);
  assert.match(content, /RandomNumberGenerator\]::Create\(\)/);
  assert.doesNotMatch(content, /RandomNumberGenerator\]::Fill/);
  assert.doesNotMatch(content, /Convert\]::ToHexString/);
  assert.match(content, /AUDIT_RUN_MANIFEST_FILE = ""/);
  assert.match(content, /Preserve the original capture\/startup failure/);
  assert.match(content, /\$env:AUDIT_HOST_FILESYSTEM = "windows-ntfs-bind"/);
  assert.match(content, /\$finalizeOnly = \(Test-Path/);
  assert.match(content, /Using reviewed completed capture for native finalization/);
  assert.match(content, /Get-ChildItem -LiteralPath \$Path -Recurse -Force/);
  assert.match(content, /\[IO\.File\]::OpenRead/);
  assert.match(content, /dist\\compare\.js/);
  assert.match(content, /dist\\report\.js/);
  assert.match(content, /dist\\validate\.js/);
});

test("Windows worker benchmark fixes the Tier 1 smoke matrix at 1, 2, and 4", () => {
  const content = fs.readFileSync(
    path.join(repoRoot, "visual-audit", "scripts", "run-windows-benchmark.ps1"),
    "utf8",
  );
  assert.match(content, /\$RequiredWorkers = @\(1, 2, 4\)/);
  assert.match(content, /-Tier "tier-1-synthetic"/);
  assert.match(content, /-Scope "smoke"/);
  assert.match(content, /VISUAL_AUDIT_CAPTURE_WORKERS/);
  assert.match(content, /dist\\benchmark\.js/);
  assert.match(content, /status --porcelain=v1 --untracked-files=all/);
  assert.match(content, /Start-Process/);
  assert.match(content, /-RedirectStandardOutput \$StdoutLog/);
  assert.match(content, /-RedirectStandardError \$StderrLog/);
});

test("Windows detached benchmark helpers record and inspect one durable operation", () => {
  const start = fs.readFileSync(
    path.join(repoRoot, "visual-audit", "scripts", "start-windows-benchmark.ps1"),
    "utf8",
  );
  const status = fs.readFileSync(
    path.join(repoRoot, "visual-audit", "scripts", "get-windows-operation-status.ps1"),
    "utf8",
  );
  for (const field of [
    "benchmarkId",
    "expectedCommit",
    "pid",
    "exactCommand",
    "startTimestamp",
    "proofAliveAt",
    "stdoutLog",
    "stderrLog",
    "exitCodeFile",
  ]) {
    assert.match(start, new RegExp(`${field}\\s*=`));
  }
  assert.match(start, /-WindowStyle Hidden/);
  assert.match(start, /status --porcelain=v1 --untracked-files=all/);
  assert.match(status, /exitCodeFileExists/);
  assert.match(status, /terminated-without-exit-code/);
  assert.match(status, /Get-Content[^\n]+-Tail \$TailLines/);
  assert.doesNotMatch(status, /while\s*\(|tail\s+-Wait|Start-Sleep/);
});

test("capture runner checkpoints atomic progress and bounds mobile hydration retries", () => {
  const capture = fs.readFileSync(path.join(repoRoot, "visual-audit", "src", "capture.ts"), "utf8");
  const run = fs.readFileSync(path.join(repoRoot, "visual-audit", "src", "run.ts"), "utf8");
  assert.match(capture, /for \(let attempt = 0; attempt < 2; attempt \+= 1\)/);
  assert.match(capture, /await input\.coordinator\.commit\(\{/);
  assert.match(capture, /limit: input\.config\.captureWorkers/);
  assert.match(capture, /const serialGroups = groups\.filter/);
  assert.match(run, /checkpointManifest\.completedKeys = checkpointManifest\.captures/);
  assert.match(run, /writeJsonAtomic\(manifestFile, checkpointManifest\)/);
  assert.match(run, /persistCoveragePlanState/);
  assert.match(run, /phase: "converged"/);
});

test("snapshot auth bootstrap does not render redirect destinations", () => {
  const auth = fs.readFileSync(path.join(repoRoot, "visual-audit", "src", "auth.ts"), "utf8");
  assert.match(auth, /responseMode: "storage-state"/);
  assert.match(auth, /maxRedirects: 0/);
  assert.match(auth, /response\.status\(\) !== 204/);
});

test("shareable review helper accepts only explicit anonymous capture keys", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kenmatch-review-"));
  try {
    const runRoot = path.join(root, "visual-audits", "run-1");
    const stateFile = path.join(root, "state", "shareable-approval.json");
    fs.mkdirSync(runRoot, { recursive: true });
    fs.writeFileSync(path.join(runRoot, "manifest.json"), JSON.stringify({
      captures: [
        { key: "anon", auth: "anonymous", sensitive: false, route: "/", theme: "oled", viewport: "desktop-1440", state: "default" },
        { key: "private", auth: "owner", sensitive: true, route: "/admin", theme: "oled", viewport: "desktop-1440", state: "owner-controls" },
      ],
    }));
    const script = path.join(repoRoot, "visual-audit", "scripts", "review-shareable.mjs");
    const rejected = spawnSync(process.execPath, [
      script,
      "--run-root", runRoot,
      "--state-file", stateFile,
      "--reviewer", "Reviewer",
      "--capture-key", "private",
    ], { encoding: "utf8" });
    assert.notEqual(rejected.status, 0);
    assert.equal(fs.existsSync(stateFile), false);

    const accepted = spawnSync(process.execPath, [
      script,
      "--run-root", runRoot,
      "--state-file", stateFile,
      "--reviewer", "Reviewer",
      "--capture-key", "anon",
    ], { encoding: "utf8" });
    assert.equal(accepted.status, 0, accepted.stderr);
    const approval = JSON.parse(fs.readFileSync(stateFile, "utf8"));
    assert.deepEqual(approval.captureKeys, ["anon"]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
