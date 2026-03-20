import type { CheckpointGateRecord, CommentRecord, CommentVoteRecord, ProfileAttestationRecord, RevenueStreamRecord, RunUpdateRecord, TaskFinanceRecord, TaskPulseVoteRecord, TaskTimingRecord, TreasuryEntryRecord } from "@/lib/types";

export const seedProfileAttestations: ProfileAttestationRecord[] = [
  { profileId: "maya-chen", provider: "Maintainer history + manual review", status: "verified", sybilRisk: "low", reviewedAt: "2026-03-12T10:00:00.000Z", signals: ["Signed release history", "Independent code references"], note: "Long-running open-source track record matches the public identity on the profile." },
  { profileId: "noor-haddad", provider: "ORCID + institutional publication graph", status: "verified", sybilRisk: "low", reviewedAt: "2026-03-11T16:30:00.000Z", signals: ["ORCID-linked papers", "Conference and foundation references"], note: "Research identity and contribution history are well established." },
  { profileId: "rafael-ortiz", provider: "Nonprofit portfolio + domain verification", status: "verified", sybilRisk: "low", reviewedAt: "2026-03-10T13:20:00.000Z", signals: ["Public project archive", "Organization email review"], note: "Public-interest work and identity signals are consistent." },
  { profileId: "elena-petrov", provider: "Security maintainer review", status: "verified", sybilRisk: "low", reviewedAt: "2026-03-10T14:10:00.000Z", signals: ["Signed advisories", "Maintainer attestations"], note: "Identity and defensive expertise were manually reviewed before higher-weight participation." },
  { profileId: "aiko-tanaka", provider: "Portfolio review + repeat client references", status: "verified", sybilRisk: "medium", reviewedAt: "2026-03-13T09:45:00.000Z", signals: ["Public portfolio", "Reference check"], note: "Identity is strong, but some work is pseudonymous outside client references." },
  { profileId: "jordan-miles", provider: "Policy clinic review", status: "review", sybilRisk: "medium", reviewedAt: "2026-03-14T11:15:00.000Z", signals: ["Program references", "Long-form writing samples"], note: "Participation is active and credible, with one remaining institutional verification step pending." },
  { profileId: "priya-singh", provider: "Consortium references + operational review", status: "verified", sybilRisk: "low", reviewedAt: "2026-03-13T15:00:00.000Z", signals: ["Partner references", "Program delivery history"], note: "Operational identity and track record are strong enough for full participation." },
];

