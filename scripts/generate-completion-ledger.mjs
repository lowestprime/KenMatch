import { createHash } from "node:crypto";
import { createReadStream, existsSync, promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import readline from "node:readline";
import { execFileSync } from "node:child_process";

const repoRoot = process.cwd();
const objectivePath =
  process.env.KENMATCH_COMPLETION_OBJECTIVE ??
  "C:\\Users\\Cooper\\.codex\\attachments\\1cd191f5-4140-4f26-8ca4-0ba83e1828a3\\pasted-text-1.txt";

const sourceSpecs = [
  {
    name: "current-completion-objective.md",
    candidates: [objectivePath],
    mode: "directive",
    authority: "current-request",
  },
  {
    name: "codex_kenmatch_devops_thread_MON_07272026_084428_PM-PDT_6936e0a5_357192lines_4754083cl100k_base_tokens.md",
    candidates: [
      "C:\\Users\\Cooper\\Documents\\Codex Exports\\codex_kenmatch_devops_thread_MON_07272026_084428_PM-PDT_6936e0a5_357192lines_4754083cl100k_base_tokens.md",
    ],
    mode: "codex-thread",
    authority: "historical-thread",
  },
  {
    name: "codex_kenmatch_development_thread_MON_07272026_084408_PM-PDT_4429133e_38936lines_491024cl100k_base_tokens.md",
    candidates: [
      "C:\\Users\\Cooper\\Documents\\Codex Exports\\codex_kenmatch_development_thread_MON_07272026_084408_PM-PDT_4429133e_38936lines_491024cl100k_base_tokens.md",
    ],
    mode: "codex-thread",
    authority: "historical-thread",
  },
  {
    name: "KenMatch_Agentic.md",
    candidates: ["C:\\projects\\KenMatch_Agentic.md"],
    mode: "directive",
    authority: "explicit-request",
  },
  {
    name: "KENMATCH_FAQ_QUEUE.md",
    candidates: ["C:\\projects\\KENMATCH_FAQ_QUEUE.md"],
    mode: "queue",
    authority: "explicit-queue",
  },
  {
    name: "ChatGPT_Thinking_KenMatch_Codex_Prompt_Designer_2026-04-26T19_45_18.223Z_2026-07-28T03-53-08.md",
    candidates: [
      "C:\\projects\\ChatGPT_Thinking_KenMatch_Codex_Prompt_Designer_2026-04-26T19_45_18.223Z_2026-07-28T03-53-08.md",
    ],
    mode: "chat-export",
    authority: "historical-thread",
  },
  {
    name: "ChatGPT_Thinking_KenMatch_Agentic_2026-05-01T04_23_11.973Z_2026-07-28T03-52-22.md",
    candidates: [
      "C:\\projects\\ChatGPT_Thinking_KenMatch_Agentic_2026-05-01T04_23_11.973Z_2026-07-28T03-52-22.md",
    ],
    mode: "chat-export",
    authority: "historical-thread",
  },
  {
    name: "ChatGPT_Thinking_KenMatch_Icon_2026-07-17T02_34_00.523Z_2026-07-28T03-51-29.md",
    candidates: [
      "C:\\projects\\ChatGPT_Thinking_KenMatch_Icon_2026-07-17T02_34_00.523Z_2026-07-28T03-51-29.md",
    ],
    mode: "chat-export",
    authority: "asset-decision-history",
  },
  {
    name: "ChatGPT_Thinking_KenMatch_Visual_Updates_Jul_2026_2026-07-21T00_23_15.547Z_2026-07-28T03-50-59.md",
    candidates: [
      "C:\\projects\\ChatGPT_Thinking_KenMatch_Visual_Updates_Jul_2026_2026-07-21T00_23_15.547Z_2026-07-28T03-50-59.md",
    ],
    mode: "chat-export",
    authority: "asset-decision-history",
  },
  {
    name: "KENMATCH_FEATURE_DEV_TASK_QUEUE.md",
    candidates: ["C:\\projects\\KENMATCH_FEATURE_DEV_TASK_QUEUE.md"],
    mode: "queue",
    authority: "explicit-queue",
  },
  {
    name: "KenMatch_gdoc_exported_07272026.md",
    candidates: ["C:\\projects\\KenMatch_gdoc_exported_07272026.md"],
    mode: "concept-queue",
    authority: "concept-corpus",
  },
  {
    name: "visual-archive.md",
    candidates: ["X:\\woodsmith\\docs\\visual-archive.md"],
    mode: "reference",
    authority: "validated-reference",
  },
  {
    name: "Automated_Web_Snapshot_Implementation_Strategy_2026-07-11T04_42_44.052Z_2026-07-11T12-32-15(2).md",
    candidates: [
      "X:\\woodsmith\\archive\\Automated_Web_Snapshot_Implementation_Strategy_2026-07-11T04_42_44.052Z_2026-07-11T12-32-15.md",
    ],
    mode: "reference",
    authority: "validated-reference",
    note: "Available source omits the requested '(2)' filename suffix.",
  },
  ...[
    "AGENTS.md",
    "README.md",
    "PLANS.md",
    "KenMatch_Conception.md",
    "KenMatch_DeepWiki.md",
    "docs/architecture.md",
    "docs/requirements-traceability.md",
    "docs/public-security-hardening.md",
    "docs/synology-nas-deploy.md",
    ".env.example",
  ].map((name) => {
    const mode =
      name === "PLANS.md"
        ? "plan"
        : name === "docs/requirements-traceability.md"
          ? "traceability"
          : name === "docs/public-security-hardening.md" || name === "docs/synology-nas-deploy.md"
            ? "policy"
            : name === "KenMatch_Conception.md" || name === "KenMatch_DeepWiki.md"
              ? "concept"
              : "claims";
    return {
      name,
      candidates: [path.join(repoRoot, name)],
      mode,
      authority: "current-repository",
    };
  }),
];

const requirementVerb =
  /\b(must|should|shall|need(?:s)? to|required|requirement|add|fix|ensure|implement|upgrade|optimi[sz]e|validate|verify|preserve|prevent|create|build|audit|document|support|provide|expose|replace|refactor|integrate|complete|include|cover|keep|use|avoid|do not|never|target|allow|block|reject|record|publish|define|enforce|maintain|route|protect|test|run)\b/i;
const completionClaim =
  /\b(done|complete(?:d)?|implemented|validated|verified|deployed|fixed|passed|green|shipped)\b/i;
const productTerms =
  /\b(kenmatch|kens?\b|feed|category|lane|tier|allocation|pulse|voice|checkpoint|faq|glossary|auth|sign[- ]?in|sign[- ]?out|session|visitor|admin|audit|moderation|ranking|search|filter|sponsor|treasury|visual|archive|snapshot|seo|reddit|theme|oled|light mode|mobile|database|sqlite|synology|cloudflare|docker|accessibility|privacy|security)\b/i;
const boilerplate =
  /\b(chain[- ]of[- ]thought|reasoning effort|token budget|AGENTS\.md instructions|environment_context|tool call|commentary channel|final response contract|Codex can now help|Browser Use preflight|browser task|nameSession|agent\.browser|node_repl|Playwright API Reference)\b/i;
const codeLike =
  /^(?:import |export (?:type |interface |const |function )|const |let |var |function |class |if \(|for \(|while \(|return |await |git |npm |docker |curl |pwsh |powershell |Get-|Set-|New-|Remove-|Copy-|Move-|SELECT |INSERT |UPDATE |CREATE TABLE|\{|\}|\[|\]|<\/?[a-z])/i;

const workstreamRules = [
  ["A-FAQ-GLOSSARY-TRUST", /\b(faq|glossary|definition|trust surface|how it works|product truth)\b/i],
  ["B-FEED-RANKING-SEARCH", /\b(feed|filter|reset|ranking|discovery|search|pagination|cursor|brigad|tie-break)\b/i],
  ["C-REVIEW-WORKFLOWS", /\b(category proposal|submitted ken|intake|review queue|needs revision|approve|reject|merge)\b/i],
  ["D-MODERATION", /\b(moderat|appeal|recus|conflict of interest|capture|retaliation|triage)\b/i],
  ["E-LIFECYCLE", /\b(lifecycle|graphical abstract|checkpoint|post-run|early completion|partial delivery)\b/i],
  ["F-VISUAL-UX", /\b(theme|oled|light mode|visual system|glass|metal|scroll|responsive|mobile|audit log sizing|overflow)\b/i],
  ["G-ANALYTICS", /\b(visitor|analytics|chart|graph|country distribution|returning visitor)\b/i],
  ["H-SEO-COMMUNITY", /\b(seo|sitemap|robots|canonical|json-ld|structured data|reddit|backlink|marketing|community)\b/i],
  ["I-POLICY-ECONOMICS", /\b(funding|treasury|quality contract|termination|stop reason|objective|subjective|runtime cap|sponsor)\b/i],
  ["J-VISUAL-ARCHIVE", /\b(visual archive|visual-audit|snapshot-lab|live-readonly|capture|playwright|screenshot|pdf|manifest|evidence tier)\b/i],
  ["K-SECURITY-PRIVACY-A11Y-PERF", /\b(security|privacy|accessib|wcag|performance|dependency audit|csp|rate limit|turnstile|stripe webhook)\b/i],
  ["L-DOCS-DEPLOYMENT", /\b(document|readme|plans\.md|synology|deploy|rollback|backup|docker|compose|health)\b/i],
  ["AUTH-SESSION", /\b(auth|sign[- ]?in|sign[- ]?out|session|cookie|account creation)\b/i],
  ["ASSETS-TAXONOMY", /\b(brand|asset|icon|category symbol|taxonomy|social preview|og-image|share-image)\b/i],
];

const evidenceRules = [
  {
    match: /\b(auth|sign[- ]?in|sign[- ]?out|session|cookie)\b/i,
    code: [
      "src/components/auth-session-controls.tsx",
      "src/app/auth/sign-out/route.ts",
      "src/lib/session.ts",
      "src/proxy.ts",
    ],
    tests: ["tests/test-auth.test.ts"],
  },
  {
    match: /\bfaq\b/i,
    code: ["src/lib/faq.ts", "src/components/faq-explorer.tsx", "src/app/faq/page.tsx"],
    tests: ["tests/faq-contact.test.ts"],
  },
  {
    match: /\b(contact|feedback|attachment|smtp)\b/i,
    code: ["src/lib/contact.ts", "src/components/contact-form.tsx", "src/lib/mail.ts", "src/lib/db.ts"],
    tests: ["tests/faq-contact.test.ts"],
  },
  {
    match: /\b(category|taxonomy|lane|tier|symbol)\b/i,
    code: [
      "src/lib/taxonomy.ts",
      "src/components/filter-chip-link.tsx",
      "src/components/category-proposal-form.tsx",
      "src/components/admin/category-proposals.tsx",
    ],
    tests: ["tests/taxonomy.test.ts", "tests/category-symbol-assets.test.ts"],
  },
  {
    match: /\b(filter|search|reset)\b/i,
    code: ["src/components/task-board-filters.tsx", "src/components/search-field.tsx", "src/app/kens/page.tsx"],
    tests: [],
  },
  {
    match: /\b(rank|allocation|voice|pulse|quadratic|eligib|tie-break|discovery)\b/i,
    code: ["src/lib/allocation.ts", "src/lib/allocation-policy.ts", "src/lib/db.ts"],
    tests: ["tests/allocation.test.ts", "tests/attestation.test.ts"],
  },
  {
    match: /\b(lifecycle|checkpoint|run budget|runtime cap|partial delivery|early completion|stop reason)\b/i,
    code: ["src/lib/allocation-policy.ts", "src/lib/types.ts", "src/components/ken-timing-strip.tsx"],
    tests: ["tests/allocation.test.ts"],
  },
  {
    match: /\b(visitor|analytics|country|map|chart)\b/i,
    code: ["src/components/visitor-map.tsx", "src/components/admin/visitors.tsx", "src/lib/visitor.ts", "src/lib/db.ts"],
    tests: [],
  },
  {
    match: /\b(sponsor|funding|treasury|economics|coverage)\b/i,
    code: ["src/lib/economics.ts", "src/app/economics/page.tsx", "src/components/sponsor-form.tsx", "src/lib/db.ts"],
    tests: ["tests/economics.test.ts"],
  },
  {
    match: /\b(security|privacy|csp|host allow|origin|rate limit|turnstile|stripe webhook)\b/i,
    code: ["src/proxy.ts", "src/lib/security.ts", "src/lib/session.ts", "src/app/api/stripe/webhook/route.ts"],
    tests: ["tests/test-auth.test.ts"],
  },
  {
    match: /\b(theme|oled|light mode|scroll|overflow|responsive|mobile|focus|forced colors|reduced motion)\b/i,
    code: ["src/app/globals.css", "src/components/theme-toggle.tsx", "src/components/site-shell.tsx"],
    tests: [],
  },
  {
    match: /\b(changelog)\b/i,
    code: ["src/components/changelog-list.tsx", "src/app/about/page.tsx", "src/app/about/changelog/page.tsx"],
    tests: [],
  },
  {
    match: /\b(brand|asset|icon|social preview|og-image|share-image|category identity)\b/i,
    code: ["src/components/kenmatch-mark.tsx", "src/components/ken-visual.tsx", "public/icon-dark.svg", "public/og-image.png"],
    tests: ["tests/category-symbol-assets.test.ts"],
  },
];

const missingFeatureRules = [
  {
    match:
      /\b(first-class.{0,30}glossary|operational glossary|glossary (?:tab|route|page|explorer|term|search|integration|is operational)|integrate the glossary|glossary\/FAQ source)\b/i,
    absent: ["src/lib/glossary.ts", "src/app/glossary/page.tsx", "src/components/glossary-explorer.tsx"],
  },
  {
    match: /\breset filters|clear all (?:search )?filters\b/i,
    contentAbsent: ["src/components/task-board-filters.tsx", /Reset filters/i],
  },
  {
    match: /\bvisual archive|visual-audit|snapshot-lab|live-readonly\b/i,
    absent: ["visual-audit/package.json"],
  },
  {
    match: /\b(sitemap|robots\.ts|robots response)\b/i,
    absent: ["src/app/sitemap.ts", "src/app/robots.ts"],
  },
  {
    match: /\bsubmitted[- ]ken review|ken intake|review queue\b/i,
    absent: ["src/components/admin/task-submissions.tsx"],
  },
  {
    match: /\b(historical analytics|visitors by day|visitors by week|visitors by month|country distribution over time)\b/i,
    absent: ["src/components/admin/visitor-analytics.tsx"],
  },
  {
    match: /\b(appeal|recus|moderation threat model)\b/i,
    absent: ["src/lib/moderation-policy.ts"],
  },
  {
    match: /\b(trust surface|implementation-status transparency|how it works route)\b/i,
    absent: ["src/lib/product-status.ts"],
  },
  {
    match: /\b(graphical abstract)\b/i,
    absent: ["src/components/ken-lifecycle-abstract.tsx"],
  },
  {
    match: /\b(pagination|cursoring|100,000 kens|100000 kens)\b/i,
    absent: ["src/lib/discovery.ts"],
  },
];

const stopWords = new Set(
  "a an and are as at be been being but by can could do does for from had has have how i if in into is it its may might more most must no not of on only or our should so than that the their them then there these they this those to under use used using via was we were what when where which while who why will with would you your".split(
    " ",
  ),
);

function resolveSource(spec) {
  return spec.candidates.find((candidate) => existsSync(candidate));
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

function redactText(value) {
  return String(value)
    .replace(/C:\\Users\\[^\\\s]+\\[^\s`"'<>]*/gi, "[LOCAL_PATH]")
    .replace(/[A-Z]:\\[^\s`"'<>]*/g, "[LOCAL_PATH]")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "[REDACTED_ID]")
    .replace(/\b[0-9a-f]{64,}\b/gi, "[REDACTED_HEX]")
    .replace(
      /\b(?!cooperbeaman@proton\.me\b)(?![^@\s]+@example\.com\b)[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      "[REDACTED_EMAIL]",
    );
}

function sanitizeSourcePath(sourcePath) {
  const normalized = path.resolve(sourcePath);
  const relative = path.relative(repoRoot, normalized);
  if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) return relative.replaceAll("\\", "/");
  if (/^[Xx]:\\woodsmith\\/i.test(normalized)) {
    return `[woodsmith]/${path.relative("X:\\woodsmith", normalized).replaceAll("\\", "/")}`;
  }
  return `[external-corpus]/${path.basename(normalized)}`;
}

function cleanText(value) {
  return redactText(value)
    .replace(/^\s*(?:[-*+]|\d+[.)]|- \[[ xX]\])\s+/, "")
    .replace(/[`*_>#|]/g, " ")
    .replace(/\[(.*?)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedKey(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/\b(?:please|optimally|optimal|absolute|absolutely|comprehensive|comprehensively|exhaustive|exhaustively|meticulous|meticulously|rigorous|rigorously|maximum|maximal|elite|state[- ]of[- ]the[- ]art)\b/g, "")
    .replace(/\b(?:must|should|shall|needs? to|required to|ensure that|make sure)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(value) {
  return new Set(
    normalizedKey(value)
      .split(" ")
      .filter((token) => token.length > 2 && !stopWords.has(token)),
  );
}

function jaccard(left, right) {
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
}

function splitLongText(value) {
  if (value.length <= 900) return [value];
  return value
    .replace(/\s+(?=(?:[-*+]|\d+[.)])\s+)/g, "\n")
    .split(/(?<=[.!?;])\s+(?=[A-Z0-9"'`])/)
    .flatMap((part) => part.split(/\n+/))
    .filter(Boolean);
}

function workstreamFor(text) {
  return workstreamRules.find(([, pattern]) => pattern.test(text))?.[0] ?? "M-CROSS-CUTTING";
}

function priorityFor(text, authority) {
  if (/\b(security|privacy|auth|session|unsafe|secret|pii|deployment|rollback|database mutation|production)\b/i.test(text)) {
    return "P0";
  }
  if (authority === "current-request" || authority === "explicit-queue") return "P1";
  if (/\b(must|required|fix|missing|broken|block|prevent)\b/i.test(text)) return "P1";
  return authority === "current-repository" ? "P2" : "P3";
}

function riskFor(text) {
  if (/\b(secret|pii|security|auth|session|production mutation|database|migration|payment|stripe|deploy|rollback)\b/i.test(text)) {
    return "high";
  }
  if (/\b(rank|moderation|allocation|funding|review|privacy|accessib|performance|analytics)\b/i.test(text)) {
    return "medium";
  }
  return "low";
}

function lineLooksLikeRequirement(line, mode, context = "") {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 8 || trimmed.startsWith("|") || trimmed === "---") return false;
  if (/^#{1,6}\s+/.test(trimmed)) return false;
  if (boilerplate.test(trimmed) || codeLike.test(trimmed)) return false;
  if (/[\uE000-\uF8FF]/u.test(trimmed) || /^\s*[┌└├│┗┏┠┃]/u.test(trimmed)) return false;
  if (/\b[0-9a-f]{7,40}\b.*\b(?:HEAD|origin\/|commit|chore[:(]|feat[:(]|fix[:(])\b/i.test(trimmed)) return false;
  if (/^\s*(?:PS>|[$>])\s|^\s*(?:if|foreach)\s*\(.*\bgit\b/i.test(trimmed)) return false;
  if (/^(?:Exit code:|Wall time:|Output:|Total output lines:|Warning:|fatal:|error:)/i.test(trimmed)) return false;
  if (/^[A-Za-z]:\\|^\/(?:home|volume|app|tmp)\/|^[^ ]+\.(?:tsx?|jsx?|json|md|png|svg|yml|yaml):\d+:/i.test(trimmed)) return false;
  const listLike = /^\s*(?:[-*+]|\d+[.)]|- \[[ xX]\])\s+/.test(line);
  const questionLike = /\?\s*$/.test(trimmed);
  const relevant = productTerms.test(`${context} ${trimmed}`);
  if (mode === "queue") return listLike || questionLike || relevant;
  if (mode === "directive") {
    const cleaned = cleanText(trimmed);
    if (cleaned.length < 32 && !questionLike && !requirementVerb.test(cleaned)) return false;
    return (listLike && (requirementVerb.test(trimmed) || cleaned.length >= 48)) || requirementVerb.test(trimmed);
  }
  if (mode === "policy") {
    return /\b(must|shall|required|do not|never|only after|non-negotiable)\b/i.test(trimmed);
  }
  if (mode === "traceability") {
    return listLike && relevant && cleanText(trimmed).length >= 32;
  }
  if (mode === "plan") {
    return /\b(todo|partial|in progress|blocked|not applicable)\b/i.test(trimmed) && relevant;
  }
  if (mode === "concept-queue") return listLike || questionLike || (relevant && requirementVerb.test(trimmed));
  if (mode === "concept") {
    return (
      relevant &&
      /\b(must|should|need(?:s)? to|recommend(?:ed)?|propos(?:e|ed)|implement|add|fix|ensure|require(?:d|ment)?|todo|partial|in progress|blocked)\b/i.test(
        trimmed,
      )
    );
  }
  if (mode === "claims" || mode === "reference") return false;
  return relevant && (listLike || questionLike || requirementVerb.test(trimmed));
}

function requirementTextFrom(raw) {
  const cleaned = cleanText(raw);
  if (!cleaned) return "";
  if (/\?\s*$/.test(cleaned)) return `Answer publicly and accurately: ${cleaned}`;
  if (/^(?:no|never|do not|avoid|preserve|add|fix|ensure|implement|upgrade|optimi[sz]e|validate|verify|create|build|audit|document|support|provide|replace|refactor|integrate|complete|include|cover|keep|use|allow|block|reject|record|publish|define|enforce|maintain|route|protect|test|run)\b/i.test(cleaned)) {
    return cleaned;
  }
  return `Ensure ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}`;
}

function excerpt(value, limit = 260) {
  const cleaned = cleanText(value);
  return cleaned.length <= limit ? cleaned : `${cleaned.slice(0, limit - 1).trimEnd()}…`;
}

function isRelevantPrompt(block) {
  const joined = block.map((item) => item.text).join(" ");
  if (!productTerms.test(joined)) return false;
  if (/^<environment_context>/m.test(joined) && joined.length < 1200) return false;
  if (/AGENTS\.md instructions/.test(joined) && !/\b(?:KenMatch|kmat\.ch)\b/i.test(joined.replace(/AGENTS\.md instructions.*/s, ""))) {
    return false;
  }
  return true;
}

function collectBlockCandidates(block, spec, requirements, claims, role) {
  if (block.length === 0) return;
  const relevant = isRelevantPrompt(block);
  if (role === "assistant") {
    if (!relevant) return;
    const claim = block.find(
      (item) =>
        completionClaim.test(item.text) &&
        productTerms.test(`${item.heading} ${item.text}`) &&
        item.text.length >= 20 &&
        item.text.length < 700 &&
        !boilerplate.test(item.text),
    );
    if (claim) {
      claims.push({
        claim_type: "historical_completion_claim",
        source_file: spec.name,
        source_line_or_section: `line ${claim.line}${claim.heading ? `; ${claim.heading}` : ""}`,
        exact_short_excerpt: excerpt(claim.text),
      });
    }
    return;
  }
  if (!relevant) return;
  const matches = [];
  for (const item of block) {
    for (const part of splitLongText(item.text)) {
      if (!lineLooksLikeRequirement(part, "historical", item.heading)) continue;
      matches.push({ item, part });
    }
  }
  if (matches.length === 0) return;
  const primary =
    matches.find(({ part }) =>
      /\b(please|request|task|implement|add|fix|upgrade|audit|validate|continue|deploy)\b/i.test(part),
    ) ?? matches[0];
  const candidate = makeCandidate(spec, primary.item, primary.part);
  candidate.acceptance_criteria = matches
    .map(({ part }) => cleanText(part))
    .filter((value) => value.length >= 20)
    .slice(0, 60);
  requirements.push(candidate);
}

function makeCandidate(spec, item, raw) {
  const cleaned = cleanText(raw);
  const normalized =
    /:\s*$/.test(raw) && cleaned.length < 140
      ? `Implement ${item.heading || "the current section"} requirements: ${cleaned.replace(/:\s*$/, "")}.`
      : requirementTextFrom(raw);
  return {
    normalized_requirement: normalized.slice(0, 800),
    exact_short_excerpt: excerpt(raw),
    source: {
      source_file: spec.name,
      source_path: sanitizeSourcePath(item.sourcePath),
      source_line_or_section: `line ${item.line}${item.heading ? `; ${item.heading}` : ""}`,
      authority: spec.authority,
    },
    workstream: workstreamFor(`${item.heading} ${normalized}`),
    priority: priorityFor(normalized, spec.authority),
    risk: riskFor(normalized),
    acceptance_criteria: [],
  };
}

async function scanSource(spec, sourcePath) {
  const requirements = [];
  const claims = [];
  const referenceConstraints = [];
  const headings = [];
  const input = createReadStream(sourcePath, { encoding: "utf8" });
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  let lineNo = 0;
  let heading = "";
  let role = spec.mode === "codex-thread" || spec.mode === "chat-export" ? "unknown" : "authoritative";
  let block = [];
  let inCodeFence = false;
  let inConceptTracker = false;
  let inDirectiveBody = spec.name !== "current-completion-objective.md";
  let listStack = [];
  let sectionContainer = null;
  let sectionContainerHeading = "";

  const flushBlock = () => {
    collectBlockCandidates(block, spec, requirements, claims, role);
    block = [];
  };

  for await (const rawLine of lines) {
    lineNo += 1;
    const trimmed = rawLine.trim();
    if (/^```/.test(trimmed)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (/^#{1,6}\s+/.test(trimmed)) {
      heading = cleanText(trimmed.replace(/^#{1,6}\s+/, ""));
      headings.push({ line: lineNo, heading });
      listStack = [];
      sectionContainer = null;
      sectionContainerHeading = heading;
      if (/feature tracker|to-do list/i.test(heading)) inConceptTracker = true;
      if (/^archived$|^overview$/i.test(heading) && inConceptTracker) inConceptTracker = false;
      if (
        spec.name === "current-completion-objective.md" &&
        (/^0\.\s+CENTRAL ASSIGNMENT/i.test(heading) || /^CENTRAL ASSIGNMENT$/i.test(heading))
      ) {
        inDirectiveBody = true;
      }
    }

    if (spec.mode === "codex-thread") {
      if (/^### Prompt \d+/.test(trimmed)) {
        flushBlock();
        role = "user";
        continue;
      }
      if (/^### (?:Response|Assistant message|Action) \d+/.test(trimmed) || /^## Turn \d+/.test(trimmed)) {
        flushBlock();
        role = /^### Response/.test(trimmed) ? "assistant" : "unknown";
        continue;
      }
      if (/^\| Role \| user \|/i.test(trimmed)) role = "user";
      if (/^\| Role \| assistant \|/i.test(trimmed)) role = "assistant";
      if (role === "user" || role === "assistant") {
        block.push({ text: rawLine, line: lineNo, heading, sourcePath });
      }
      continue;
    }

    if (spec.mode === "chat-export") {
      if (/^#### You:/.test(trimmed)) {
        flushBlock();
        role = "user";
        continue;
      }
      if (/^#### ChatGPT:/.test(trimmed)) {
        flushBlock();
        role = "assistant";
        continue;
      }
      if (role === "user" || role === "assistant") {
        block.push({ text: rawLine, line: lineNo, heading, sourcePath });
      }
      continue;
    }

    if (inCodeFence) continue;
    if (!inDirectiveBody) continue;
    if (spec.mode === "reference") {
      if (
        requirementVerb.test(trimmed) &&
        productTerms.test(`${heading} ${trimmed}`) &&
        !boilerplate.test(trimmed) &&
        !codeLike.test(trimmed) &&
        trimmed.length >= 20 &&
        trimmed.length < 900
      ) {
        referenceConstraints.push({
          source_file: spec.name,
          source_line_or_section: `line ${lineNo}${heading ? `; ${heading}` : ""}`,
          exact_short_excerpt: excerpt(trimmed),
        });
      }
      continue;
    }
    if (spec.mode === "claims") {
      if (
        productTerms.test(`${heading} ${trimmed}`) &&
        (completionClaim.test(trimmed) || /^\s*[-*+]\s+/.test(rawLine)) &&
        trimmed.length >= 20 &&
        trimmed.length < 700 &&
        !codeLike.test(trimmed)
      ) {
        claims.push({
          claim_type: "current_documentation_claim",
          source_file: spec.name,
          source_line_or_section: `line ${lineNo}${heading ? `; ${heading}` : ""}`,
          exact_short_excerpt: excerpt(trimmed),
        });
      }
      continue;
    }
    if (
      (spec.mode === "concept" || spec.mode === "concept-queue") &&
      !inConceptTracker &&
      !/\b(todo|partial|in progress|blocked|done|must|should|implement|add|fix|ensure|recommend|propose|require)\b/i.test(trimmed)
    ) {
      continue;
    }
    const listMatch = rawLine.match(/^(\s*)(?:[-*+]|\d+[.)]|- \[[ xX]\])\s+/);
    const indent = listMatch ? listMatch[1].replace(/\t/g, "    ").length : -1;
    if (listMatch) {
      while (listStack.length > 0 && listStack.at(-1).indent >= indent) listStack.pop();
      const parent = listStack.at(-1)?.candidate ?? (sectionContainerHeading === heading ? sectionContainer : null);
      if (parent) {
        const criterion = cleanText(rawLine);
        if (criterion.length >= 3 && !parent.acceptance_criteria.includes(criterion)) {
          parent.acceptance_criteria.push(criterion);
        }
        listStack.push({ indent, candidate: parent });
        continue;
      }
    }
    for (const part of splitLongText(rawLine)) {
      if (!lineLooksLikeRequirement(part, spec.mode, heading)) continue;
      const candidate = makeCandidate(spec, { text: part, line: lineNo, heading, sourcePath }, part);
      requirements.push(candidate);
      if (listMatch) listStack.push({ indent, candidate });
      if (
        !listMatch &&
        (/:\s*$/.test(part) || /\b(?:include|cover|at least|requirements|properties|rules|checks)\b/i.test(part))
      ) {
        sectionContainer = candidate;
        sectionContainerHeading = heading;
      }
    }
  }
  flushBlock();
  return { requirements, claims, referenceConstraints, headings, lineCount: lineNo };
}

function canonicalize(candidates) {
  const canonical = [];
  const exact = new Map();
  for (const candidate of candidates) {
    const key = normalizedKey(candidate.normalized_requirement);
    if (key.length < 8) continue;
    let target = exact.get(key);
    if (!target) {
      const tokens = tokenSet(key);
      target = canonical.find(
        (entry) =>
          entry.workstream === candidate.workstream &&
          Math.min(entry._tokens.size, tokens.size) >= 5 &&
          jaccard(entry._tokens, tokens) >= 0.94,
      );
    }
    if (!target) {
      const digest = createHash("sha256").update(key).digest("hex").slice(0, 12).toUpperCase();
      target = {
        id: `REQ-${digest}`,
        source_file: candidate.source.source_file,
        source_line_or_section: candidate.source.source_line_or_section,
        normalized_requirement: candidate.normalized_requirement,
        exact_short_excerpt: candidate.exact_short_excerpt,
        priority: candidate.priority,
        risk: candidate.risk,
        current_code_evidence: [],
        current_test_evidence: [],
        current_live_evidence: [],
        status: "NOT_AUDITED",
        superseded_by: null,
        implementation_plan: `Audit and implement under ${candidate.workstream}.`,
        acceptance_criteria:
          candidate.acceptance_criteria.length > 0
            ? [...candidate.acceptance_criteria]
            : [`The requirement is implemented or dispositioned with reproducible current evidence.`],
        test_ids: [],
        commits: [],
        notes: "Initial automated classification; current evidence must be manually verified before DONE.",
        workstream: candidate.workstream,
        source_backlinks: [],
        _tokens: tokenSet(key),
      };
      canonical.push(target);
      exact.set(key, target);
    }
    const backlinkKey = `${candidate.source.source_file}:${candidate.source.source_line_or_section}`;
    if (!target.source_backlinks.some((item) => `${item.source_file}:${item.source_line_or_section}` === backlinkKey)) {
      target.source_backlinks.push(candidate.source);
    }
    if (candidate.priority < target.priority) target.priority = candidate.priority;
    if (candidate.risk === "high" || (candidate.risk === "medium" && target.risk === "low")) target.risk = candidate.risk;
    for (const criterion of candidate.acceptance_criteria) {
      if (!target.acceptance_criteria.includes(criterion)) target.acceptance_criteria.push(criterion);
    }
  }
  return canonical;
}

async function firstEvidenceLine(relativePath, pattern) {
  const absolute = path.join(repoRoot, relativePath);
  if (!existsSync(absolute)) return null;
  if (/\.(?:png|ico|jpg|jpeg|webp)$/i.test(relativePath)) return `${relativePath} (binary asset present)`;
  const text = await fs.readFile(absolute, "utf8");
  const lines = text.split(/\r?\n/);
  const line = pattern ? lines.findIndex((value) => pattern.test(value)) : lines.findIndex((value) => value.trim());
  return `${relativePath}:${Math.max(1, line + 1)}`;
}

async function attachEvidence(entries) {
  const fileCache = new Map();
  for (const entry of entries) {
    const matchingRules = evidenceRules.filter((rule) => rule.match.test(entry.normalized_requirement));
    const code = [...new Set(matchingRules.flatMap((rule) => rule.code))];
    const tests = [...new Set(matchingRules.flatMap((rule) => rule.tests))];
    for (const file of code) {
      if (!existsSync(path.join(repoRoot, file))) continue;
      if (!fileCache.has(file)) fileCache.set(file, await firstEvidenceLine(file));
      entry.current_code_evidence.push(fileCache.get(file));
    }
    for (const file of tests) {
      if (!existsSync(path.join(repoRoot, file))) continue;
      if (!fileCache.has(file)) fileCache.set(file, await firstEvidenceLine(file));
      entry.current_test_evidence.push(fileCache.get(file));
      entry.test_ids.push(path.basename(file));
    }

    const missingRule = missingFeatureRules.find((rule) => rule.match.test(entry.normalized_requirement));
    let knownMissing = false;
    if (missingRule?.absent) {
      knownMissing = missingRule.absent.every((file) => !existsSync(path.join(repoRoot, file)));
    }
    if (missingRule?.contentAbsent) {
      const [file, pattern] = missingRule.contentAbsent;
      const absolute = path.join(repoRoot, file);
      knownMissing = !existsSync(absolute) || !pattern.test(await fs.readFile(absolute, "utf8"));
    }
    if (knownMissing) {
      entry.status = "MISSING";
      entry.notes = "Initial gap audit found no implementation matching the required capability.";
    } else if (entry.current_code_evidence.length > 0) {
      const broadening =
        /\b(complete|comprehensive|full lifecycle|historical|over time|pagination|100,?000|appeal|recus|threat model|scale-resilient|every route|all states|tier-2|tier-3)\b/i.test(
          entry.normalized_requirement,
        );
      entry.status = broadening ? "PARTIAL" : "IMPLEMENTED_UNVALIDATED";
      entry.notes = broadening
        ? "Related implementation exists, but the requested end-to-end scope is broader than current evidence."
        : "Related implementation and/or tests exist; runtime and acceptance evidence is still required.";
    }
  }
}

async function brandAssetHashes() {
  const assets = [
    "public/icon-dark.svg",
    "public/icon-light.svg",
    "public/kenmatch_dark_final_svg_compatible_sector.svg",
    "public/kenmatch_light_final_svg_compatible_sector.svg",
    "public/og-image.png",
    "public/share-image.png",
    "public/favicon.ico",
    "public/apple-touch-icon.png",
    "public/icon-192.png",
    "public/icon-512.png",
  ];
  const categoryRoots = ["public/category-icons/dark", "public/category-icons/light"];
  for (const root of categoryRoots) {
    if (!existsSync(path.join(repoRoot, root))) continue;
    for (const name of await fs.readdir(path.join(repoRoot, root))) assets.push(`${root}/${name}`);
  }
  const output = {};
  for (const asset of assets.sort()) {
    const absolute = path.join(repoRoot, asset);
    if (existsSync(absolute)) output[asset] = await sha256File(absolute);
  }
  return output;
}

function statusCounts(entries) {
  return entries.reduce((counts, entry) => {
    counts[entry.status] = (counts[entry.status] ?? 0) + 1;
    return counts;
  }, {});
}

function woodsmithProvenance() {
  const woodsmithRoot = "X:\\woodsmith";
  if (!existsSync(path.join(woodsmithRoot, ".git"))) {
    return {
      repository: woodsmithRoot,
      status: "unavailable",
      note: "The local Woodsmith repository was not available when the ledger was generated.",
    };
  }
  const git = (...args) => {
    try {
      return execFileSync("git", args, { cwd: woodsmithRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch {
      return null;
    }
  };
  const sourceRef = "origin/codex/sitewide-studio-ux-commission-overhaul-20260711";
  const latestRef = "origin/codex/woodsmith-v19-admin-completion-20260721";
  const resolved = git(
    "rev-parse",
    "origin/master",
    sourceRef,
    latestRef,
    `${sourceRef}:docs/visual-archive.md`,
  )?.split(/\r?\n/);
  return {
    repository: "https://github.com/lowestprime/woodsmith",
    remote: git("remote", "get-url", "origin"),
    default_ref: "origin/master",
    default_head: resolved?.[0] ?? null,
    source_ref: sourceRef,
    source_head: resolved?.[1] ?? null,
    latest_observed_ref: latestRef,
    latest_observed_head: resolved?.[2] ?? null,
    visual_archive_blob: resolved?.[3] ?? null,
    last_visual_archive_commit: git("log", "-1", "--format=%H", sourceRef, "--", "visual-audit", "docs/visual-archive.md"),
    status: "verified",
    note:
      "The default branch does not contain docs/visual-archive.md. The implementation source ref is the common ancestor of the latest observed v19 branch, and both refs carry the same visual-archive document blob.",
  };
}

function markdownCell(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

function renderMarkdown(ledger) {
  const counts = ledger.summary.status_counts;
  const lines = [
    "# KenMatch Completion Ledger",
    "",
    "> This is the initial evidence-first ledger generated before product-behavior edits. `DONE` is intentionally impossible at this stage because current local, browser, deployment, and live evidence has not yet been completed.",
    "",
    "## Provenance",
    "",
    `- Repository: \`${ledger.repository.path}\``,
    `- Branch: \`${ledger.repository.branch}\``,
    `- Starting SHA: \`${ledger.repository.starting_sha}\``,
    `- Generated: \`${ledger.generated_at}\``,
    `- Generator: \`${ledger.generator}\``,
    `- Woodsmith visual-archive source: \`${ledger.reference_implementation_provenance.source_ref}@${ledger.reference_implementation_provenance.source_head}\``,
    `- Canonical requirements: **${ledger.requirements.length}**`,
    `- Historical completion claims retained for re-audit: **${ledger.historical_completion_claims.length}**`,
    `- Reference-architecture constraints retained: **${ledger.reference_constraints.length}**`,
    "",
    "## Status Counts",
    "",
    "| Status | Count |",
    "|---|---:|",
    ...Object.entries(counts)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([status, count]) => `| ${status} | ${count} |`),
    "",
    "## Source Inventory",
    "",
    "| Source | Authority | Lines | SHA-256 | Requirements extracted | Notes |",
    "|---|---|---:|---|---:|---|",
    ...ledger.sources.map(
      (source) =>
        `| ${markdownCell(source.name)} | ${source.authority} | ${source.line_count} | \`${source.sha256.slice(0, 16)}…\` | ${source.extracted_requirements} | ${markdownCell(source.note)} |`,
    ),
    "",
    "## Initial Gap Analysis",
    "",
    ...ledger.summary.initial_gap_analysis.map((item) => `- **${item.status}** ${item.capability}: ${item.evidence}`),
    "",
    "## Baseline Validation",
    "",
    ...ledger.baseline_validation.commands.map(
      (item) =>
        `- \`${item.command}\`: **${item.outcome}**${item.detail ? ` — ${markdownCell(item.detail)}` : ""}`,
    ),
    "",
    "## Requirement Ledger",
    "",
    "The JSON companion contains all fields, source backlinks, evidence arrays, acceptance criteria, and historical claims. This table includes every canonical requirement in a reviewable compact form.",
    "",
    "| ID | Workstream | Priority | Risk | Status | Requirement | Primary source | Current evidence |",
    "|---|---|---|---|---|---|---|---|",
    ...ledger.requirements.map((entry) => {
      const evidence = [...entry.current_code_evidence, ...entry.current_test_evidence].slice(0, 3).join("; ");
      return `| ${entry.id} | ${entry.workstream} | ${entry.priority} | ${entry.risk} | ${entry.status} | ${markdownCell(entry.normalized_requirement)} | ${markdownCell(`${entry.source_file} (${entry.source_line_or_section})`)} | ${markdownCell(evidence || "None yet")} |`;
    }),
    "",
    "## Asset Integrity Baseline",
    "",
    "The following production brand, social-preview, and category identity assets are protected by their recorded SHA-256 values in the JSON ledger. Any later byte change must be justified by a demonstrated defect and called out explicitly.",
    "",
    ...Object.entries(ledger.asset_integrity_baseline).map(([asset, hash]) => `- \`${hash}\`  \`${asset}\``),
    "",
    "## Maintenance Rules",
    "",
    "- Update this ledger after every implementation slice.",
    "- Do not promote an item to `DONE` without current code, test, and applicable runtime/live evidence.",
    "- Preserve duplicate source backlinks even when requirements canonicalize.",
    "- Use `SUPERSEDED` or `NOT_APPLICABLE` only with a precise rationale.",
    "- Record external blockers only after all safe scaffolding, tests, and documentation are complete.",
  ];
  return `${lines.join("\n")}\n`;
}

async function main() {
  const upstreamSha = execFileSync("git", ["rev-parse", "origin/main"], { cwd: repoRoot, encoding: "utf8" }).trim();
  const repository = {
    path: ".",
    remote: execFileSync("git", ["remote", "get-url", "origin"], { cwd: repoRoot, encoding: "utf8" }).trim(),
    branch: execFileSync("git", ["branch", "--show-current"], { cwd: repoRoot, encoding: "utf8" }).trim(),
    starting_sha: execFileSync("git", ["merge-base", "HEAD", upstreamSha], { cwd: repoRoot, encoding: "utf8" }).trim(),
    upstream_sha: upstreamSha,
  };
  const sourceInventory = [];
  const candidates = [];
  const sourceClaims = [];
  const referenceConstraints = [];

  for (const spec of sourceSpecs) {
    const sourcePath = resolveSource(spec);
    if (!sourcePath) {
      sourceInventory.push({
        name: spec.name,
        authority: spec.authority,
        path: null,
        line_count: 0,
        sha256: "",
        extracted_requirements: 0,
        status: "missing",
        note: spec.note ?? "Source was not found.",
      });
      continue;
    }
    const scan = await scanSource(spec, sourcePath);
    candidates.push(...scan.requirements);
    sourceClaims.push(...scan.claims);
    referenceConstraints.push(...scan.referenceConstraints);
    sourceInventory.push({
      name: spec.name,
      authority: spec.authority,
        path: sanitizeSourcePath(sourcePath),
      line_count: scan.lineCount,
      heading_count: scan.headings.length,
      sha256: await sha256File(sourcePath),
      extracted_requirements: scan.requirements.length,
      historical_claims: scan.claims.length,
      reference_constraints: scan.referenceConstraints.length,
      status: "scanned",
      note: spec.note ?? "",
    });
  }

  const requirements = canonicalize(candidates);
  await attachEvidence(requirements);
  requirements.sort(
    (left, right) =>
      left.priority.localeCompare(right.priority) ||
      left.workstream.localeCompare(right.workstream) ||
      left.id.localeCompare(right.id),
  );

  const counts = statusCounts(requirements);
  const ledger = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    generator: "scripts/generate-completion-ledger.mjs",
    repository,
    source_precedence: [
      "Current code, schema, tests, runtime configuration, and live behavior",
      "Current synchronized repository documentation",
      "Explicit requirement queues and current request",
      "Historical threads as decision history/evidence",
      "Conceptual/exported documents as non-authoritative requirements/copy corpus",
    ],
    reference_implementation_provenance: woodsmithProvenance(),
    baseline_validation: {
      observed_at: "2026-07-27",
      repository_sha: repository.starting_sha,
      commands: [
        {
          command: "npm ci",
          outcome: "PASS",
          detail: "381 packages installed; npm reported 1 low and 7 high advisories.",
        },
        {
          command: "npm run lint",
          outcome: "PASS_WITH_WARNINGS",
          detail: "0 errors; pre-existing warnings remain in page.tsx and kenmatch-mark.tsx.",
        },
        {
          command: "npm run test",
          outcome: "PASS",
          detail: "41 tests passed; 0 failed, skipped, cancelled, or todo.",
        },
        {
          command: "npm run typecheck",
          outcome: "PASS",
          detail: "Next route type generation and tsc --noEmit completed successfully.",
        },
        {
          command: "npm run build",
          outcome: "PASS",
          detail: "Next.js 16.2.4 production compile/generate-env and route-chunk verification completed.",
        },
        {
          command: "npm audit --audit-level=high",
          outcome: "FAIL",
          detail:
            "7 high and 1 low advisories; direct runtime findings include Next.js and Nodemailer and require an isolated upgrade.",
        },
      ],
    },
    sources: sourceInventory,
    summary: {
      candidate_requirements_extracted: candidates.length,
      canonical_requirements: requirements.length,
      duplicate_backlinks_preserved: requirements.reduce(
        (count, entry) => count + Math.max(0, entry.source_backlinks.length - 1),
        0,
      ),
      source_claims: sourceClaims.length,
      reference_constraints: referenceConstraints.length,
      status_counts: counts,
      initial_gap_analysis: [
        {
          capability: "Glossary",
          status: "MISSING",
          evidence: "No glossary data module, route, or explorer component exists.",
        },
        {
          capability: "Feed reset and navigation consolidation",
          status: "MISSING",
          evidence: "TaskBoardFilters has no Reset filters control and currently issues both effect-driven and immediate router.replace calls.",
        },
        {
          capability: "Strategic FAQ queue",
          status: "PARTIAL",
          evidence: "FAQ exists with core basics, but the supplied competitor, resilience, trust, incentive, quality, and scale questions are absent.",
        },
        {
          capability: "Category proposal lifecycle",
          status: "PARTIAL",
          evidence: "Submission and pending/approved/rejected review exist; revision, merge, idempotency, submitter status, and durable decision history are incomplete.",
        },
        {
          capability: "Submitted-Ken review and moderation appeals",
          status: "MISSING",
          evidence: "No explicit submitted-Ken intake queue, appeal/recusal workflow, or moderation policy module exists.",
        },
        {
          capability: "Scale-resilient discovery",
          status: "PARTIAL",
          evidence: "Current marketplace hydration loads and sorts the full task corpus in memory; no bounded cursor/pagination or large-volume property tests exist.",
        },
        {
          capability: "Lifecycle graphical abstract",
          status: "MISSING",
          evidence: "Policy constants and compact timing strips exist, but no complete accessible graphical abstract component exists.",
        },
        {
          capability: "Historical admin analytics",
          status: "MISSING",
          evidence: "Interactive country map and current aggregates exist; historical series, date ranges, comparison periods, and accessible chart/table equivalents do not.",
        },
        {
          capability: "Technical SEO",
          status: "PARTIAL",
          evidence: "Root metadata exists; sitemap, robots route, route-specific canonical/noindex policy, and structured-data coverage are absent.",
        },
        {
          capability: "Deterministic visual archive",
          status: "MISSING",
          evidence: "No KenMatch visual-audit workspace, readonly audit guard, inventory endpoint, lab compose stack, or archive tooling exists.",
        },
        {
          capability: "Brand/category asset integrity",
          status: "IMPLEMENTED_UNVALIDATED",
          evidence: "Finalized assets are present and hashed; browser/live byte parity still requires validation.",
        },
      ],
    },
    asset_integrity_baseline: await brandAssetHashes(),
    requirements: requirements.map((entry) =>
      Object.fromEntries(Object.entries(entry).filter(([key]) => key !== "_tokens")),
    ),
    historical_completion_claims: sourceClaims.filter((claim) => claim.claim_type !== "current_documentation_claim"),
    current_documentation_claims: sourceClaims.filter((claim) => claim.claim_type === "current_documentation_claim"),
    reference_constraints: referenceConstraints,
  };

  await fs.mkdir(path.join(repoRoot, "docs"), { recursive: true });
  await fs.writeFile(
    path.join(repoRoot, "docs", "kenmatch-completion-ledger.json"),
    `${JSON.stringify(ledger, null, 2)}\n`,
    "utf8",
  );
  await fs.writeFile(
    path.join(repoRoot, "docs", "kenmatch-completion-ledger.md"),
    renderMarkdown(ledger),
    "utf8",
  );

  process.stdout.write(
    `${JSON.stringify(
      {
        branch: repository.branch,
        sha: repository.starting_sha,
        sources: sourceInventory.length,
        candidates: candidates.length,
        canonical: requirements.length,
        claims: sourceClaims.length,
        referenceConstraints: referenceConstraints.length,
        statuses: counts,
      },
      null,
      2,
    )}\n`,
  );
}

await main();
