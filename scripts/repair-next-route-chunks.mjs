import { existsSync, readdirSync, readFileSync, statSync, copyFileSync } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const nextRoot = path.join(projectRoot, ".next");
const staticRoot = path.join(nextRoot, "static");
const manifestRoots = [
  path.join(nextRoot, "server"),
  path.join(nextRoot, "standalone", ".next", "server"),
];

const chunkReferencePattern = /static\/chunks\/app\/[^"'\s]+?\.js/g;
const repaired = [];
const missing = [];

function walkFiles(dir, files = []) {
  if (!existsSync(dir)) {
    return files;
  }

  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      walkFiles(fullPath, files);
    } else if (entry.endsWith("_client-reference-manifest.js")) {
      files.push(fullPath);
    }
  }

  return files;
}

function relativeStaticPath(reference) {
  return decodeURIComponent(reference).split("/").join(path.sep).replace(/^static[\\/]/, "");
}

function findReplacement(reference) {
  const relativePath = relativeStaticPath(reference);
  const targetPath = path.join(staticRoot, relativePath);
  const dir = path.dirname(targetPath);
  const targetFile = path.basename(targetPath);
  const prefix = targetFile.replace(/-[^-]+\.js$/, "-");

  if (!existsSync(dir)) {
    return null;
  }

  const candidates = readdirSync(dir)
    .filter((file) => file.startsWith(prefix) && file.endsWith(".js"))
    .map((file) => path.join(dir, file));

  return candidates.length === 1 ? candidates[0] : null;
}

for (const root of manifestRoots) {
  for (const manifestPath of walkFiles(root)) {
    const manifest = readFileSync(manifestPath, "utf8");
    const references = new Set(manifest.match(chunkReferencePattern) ?? []);

    for (const reference of references) {
      const expectedPath = path.join(staticRoot, relativeStaticPath(reference));

      if (existsSync(expectedPath)) {
        continue;
      }

      const replacement = findReplacement(reference);

      if (replacement) {
        copyFileSync(replacement, expectedPath);
        repaired.push({
          expected: path.relative(projectRoot, expectedPath),
          replacement: path.relative(projectRoot, replacement),
          manifest: path.relative(projectRoot, manifestPath),
        });
      } else {
        missing.push({
          expected: path.relative(projectRoot, expectedPath),
          manifest: path.relative(projectRoot, manifestPath),
        });
      }
    }
  }
}

if (missing.length > 0) {
  console.error("Next route chunk verification failed. Missing chunk references:");
  for (const item of missing) {
    console.error(`- ${item.expected} referenced by ${item.manifest}`);
  }
  process.exit(1);
}

if (repaired.length > 0) {
  console.warn("Repaired Next route chunk references with matching sibling chunks:");
  for (const item of repaired) {
    console.warn(`- ${item.expected} <= ${item.replacement}`);
  }
} else {
  console.log("Next route chunk verification passed.");
}