export const seedTaskFinance: TaskFinanceRecord[] = [
  { taskId: "home-energy-upgrade-companion", qualityBondCredits: 3, sponsorPoolUsd: 9000, checkpointApprovalTarget: 16, enterprisePackaging: "White-label planning workflow for utilities, cities, and nonprofit housing groups.", dataValueNote: "Corrections on savings assumptions and household constraints form useful planning data." },
  { taskId: "repair-manual-finder", qualityBondCredits: 1, sponsorPoolUsd: 2500, checkpointApprovalTarget: 8, enterprisePackaging: "Hosted repair knowledge search for libraries, schools, and appliance service networks.", dataValueNote: "Verified matches and user corrections improve manual retrieval and model confidence scoring." },
  { taskId: "benefit-appeal-packet-helper", qualityBondCredits: 3, sponsorPoolUsd: 12000, checkpointApprovalTarget: 18, enterprisePackaging: "Managed appeals drafting workflow for legal-aid clinics and county support desks.", dataValueNote: "Edits to packet drafts create high-signal supervision for rule-grounded drafting." },
  { taskId: "small-town-procurement-checker", qualityBondCredits: 1, sponsorPoolUsd: 3000, checkpointApprovalTarget: 8, enterprisePackaging: "Procurement quality checker for small public agencies and cooperative buying groups.", dataValueNote: "Correction histories produce practical drafting and review data for public-sector documents." },
  { taskId: "local-air-quality-briefing", qualityBondCredits: 4, sponsorPoolUsd: 14000, checkpointApprovalTarget: 22, enterprisePackaging: "Alerting and briefing layer for schools, clinics, local newsrooms, and municipal operations.", dataValueNote: "Regional overrides and source conflict resolutions improve civic alert ranking systems." },
  { taskId: "open-source-security-regression-watch", qualityBondCredits: 5, sponsorPoolUsd: 17000, checkpointApprovalTarget: 24, enterprisePackaging: "Defensive release intelligence feed for registries, platform teams, and maintainers.", dataValueNote: "Replay adjudications and reviewer corrections build premium defensive evaluation data." },
  { taskId: "rare-disease-evidence-atlas", qualityBondCredits: 4, sponsorPoolUsd: 16000, checkpointApprovalTarget: 24, enterprisePackaging: "Living evidence atlas for foundations, small labs, and clinician-scientist teams.", dataValueNote: "Expert contradiction handling and uncertainty edits create unusually valuable synthesis traces." },
  { taskId: "clinic-follow-up-question-drafter", qualityBondCredits: 1, sponsorPoolUsd: 2200, checkpointApprovalTarget: 8, enterprisePackaging: "Care-team drafting support for community clinics with mandatory clinician sign-off.", dataValueNote: "Accepted and rejected follow-up prompts sharpen narrow, safe medical drafting workflows." },
  { taskId: "museum-oral-history-indexer", qualityBondCredits: 2, sponsorPoolUsd: 6500, checkpointApprovalTarget: 12, enterprisePackaging: "Archive indexing service for museums, schools, and local history projects.", dataValueNote: "Metadata corrections and rights notes improve cultural archive tooling." },
  { taskId: "public-domain-performance-studio", qualityBondCredits: 1, sponsorPoolUsd: 2600, checkpointApprovalTarget: 8, enterprisePackaging: "Rights-safe rehearsal workflow for schools, libraries, and community theater groups.", dataValueNote: "Rights validation and rehearsal edits improve creative planning tools." },
  { taskId: "autonomous-phishing-lure-optimizer", qualityBondCredits: 5, sponsorPoolUsd: 0, checkpointApprovalTarget: 0, enterprisePackaging: "No commercial path because the Ken is blocked as prohibited offensive work.", dataValueNote: "No data collection or commercialization is allowed for blocked abuse-oriented Kens." },
];

export const seedTaskPulseVotes: TaskPulseVoteRecord[] = [
  { id: "pulse-1", taskId: "home-energy-upgrade-companion", profileId: "rafael-ortiz", value: 1, updatedAt: "2026-03-15T10:00:00.000Z" },
  { id: "pulse-2", taskId: "home-energy-upgrade-companion", profileId: "jordan-miles", value: 1, updatedAt: "2026-03-15T10:02:00.000Z" },
  { id: "pulse-3", taskId: "repair-manual-finder", profileId: "maya-chen", value: 1, updatedAt: "2026-03-15T10:05:00.000Z" },
  { id: "pulse-4", taskId: "benefit-appeal-packet-helper", profileId: "jordan-miles", value: 1, updatedAt: "2026-03-15T10:08:00.000Z" },
  { id: "pulse-5", taskId: "benefit-appeal-packet-helper", profileId: "rafael-ortiz", value: 1, updatedAt: "2026-03-15T10:10:00.000Z" },
  { id: "pulse-6", taskId: "small-town-procurement-checker", profileId: "jordan-miles", value: 1, updatedAt: "2026-03-15T10:12:00.000Z" },
  { id: "pulse-7", taskId: "local-air-quality-briefing", profileId: "rafael-ortiz", value: 1, updatedAt: "2026-03-15T10:16:00.000Z" },
  { id: "pulse-8", taskId: "local-air-quality-briefing", profileId: "priya-singh", value: 1, updatedAt: "2026-03-15T10:18:00.000Z" },
  { id: "pulse-9", taskId: "local-air-quality-briefing", profileId: "jordan-miles", value: 1, updatedAt: "2026-03-15T10:21:00.000Z" },
  { id: "pulse-10", taskId: "open-source-security-regression-watch", profileId: "elena-petrov", value: 1, updatedAt: "2026-03-15T10:24:00.000Z" },
  { id: "pulse-11", taskId: "open-source-security-regression-watch", profileId: "maya-chen", value: 1, updatedAt: "2026-03-15T10:26:00.000Z" },
  { id: "pulse-12", taskId: "rare-disease-evidence-atlas", profileId: "noor-haddad", value: 1, updatedAt: "2026-03-15T10:30:00.000Z" },
  { id: "pulse-13", taskId: "rare-disease-evidence-atlas", profileId: "priya-singh", value: 1, updatedAt: "2026-03-15T10:32:00.000Z" },
  { id: "pulse-14", taskId: "clinic-follow-up-question-drafter", profileId: "priya-singh", value: 1, updatedAt: "2026-03-15T10:35:00.000Z" },
  { id: "pulse-15", taskId: "museum-oral-history-indexer", profileId: "aiko-tanaka", value: 1, updatedAt: "2026-03-15T10:39:00.000Z" },
  { id: "pulse-16", taskId: "public-domain-performance-studio", profileId: "aiko-tanaka", value: 1, updatedAt: "2026-03-15T10:42:00.000Z" },
  { id: "pulse-17", taskId: "public-domain-performance-studio", profileId: "noor-haddad", value: -1, updatedAt: "2026-03-15T10:44:00.000Z" },
  { id: "pulse-18", taskId: "autonomous-phishing-lure-optimizer", profileId: "maya-chen", value: -1, updatedAt: "2026-03-15T10:47:00.000Z" },
  { id: "pulse-19", taskId: "autonomous-phishing-lure-optimizer", profileId: "elena-petrov", value: -1, updatedAt: "2026-03-15T10:49:00.000Z" },
];

