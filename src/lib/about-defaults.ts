import type { AboutPageContent } from "@/lib/types";

export const DEFAULT_ABOUT_PAGE: AboutPageContent = {
  heroEyebrow: "Owner and mission",
  heroTitle: "Make sustained frontier compute transparent, merit-sensitive, and publicly accountable.",
  heroSubtitle:
    "KenMatch is an owner-operated prototype for a public board that helps people propose, rank, fund, launch, and audit sustained AI-assisted work through visible rules rather than private access.",
  missionTitle: "Why KenMatch exists",
  missionBody:
    "Sustained frontier-AI work depends on scarce API budget, engineering time, review labor, and operational attention. Today those resources are easiest to access for people with capital, institutional backing, or private lab relationships. KenMatch stakes out a public alternative before that allocation layer hardens: anyone can propose a documented Ken, contributors can add public signal and scarce allocation credits, and the site records how ranking, checkpoints, funding context, and sandbox outputs would be governed. The prototype is intentionally public because demand for shared ways to direct increasingly capable AI systems is likely to grow as those systems become better at long-horizon intellectual work. In this demo, dollar amounts and model results are explicitly simulated until live backing and execution are configured.",
  beliefsTitle: "What KenMatch believes",
  beliefsBullets: [
    "Public-interest AI work should be contestable by people who can explain the value, not only by teams that can prepay for compute.",
    "Creativity, taste, imagination, and public judgment should become legitimate inputs into where powerful AI systems spend sustained attention.",
    "Transparency beats charisma: allocation rules, sponsorship context, review decisions, and rollback points should be legible before launch.",
    "Hard problems in science, health, software reliability, evaluation, reproducibility, and engineering design often need sustained runs with checkpoints, not one-off demos.",
    "Email verification, rate limits, profile evidence, peer attestation, and admin review are practical signals for limiting abuse without excluding new contributors by status alone.",
    "Open, reproducible infrastructure makes it easier to audit whether scarce AI resources are helping real people and communities.",
  ],
  backgroundTitle: "Background",
  backgroundBody:
    "KenMatch is built around the conviction that the public should help define which difficult, relevant, and urgent problems deserve sustained attention from increasingly capable AI systems. The project treats long-horizon frontier compute as a public good that needs clear proposals, visible checkpoints, reproducible outputs, independent review, and allocation rules that do not default to wealth or insider access.",
  goalsTitle: "Goals for KenMatch",
  goalsBullets: [
    "Prove that a transparent, merit-sensitive allocation protocol can consistently surface high-value scientific, technical, and public-benefit Kens.",
    "Separate public ranking from sponsorship so backing can support compute, review, and operations without buying release decisions.",
    "Publish reference sandbox runs with traceable assumptions, checkpoint notes, and simulated costs before any production-scale commitments.",
    "Broaden participation beyond insiders by lowering the cost of proposing, evaluating, and contributing safety review to high-stakes AI work.",
    "Recruit experienced AI, software, research, and public-interest collaborators who want a public mechanism for steering frontier compute toward collective flourishing.",
    "Keep KenMatch sustainable and independent by making governance, treasury logic, and audit trails more important than any single operator.",
  ],
  contactTitle: "Contact",
  contactBody:
    "For partnership inquiries, verification questions, research collaboration, or anything else related to the platform, reach the owner directly. Press, funders, and builders are all welcome.",
  contactEmail: "cooperbeaman@proton.me",
  links: [
    { label: "Repository", url: "https://github.com/lowestprime/KenMatch" },
    { label: "Owner profile", url: "https://github.com/lowestprime" },
    { label: "Contact", url: "mailto:cooperbeaman@proton.me" },
  ],
  lastUpdated: new Date(0).toISOString(),
};
