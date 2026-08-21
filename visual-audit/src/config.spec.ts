import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { assertSafeOutputRoot } from "./config.js";

const filesystemRoot = path.parse(process.cwd()).root;
const repoRoot = path.resolve(filesystemRoot, "workspace", "repo");
const repositoryArchiveRoot = path.resolve(repoRoot, "visual-audits");
const dedicatedMountRoot = path.resolve(filesystemRoot, "audit-output");

test("audit output accepts only repository archives or the dedicated mount", () => {
  assert.doesNotThrow(() => assertSafeOutputRoot(repositoryArchiveRoot, repoRoot));
  assert.doesNotThrow(() => assertSafeOutputRoot(dedicatedMountRoot, repoRoot));

  for (const rejected of [
    filesystemRoot,
    repoRoot,
    path.resolve(repoRoot, "visual-audit", ".benchmarks"),
    path.resolve(dedicatedMountRoot, "nested"),
  ]) {
    assert.throws(() => assertSafeOutputRoot(rejected, repoRoot), /RUN_OUTPUT_ROOT/);
  }
});