export const seedTaskTimings: TaskTimingRecord[] = [
  { taskId: "home-energy-upgrade-companion", launchAt: "2026-03-05T09:00:00.000Z", startedAt: "2026-03-05T09:00:00.000Z", expectedMaxEndAt: "2026-03-20T09:00:00.000Z", computeHoursUsed: 174, completionMode: "running", completionSummary: "Publishing household plan packets and feeding corrections into the rebate rules index.", updatedAt: "2026-03-18T18:30:00.000Z" },
  { taskId: "repair-manual-finder", launchAt: "2026-02-28T08:00:00.000Z", startedAt: "2026-02-28T08:00:00.000Z", expectedMaxEndAt: "2026-03-03T08:00:00.000Z", computeHoursUsed: 68, completionMode: "completed-early", completionSummary: "Reached a good enough public release early after match quality cleared the target threshold.", updatedAt: "2026-03-04T09:10:00.000Z" },
  { taskId: "benefit-appeal-packet-helper", launchAt: "2026-03-22T10:00:00.000Z", startedAt: null, expectedMaxEndAt: "2026-03-29T10:00:00.000Z", computeHoursUsed: 0, completionMode: "planned", completionSummary: "Waiting on rules freshness and advocate pilot approval.", updatedAt: "2026-03-15T16:20:00.000Z" },
  { taskId: "small-town-procurement-checker", launchAt: "2026-03-26T09:00:00.000Z", startedAt: null, expectedMaxEndAt: "2026-03-28T09:00:00.000Z", computeHoursUsed: 0, completionMode: "planned", completionSummary: "Queued behind public ranking and a final policy copy review.", updatedAt: "2026-03-15T15:40:00.000Z" },
  { taskId: "local-air-quality-briefing", launchAt: "2026-03-01T06:00:00.000Z", startedAt: "2026-03-01T06:00:00.000Z", expectedMaxEndAt: "2026-03-31T06:00:00.000Z", computeHoursUsed: 468, completionMode: "running", completionSummary: "Daily briefings are live and expanding neighborhood-level coverage.", updatedAt: "2026-03-18T17:45:00.000Z" },
  { taskId: "open-source-security-regression-watch", launchAt: "2026-03-02T12:00:00.000Z", startedAt: "2026-03-02T12:00:00.000Z", expectedMaxEndAt: "2026-04-01T12:00:00.000Z", computeHoursUsed: 412, completionMode: "running", completionSummary: "Replay bundles are flowing, with one advisory held behind embargo review.", updatedAt: "2026-03-18T13:15:00.000Z" },
  { taskId: "rare-disease-evidence-atlas", launchAt: "2026-03-03T09:00:00.000Z", startedAt: "2026-03-03T09:00:00.000Z", expectedMaxEndAt: "2026-04-02T09:00:00.000Z", computeHoursUsed: 390, completionMode: "running", completionSummary: "The atlas is live with specialist corrections and contradiction labels preserved.", updatedAt: "2026-03-18T14:20:00.000Z" },
  { taskId: "clinic-follow-up-question-drafter", launchAt: "2026-02-29T08:30:00.000Z", startedAt: "2026-02-29T08:30:00.000Z", expectedMaxEndAt: "2026-03-03T08:30:00.000Z", computeHoursUsed: 72, completionMode: "completed-at-limit", completionSummary: "The pilot shipped narrow value, but expansion was stopped pending more conservative controls.", updatedAt: "2026-03-05T18:00:00.000Z" },
  { taskId: "museum-oral-history-indexer", launchAt: "2026-03-25T11:00:00.000Z", startedAt: null, expectedMaxEndAt: "2026-03-31T11:00:00.000Z", computeHoursUsed: 0, completionMode: "planned", completionSummary: "Waiting on archive rights review before ingestion begins.", updatedAt: "2026-03-16T10:50:00.000Z" },
  { taskId: "public-domain-performance-studio", launchAt: "2026-03-29T09:30:00.000Z", startedAt: null, expectedMaxEndAt: "2026-03-31T15:30:00.000Z", computeHoursUsed: 0, completionMode: "planned", completionSummary: "Still gathering public signal and community-theater pilot partners.", updatedAt: "2026-03-16T09:10:00.000Z" },
  { taskId: "autonomous-phishing-lure-optimizer", launchAt: null, startedAt: null, expectedMaxEndAt: null, computeHoursUsed: 0, completionMode: "blocked", completionSummary: "Blocked before launch because the Ken improves offensive abuse capability.", updatedAt: "2026-03-03T11:00:00.000Z" },
];

