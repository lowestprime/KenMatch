import fs from "node:fs";
import path from "node:path";

function fail(message) {
  throw new Error(message);
}

function valuesFor(argv, name) {
  const values = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === name && argv[index + 1]) values.push(argv[index + 1]);
  }
  return values;
}

function valueFor(argv, name) {
  return valuesFor(argv, name).at(-1) ?? "";
}

const argv = process.argv.slice(2);
const runRoot = path.resolve(valueFor(argv, "--run-root"));
const stateFile = path.resolve(valueFor(argv, "--state-file"));
if (path.basename(path.dirname(runRoot)) !== "visual-audits" || path.basename(runRoot) === "visual-audits") {
  fail("--run-root must be one run immediately inside visual-audits.");
}
const manifestFile = path.join(runRoot, "manifest.json");
if (!fs.existsSync(manifestFile)) fail("Run manifest is missing.");
const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
const eligible = manifest.captures.filter((capture) => capture.auth === "anonymous" && capture.sensitive !== true);

if (argv.includes("--list")) {
  for (const capture of eligible) {
    console.log(`${capture.key}\t${capture.route}\t${capture.theme}\t${capture.viewport}\t${capture.state}`);
  }
  process.exit(0);
}

const reviewer = valueFor(argv, "--reviewer").trim();
const keys = [
  ...valuesFor(argv, "--capture-key"),
  ...valueFor(argv, "--capture-keys").split(","),
].map((value) => value.trim()).filter(Boolean);
if (!reviewer) fail("--reviewer is required when recording approval.");
if (keys.length === 0) fail("At least one --capture-key is required.");
const eligibleByKey = new Map(eligible.map((capture) => [capture.key, capture]));
const invalid = [...new Set(keys)].filter((key) => !eligibleByKey.has(key));
if (invalid.length) fail(`Only existing non-sensitive anonymous captures can be approved: ${invalid.join(", ")}`);
if (stateFile === path.parse(stateFile).root || path.basename(stateFile) !== "shareable-approval.json") {
  fail("--state-file must end in shareable-approval.json.");
}
fs.mkdirSync(path.dirname(stateFile), { recursive: true, mode: 0o700 });
const approval = {
  reviewer,
  reviewedAt: new Date().toISOString(),
  captureKeys: [...new Set(keys)].sort(),
};
fs.writeFileSync(stateFile, `${JSON.stringify(approval, null, 2)}\n`, { mode: 0o600 });
if (process.platform !== "win32") {
  fs.chmodSync(path.dirname(stateFile), 0o700);
  fs.chmodSync(stateFile, 0o600);
}
console.log(`Recorded explicit approval for ${approval.captureKeys.length} anonymous capture(s).`);
