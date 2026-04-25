import type { AboutPageContent } from "@/lib/types";

export const DEFAULT_ABOUT_PAGE: AboutPageContent = {
  heroEyebrow: "Creator and mission",
  heroTitle: "Make sustained frontier compute transparent, merit-sensitive, and publicly accountable.",
  heroSubtitle:
    "KenMatch is built by Cooper Beaman so high-value scientific, technical, and public-interest work can be prioritized by collective judgment rather than wealth.",
  missionTitle: "Why KenMatch exists",
  missionBody:
    "The most capable AI systems now consume electricity, engineering effort, and capital on a scale comparable to sizable public utilities, but the decisions about what those systems are used for remain concentrated inside a small number of private labs. KenMatch turns that asymmetry around: anyone can propose a specific, documented use of sustained frontier compute, the public decides which of those proposals matter most, and a transparent allocation protocol converts that judgment into structured access to real compute. Concretely, it is a marketplace where people submit Kens (proposed deep-research or public-benefit uses of frontier compute), voters allocate quadratic voice over them, and a disciplined, open accounting layer reports how that collective signal is being translated into committed compute hours, sponsorships, and audited outputs.",
  beliefsTitle: "What I believe",
  beliefsBullets: [
    "AI access should be decided democratically, not only by what investors or labs find profitable.",
    "Transparency beats charisma: every allocation, revenue flow, and safety decision should be auditable in real time.",
    "Hard public-interest problems in science, health, climate, and governance deserve sustained frontier compute, not one-off demos.",
    "Provisional merit signals like email verification, rate limiting, and peer attestation can replace status theater and political gatekeeping.",
    "Open, reproducible infrastructure is a public good; closed, wealth-controlled compute is a market failure we can route around.",
  ],
  backgroundTitle: "Background",
  backgroundBody:
    "I am a UCLA neuroscience PhD student and computational genomics researcher working at the intersection of functional genomics, cross-disorder psychiatric genetics, and reproducible research infrastructure. My academic work has focused on building reproducible, open pipelines for analyzing large human and model-organism datasets, including GWAS, single-cell transcriptomics, and long-read sequencing. In parallel I have built and administered self-hosted compute infrastructure, full-stack web applications, and structured evaluation tools that prioritize auditability, resource efficiency, and user agency. KenMatch is a direct extension of this combined training: a platform that treats sustained frontier compute as a public good that deserves the same methodological rigor, reproducibility standards, and democratic accountability I apply in neuroscience and genomics.",
  goalsTitle: "Goals for KenMatch",
  goalsBullets: [
    "Prove that a transparent, merit-sensitive allocation protocol can consistently surface high-value scientific and public-interest Kens.",
    "Maintain a credible, recurring treasury that can cover at least six months of public-good compute obligations.",
    "Ship reference runs that are fully reproducible, openly licensed, and cited publicly as evidence of the process working.",
    "Broaden participation beyond insiders by lowering the cost of proposing, evaluating, and contributing safety review to high-stakes AI work.",
    "Keep KenMatch sustainable and independent so the protocol, not a single operator, is what people trust.",
  ],
  contactTitle: "Contact",
  contactBody:
    "For partnership inquiries, verification questions, research collaboration, or anything else related to the platform, reach out directly. Press, funders, and builders are all welcome.",
  contactEmail: "",
  links: [
    { label: "Repository", url: "https://github.com/lowestprime/KenMatch" },
    { label: "GitHub profile", url: "https://github.com/lowestprime" },
    { label: "Contact", url: "https://github.com/lowestprime/KenMatch" },
  ],
  lastUpdated: new Date(0).toISOString(),
};