export const seedRunUpdates: RunUpdateRecord[] = [
  { id: "update-1", taskId: "home-energy-upgrade-companion", label: "First nonprofit pilot delivered", status: "on-track", summary: "Partner staff reviewed twenty household plans and accepted most recommendations with only small citation edits.", artifact: "Pilot packet set", evidenceNote: "Acceptance notes and citation checks archived with the pilot bundle.", createdAt: "2026-03-11T17:00:00.000Z" },
  { id: "update-2", taskId: "home-energy-upgrade-companion", label: "Rebate parser expanded", status: "on-track", summary: "Three new municipal rebate programs were added with clearer stale-data warnings.", artifact: "Rules coverage update", evidenceNote: "Source snapshots recorded for each new local rule.", createdAt: "2026-03-18T18:00:00.000Z" },
  { id: "update-3", taskId: "repair-manual-finder", label: "Manual match quality cleared release bar", status: "shipped", summary: "The public repair packet flow launched after early quality targets were met ahead of the full compute window.", artifact: "Public repair packet release", evidenceNote: "Match-rate audit and contest queue results are archived.", createdAt: "2026-03-04T09:00:00.000Z" },
  { id: "update-4", taskId: "benefit-appeal-packet-helper", label: "Jurisdiction bundle loaded", status: "planned", summary: "The first rules bundle is staged for launch pending advocate review and a final freshness check.", artifact: "Rules bundle preview", evidenceNote: "Citations are staged but not yet public.", createdAt: "2026-03-15T16:00:00.000Z" },
  { id: "update-5", taskId: "local-air-quality-briefing", label: "School alert layer added", status: "on-track", summary: "The briefing now carries district-specific school notices alongside air-quality readings.", artifact: "School notice integration", evidenceNote: "Source links and district timestamps are preserved per region.", createdAt: "2026-03-14T12:30:00.000Z" },
  { id: "update-6", taskId: "open-source-security-regression-watch", label: "One advisory held for embargo review", status: "at-risk", summary: "A real regression was found, but publication remains paused while maintainers handle embargo timing.", artifact: "Held advisory packet", evidenceNote: "Replay bundle exists but is not public until the gate clears.", createdAt: "2026-03-18T13:00:00.000Z" },
  { id: "update-7", taskId: "rare-disease-evidence-atlas", label: "First expert correction round merged", status: "on-track", summary: "Specialist reviewers kept the contradiction log intact and requested clearer uncertainty labels on two clusters.", artifact: "Correction pass one", evidenceNote: "Reviewer notes and source diffs are attached to the atlas history.", createdAt: "2026-03-16T14:15:00.000Z" },
  { id: "update-8", taskId: "clinic-follow-up-question-drafter", label: "Pilot shipped with limited scope", status: "partial", summary: "Clinicians found the drafting useful for note triage, but broader automation was intentionally deferred after the compute window ended.", artifact: "Pilot retrospective", evidenceNote: "Accepted and rejected outputs remain available for audit.", createdAt: "2026-03-05T17:30:00.000Z" },
  { id: "update-9", taskId: "museum-oral-history-indexer", label: "Archive rights review underway", status: "planned", summary: "Consent forms and speaker restrictions are being normalized before ingestion begins.", artifact: "Rights review workbook", evidenceNote: "Archive staff comments are preserved in the staging packet.", createdAt: "2026-03-16T10:30:00.000Z" },
  { id: "update-10", taskId: "public-domain-performance-studio", label: "Community theater pilot recruited", status: "planned", summary: "Two school and theater groups volunteered to test the rehearsal packet flow if the Ken reaches the days lane.", artifact: "Pilot interest log", evidenceNote: "Interested groups are listed in the partner note set.", createdAt: "2026-03-16T09:00:00.000Z" },
];

