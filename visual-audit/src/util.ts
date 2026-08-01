import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function ensureDirectory(directory: string, mode = 0o700) {
  fs.mkdirSync(directory, { recursive: true, mode });
  if (process.platform !== "win32") fs.chmodSync(directory, mode);
}

export function writeJson(file: string, value: unknown, mode = 0o600) {
  ensureDirectory(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode });
  if (process.platform !== "win32") fs.chmodSync(file, mode);
}

export function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

export function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

export function fileSha256(file: string) {
  return sha256(fs.readFileSync(file));
}

export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function safeKey(value: string) {
  return value
    .replace(/^https?:\/\//, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180) || "root";
}

export function relativePosix(root: string, file: string) {
  return path.relative(root, file).split(path.sep).join("/");
}

export function assertInside(root: string, candidate: string) {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  if (resolvedCandidate !== resolvedRoot && !resolvedCandidate.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Path escapes expected root: ${resolvedCandidate}`);
  }
}

export function hardenPermissions(root: string) {
  if (process.platform === "win32" || !fs.existsSync(root)) return;
  const visit = (entryPath: string) => {
    const stats = fs.lstatSync(entryPath);
    if (stats.isSymbolicLink()) throw new Error(`Archive output contains a symbolic link: ${entryPath}`);
    if (stats.isDirectory()) {
      fs.chmodSync(entryPath, 0o700);
      for (const child of fs.readdirSync(entryPath)) visit(path.join(entryPath, child));
    } else if (stats.isFile()) {
      fs.chmodSync(entryPath, 0o600);
    }
  };
  visit(root);
}
