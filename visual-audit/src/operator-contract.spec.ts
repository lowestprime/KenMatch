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
    assert.match(content, /\/audit-secrets:size=1m,[^\n]*mode=0700/);
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
  assert.match(content, /Get-ChildItem -LiteralPath \$Path -Recurse -Force/);
  assert.match(content, /\[IO\.File\]::OpenRead/);
  assert.match(content, /dist\\compare\.js/);
  assert.match(content, /dist\\report\.js/);
  assert.match(content, /dist\\validate\.js/);
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