export const seedCheckpointGates: CheckpointGateRecord[] = [
  { checkpointId: "checkpoint-1", approvalScore: 18, requiredApprovals: 16, releaseStatus: "approved" },
  { checkpointId: "checkpoint-2", approvalScore: 11, requiredApprovals: 16, releaseStatus: "pending" },
  { checkpointId: "checkpoint-3", approvalScore: 0, requiredApprovals: 18, releaseStatus: "pending" },
  { checkpointId: "checkpoint-4", approvalScore: 0, requiredApprovals: 18, releaseStatus: "pending" },
  { checkpointId: "checkpoint-5", approvalScore: 24, requiredApprovals: 22, releaseStatus: "approved" },
  { checkpointId: "checkpoint-6", approvalScore: 15, requiredApprovals: 22, releaseStatus: "pending" },
  { checkpointId: "checkpoint-7", approvalScore: 27, requiredApprovals: 24, releaseStatus: "approved" },
  { checkpointId: "checkpoint-8", approvalScore: 13, requiredApprovals: 24, releaseStatus: "pending" },
  { checkpointId: "checkpoint-9", approvalScore: 25, requiredApprovals: 24, releaseStatus: "approved" },
  { checkpointId: "checkpoint-10", approvalScore: 14, requiredApprovals: 24, releaseStatus: "pending" },
  { checkpointId: "checkpoint-11", approvalScore: 0, requiredApprovals: 12, releaseStatus: "pending" },
  { checkpointId: "checkpoint-12", approvalScore: 10, requiredApprovals: 8, releaseStatus: "approved" },
];

