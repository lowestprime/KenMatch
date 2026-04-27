import type { AboutPageContent } from "@/lib/types";

export const DEFAULT_ABOUT_PAGE: AboutPageContent = {
  heroEyebrow: "Creator and mission",
  heroTitle: "Make sustained frontier compute transparent, merit-sensitive, and publicly accountable.",
  heroSubtitle:
    "KenMatch is built by Cooper Beaman so high-value scientific, technical, and public-interest work can be prioritized by collective judgment rather than wealth.",
  missionTitle: "Why KenMatch exists",
  missionBody:
    "Sustained frontier-AI work depends on scarce API budget, engineering time, review labor, and operational attention. Today those resources are easiest to access for teams with money, institutional backing, or private lab relationships. KenMatch makes the prioritization layer visible: anyone can propose a documented Ken, contributors can add public signal and scarce allocation credits, and the site records how ranking, checkpoints, funding context, and sandbox outputs would be governed. In this public demo, dollar amounts and model results are explicitly simulated until live backing and execution are configured.",
  beliefsTitle: "What I believe",
  beliefsBullets: [
    "Public-interest AI work should be contestable by people who can explain the value, not only by teams that can prepay for compute.",
    "Transparency beats charisma: allocation rules, sponsorship context, review decisions, and rollback points should be legible before launch.",
    "Hard problems in science, health, climate, governance, public services, software, and culture often need sustained runs with checkpoints, not one-off demos.",
    "Email verification, rate limits, profile evidence, peer attestation, and admin review are practical signals for limiting abuse without excluding new contributors by status alone.",
    "Open, reproducible infrastructure makes it easier to audit whether scarce AI resources are helping real people and communities.",
  ],
  backgroundTitle: "Background",
  backgroundBody:
    "I am a UCLA neuroscience PhD student and computational genomics researcher working at the intersection of functional genomics, cross-disorder psychiatric genetics, and reproducible research infrastructure. My academic work has focused on building reproducible, open pipelines for analyzing large human and model-organism datasets, including GWAS, single-cell transcriptomics, and long-read sequencing. In parallel I have built and administered self-hosted compute infrastructure, full-stack web applications, and structured evaluation tools that prioritize auditability, resource efficiency, and user agency. KenMatch is a direct extension of this combined training: a platform that treats sustained frontier compute as a public good that deserves the same methodological rigor, reproducibility standards, and democratic accountability I apply in neuroscience and genomics.",
  goalsTitle: "Goals for KenMatch",
  goalsBullets: [
    "Prove that a transparent, merit-sensitive allocation protocol can consistently surface high-value scientific and public-interest Kens.",
    "Separate public ranking from sponsorship so backing can support compute, review, and operations without buying release decisions.",
    "Publish reference sandbox runs with traceable assumptions, checkpoint notes, and simulated costs before any production-scale commitments.",
    "Broaden participation beyond insiders by lowering the cost of proposing, evaluating, and contributing safety review to high-stakes AI work.",
    "Keep KenMatch sustainable and independent by making governance, treasury logic, and audit trails more important than any single operator.",
  ],
  contactTitle: "Contact",
  contactBody:
    "For partnership inquiries, verification questions, research collaboration, or anything else related to the platform, reach out directly. Press, funders, and builders are all welcome.",
  contactEmail: "cooperbeaman@proton.me",
  links: [
    { label: "Repository", url: "https://github.com/lowestprime/KenMatch" },
    { label: "GitHub profile", url: "https://github.com/lowestprime" },
    { label: "Contact", url: "mailto:cooperbeaman@proton.me" },
  ],
  lastUpdated: new Date(0).toISOString(),
};
