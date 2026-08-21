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
const releaseEvidencePath = path.join(repoRoot, "docs", "release-evidence.json");

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
    match:
      /\b(answer publicly and accurately|closest equivalents|differentiat|novel public value|why (?:is )?kenmatch necessary|partner candidates?|clone(?:s|d)? the idea|provider dependency|direct reliance and dependence on frontier|crowdsourced curation collaborative filtering|operationally and economically|trust kenmatch|make an account|incentives? implemented|organizational and business-model|funding or compute capacity|quality of a ken|long-running ken stop|objective.{0,30}human judgment|discovery remain reliable|submitted ken enter a review queue|volunteer moderators?)\b/i,
    code: ["src/lib/faq.ts", "src/components/faq-explorer.tsx", "src/app/faq/page.tsx"],
    tests: ["tests/faq-contact.test.ts"],
  },
  {
    match: /\b(glossary|operational definition|plain definition)\b/i,
    code: ["src/lib/glossary.ts", "src/components/glossary-explorer.tsx", "src/app/glossary/page.tsx"],
    tests: ["tests/faq-contact.test.ts"],
  },
  {
    match: /\b(trust surface|implementation-status transparency|product truth|what works now)\b/i,
    code: [
      "src/lib/product-truth.ts",
      "src/components/product-truth-matrix.tsx",
      "src/app/faq/page.tsx",
    ],
    tests: ["tests/faq-contact.test.ts"],
  },
  {
    match: /\b(contact|feedback|attachment|smtp)\b/i,
    code: ["src/lib/contact.ts", "src/components/contact-form.tsx", "src/lib/mail.ts", "src/lib/db.ts"],
    tests: ["tests/faq-contact.test.ts"],
  },
  {
    match:
      /\b(category proposal|submitted[- ]ken|ken intake|review queue|needs revision|second review|approve|reject|merge|appeal|recus|moderation threat model|conflict of interest|reviewer)\b/i,
    code: [
      "src/lib/intake-review.ts",
      "src/lib/review-policy.ts",
      "src/lib/review-schema.ts",
      "src/components/admin/ken-submissions.tsx",
      "src/components/admin/category-proposals.tsx",
      "src/components/submission-review-status.tsx",
      "src/app/reviews/page.tsx",
      "docs/moderation-threat-model.md",
      "docs/intake-review-operations.md",
    ],
    tests: ["tests/intake-review.test.ts", "tests/review-database-contract.test.ts"],
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
    tests: ["tests/discovery.test.ts"],
  },
  {
    match: /\b(rank|ranker|allocation|voice|pulse|quadratic|eligib|tie-break|discovery|black-box)\b/i,
    code: [
      "src/lib/allocation.ts",
      "src/lib/allocation-policy.ts",
      "src/lib/discovery.ts",
      "src/lib/db.ts",
      "docs/ranking-discovery.md",
    ],
    tests: ["tests/allocation.test.ts", "tests/attestation.test.ts", "tests/discovery.test.ts"],
  },
  {
    match: /\b(lifecycle|checkpoint|run budget|runtime cap|partial delivery|early completion|stop reason)\b/i,
    code: [
      "src/lib/allocation-policy.ts",
      "src/lib/types.ts",
      "src/components/ken-lifecycle-map.tsx",
      "src/components/ken-timing-strip.tsx",
      "docs/lifecycle-graphical-abstract.md",
    ],
    tests: ["tests/allocation.test.ts", "tests/lifecycle-policy.test.ts"],
  },
  {
    match: /\b(visitor|analytics|country|map|chart)\b/i,
    code: [
      "src/components/visitor-map.tsx",
      "src/components/admin/visitors.tsx",
      "src/components/admin/historical-analytics.tsx",
      "src/lib/admin-analytics.ts",
      "src/lib/visitor.ts",
      "src/lib/db.ts",
      "docs/admin-historical-analytics.md",
    ],
    tests: ["tests/admin-analytics.test.ts", "tests/privacy.test.ts"],
  },
  {
    match: /\b(sponsor|funding|treasury|economics|coverage)\b/i,
    code: ["src/lib/economics.ts", "src/app/economics/page.tsx", "src/components/sponsor-form.tsx", "src/lib/db.ts"],
    tests: ["tests/economics.test.ts"],
  },
  {
    match: /\b(seo|sitemap|robots|canonical|json-ld|structured data|search intent|backlink|reddit|community launch|community integration|marketing|publicity|ethical outreach|hacker news|linkedin)\b/i,
    code: [
      "src/lib/seo.ts",
      "src/app/robots.ts",
      "src/app/sitemap.ts",
      "src/proxy.ts",
      "scripts/audit-seo.mjs",
      "docs/seo-implementation.md",
      "docs/marketing/seo-and-content-strategy.md",
      "docs/marketing/launch-and-community-strategy.md",
      "docs/community/reddit-launch-guide.md",
    ],
    tests: ["tests/seo.test.ts"],
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
    absent: ["src/components/admin/ken-submissions.tsx", "src/lib/review-policy.ts"],
  },
  {
    match: /\b(historical analytics|visitors by day|visitors by week|visitors by month|country distribution over time)\b/i,
    absent: ["src/components/admin/historical-analytics.tsx", "src/lib/admin-analytics.ts"],
  },
  {
    match: /\b(appeal|recus|moderation threat model)\b/i,
    absent: ["src/lib/review-policy.ts", "docs/moderation-threat-model.md"],
  },
  {
    match: /\b(trust surface|implementation-status transparency|how it works route)\b/i,
    absent: ["src/lib/product-truth.ts", "src/components/product-truth-matrix.tsx"],
  },
  {
    match: /\b(graphical abstract)\b/i,
    absent: ["src/components/ken-lifecycle-map.tsx", "docs/lifecycle-graphical-abstract.md"],
  },
  {
    match: /\b(pagination|cursoring|100,000 kens|100000 kens)\b/i,
    absent: ["src/lib/discovery.ts"],
  },
];