export const seedComments: CommentRecord[] = [
  { id: "comment-1", taskId: "home-energy-upgrade-companion", profileId: "jordan-miles", parentId: null, body: "The best part of this Ken is that it turns a pile of rebate fine print into something a household can actually act on without hiring a consultant.", stakeCredits: 3, createdAt: "2026-03-15T11:00:00.000Z" },
  { id: "comment-2", taskId: "home-energy-upgrade-companion", profileId: "rafael-ortiz", parentId: "comment-1", body: "Agreed. The bar should be that every savings claim stays tied to a source and a confidence note, especially when a local program has fuzzy language.", stakeCredits: 2, createdAt: "2026-03-15T11:06:00.000Z" },
  { id: "comment-3", taskId: "benefit-appeal-packet-helper", profileId: "jordan-miles", parentId: null, body: "This only works if the interface makes advocate edits first-class. The point is faster packet assembly, not pretending the system can replace legal judgment.", stakeCredits: 3, createdAt: "2026-03-15T11:14:00.000Z" },
  { id: "comment-4", taskId: "benefit-appeal-packet-helper", profileId: "rafael-ortiz", parentId: "comment-3", body: "Exactly. A useful public version would also show what was uncertain or missing instead of filling the gaps with confident language.", stakeCredits: 2, createdAt: "2026-03-15T11:20:00.000Z" },
  { id: "comment-5", taskId: "local-air-quality-briefing", profileId: "priya-singh", parentId: null, body: "The value here is freshness and accessibility. Schools and clinics need a source-linked daily briefing, not another static dashboard nobody checks in time.", stakeCredits: 3, createdAt: "2026-03-15T11:30:00.000Z" },
  { id: "comment-6", taskId: "open-source-security-regression-watch", profileId: "maya-chen", parentId: null, body: "If the replay bundle stays strong, this can save dozens of downstream teams from rediscovering the same regression by hand.", stakeCredits: 3, createdAt: "2026-03-15T11:40:00.000Z" },
  { id: "comment-7", taskId: "rare-disease-evidence-atlas", profileId: "noor-haddad", parentId: null, body: "What matters is continuity. Patient groups can sometimes fund one literature pass, but not a living map that preserves contradictions and keeps updating.", stakeCredits: 3, createdAt: "2026-03-15T11:48:00.000Z" },
  { id: "comment-8", taskId: "clinic-follow-up-question-drafter", profileId: "priya-singh", parentId: null, body: "The partial result is still valuable. The pilot proved there is time-saving utility, but the current guardrails are not yet strong enough for anything broader.", stakeCredits: 2, createdAt: "2026-03-15T11:56:00.000Z" },
  { id: "comment-9", taskId: "museum-oral-history-indexer", profileId: "aiko-tanaka", parentId: null, body: "Small archives should not need a custom software budget just to make local history searchable and teachable.", stakeCredits: 2, createdAt: "2026-03-15T12:05:00.000Z" },
  { id: "comment-10", taskId: "autonomous-phishing-lure-optimizer", profileId: "elena-petrov", parentId: null, body: "Keeping blocked Kens visible matters because it shows the safety boundary in public instead of quietly pretending harmful demand does not exist.", stakeCredits: 1, createdAt: "2026-03-15T12:12:00.000Z" },
];

export const seedCommentVotes: CommentVoteRecord[] = [
  { id: "comment-vote-1", commentId: "comment-1", profileId: "rafael-ortiz", value: 1, updatedAt: "2026-03-15T12:30:00.000Z" },
  { id: "comment-vote-2", commentId: "comment-1", profileId: "maya-chen", value: 1, updatedAt: "2026-03-15T12:31:00.000Z" },
  { id: "comment-vote-3", commentId: "comment-2", profileId: "jordan-miles", value: 1, updatedAt: "2026-03-15T12:33:00.000Z" },
  { id: "comment-vote-4", commentId: "comment-3", profileId: "priya-singh", value: 1, updatedAt: "2026-03-15T12:35:00.000Z" },
  { id: "comment-vote-5", commentId: "comment-3", profileId: "rafael-ortiz", value: 1, updatedAt: "2026-03-15T12:36:00.000Z" },
  { id: "comment-vote-6", commentId: "comment-4", profileId: "jordan-miles", value: 1, updatedAt: "2026-03-15T12:38:00.000Z" },
  { id: "comment-vote-7", commentId: "comment-5", profileId: "jordan-miles", value: 1, updatedAt: "2026-03-15T12:41:00.000Z" },
  { id: "comment-vote-8", commentId: "comment-5", profileId: "rafael-ortiz", value: 1, updatedAt: "2026-03-15T12:42:00.000Z" },
  { id: "comment-vote-9", commentId: "comment-6", profileId: "elena-petrov", value: 1, updatedAt: "2026-03-15T12:45:00.000Z" },
  { id: "comment-vote-10", commentId: "comment-7", profileId: "priya-singh", value: 1, updatedAt: "2026-03-15T12:48:00.000Z" },
  { id: "comment-vote-11", commentId: "comment-7", profileId: "maya-chen", value: 1, updatedAt: "2026-03-15T12:49:00.000Z" },
  { id: "comment-vote-12", commentId: "comment-8", profileId: "noor-haddad", value: 1, updatedAt: "2026-03-15T12:51:00.000Z" },
  { id: "comment-vote-13", commentId: "comment-9", profileId: "rafael-ortiz", value: 1, updatedAt: "2026-03-15T12:54:00.000Z" },
  { id: "comment-vote-14", commentId: "comment-10", profileId: "maya-chen", value: 1, updatedAt: "2026-03-15T12:57:00.000Z" },
];

