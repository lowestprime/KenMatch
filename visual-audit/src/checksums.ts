import fs from "node:fs";
import path from "node:path";

import { ensureDirectory, fileSha256, relativePosix, writeJson } from "./util.js";

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

export function generateChecksums(runRoot: string) {
  ensureDirectory(runRoot);
  const excluded = new Set(["checksums.json", "checksums.sha256"]);
  const entries = walk(runRoot)
    .filter((file) => !excluded.has(path.basename(file)))
    .map((file) => ({
      file: relativePosix(runRoot, file),
      bytes: fs.statSync(file).size,
      sha256: fileSha256(file),
    }))
    .sort((left, right) => left.file.localeCompare(right.file));
  writeJson(path.join(runRoot, "checksums.json"), {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    entries,
  });
  fs.writeFileSync(
    path.join(runRoot, "checksums.sha256"),
    `${entries.map((entry) => `${entry.sha256}  ${entry.file}`).join("\n")}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
  if (process.platform !== "win32") {
    fs.chmodSync(path.join(runRoot, "checksums.sha256"), 0o600);
  }
  return entries;
}