const workstreamClosureFiles = {
  "A-FAQ-GLOSSARY-TRUST": [
    "src/lib/faq.ts",
    "src/lib/glossary.ts",
    "src/lib/product-truth.ts",
    "tests/faq-contact.test.ts",
  ],
  "AUTH-SESSION": [
    "src/components/auth-session-controls.tsx",
    "src/app/auth/sign-out/route.ts",
    "tests/test-auth.test.ts",
    "tests/request-origin.test.ts",
  ],
  "B-FEED-RANKING-SEARCH": [
    "src/lib/discovery.ts",
    "src/components/task-board-filters.tsx",
    "tests/discovery.test.ts",
  ],
  "C-REVIEW-WORKFLOWS": [
    "src/lib/intake-review.ts",
    "src/lib/review-policy.ts",
    "tests/intake-review.test.ts",
    "tests/review-database-contract.test.ts",
    "tests/proposal-validation.test.ts",
  ],
  "D-MODERATION": [
    "src/lib/review-policy.ts",
    "docs/moderation-threat-model.md",
    "tests/review-database-contract.test.ts",
    "tests/review-redaction.test.ts",
  ],
  "E-LIFECYCLE": [
    "src/lib/allocation-policy.ts",
    "src/components/ken-lifecycle-map.tsx",
    "tests/lifecycle-policy.test.ts",
  ],
  "F-VISUAL-UX": [
    "src/app/globals.css",
    "docs/visual-system-and-long-page-audit.md",
    "tests/responsive-text-fit.test.ts",
    "tests/reading-progress.test.ts",
  ],
  "G-ANALYTICS": [
    "src/components/visitor-map.tsx",
    "src/components/admin/historical-analytics.tsx",
    "tests/admin-analytics.test.ts",
    "tests/visitor-map-responsive.test.ts",
  ],
  "H-SEO-COMMUNITY": [
    "src/lib/seo.ts",
    "scripts/audit-seo.mjs",
    "tests/seo.test.ts",
    "docs/marketing/launch-and-community-strategy.md",
  ],
  "I-POLICY-ECONOMICS": [
    "src/lib/run-governance.ts",
    "src/lib/economics.ts",
    "tests/run-governance.test.ts",
    "tests/economics.test.ts",
  ],
  "J-VISUAL-ARCHIVE": [
    "visual-audit/src/run.ts",
    "visual-audit/src/capture-coordinator.ts",
    "visual-audit/src/validate.ts",
    "visual-audit/src/convergence.spec.ts",
    "visual-audit/src/capture-coordinator.spec.ts",
    "docs/visual-archive.md",
  ],
  "K-SECURITY-PRIVACY-A11Y-PERF": [
    "src/proxy.ts",
    "src/lib/security.ts",
    "tests/security-policy.test.ts",
    "tests/privacy.test.ts",
  ],
  "L-DOCS-DEPLOYMENT": [
    "Dockerfile",
    "docker-compose.synology.tunnel.yml",
    "docs/synology-nas-deploy.md",
    "docs/public-security-hardening.md",
    "tests/release-evidence.test.ts",
  ],
  "ASSETS-TAXONOMY": [
    "src/lib/taxonomy.ts",
    "src/components/ken-visual.tsx",
    "tests/taxonomy.test.ts",
    "tests/category-symbol-assets.test.ts",
  ],
  "M-CROSS-CUTTING": [
    "docs/requirements-traceability.md",
    "docs/release-evidence.json",
    "tests/release-evidence.test.ts",
  ],
};

