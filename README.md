# KenMatch

KenMatch is a public board for proposing, ranking, funding, launching, and auditing long-running AI work. Each unit of work is called a ***Ken***. A Ken can be an open tool, a civic workflow, a scientific evidence map, a repair assistant, or a creative service that benefits from sustained compute, checkpoints, public feedback, and visible funding.

[Live platform](https://kmat.ch) · [GitHub](https://github.com/lowestprime/KenMatch)

## Mission and Background

KenMatch is built around a simple idea: everyone should have a public, legible opportunity to decide which long-horizon Kens receive time, review, and funding, ***without*** relying on wealth as the allocator. ([1](https://deepmind.google/models/model-cards/gemini-3-1-pro/))([2](https://developers.openai.com/api/docs/models/gpt-5.4))([12](https://openai.com/index/introducing-gpt-5-4/))([5](https://platform.claude.com/docs/en/about-claude/models/overview))([3](https://www.anthropic.com/news/claude-opus-4-6))([4](https://x.ai/api))

As frontier models evolve from short, single-turn assistants into long-context, tool-using agents, the “few queries” standard is rapidly becoming obsolete. The opportunity to participate in the alignment of long-horizon AI effort toward public challenges, services, research, and creative endeavors, however, is likely to remain capital and access constrained. KenMatch interrupts this trend. Major AI providers now document advanced reasoning, long context, and agentic capabilities as first-class features, underscoring a growing demand for solutions democratizing access, participation, and governance, independent of capital. ([1](https://deepmind.google/models/model-cards/gemini-3-1-pro/))([2](https://developers.openai.com/api/docs/models/gpt-5.4))([3](https://www.anthropic.com/news/claude-opus-4-6))([4](https://x.ai/api))

## Concept

### Kens

A Ken is a proposed unit of long-running AI work. The public board shows its goal, evidence, risks, requested lane, funding path, current review state, launch timing, and audit trail.

### Public Participation

KenMatch separates fast public signal from scarce allocation voice:

- Public vote: simple upvote or downvote support.
- Voice allocation: quadratic credits assigned by signed-in contributors.
- Comments: threaded, voted, timestamped discussion with visible stake.
- Attestation policy: new or partially reviewed accounts can participate with review-aware limits until stronger verification lands.

### Launch and Review

Kens can stay public before launch. Launch requires visible release conditions:

- safety status
- checkpoint gates
- reproducibility notes
- rollback plan
- run updates and evidence logs

### Funding

KenMatch keeps funding legible without turning rank into a purchasable advantage:

- sponsor pools tied to specific Kens
- reusable service revenue routed into the treasury
- committed and projected support shown separately
- founder and operations split reported separately from public compute support

## Coordination

KenMatch centralizes the proposal, refinement, and prioritization of &ldquo;long-horizon tasks,&rdquo; including, but not limited to:

1. deep scientific and technical research that benefits from iterative investigation and synthesis,

2. complex software development and maintenance,

3. public-interest analysis and tooling,

4. and other high-leverage work whose results can be validated, reused, and compounded.

The platform is designed for tasks that are naturally multi-stage: they require planning, intermediate checkpoints, continuous evaluation, and the ability to pause and resume without losing state.

## Proof-of-value Allocation Credits

KenMatch&rsquo;s allocation credits are not a pay-to-win instrument. In KenMatch&rsquo;s intended design, **allocation rights are earned** through contribution and curation.

Users earn &ldquo;proof-of-value&rdquo; credits by doing work the community can audit and validate, such as:

1. proposing tasks that generate high-quality, verifiable outputs,

2. improving existing tasks (clarifying requirements, adding constraints, testing plans),

3. accurately curating (supporting proposals that later prove to be genuinely valuable),

4. and contributing measurable infrastructure support (e.g., verified computation or evaluation labor) under clear rules.

The governance literature on token platforms emphasizes that token issuance can align incentives under some conditions, but token voting also introduces capture risks and demands careful mechanism design. KenMatch therefore treats tokens as **allocation credentials**, not a speculative asset class. ([13](https://www.philadelphiafed.org/the-economy/banking-and-financial-markets/token-based-platform-governance))([14](https://www.sciencedirect.com/science/article/pii/S2405896325031519))

## Safeguarded Democratic Ranking

KenMatch&rsquo;s &ldquo;value&rdquo; cannot be a single number. It must be the result of a process that is:

1. **inclusive** (broad participation),

2. **sybil-resistant** (identity and duplication attacks are managed),

3. **auditable** (why a task won is legible),

4. and **safe** (high-severity dual-use is screened).

A defensible default for expressing intensity of preference is quadratic voting, where the cost of concentrating votes rises quadratically. This voting rule is motivated in the mechanism design literature and is widely discussed as a way to incorporate preference intensity rather than only headcount, while still requiring serious attention to secure implementation and fraud resistance. ([15](https://vote.caltech.edu/working-papers/128))([16](https://www.microsoft.com/en-us/research/publication/quadratic-voting-how-mechanism-design-can-radicalize-democracy/))

KenMatch pairs broad voting with a constrained &ldquo;safety and validity&rdquo; layer that can block tasks that plausibly create severe harm or cannot be evaluated responsibly. This is aligned with mainstream AI risk management guidance (governance, measurement, monitoring, and mitigation), instead of a blind trust approach. ([24](https://deepmind.google/discover/blog/introducing-the-frontier-safety-framework/))([25](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10))([26](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence))([27](https://www.oecd.org/en/topics/ai-principles.html))

## Allocation Protocol

KenMatch organizes long-horizon computational tasks into explicit duration tiers, because the duration of frontier LLM&rsquo;s sustained computational effort is a finite resource, while the management of energy use and facilities pose additional constraints.

KenMatch&rsquo;s baseline tiering is:

1. **Months**: top **3** Kens per category

2. **Weeks**: top **10** Kens per category

3. **Days**: top **100** Kens per category

Modern accelerator systems are power-dense (e.g., DGX-class systems are in the tens of kilowatts), and at national and global scale data center electricity demand is now a material planning variable. Long-horizon allocations must therefore be explicit about duration, checkpointing, and rollback, as well as about evaluation and stopping conditions. ([6](https://www.energy.gov/articles/doe-releases-new-report-evaluating-increase-electricity-demand-data-centers))([7](https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai))([10](https://www.nvidia.com/en-us/data-center/dgx-b200/))

## Execution Layer Neutrality

KenMatch is **execution-layer neutral** by design: it can route long-horizon computation to (1) enterprise APIs, (2) dedicated clusters, and/or (3) decentralized computation networks with verifiable work.

Decentralized computation is an active design space with concrete architectures:

1. decentralized marketplaces for leasing computation capacity and managing deployments, bids, and leases, ([20](https://akash.network/docs/getting-started/what-is-akash/))([21](https://akash.network/docs/learn/core-concepts/deployments/))([23](https://bittensor.com/whitepaper))([22](https://docs.gensyn.ai/home/the-gensyn-protocol))

2. protocols for running ML computation across heterogeneous devices with trustless verification, ([22](https://docs.gensyn.ai/home/the-gensyn-protocol))

3. and peer-to-peer &ldquo;intelligence markets&rdquo; that reward contributors based on ledgered value signals. ([23](https://bittensor.com/whitepaper))

KenMatch contends that **the collective deserves a legitimate mechanism to determine which ideas and problems will benefit from the long-horizon effort of advanced API-accessible models**, without defaulting to wealth as the allocator.

## Stewardship, Legitimacy, and Public Benefit

KenMatch treats legitimacy as a product requirement.

A credible democratic computation platform must:

1. publish clear rules for what can and cannot be run,

2. maintain transparent logs of decisions and allocations,

3. implement rigorous evaluation and rollback practices for long-horizon agents,

4. and align incentives so that the platform produces durable public value (e.g., tools, research artifacts, verified analyses) rather than attention-grabbing but unverifiable outputs.

This stance reflects widely adopted principles for AI alignment, including risk management, accountability, transparency, and respect for human rights and democratic values. ([24](https://deepmind.google/discover/blog/introducing-the-frontier-safety-framework/))([25](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10))([26](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence))([27](https://www.oecd.org/en/topics/ai-principles.html))

## Vision

KenMatch is a public queue for work that benefits from sustained frontier-compute runs, visible checkpoints, and human review. A Ken can be a scientific evidence map, a reproducibility scout, a defensive software regression watch, a public-records review workflow, an archive tool, or another bounded project where one quick prompt is not enough.

The allocation problem is practical: compute, review time, and operational attention are scarce, while useful ideas often come from people or groups that cannot simply buy long-running access. KenMatch separates funding from rank. Public pulse votes make interest visible, allocation credits make scarce prioritization harder to concentrate, and checkpoints keep releases auditable before more runtime is spent.

## Features

- Public proposal feed with search, categories, stage/tier filters, and realistic community-facing examples.
- Linked contributor profiles plus real account creation, email verification, password reset, and cookie-backed sessions.
- Earned quadratic voice for scarce allocation, with separate up/down pulse voting for broad public curation.
- Threaded comments with replies, voting, and small stakes for discussion quality.
- Proposal quality bonds, checkpoint approval gates, run metadata, rollback plans, and visible blocked work.
- Economics surface for supported service packaging, screened evaluation licensing, compute routing, private execution lanes, sponsorship routing, treasury entries, and the 80/20 public reporting split.
- Structured sponsor commitments with projected, simulated, and committed funding states plus optional Stripe Checkout for live sponsor intake.
- Sandbox-backed demo Kens with clearly disclosed simulated capital, current API-accessible model lineups, API spend, pilot-user counts, and sample outcomes shown directly in the UI.
- Two theme modes (`Light` and true-black `OLED`), rich motion, compact responsive navigation, strong visual hierarchy, and preview-safe KenMatch favicon/social-image assets.
- Public board at `/kens` with search, category, lane, and status filters.
- Real account creation and persistent signed-in accounts.
- libSQL-backed persistence with local-file or remote libSQL support.
- Public upvote/downvote signal, separate quadratic voice allocation, and threaded comments with voting.
- Forgot-password, email-verification, owner/admin notification, profile editing, profile-picture customization, About/Contact editing, visitor telemetry, and audit logging.
- Universal sitewide search, mobile navigation drawer, bookmark/share affordances, and linked public profile surfaces.
- Ken timing metadata: created and updated timestamps, launch countdown, submission age, compute usage, remaining runtime window, and completion state.
- Incremental run audit history for partial delivery, early completion, and checkpoint-by-checkpoint evidence notes.
- Economics and treasury views with committed versus projected support, sponsor pools, restricted funding, simulated runway, safety reserve coverage, and sponsor covenant details.
- Governance view with blocked Kens, attestation state, enforceable participation limits, review timing, and visible decision logs.
- Security headers, host filtering, request-origin checks, structured rate limits, optional Turnstile verification, and public-safe health checks.
- Standalone Next.js Docker build, non-root container runtime, loopback-only Synology deployment, and public-hosting guidance for Cloudflare Tunnel or equivalent origin shielding.

## Stack

- [Next.js 16](https://nextjs.org/blog/next-16)
- [React 19.2](https://react.dev/blog/2025/10/01/react-19-2)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [libSQL TypeScript client](https://docs.turso.tech/sdk/ts/quickstart) for local-file or remote libSQL persistence
- [`zod`](https://zod.dev) for form and environment validation

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` and set values as needed.

- `DATABASE_URL`: leave empty for the local file database, or point it at remote libSQL.
- `DATABASE_AUTH_TOKEN`: auth token for remote libSQL.
- `KENMATCH_DB_FILE`: local fallback database path.
- `KENMATCH_SESSION_COOKIE`: cookie name for the signed-in account cookie.
- `KENMATCH_SESSION_DAYS`: sign-in lifetime in days.
- `KENMATCH_ALLOW_SIGNUPS`: set to `false` to disable public account creation.
- `KENMATCH_REQUIRE_EMAIL_VERIFICATION`: when true, signups must confirm the emailed verification link before participating.
- `KENMATCH_PUBLIC_ORIGIN`: exact public HTTPS origin for redirects, Stripe success URLs, and host validation.
- `KENMATCH_ALLOWED_HOSTS`: comma-separated list of allowed public hostnames.
- `KENMATCH_OWNER_EMAIL`: owner account email that receives owner-only permissions.
- `KENMATCH_ADMIN_EMAILS`: comma-separated admin account emails.
- `KENMATCH_NOTIFICATION_EMAILS`: comma-separated alert recipients for signup, visitor, verification, and Ken events.
- `KENMATCH_SMTP_HOST` / `KENMATCH_SMTP_PORT` / `KENMATCH_SMTP_USER` / `KENMATCH_SMTP_PASS` / `KENMATCH_SMTP_SECURE` / `KENMATCH_SMTP_FROM`: SMTP settings for verification, reset, and admin notification email dispatch.
- `KENMATCH_VISITOR_HASH_SALT`: server-only salt for unique visitor deduplication.
- `KENMATCH_HEALTH_TOKEN`: token for detailed health responses.
- `KENMATCH_TREASURY_TARGET_MONTHS`: reserve target used by the economics view.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `KENMATCH_TURNSTILE_SECRET_KEY`: optional Cloudflare Turnstile keys for public forms.
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`: optional Stripe Checkout and webhook settings for live sponsorships.
- `DEPLOYMENT_VERSION`: optional deployment identifier passed into Next.js.

## Scripts

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
```

## Deployment

KenMatch ships with a standalone Next.js build configuration and a Docker image intended for self-hosting.

- `next.config.ts` sets `output: "standalone"`.
- `npm run build` runs Next's compile build mode followed by generate-env mode, then verifies that every app-route chunk referenced by the standalone server exists under `.next/static` before Docker copies the artifact.
- `npm run start` copies `.next/static` and `public` assets into `.next/standalone` before starting the standalone server so local and container previews use the same icon and CSS paths.
- `Dockerfile` runs the generated standalone server as a non-root user.
- `docker-compose.synology.yml` mounts persistent local data, keeps the container read-only except for `/app/data`, and binds the app to `127.0.0.1:3000`.
- `docker-compose.synology.tunnel.yml` adds a `cloudflared` sidecar for a direct Cloudflare Tunnel deployment from Synology.
- The [`/api/health`](./src/app/api/health) health endpoint exposes a public-safe summary and can return detailed diagnostics when `KENMATCH_HEALTH_TOKEN` is supplied.
- For local development, KenMatch constructs a file-backed SQLite-compatible database via libSQL.
- For public deployment, `DATABASE_URL` and `DATABASE_AUTH_TOKEN` can be specified for managed remote libSQL database integration.
- Security headers, host filtering, and mutation-origin checks live in [middleware.ts](./middleware.ts).
- For public Synology NAS deployment, read [docs/synology-nas-deploy.md](./docs/synology-nas-deploy.md) and [docs/public-security-hardening.md](./docs/public-security-hardening.md) before exposing the service.

## Main Routes

- `/` overview and featured Kens
- `/kens` public Ken board
- `/kens/[slug]` Ken detail, timing, voting, audit, and comments
- `/submit` Ken submission
- `/governance` governance, attestation, and blocked Kens
- `/economics` treasury and revenue logic
- `/auth` sign-in and account creation
- `/forgot-password`, `/reset`, `/verify` email-backed account recovery and verification
- `/account` profile, avatar, links, verification request, and bookmarks
- `/people/[slug]` linked public profile surface for contributors referenced from Kens, comments, and account cards
- `/verification` public identity and participation guidance
- `/about` owner-editable About / Contact page
- `/admin` owner/admin/moderator operations portal

Legacy `/tasks` routes now redirect to `/kens` routes.

## Repo Map

- `src/app` routes, layout, health endpoint, and server actions
- `src/components` public UI, timing display, voting, comments, sponsor intake, auth, and shell
- `src/lib/attestation.ts` participation policy derived from attestation state
- `src/lib/db.ts` database schema, seeding, hydration, account persistence, funding ledger, rate limits, and write flows
- `src/lib/security.ts` form hardening, origin checks, rate-limit integration, and Turnstile verification
- `src/lib/stripe.ts` optional hosted sponsor checkout wiring
- `src/lib/seed.ts` and `src/lib/seed-plus.ts` realistic demo data
- `docs/architecture.md` implementation structure
- `docs/requirements-traceability.md` conception-to-code mapping
- `docs/synology-nas-deploy.md` Synology NAS deployment guide
- `docs/public-security-hardening.md` public-hosting security checklist
- `cloudflared/config.yml.example` Cloudflare Tunnel example configuration for NAS deployments

## Notes

- The default local deployment uses a file-backed libSQL database. For public internet deployment, use a managed remote libSQL instance when possible.
- The included Synology compose file is intentionally loopback-only. Put Cloudflare Tunnel or another reverse proxy in front of it instead of exposing the container directly.
- The deployment artifact in this repository is currently produced through Next.js experimental compile/generate-env build modes because this project has been validated around that standalone output path.

## Learn More

### 1. [KenMatch\_Conception.md](./KenMatch_Conception.md)

### 2. [KenMatch\_DeepWiki.md](./KenMatch_DeepWiki.md)

## References

1. Data center energy demand and projections: U.S. Department of Energy summary of LBNL report (U.S. share, 176 TWh, 2028 projections). ([6](https://www.energy.gov/articles/doe-releases-new-report-evaluating-increase-electricity-demand-data-centers))([7](https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai))([8](https://www.iea.org/reports/energy-and-ai/executive-summary%C2%A0))  
2. Global data center electricity demand: International Energy Agency Energy and AI report pages (415 TWh in 2024; 945 TWh by 2030; sensitivity cases). ([7](https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai))([8](https://www.iea.org/reports/energy-and-ai/executive-summary%C2%A0))  
3. Hardware power density: NVIDIA specs for H100 TDP and DGX B200 system power usage. ([9](https://www.nvidia.com/en-in/data-center/h100/))([10](https://www.nvidia.com/en-us/data-center/dgx-b200/))  
4. Frontier model capabilities and access gating: OpenAI GPT-5.4 release \+ model docs; Google DeepMind Gemini 3.1 Pro model card; Anthropic Claude model overview; xAI API models. ([1](https://deepmind.google/models/model-cards/gemini-3-1-pro/))([2](https://developers.openai.com/api/docs/models/gpt-5.4))([12](https://openai.com/index/introducing-gpt-5-4/))([5](https://platform.claude.com/docs/en/about-claude/models/overview))([4](https://x.ai/api))
5. Governance mechanisms: Quadratic voting paper summary; secure QV implementation concerns. ([15](https://vote.caltech.edu/working-papers/128))([16](https://www.microsoft.com/en-us/research/publication/quadratic-voting-how-mechanism-design-can-radicalize-democracy/))  
6. Token governance and DAO voting risks: Philadelphia Fed token governance research; DAO voting mechanism centralization risks. ([13](https://www.philadelphiafed.org/the-economy/banking-and-financial-markets/token-based-platform-governance))([14](https://www.sciencedirect.com/science/article/pii/S2405896325031519))  
7. Risk and stewardship frameworks: NIST AI RMF and GenAI profile; OECD AI principles; DeepMind Frontier Safety Framework. ([24](https://deepmind.google/discover/blog/introducing-the-frontier-safety-framework/))([25](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10))([26](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence))([27](https://www.oecd.org/en/topics/ai-principles.html))  
9. Decentralized compute / verification primitives: Akash deployment marketplace docs; Gensyn protocol overview; Bittensor whitepaper. ([20](https://akash.network/docs/getting-started/what-is-akash/))([21](https://akash.network/docs/learn/core-concepts/deployments/))([23](https://bittensor.com/whitepaper))([22](https://docs.gensyn.ai/home/the-gensyn-protocol))
