# KenMatch Launch and Community Strategy

Last reviewed: 2026-07-28

## Launch principle

Launch KenMatch as an inspectable public prototype, not as a completed compute
marketplace. The strongest claim is concrete: people can propose, compare, rank,
discuss, back, and audit bounded Kens while the sandbox distinguishes public
voice from money. Example capital, users, runs, and outcomes remain visibly
simulated until real commitments exist.

## Audience sequence

1. **Technical reviewers and open-source contributors.** Ask for architecture,
   security, accessibility, data-model, and ranking review before promotion.
2. **AI evaluation, safety, and governance practitioners.** Ask whether the
   lifecycle, evidence contract, and decision boundaries are credible.
3. **Domain experts and public-interest communities.** Ask for well-scoped Ken
   proposals and source/acceptance-criteria review.
4. **Potential infrastructure and funding partners.** Ask for bounded support
   with public restrictions, reporting, and no influence over rank.
5. **Broader public communities.** Introduce the problem and invite concrete
   critique only after common questions and failure modes are documented.

## Prelaunch proof package

- One-sentence Ken definition and a searchable FAQ/glossary.
- Transparent sandbox disclosure on every simulated financial or run surface.
- Public ranking, lifecycle, review, stopping, and correction policies.
- Reproducible source and deployment documentation.
- Response-level SEO audit and deterministic visual archive.
- A small set of credible example Kens covering different categories and lanes.
- A public issue template for bugs, governance concerns, and documentation gaps.
- Clear operator identity, contact route, privacy boundaries, and incident path.

## Content sequence

| Phase | Publish | Primary request |
| --- | --- | --- |
| 1. Technical preview | Architecture note, threat model, ranking test, visual archive | Find defects and unsupported claims |
| 2. Mechanism review | Ken definition, lane/ranking explainer, governance matrix | Challenge the mechanism and edge cases |
| 3. Domain pilots | Two or three scoped Ken case studies | Improve sources, criteria, and deliverables |
| 4. Public launch | Concise launch post with sandbox disclosure and demo links | Try the workflow and report confusion |
| 5. Evidence loop | Changelog, review outcomes, corrections, archive diffs | Verify whether feedback changed the system |
| 6. Partner outreach | Bounded infrastructure/funding brief | Support capacity without buying rank |

## Channel adaptations

### Hacker News

- Lead with the implemented mechanism and technical tradeoffs.
- Link the source, live demo, ranking policy, and visual evidence.
- State that financial and run data are simulated.
- Ask one concrete review question, such as whether the checkpoint contract can
  prevent silent scope drift.
- Stay present for technical criticism; do not coordinate votes.

### Reddit

- Match each community's rules and topical scope before posting.
- Explain the user problem in plain language and link a directly relevant page.
- Use r/kenmatch for durable community onboarding, not as proof of external
  endorsement.
- Never mass cross-post, solicit upvotes, evade removal, or use undisclosed
  automated accounts.
- Move authoritative decisions and evidence to the matching on-site record.

### X

- Use a short factual thread: problem, mechanism, one screenshot, sandbox
  boundary, source, and request for a specific critique.
- Avoid engagement bait, repeated tagging, unverified reach claims, and
  automated replies.
- Correct misleading summaries in the original thread and on the changelog.

### LinkedIn

- Focus on governance, research operations, sponsorship boundaries, or
  open-source implementation depending on the audience.
- Describe the prototype and its current limitations directly.
- Invite practitioners to review a named policy or example Ken, not to provide
  generic endorsements.

### GitHub

- Keep the README, architecture, data model, threat model, deployment path,
  contribution guidance, and issue templates current.
- Publish reproducible performance, accessibility, and visual-archive evidence.
- Use issues and discussions for actionable technical records; do not fabricate
  contributor activity.

## Ethical outreach

Appropriate partner classes include:

- AI evaluation and safety researchers;
- civic participation and collective-intelligence groups;
- open-source maintainers and digital-governance projects;
- academic labs and public-interest technology organizations;
- domain-specific patient, science, climate, accessibility, and software groups;
- compute, model, and infrastructure providers willing to accept public
  restrictions and rank independence;
- philanthropic or public-interest funders.

Every outreach message must identify why the recipient is relevant, link the
specific surface under review, disclose the prototype/sandbox state, and make a
bounded request. Purchased links, scraped lists, bulk unsolicited mail, fake
accounts, undisclosed sponsorship, astroturfing, and vote manipulation are
prohibited.

## Community operating boundaries

- `/discuss` is the canonical on-site discussion and public-decision surface.
- r/kenmatch is an external community venue. Its current public branding does
  not prove account-level owner or moderator control.
- GitHub is the canonical source and technical issue record.
- Review outcomes, checkpoint decisions, corrections, and governance changes
  must be copied or linked into the corresponding on-site record.
- Moderators may enforce conduct and scope; they may not silently change rank,
  erase audit history, or turn sponsor preference into public priority.

## Quality metrics

Use:

- proportion of visitors who reach a Ken, FAQ answer, or policy from the launch
  page;
- substantive comments with sources or testable corrections;
- new Kens that pass scope/readiness checks;
- reviewer response and resolution time;
- accepted corrections and closed documentation gaps;
- repeat contributors and successful handoffs;
- partner conversations that produce explicit, auditable commitments;
- crawl, accessibility, performance, and incident trends.

Avoid:

- raw follower, impression, or subscriber targets without quality context;
- post volume, indiscriminate backlinks, or comments per day;
- any metric that rewards spam, outrage, or artificial consensus.

## Misinformation and crisis response

1. Preserve evidence: URL, timestamp, screenshot, and affected public record.
2. Classify the issue: safety, privacy, financial misstatement, impersonation,
   moderation abuse, technical defect, or ordinary disagreement.
3. Restrict only what is necessary; preserve public historical records unless
   privacy or safety requires redaction.
4. Publish a factual notice on the authoritative KenMatch surface.
5. Correct the source claim, link the correction, and update the changelog.
6. Escalate threats, credential compromise, payment issues, or illegal content
   through the documented incident and provider channels.
7. Publish a short post-incident record covering impact, response, correction,
   and prevention. Do not identify private reporters or expose security detail
   that would enable abuse.

## Launch acceptance criteria

- Production build and complete test suite pass.
- Local and deployed response audits pass.
- Deterministic visual archive is complete and reviewed.
- Live `/api/health`, public route, mobile, auth, and protected-route checks pass.
- Sandbox language is present and financial/run values are not overstated.
- Community links use accurate ownership language.
- There is one accountable contact and one incident path.
- No campaign begins while a known P0 security, privacy, auth, or data-integrity
  defect remains.
