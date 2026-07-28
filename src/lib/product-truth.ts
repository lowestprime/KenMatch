export const productTruthStatuses = ["operational", "sandbox", "unconfigured", "proposed", "out-of-scope"] as const;
export type ProductTruthStatus = (typeof productTruthStatuses)[number];

export interface ProductTruthItem {
  id: string;
  area: string;
  status: ProductTruthStatus;
  evidence: string;
  limitation: string;
  route: string;
}

export const PRODUCT_TRUTH_ITEMS: ProductTruthItem[] = [
  {
    id: "accounts",
    area: "Accounts and sessions",
    status: "operational",
    evidence: "Account, verification, secure-session, recovery, and role checks are implemented in the application and local database.",
    limitation: "Email delivery and anti-abuse challenge delivery depend on deployment configuration.",
    route: "/auth",
  },
  {
    id: "ranking",
    area: "Pulse, voice, and lane ranking",
    status: "sandbox",
    evidence: "Account-attributed pulse, quadratic voice cost, eligibility, and category-local lane allocation are deterministic and tested.",
    limitation: "Current public records and run outcomes are seeded demonstration data, not a production allocation program.",
    route: "/governance",
  },
  {
    id: "sponsorship",
    area: "Sponsorship and treasury",
    status: "sandbox",
    evidence: "Funding states, restrictions, checkout boundaries, and money/rank separation are represented in the product.",
    limitation: "Displayed public sponsor totals are simulated unless explicitly labeled otherwise.",
    route: "/economics",
  },
  {
    id: "provider-execution",
    area: "Frontier-model execution",
    status: "unconfigured",
    evidence: "Run plans, budgets, checkpoints, and outcome records are production-shaped.",
    limitation: "No public claim is made that the prototype currently operates autonomous multi-month frontier-model runs.",
    route: "/faq#provider-dependency",
  },
  {
    id: "review",
    area: "Intake, review, and moderation",
    status: "proposed",
    evidence: "Role checks, category review, safety boundaries, and audit events exist.",
    limitation: "The complete appealable submitted-Ken review and scoped volunteer moderation workflow is still being completed.",
    route: "/faq#moderation-boundaries",
  },
  {
    id: "analytics",
    area: "Country-level visitor analytics",
    status: "operational",
    evidence: "Country aggregates and salted visitor identifiers support private owner/admin operating awareness.",
    limitation: "Counts are approximate; no raw IPs are intended to be stored or displayed.",
    route: "/faq#privacy",
  },
  {
    id: "persistence",
    area: "Persistence",
    status: "operational",
    evidence: "Application records persist in the configured SQLite or libSQL-compatible database and mounted data tree.",
    limitation: "Single-node SQLite is appropriate for the current prototype, not an unbounded global deployment.",
    route: "/about",
  },
  {
    id: "backups",
    area: "Backups and disaster recovery",
    status: "unconfigured",
    evidence: "The repository documents verified backup, integrity-check, image rollback, and restore procedures.",
    limitation: "Actual backup cadence and off-device copies are operator/deployment responsibilities and cannot be inferred from public UI.",
    route: "/about#changelog",
  },
  {
    id: "blockchain",
    area: "Blockchain or tradable token",
    status: "out-of-scope",
    evidence: "Current allocation credits are ordinary non-transferable database records.",
    limitation: "KenMatch does not currently use a blockchain or offer a tradable token.",
    route: "/faq#classification",
  },
];