export const seedRevenueStreams: RevenueStreamRecord[] = [
  { id: "revenue-1", slug: "hosted-workflows", name: "Hosted workflow subscriptions", engine: "enterprise", description: "Managed versions of successful Kens sold to institutions that need support, uptime, and reporting.", pricingModel: "Annual subscriptions plus onboarding", status: "live", monthlyRevenueUsd: 64000, grossMargin: 0.8, treasurySharePercent: 80, founderSharePercent: 20 },
  { id: "revenue-2", slug: "correction-licensing", name: "Correction and evaluation licensing", engine: "data-licensing", description: "Privacy-screened correction trails and evaluation records licensed for training and audit use.", pricingModel: "Quarterly licensing agreements", status: "pilot", monthlyRevenueUsd: 26000, grossMargin: 0.77, treasurySharePercent: 80, founderSharePercent: 20 },
  { id: "revenue-3", slug: "off-peak-routing", name: "Off-peak compute routing", engine: "compute-arbitrage", description: "Enterprise workloads routed through cheaper windows and neutral compute markets.", pricingModel: "Usage-based orchestration margin", status: "live", monthlyRevenueUsd: 21000, grossMargin: 0.74, treasurySharePercent: 80, founderSharePercent: 20 },
  { id: "revenue-4", slug: "restricted-civic-sponsorships", name: "Restricted civic sponsorships", engine: "sponsorship", description: "Mission-aligned funding reserved for specific public-interest Kens and open deliverables.", pricingModel: "Restricted sponsorship pools", status: "planned", monthlyRevenueUsd: 12000, grossMargin: 0.55, treasurySharePercent: 90, founderSharePercent: 10 },
];

export const seedTreasuryEntries: TreasuryEntryRecord[] = [
  { id: "treasury-1", streamId: "revenue-1", title: "Hosted workflow routing", description: "March subscription revenue routed into the compute treasury under the public split.", bucket: "compute-treasury", direction: "inflow", amountUsd: 51200, createdAt: "2026-03-01T09:00:00.000Z" },
  { id: "treasury-2", streamId: "revenue-2", title: "Correction licensing routing", description: "Pilot licensing proceeds from screened correction and checkpoint data.", bucket: "compute-treasury", direction: "inflow", amountUsd: 20800, createdAt: "2026-03-03T09:00:00.000Z" },
  { id: "treasury-3", streamId: "revenue-3", title: "Off-peak routing surplus", description: "Margin captured from neutral compute routing for enterprise workloads.", bucket: "compute-treasury", direction: "inflow", amountUsd: 16800, createdAt: "2026-03-05T09:00:00.000Z" },
  { id: "treasury-4", streamId: "revenue-4", title: "Restricted civic sponsorship pool", description: "Restricted inflow reserved for local air-quality and benefits-support Kens.", bucket: "compute-treasury", direction: "inflow", amountUsd: 9600, createdAt: "2026-03-06T09:00:00.000Z" },
  { id: "treasury-5", streamId: null, title: "Month-tier compute allocation", description: "Capital released to continuous month-scale Kens after checkpoint approval.", bucket: "compute-treasury", direction: "outflow", amountUsd: 56000, createdAt: "2026-03-08T09:00:00.000Z" },
  { id: "treasury-6", streamId: null, title: "Week-tier compute allocation", description: "Funded active and scheduled week-scale Kens across public and cultural lanes.", bucket: "compute-treasury", direction: "outflow", amountUsd: 17000, createdAt: "2026-03-09T09:00:00.000Z" },
  { id: "treasury-7", streamId: null, title: "Safety and audit reserve", description: "External review, attestation checks, checkpoint moderation, and incident-response reserve.", bucket: "compute-treasury", direction: "outflow", amountUsd: 8000, createdAt: "2026-03-10T09:00:00.000Z" },
  { id: "treasury-8", streamId: null, title: "Founder sustenance transfer", description: "Founder operations routed to the holding company under the public reporting rule.", bucket: "founder-ops", direction: "inflow", amountUsd: 15700, createdAt: "2026-03-11T09:00:00.000Z" },
];
