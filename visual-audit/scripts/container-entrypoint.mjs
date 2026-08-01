import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const auditRoot = "/audit";
const sourceRoot = "/audit-state";
const secretRoot = "/audit-secrets";
const allowedTargets = new Set([
  "dist/run.js",
  "dist/compare.js",
  "dist/report.js",
  "dist/validate.js",
]);
const mappings = [
  ["AUDIT_TOKEN_SOURCE_FILE", "AUDIT_TOKEN_FILE", "audit-token"],
  ["TEST_AUTH_TOKEN_SOURCE_FILE", "TEST_AUTH_TOKEN_FILE", "test-auth-token"],
  ["ADMIN_PASSWORD_SOURCE_FILE", "ADMIN_PASSWORD_FILE", "admin-password"],
];

function fail(message) {
  throw new Error(`visual-audit entrypoint: ${message}`);
}

for (const [sourceName, targetName, expectedName] of mappings) {
  const sourceValue = process.env[sourceName]?.trim();
  if (!sourceValue) continue;
  const targetValue = process.env[targetName]?.trim();
  if (!targetValue) fail(`${targetName} is required when ${sourceName} is set.`);
  const source = path.resolve(sourceValue);
  const target = path.resolve(targetValue);
  if (path.dirname(source) !== sourceRoot || path.basename(source) !== expectedName) {
    fail(`${sourceName} must resolve to ${sourceRoot}/${expectedName}.`);
  }
  if (path.dirname(target) !== secretRoot || path.basename(target) !== expectedName) {
    fail(`${targetName} must resolve to ${secretRoot}/${expectedName}.`);
  }
  const sourceStats = fs.lstatSync(source);
  if (!sourceStats.isFile() || sourceStats.isSymbolicLink()) {
    fail(`${sourceName} must point to a regular non-symlink file.`);
  }
  const value = fs.readFileSync(source);
  if (value.length === 0) fail(`${sourceName} points to an empty file.`);
  fs.mkdirSync(secretRoot, { recursive: true, mode: 0o700 });
  fs.chmodSync(secretRoot, 0o700);
  fs.writeFileSync(target, value, { mode: 0o600, flag: "w" });
  fs.chmodSync(target, 0o600);
  if ((fs.statSync(target).mode & 0o077) !== 0) {
    fail(`${targetName} could not be restricted to mode 600.`);
  }
}

const script = process.argv[2];
if (!script || !allowedTargets.has(script)) {
  fail("the requested audit command is not allowlisted.");
}
const result = spawnSync(process.execPath, [path.join(auditRoot, script), ...process.argv.slice(3)], {
  cwd: auditRoot,
  env: process.env,
  stdio: "inherit",
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
