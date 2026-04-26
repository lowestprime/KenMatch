import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const standalone = join(root, ".next", "standalone");

if (!existsSync(standalone)) {
  throw new Error("Missing .next/standalone. Run npm run build before npm run start.");
}

const copies = [
  [join(root, ".next", "static"), join(standalone, ".next", "static")],
  [join(root, "public"), join(standalone, "public")],
];

for (const [source, target] of copies) {
  if (!existsSync(source)) continue;
  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true });
}