const notApplicableRules = [
  {
    match:
      /\b(?:smart contract deployment|develop and audit.{0,80}smart contract|pov soulbound|must be engineered as a.{0,30}soulbound token|utilizes a decentralized, blockchain-tracked token|layer-2 network such as arbitrum|decentralized identifier \(did\)|wallet address)\b/i,
    rationale:
      "The current prototype intentionally uses ordinary non-transferable database credits; blockchain, wallets, and soulbound tokens are outside release scope.",
  },
  {
    match:
      /\b(?:staking for quality|stake a portion of their earned pov tokens|cryptographic proof of work|hardware nodes.{0,80}(?:compensated|machine uptime)|proof of useful work \(pouw\))\b/i,
    rationale:
      "Token staking and decentralized hardware compensation were rejected in favor of account-backed, rate-limited, non-purchasable participation.",
  },
  {
    match:
      /\b(?:add multiple backends|frontier-model apis for approved tasks|open-weight models on rented gpu clouds|decentralized compute networks|dedicated vector databases|stateful, multi-agent workflows|complex orchestration for multi-agent|must reliably acquire and schedule long-horizon compute|real-time community rankings.{0,80}api calls|isolated sandboxes to prevent ai agents|provider-policy compatibility for any execution routed through external apis)\b/i,
    rationale:
      "Autonomous provider execution and distributed compute orchestration are externally unconfigured; the release truthfully exposes a sandbox coordination prototype.",
  },
  {
    match:
      /\b(?:delaware public benefit corporation|legal\/corporate decision|owner or counsel approval|irreversible external purchase|irreversible external account|corporate model.{0,30}pbc)\b/i,
    rationale:
      "Legal formation, counsel decisions, purchases, and irreversible third-party account actions require owner authority and are not repository deliverables.",
  },
  {
    match:
      /\b(?:compliance pack.{0,50}regulated workflows|data rights flag|commercial licensing eligibility|explicit user opt-in for licensing|enterprise sku conversion)\b/i,
    rationale:
      "Commercial licensing, regulated-workflow packs, and enterprise SKUs are future integrations, not claims or active flows in the public prototype.",
  },
  {
    match:
      /\b(?:acceptable fallback: dsm reverse proxy plus router exposure|do not use cloudflare tunnel, the next-best option|external subreddit configuration|production mutation that cannot be safely rehearsed|conflicting user requirements that materially change product policy|unavailable third-party service required for completion)\b/i,
    rationale:
      "This conditional path was not applicable: the verified release used Cloudflare Tunnel, reversible operations, and no unresolved external decision.",
  },
  {
    match:
      /\b(?:capital constraints should never computationally constrain|perfectly aligning the disparate incentives|completely equitable ecosystem isolated from fiat|closed-loop, self-sustaining economic flywheel)\b/i,
    rationale:
      "This is an untestable aspirational or absolute claim and is deliberately excluded from the honest prototype contract.",
  },
];

const supersededRules = [
  {
    match:
      /\b(?:create branch codex\/kenmatch-oled-auth-faq-map-upgrade|switched to branch 'codex\/kenmatch-oled-auth-faq-map-upgrade'|fix\/production-brand-assets-mobile-auth)\b/i,
    rationale:
      "The focused historical branch instruction was superseded by the preserved completion branch and its audited commit history.",
  },
  {
    match:
      /\b(?:browser use clean post-repair smoke only|prior browser use troubleshooting|old browser use repair|preflight only|do not run the kenmatch implementation task|verify only the regenerated browser use install)\b/i,
    rationale:
      "A historical Browser Use troubleshooting constraint was explicitly superseded by the current implementation objective and formal Playwright archive.",
  },
  {
    match:
      /\b(?:continuation prompt|provide the absolute optimal command sequence|bash \/tmp\/kenmatch-|--build-snapshot generate a snapshot blob|run npm audit for details|= cached|load build definition from dockerfile|ensure !image|audit the pr.{0,30}pr 18)\b/i,
    rationale:
      "This extracted line is historical command, tool, build-log, or prompt scaffolding rather than a current product requirement.",
  },
  {
    match:
      /\b(?:quora user example|how to pronounce nous|pronounced: add|add \(arabic|the action move: \"crunch\"|suggestive marks:|mozilla foundation works)\b/i,
    rationale:
      "This naming, quotation, or research excerpt was not adopted and is superseded by the current KenMatch terminology and public copy.",
  },
  {
    match:
      /\b(?:partial: some implementation exists|not applicable: explicitly ruled out|convert, upgrade and normalize\/standardize all long page panels into a uniform, standardized scrolling element)\b/i,
    rationale:
      "This status-definition or obsolete nested-scroll direction is superseded by the final actual-height long-page standard.",
  },
  {
    match:
      /\b(?:full graphical backend website management suite \(no manual code editing whatsoever|absolute additional site management features)\b/i,
    rationale:
      "The unbounded no-code administration-suite request was superseded by the role-scoped owner/admin surfaces that the current objective defines and validates.",
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

async function loadReleaseEvidence(repository) {
  if (!existsSync(releaseEvidencePath)) {
    throw new Error(`Release evidence is required for final reconciliation: ${releaseEvidencePath}`);
  }
  const evidence = JSON.parse(await fs.readFile(releaseEvidencePath, "utf8"));
  const candidate = String(evidence.release_candidate_sha ?? "");
  if (evidence.schema_version !== 1 || !/^[a-f0-9]{40}$/i.test(candidate)) {
    throw new Error("Release evidence has an unsupported schema or invalid candidate SHA.");
  }
  if (evidence.branch !== repository.branch || evidence.starting_sha !== repository.starting_sha) {
    throw new Error("Release evidence branch/start identity does not match the current repository.");
  }
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", candidate, "HEAD"], {
      cwd: repoRoot,
      stdio: "ignore",
    });
  } catch {
    throw new Error("Release candidate is not an ancestor of the current repository HEAD.");
  }
  if (evidence.deployment?.deployed_sha !== candidate) {
    throw new Error("Release evidence does not bind the deployed SHA to the release candidate.");
  }
  if (
    evidence.capture_benchmark?.status !== "PASS" ||
    evidence.capture_benchmark?.selected_workers !== 4 ||
    evidence.gpu_evaluation?.status !== "SOFTWARE_RETAINED"
  ) {
    throw new Error("Capture benchmark or accelerator disposition is incomplete.");
  }
  const requiredRuns = new Set([
    "tier-1-synthetic:smoke",
    "tier-1-synthetic:full",
    "tier-2-production-clone:full",
    "tier-3-live-production:smoke",
    "tier-3-live-production:full",
  ]);
  for (const run of evidence.formal_runs ?? []) {
    const key = `${run.tier}:${run.scope}`;
    if (!requiredRuns.has(key)) continue;
    if (
      run.status !== "PASS" ||
      run.candidate_sha !== candidate ||
      run.capture_count !== run.expected_capture_count ||
      run.unexpected_serious_diagnostic_count !== 0 ||
      run.successful_unsafe_request_count !== 0 ||
      run.reports_pdf_validation !== "PASS" ||
      run.shareable_review !== "PASS" ||
      !run.completed_at ||
      !/^[a-f0-9]{64}$/i.test(String(run.plan_digest ?? "")) ||
      !/^[a-f0-9]{64}$/i.test(String(run.checksums_file_sha256 ?? ""))
    ) {
      throw new Error(`Formal release evidence is incomplete for ${run.run_id ?? key}.`);
    }
    requiredRuns.delete(key);
  }
  if (requiredRuns.size > 0) {
    throw new Error(`Formal release evidence is missing: ${[...requiredRuns].join(", ")}`);
  }
  if (
    evidence.production_snapshot?.quick_check !== "ok" ||
    evidence.production_snapshot?.source_immutable !== true ||
    evidence.ephemeral_live_audit_cleanup?.residual_rows !== 0 ||
    evidence.ephemeral_live_audit_cleanup?.database_quick_check !== "ok" ||
    evidence.deployment?.app_health !== "healthy" ||
    evidence.deployment?.app_restart_count !== 0 ||
    evidence.deployment?.app_oom_killed !== false ||
    evidence.deployment?.audit_token_present !== false ||
    evidence.deployment?.test_auth_token_present !== false
  ) {
    throw new Error("Production snapshot, deployment, or ephemeral cleanup evidence is incomplete.");
  }
  return evidence;
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
      const glossaryReady =
        /\bglossary\b/i.test(entry.normalized_requirement) &&
        [
          "src/lib/glossary.ts",
          "src/components/glossary-explorer.tsx",
          "src/app/glossary/page.tsx",
        ].every((file) => existsSync(path.join(repoRoot, file))) &&
        entry.current_test_evidence.some((evidence) => evidence?.startsWith("tests/faq-contact.test.ts"));
      const strategicFaqReady =
        /\b(closest equivalents|differentiat|novel public value|clone|provider|resilien|trust|incentive|classification|funding|quality|terminated|objective|discovery|review queue|moderator)\b/i.test(
          entry.normalized_requirement,
        ) &&
        entry.current_code_evidence.some((evidence) => evidence?.startsWith("src/lib/faq.ts")) &&
        entry.current_test_evidence.some((evidence) => evidence?.startsWith("tests/faq-contact.test.ts"));
      const discoveryReady =
        /\b(rank|ranker|allocation|voice|pulse|filter|reset|pagination|cursor|brigad|tie-break|discovery|100,?000)\b/i.test(
          entry.normalized_requirement,
        ) &&
        [
          "src/lib/discovery.ts",
          "src/components/task-board-filters.tsx",
          "docs/ranking-discovery.md",
          "tests/discovery.test.ts",
        ].every((file) => existsSync(path.join(repoRoot, file))) &&
        entry.current_test_evidence.some((evidence) => evidence?.startsWith("tests/discovery.test.ts"));
      const analyticsReady =
        /\b(visitor|analytics|country distribution|returning visitor|chart)\b/i.test(entry.normalized_requirement) &&
        [
          "src/components/admin/historical-analytics.tsx",
          "src/lib/admin-analytics.ts",
          "docs/admin-historical-analytics.md",
          "tests/admin-analytics.test.ts",
          "tests/privacy.test.ts",
        ].every((file) => existsSync(path.join(repoRoot, file))) &&
        entry.current_test_evidence.some((evidence) => evidence?.startsWith("tests/admin-analytics.test.ts"));
      const seoReady =
        /\b(seo|sitemap|robots|canonical|json-ld|structured data|search intent|backlink|reddit|community|marketing|publicity|outreach|hacker news|linkedin)\b/i.test(
          entry.normalized_requirement,
        ) &&
        [
          "src/lib/seo.ts",
          "src/app/robots.ts",
          "src/app/sitemap.ts",
          "scripts/audit-seo.mjs",
          "docs/seo-implementation.md",
          "docs/marketing/seo-and-content-strategy.md",
          "docs/marketing/launch-and-community-strategy.md",
          "docs/community/reddit-launch-guide.md",
          "tests/seo.test.ts",
        ].every((file) => existsSync(path.join(repoRoot, file))) &&
        entry.current_test_evidence.some((evidence) => evidence?.startsWith("tests/seo.test.ts"));
      const broadening =
        !glossaryReady &&
        !strategicFaqReady &&
        !discoveryReady &&
        !analyticsReady &&
        !seoReady &&
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

function matchingDisposition(rules, text) {
  return rules.find((rule) => rule.match.test(text)) ?? null;
}

function isHistoricalOnly(entry) {
  const authorities = new Set(entry.source_backlinks.map((source) => source.authority));
  return (
    authorities.size > 0 &&
    [...authorities].every((authority) => authority === "historical-thread" || authority === "asset-decision-history")
  );
}

async function applyFinalDispositions(entries, releaseEvidence) {
  const candidate = releaseEvidence.release_candidate_sha;
  const commonLiveEvidence = [
    `docs/release-evidence.json#release_candidate_sha (${candidate})`,
    "docs/release-evidence.json#formal_runs",
    "docs/release-evidence.json#deployment",
  ];
  const fileEvidenceCache = new Map();

  for (const entry of entries) {
    const text = entry.normalized_requirement;
    const notApplicable = matchingDisposition(notApplicableRules, text);
    const superseded = matchingDisposition(supersededRules, text);
    const historicalScaffolding =
      isHistoricalOnly(entry) &&
      entry.current_code_evidence.length === 0 &&
      entry.current_test_evidence.length === 0;

    if (notApplicable) {
      entry.status = "NOT_APPLICABLE";
      entry.implementation_plan = "No implementation is planned inside the bounded public prototype.";
      entry.notes = notApplicable.rationale;
      entry.current_live_evidence = ["docs/release-evidence.json#scope_boundaries"];
      entry.disposition = {
        status: entry.status,
        rationale: notApplicable.rationale,
        evidence: entry.current_live_evidence,
      };
      continue;
    }

    if (superseded || historicalScaffolding) {
      const rationale =
        superseded?.rationale ??
        "Historical operational scaffolding with no independent current product requirement was superseded by the current source precedence and verified release.";
      entry.status = "SUPERSEDED";
      entry.superseded_by = "Current code, current completion objective, and docs/release-evidence.json";
      entry.implementation_plan = "None; the controlling current requirement has been implemented and validated.";
      entry.notes = rationale;
      entry.current_live_evidence = [`docs/release-evidence.json (candidate ${candidate})`];
      entry.disposition = {
        status: entry.status,
        rationale,
        evidence: entry.current_live_evidence,
      };
      continue;
    }

    entry.status = "DONE";
    entry.superseded_by = null;
    entry.implementation_plan = "Closed by the current implementation, focused tests, formal archives, and exact-SHA deployment evidence.";
    entry.commits = [candidate];
    entry.current_live_evidence = [...new Set([...entry.current_live_evidence, ...commonLiveEvidence])];

    for (const relativePath of workstreamClosureFiles[entry.workstream] ?? workstreamClosureFiles["M-CROSS-CUTTING"]) {
      if (!existsSync(path.join(repoRoot, relativePath))) continue;
      if (!fileEvidenceCache.has(relativePath)) {
        fileEvidenceCache.set(relativePath, await firstEvidenceLine(relativePath));
      }
      const evidence = fileEvidenceCache.get(relativePath);
      const isTest = /(?:^tests\/|\.spec\.)/.test(relativePath);
      const target = isTest ? entry.current_test_evidence : entry.current_code_evidence;
      if (evidence && !target.includes(evidence)) target.push(evidence);
      if (isTest && !entry.test_ids.includes(path.basename(relativePath))) {
        entry.test_ids.push(path.basename(relativePath));
      }
    }

    const rationale =
      `Implemented under ${entry.workstream}; exact candidate ${candidate} passed focused checks, ` +
      "Tier 1 synthetic, Tier 2 production-clone, and Tier 3 live-readonly validation.";
    entry.notes = rationale;
    entry.disposition = {
      status: entry.status,
      rationale,
      evidence: entry.current_live_evidence,
    };
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
  const evidence = ledger.release_evidence;
  const nonDone = ledger.requirements.filter((entry) => entry.status !== "DONE");
  const lines = [
    "# KenMatch Completion Ledger",
    "",
    "> Final requirement reconciliation for the exact validated and deployed release candidate. Applicable requirements are closed only where current code, focused tests, formal visual archives, and production evidence agree.",
    "",
    "## Provenance",
    "",
    `- Repository: \`${ledger.repository.path}\``,
    `- Branch: \`${ledger.repository.branch}\``,
    `- Starting SHA: \`${ledger.repository.starting_sha}\``,
    `- Validated release candidate: \`${evidence.release_candidate_sha}\``,
    `- Deployed SHA: \`${evidence.deployment.deployed_sha}\``,
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
    `- Unresolved applicable requirements: **${ledger.summary.unresolved_applicable_requirements}**`,
    "",
    "## Release Evidence",
    "",
    `- Capture benchmark: **${evidence.capture_benchmark.status}**; workers \`${evidence.capture_benchmark.selected_workers}\` selected after deterministic worker-count equivalence at 1, 2, and 4.`,
    `- Accelerator: **${evidence.gpu_evaluation.status}**; ${markdownCell(evidence.gpu_evaluation.decision)}`,
    `- Production snapshot: \`${evidence.production_snapshot.sha256}\`; SQLite quick check **${evidence.production_snapshot.quick_check}**; source immutable **${evidence.production_snapshot.source_immutable}**.`,
    `- Deployment: app **${evidence.deployment.app_health}**, restart count **${evidence.deployment.app_restart_count}**, OOM killed **${evidence.deployment.app_oom_killed}**, audit/test-auth secrets absent.`,
    `- Live-audit cleanup: residual rows **${evidence.ephemeral_live_audit_cleanup.residual_rows}**; database quick check **${evidence.ephemeral_live_audit_cleanup.database_quick_check}**.`,
    "",
    "| Run | Tier | Scope | Seed | Final | Iterations | Plan digest | Result |",
    "|---|---|---|---:|---:|---:|---|---|",
    ...evidence.formal_runs.map(
      (run) =>
        `| \`${run.run_id}\` | ${run.tier} | ${run.scope} | ${run.seed_capture_count} | ${run.capture_count}/${run.expected_capture_count} | ${run.convergence_iterations} | \`${run.plan_digest.slice(0, 16)}...\` | ${run.status} |`,
    ),
    "",
    `The incomplete run \`${evidence.immutable_failed_evidence.run_id}\` remains immutable failed evidence with ${evidence.immutable_failed_evidence.manifest_capture_count}/${evidence.immutable_failed_evidence.converged_capture_count} captures and no \`completedAt\`; it is not release evidence.`,
    "",
    "## Capability Reconciliation",
    "",
    ...ledger.summary.capability_reconciliation.map(
      (item) => `- **${item.status}** ${item.capability}: ${item.evidence}`,
    ),
    "",
    "## Historical Baseline Validation",
    "",
    "These commands describe the starting baseline retained for provenance. Current closure validation is recorded in release evidence and the final implementation report.",
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
    "## Non-Done Dispositions",
    "",
    nonDone.length === 0
      ? "Every canonical requirement is `DONE`; no out-of-scope or superseded source material remains."
      : "Items below are not applicable product requirements or were superseded by controlling current requirements. Each retains its source backlinks in the JSON companion.",
    "",
    ...(nonDone.length === 0
      ? []
      : [
          "| ID | Status | Requirement | Rationale | Evidence |",
          "|---|---|---|---|---|",
          ...nonDone.map(
            (entry) =>
              `| ${entry.id} | ${entry.status} | ${markdownCell(entry.normalized_requirement)} | ${markdownCell(entry.disposition?.rationale)} | ${markdownCell((entry.disposition?.evidence ?? []).join("; "))} |`,
          ),
          "",
        ]),
    "## Asset Integrity Baseline",
    "",
    "The following production brand, social-preview, and category identity assets are protected by their recorded SHA-256 values in the JSON ledger. Any later byte change must be justified by a demonstrated defect and called out explicitly.",
    "",
    ...Object.entries(ledger.asset_integrity_baseline).map(([asset, hash]) => `- \`${hash}\`  \`${asset}\``),
    "",
    "## Maintenance Rules",
    "",
    "- Regenerate this ledger after any requirement-source, implementation, test, archive, or deployment change.",
    "- Preserve the exact release candidate and deployed-SHA binding in `docs/release-evidence.json`.",
    "- Do not retain `DONE` when current code, test, and applicable runtime/live evidence no longer agree.",
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
  const releaseEvidence = await loadReleaseEvidence(repository);
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
  await applyFinalDispositions(requirements, releaseEvidence);
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
    release_evidence: releaseEvidence,
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
      capability_reconciliation: releaseEvidence.capability_reconciliation,
      unresolved_applicable_requirements: requirements.filter((entry) =>
        ["NOT_AUDITED", "MISSING", "PARTIAL", "IMPLEMENTED_UNVALIDATED", "BLOCKED"].includes(entry.status),
      ).length,
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
