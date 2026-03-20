# KenMatch-Overview

# KenMatch Overview
Relevant source files

- [KenMatch_Conception.md](https://github.com/lowestprime/KenMatch/blob/8218181e/KenMatch_Conception.md)
- [README.md](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md)
- [docs/architecture.md](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md)

KenMatch is a public coordination platform for proposing, ranking, and auditing long-running AI work. It democratizes access to "long-horizon" frontier AI compute—tasks requiring days, weeks, or months of agentic runtime—by allocating these scarce resources based on transparently resolved collective value rather than personal wealth [README.md#1-5](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L1-L5)

## The Problem: Compute Scarcity and Horizon

As frontier AI models evolve from single-turn assistants into long-context, tool-using agents, the primary bottleneck shifts from "queries per minute" to "sustained agentic effort" [README.md#7-8](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L7-L8) Access to this continuous computation is currently constrained by infrastructure costs and energy demands, often favoring large corporations or governments [KenMatch_Conception.md#33-37](https://github.com/lowestprime/KenMatch/blob/8218181e/KenMatch_Conception.md#L33-L37)

KenMatch solves this by providing a framework for:

- Democratized Allocation: Crowdsourcing which tasks deserve enterprise-grade compute [README.md#5](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L5-L5)
- Proof-of-Value: Awarding allocation rights based on audited contributions and curation rather than financial power [README.md#53-57](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L53-L57)
- Visible Governance: Ensuring long-running tasks are safe, auditable, and subject to public feedback [README.md#22-30](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L22-L30)

## Core Domain Entities

The system centers on the Ken (internally referred to as a `task`), which represents a unit of long-horizon work [docs/architecture.md#43](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L43-L43)

### Natural Language to Code Entity Mapping (Domain)

The following diagram maps high-level KenMatch concepts to their corresponding implementation identifiers in the codebase.

Sources: [docs/architecture.md#37-58](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L37-L58)[src/lib/db.ts#1-100](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L1-L100)

## System Subsystems

KenMatch is structured into several major technical layers that handle persistence, business logic, and user interaction.

### 1. Data and Persistence

Uses libSQL (SQLite) for storing everything from user profiles and sessions to complex ledger entries and governance logs [docs/architecture.md#8-10](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L8-L10)

- For details, see [Core Concepts and Domain Model](#1.1).

### 2. Allocation and Economics Logic

Pure-function libraries in `src/lib/` implement the core "rules of the game":

- Quadratic Voting: `src/lib/allocation.ts` calculates the cost of votes ($cost = votes^2$) to prevent capture by a few intense preferences [README.md#81-83](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L81-L83)
- Attestation: `src/lib/attestation.ts` manages participation limits based on account maturity and sybil-risk [docs/architecture.md#64](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L64-L64)
- Treasury: `src/lib/economics.ts` tracks revenue streams and compute-treasury splits [docs/architecture.md#63](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L63-L63)

### 3. Application and UI

Built with Next.js 16 App Router and React 19[docs/architecture.md#5-6](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L5-L6)

- Server Actions: `src/app/actions.ts` handles all mutations (voting, submitting Kens, commenting) [docs/architecture.md#10](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L10-L10)
- Components: Interactive elements like `VotePanel` and `TaskPulsePanel` provide the interface for quadratic allocation and public signaling [docs/architecture.md#88-91](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L88-L91)
- For details, see [System Architecture Overview](#1.2).

### System Architecture Bridge

This diagram illustrates how user actions flow through the system components to the database.

Sources: [docs/architecture.md#12-32](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L12-L32)[src/app/actions.ts#1-50](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L1-L50)[src/lib/allocation.ts#1-30](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L1-L30)

## Key Features

FeatureDescriptionCode PointerQuadratic VotingPrevents "pay-to-win" by increasing vote costs quadratically.`src/lib/allocation.ts`Duration TiersGroups Kens into Months (top 3), Weeks (top 10), and Days (top 100).`KenMatch_Conception.md:11-23`Attestation LadderScales user capabilities based on verification and contribution.`src/lib/attestation.ts`Public PulseFast upvote/downvote signals separate from scarce Voice credits.`src/components/task-pulse-panel.tsx`Audit TrailTransparent logs of run updates, checkpoints, and safety gates.`src/app/kens/[slug]/page.tsx`

## Child Sections

For deeper technical dives into specific areas of the KenMatch codebase, refer to the following pages:

- [Core Concepts and Domain Model](#1.1): Detailed definitions of Kens, Voice Credits, Pulse, and the Proof-of-Value system.
- [System Architecture Overview](#1.2): A technical breakdown of the Next.js stack, libSQL integration, and the Server Actions mutation layer.

Sources: [README.md#1-100](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L1-L100)[docs/architecture.md#1-118](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L1-L118)[KenMatch_Conception.md#1-97](https://github.com/lowestprime/KenMatch/blob/8218181e/KenMatch_Conception.md#L1-L97)

---

# Core-Concepts-and-Domain-Model

# Core Concepts and Domain Model
Relevant source files

- [README.md](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md)
- [docs/requirements-traceability.md](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/requirements-traceability.md)
- [src/lib/types.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts)

This page defines the fundamental domain vocabulary and the underlying mental model of KenMatch. It explains how tasks, voting mechanisms, and identity attestations interact to create a democratic system for allocating long-horizon AI compute.

## Domain Vocabulary

KenMatch operates on a specific set of entities designed to separate "fast signal" (public sentiment) from "scarce allocation" (governance power).

ConceptCode EntityDescriptionKen`TaskRecord`A unit of long-running AI work (e.g., scientific research, software maintenance) [README.md#11-12](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L11-L12)Lane / Tier`AllocationTier`The duration bucket assigned to a Ken based on its rank (Months, Weeks, Days) [src/lib/types.ts#4-5](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L4-L5)Voice Credits`voiceCredits`A finite resource used by contributors to influence Ken ranking via Quadratic Voting [README.md#18-19](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L18-L19)Pulse`TaskPulseVoteRecord`A binary up/down signal representing general public interest, separate from allocation [src/lib/types.ts#146-152](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L146-L152)Attestation`ProfileAttestationRecord`Metadata regarding a user's identity and Sybil-risk, determining their participation rights [src/lib/types.ts#78-86](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L78-L86)Proof-of-Value`availableCredits`A credit system where rights are earned through contribution and curation rather than purchase [README.md#53-57](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L53-L57)

---

## Kens and Allocation Tiers

A Ken (internally referred to as a `task` in the schema [docs/requirements-traceability.md#68-69](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/requirements-traceability.md#L68-L69)) represents a proposal for sustained agentic effort. Unlike standard LLM queries, Kens are categorized by the duration of compute they require.

### Allocation Lanes

The system organizes work into explicit duration tiers to manage finite accelerator resources [README.md#85-87](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L85-L87) The ranking logic in `src/lib/allocation.ts` assigns these tiers based on a Ken's competitive rank within its category:

- Months: The top 3 projects per category [README.md#91](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L91-L91)
- Weeks: Projects ranked 4 through 10 [README.md#93](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L93-L93)
- Days: Projects ranked 11 through 100 [README.md#95](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L95-L95)
- Queued: Projects eligible but outside the top 100.
- Blocked: Projects halted by the `safety-council` or `allocation-chamber`[src/lib/types.ts#16-17](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L16-L17)

### Ken Life Cycle

Kens transition through several stages defined in the `TaskStage` type [src/lib/types.ts#7-8](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L7-L8):

1. Review: Initial submission and safety screening.
2. Voting: Open for voice credit allocation.
3. Scheduled: Ranked high enough for a compute window.
4. Running: Active execution with visible `run_updates`[src/lib/types.ts#195-204](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L195-L204)
5. Shipped: Work completed and artifacts delivered.

Sources:[README.md#11-12](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L11-L12)[README.md#85-97](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L85-L97)[src/lib/types.ts#1-8](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L1-L8)[docs/requirements-traceability.md#68-69](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/requirements-traceability.md#L68-L69)

---

## Quadratic Voting and Voice Credits

KenMatch utilizes Quadratic Voting (QV) to allow contributors to express the *intensity* of their preference while preventing a single wealthy or highly-active user from dominating the rankings [README.md#81-82](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L81-L82)

### The Cost of Influence

The cost to assign votes to a Ken increases quadratically relative to the number of votes. This is implemented in the `allocation.ts` library:

- Formula: `cost = votes²`
- Incremental Cost: To increase a vote from $n$ to $n+1$, the user must spend $(n+1)^2 - n^2$ credits.
- Limit: The system enforces a `MAX_VOTES_PER_TASK` (typically 6) to further bound individual influence [src/lib/allocation.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts)

### Pulse vs. Voice

The system distinguishes between public sentiment and governance:

- Pulse (`task_pulse_votes`): Fast, non-scarce binary signal (+1/-1). Used for "trending" views.
- Voice (`votes`): Scarce, quadratic allocation. Used for actual tier placement.

### Data Flow: From Vote to Tier

The following diagram illustrates how user votes are transformed into system-wide allocations.

Diagram: Voting and Ranking Data Flow

Sources:[README.md#15-19](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L15-L19)[README.md#81-82](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L81-L82)[src/lib/types.ts#137-152](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L137-L152)[docs/requirements-traceability.md#11-14](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/requirements-traceability.md#L11-L14)

---

## Attestation and Participation Policy

To maintain Sybil-resistance without requiring invasive KYC, KenMatch uses an attestation ladder [README.md#69-76](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L69-L76)

### Participation States

A user's `ParticipationState` is resolved by `src/lib/attestation.ts` based on their `AttestationStatus` and `SybilRiskBand`[src/lib/types.ts#40-47](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L40-L47):

1. Full: Can submit Kens, comment, and allocate voice credits.
2. Review-Limited: Can comment and pulse, but voice allocation is capped or restricted.
3. Read-Only: New or high-risk accounts.

### The Attestation Ladder

Users move from `provisional` to `verified` or `expert` levels [src/lib/types.ts#37-38](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L37-L38) This status affects the `voiceMultiplier`, which can scale the effective weight of a user's credits based on their proven "Proof-of-Value" history [README.md#53-57](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L53-L57)

Diagram: Identity to Capability Mapping

Sources:[README.md#53-57](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L53-L57)[README.md#69-76](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L69-L76)[src/lib/types.ts#37-47](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L37-L47)[docs/requirements-traceability.md#19-22](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/requirements-traceability.md#L19-L22)

---

## Economics and Proof-of-Value

KenMatch maintains a legible treasury to ensure that funding is transparent and does not directly translate into ranking power [README.md#31-32](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L31-L32)

### Revenue and Splits

Revenue is tracked via `RevenueStreamRecord` and split between:

- Treasury Share: Reinvested into public compute.
- Founder Share: Operations and development [src/lib/types.ts#242-243](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L242-L243)

### Proof-of-Value (PoV)

The PoV system ensures that "allocation rights are earned" [README.md#55](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L55-L55) Users earn credits by:

1. Proposing high-quality tasks.
2. Improving existing tasks via comments and refinement.
3. Curation: Supporting Kens that successfully deliver value.

This creates a circular economy where successful contribution to the "Ken board" increases a contributor's future influence over the compute treasury.

Sources:[README.md#31-38](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L31-L38)[README.md#53-67](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L53-L67)[src/lib/types.ts#232-244](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L232-L244)[docs/requirements-traceability.md#44-48](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/requirements-traceability.md#L44-L48)

---

# System-Architecture-Overview

# System Architecture Overview
Relevant source files

- [docs/architecture.md](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md)
- [docs/requirements-traceability.md](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/requirements-traceability.md)
- [next.config.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts)
- [src/lib/env.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/env.ts)

The KenMatch system is a modern web application designed for long-horizon AI compute allocation. It leverages a unified TypeScript stack to manage complex domain logic—such as quadratic voting and duration-based tiering—while maintaining a lightweight, self-hostable deployment footprint.

## High-Level Technical Stack

KenMatch is built on a "Full-Stack TypeScript" philosophy, utilizing the Next.js App Router for both UI orchestration and server-side logic.

ComponentTechnologyRoleFrameworkNext.js 16 (App Router)Handles routing, SSR, and Server Actions [docs/architecture.md#5](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L5-L5)FrontendReact 19 + Tailwind CSS v4Component-based UI with utility-first styling [docs/architecture.md#6-7](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L6-L7)PersistencelibSQL (SQLite)Local-file or remote database persistence [docs/architecture.md#8](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L8-L8)AuthCustom Session CookiesAccount-backed signed-in state via secure cookies [docs/architecture.md#9](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L9-L9)DeploymentDocker (Standalone)Multi-stage build for containerized environments [docs/architecture.md#107-108](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L107-L108)

## System Components and Data Flow

The architecture is divided into four primary layers: the UI Layer (React Components), the Action Layer (Next.js Server Actions), the Logic Layer (Pure Business Functions), and the Data Layer (libSQL).

### Request and Mutation Flow

The following diagram illustrates how a user interaction (like voting) moves through the system.

System Interaction Flow: User Voting

Sources: [docs/architecture.md#10](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L10-L10)[docs/architecture.md#90-91](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L90-L91)[docs/requirements-traceability.md#12-13](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/requirements-traceability.md#L12-L13)[src/lib/env.ts#25-34](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/env.ts#L25-L34)

## Layer Descriptions

### 1. UI Layer (Next.js App Router)

The UI is organized into functional routes that correspond to the core domain pillars:

- Kens Board (`/kens`): The primary interface for searching and filtering tasks [docs/architecture.md#16-17](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L16-L17)
- Governance (`/governance`): Displays the attestation ladder and blocked work [docs/architecture.md#22-23](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L22-L23)
- Economics (`/economics`): Visualizes treasury health and revenue streams [docs/architecture.md#24-25](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L24-L25)

### 2. Mutation Layer (Server Actions)

Instead of a traditional REST/GraphQL API, KenMatch uses Next.js Server Actions located in `src/app/actions.ts`. This layer handles:

- Authentication: `signInAction`, `signUpAction`, and `signOutAction`[docs/architecture.md#101-103](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L101-L103)
- Domain Mutations: `createProposalAction` (Kens), `saveVoteAction` (Quadratic Voice), and `createCommentAction`[docs/architecture.md#10](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L10-L10)
- Validation: All inputs are strictly typed using Zod schemas [src/lib/env.ts#1-36](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/env.ts#L1-L36)

### 3. Logic Layer (Business Rules)

Pure TypeScript libraries in `src/lib/` encapsulate the complex rules of the system, ensuring they can be tested independently of the UI or database:

- `allocation.ts`: Implements the quadratic cost formulas and tier assignment logic [docs/requirements-traceability.md#25-26](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/requirements-traceability.md#L25-L26)
- `attestation.ts`: Converts raw profile data into participation policies (e.g., `read-only` vs `full`) [docs/requirements-traceability.md#20-22](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/requirements-traceability.md#L20-L22)
- `economics.ts`: Handles treasury reconciliation and runway calculations [docs/requirements-traceability.md#47-48](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/requirements-traceability.md#L47-L48)

### 4. Data Layer (libSQL Persistence)

The system uses libSQL for high-performance SQLite-compatible persistence. It supports two modes:

1. Local Mode: Stores data in a local file (default: `data/kenmatch.sqlite`) [src/lib/env.ts#29](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/env.ts#L29-L29)
2. Remote Mode: Connects to a Turso/libSQL server via `DATABASE_URL`[src/lib/env.ts#27-28](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/env.ts#L27-L28)

Entity Relationship Mapping

Sources: [docs/architecture.md#35-58](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L35-L58)[docs/requirements-traceability.md#29-30](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/requirements-traceability.md#L29-L30)

## Deployment Model

KenMatch is designed for Standalone Docker Deployment. The build process generates a minimal Node.js server that includes only the necessary files for production, significantly reducing image size.

- Output Mode: `standalone` configured in `next.config.ts`[next.config.ts#30](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L30-L30)
- Security: Implements strict Content-Security-Policy (CSP) and security headers (HSTS, X-Frame-Options) [next.config.ts#5-26](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L5-L26)
- Persistence: For containerized environments (like Synology NAS), the database file is stored in a persistent volume mount at `/app/data`[docs/architecture.md#109](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L109-L109)

### Environment Configuration

Key system behaviors are toggled via environment variables:

- `KENMATCH_ALLOW_SIGNUPS`: Controls public registration [src/lib/env.ts#32](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/env.ts#L32-L32)
- `KENMATCH_ENABLE_DEMO_PROFILE_SWITCHER`: Enables a UI helper for switching between seed profiles during testing [src/lib/env.ts#33](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/env.ts#L33-L33)

Sources: [next.config.ts#1-50](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L1-L50)[src/lib/env.ts#1-36](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/env.ts#L1-L36)[docs/architecture.md#105-111](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L105-L111)

---

# Data-Layer

# Data Layer
Relevant source files

- [src/lib/db.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts)
- [src/lib/types.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts)

The KenMatch Data Layer manages the persistence, retrieval, and transformation of the system's state. It is built on libSQL (a SQLite fork) and utilizes a hydration pipeline to convert flat database rows into rich, typed domain objects used by the UI and business logic layers.

## Persistence Architecture

KenMatch uses a local or remote libSQL database defined by environment variables [src/lib/db.ts#84-85](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L84-L85) The system ensures the database directory exists locally if using a file-based URL [src/lib/db.ts#98-107](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L98-L107)

### Connection Management

The database client is managed as a global singleton to prevent socket exhaustion during Next.js hot reloads [src/lib/db.ts#93-96](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L93-L96) The `ensureDatabase` function guarantees that the schema is initialized and the connection is ready before any query execution [src/lib/db.ts#121-127](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L121-L127)

### Data Access Flow

The following diagram illustrates how raw data moves from the libSQL `Client` into the application's "Code Entity Space" via the `hydrate` pipeline.

Data Hydration Pipeline

Sources: [src/lib/db.ts#109-119](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L109-L119)[src/lib/db.ts#468-472](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L468-L472)[src/lib/types.ts#105-126](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L105-L126)

## Database Schema

The schema consists of over 20 tables that track everything from user identities to the granular financial state of AI tasks. Key table groups include:

- Identity & Auth: `profiles`, `accounts`, `sessions`, and `profile_attestations`[src/lib/db.ts#209-249](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L209-L249)
- Core Tasks (Kens): `tasks`, `categories`, `votes`, and `task_pulse_votes`[src/lib/db.ts#250-316](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L250-L316)
- Execution & Governance: `runs`, `run_updates`, `checkpoints`, and `governance_events`[src/lib/db.ts#317-380](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L317-L380)
- Economics: `revenue_streams`, `treasury_entries`, and `task_finance`[src/lib/db.ts#381-424](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L381-L424)

For a comprehensive breakdown of every table and its columns, see [Database Schema and Hydration](#2.1).

## The Hydration Pipeline

Because SQLite lacks native array types, KenMatch uses a serialization strategy for lists (e.g., `deliverables`, `riskFlags`).

StepFunctionDescriptionStorage`serializeList`Converts `string[]` to JSON strings for storage [src/lib/db.ts#129-131](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L129-L131)Retrieval`parseList`Reconstitutes JSON strings back into `string[]`[src/lib/db.ts#133-139](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L133-L139)Hydration`hydrate`A bulk-load orchestrator that fetches related records (like votes or timing) and computes derived state [src/lib/db.ts#468-510](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L468-L510)

### Derived State Calculation

The data layer does not just return rows; it computes critical business metrics on-the-fly:

- `availableCredits`: Calculated by subtracting `spentCredits` (quadratic cost) from a profile's base `voiceCredits`[src/lib/db.ts#482-485](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L482-L485)
- `allocatedTier`: Determined by the task's rank within its category based on total votes [src/lib/db.ts#544-548](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L544-L548)
- `taskPulseScore`: The net sum of up/down signals [src/lib/db.ts#549](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L549-L549)

Sources: [src/lib/db.ts#129-139](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L129-L139)[src/lib/db.ts#468-510](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L468-L510)[src/lib/allocation.ts#24-25](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L24-L25)

## Seed Data and Fixtures

To facilitate development and demonstrations, KenMatch includes a robust seeding system. It populates the database with realistic AI task scenarios, spanning various stages of the lifecycle (from "voting" to "shipped").

Seeding Relationship Diagram

- `seed.ts`: Focuses on core entities: profiles, categories, and primary tasks like the "Home Energy Upgrade Companion" [src/lib/seed.ts#32-37](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed.ts#L32-L37)
- `seed-plus.ts`: Adds complexity: treasury entries, comment threads, and the "Autonomous Phishing Lure Optimizer" (an example of a blocked/unsafe task) [src/lib/seed-plus.ts#40-51](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed-plus.ts#L40-L51)

For details on running these scripts and the scenarios they create, see [Seed Data and Demo Fixtures](#2.2).

Sources: [src/lib/db.ts#31-51](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L31-L51)[src/lib/seed.ts#1-40](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed.ts#L1-L40)[src/lib/seed-plus.ts#1-55](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed-plus.ts#L1-L55)

---

# Database-Schema-and-Hydration

# Database Schema and Hydration
Relevant source files

- [src/lib/db.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts)
- [src/lib/types.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts)

KenMatch utilizes a libSQL (SQLite-compatible) database to manage a complex domain model involving quadratic voting, task allocation, and governance. The data layer is designed for high performance with a unique hydration pipeline that computes derived states—such as available credits and task rankings—on every significant load to ensure business logic consistency.

## 1. Database Schema Overview

The schema is defined in `src/lib/db.ts` and consists of over 20 tables. It enforces referential integrity through standard SQL foreign keys and stores complex lists as serialized JSON strings.

### 1.1 Core Entity Tables

The following tables form the backbone of the identity and task management systems:

TablePurposeKey Fields`profiles`User identity and credit balance.`voiceCredits`, `credibility`, `attestationLevel``accounts`Authentication credentials.`email`, `passwordHash`, `passwordSalt``sessions`Active user sessions.`tokenHash`, `expiresAt``tasks`The "Kens" or proposals.`slug`, `categoryId`, `stage`, `safetyStatus``categories`Thematic groupings for tasks.`slug`, `thesis`

### 1.2 Governance and Voting Tables

These tables track the collective decision-making process:

- `votes`: Stores quadratic votes cast by profiles for specific tasks. [src/lib/db.ts#283-290](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L283-L290)
- `task_pulse_votes`: Simple up/down signaling (Pulse) separate from voice credit allocation. [src/lib/db.ts#291-297](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L291-L297)
- `governance_events`: Audit log of decisions made by the Safety Council or Allocation Chamber. [src/lib/db.ts#348-356](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L348-L356)
- `comments` & `comment_votes`: Discussion system where comments can have "staked" credits. [src/lib/db.ts#298-314](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L298-L314)

### 1.3 Execution and Finance Tables

These tables manage the lifecycle of a task once it moves toward the "Running" stage:

- `runs` & `run_updates`: Track compute execution parameters and periodic status artifacts. [src/lib/db.ts#315-331](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L315-L331)
- `checkpoints` & `checkpoint_gates`: Define milestones and the approval scores required to release the next phase of funding/compute. [src/lib/db.ts#332-347](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L332-L347)
- `task_finance`: Stores quality bonds, sponsor pools, and enterprise packaging details. [src/lib/db.ts#273-281](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L273-L281)
- `task_timings`: High-resolution tracking of launch times and compute hours used. [src/lib/db.ts#262-272](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L262-L272)

### 1.4 Treasury and Economics

- `revenue_streams`: Models different income engines (e.g., Enterprise, Data Licensing). [src/lib/db.ts#357-369](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L357-L369)
- `treasury_entries`: A ledger of inflows and outflows (e.g., "Compute-Treasury" bucket). [src/lib/db.ts#370-379](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L370-L379)

Sources:[src/lib/db.ts#204-381](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L204-L381)[src/lib/types.ts#55-256](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L55-L256)

---

## 2. The Hydration Pipeline

KenMatch does not store all state in the database. Instead, it uses a Hydration Pipeline to transform raw `DbRow` objects into rich TypeScript interfaces. This process merges static database data with dynamic business logic results.

### 2.1 Data Flow: From SQL to UI

The following diagram illustrates how raw database records are transformed into the `TaskSummary` and `ProfileSummary` types used by the UI.

System Entity Mapping: SQL to Domain Objects

Sources:[src/lib/db.ts#536-620](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L536-L620)[src/lib/allocation.ts#29-31](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L29-L31)[src/lib/allocation.ts#46-105](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L46-L105)

### 2.2 Key Hydration Functions

The `hydrate()` function is the central entry point for data retrieval. It performs the following steps:

1. Bulk Load: Fetches all tasks, votes, and profiles in a single pass (or cached set). [src/lib/db.ts#536-545](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L536-L545)
2. Credit Calculation: Iterates through all votes for a profile and uses `quadraticCost(voteCount)` to subtract from the base `voiceCredits`. [src/lib/db.ts#558-568](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L558-L568)
3. Tier Assignment: Passes the list of tasks to `buildCategoryRankings()`, which determines if a task is in the "Months", "Weeks", or "Days" lane based on its vote count relative to others. [src/lib/db.ts#577-580](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L577-L580)
4. Pulse Scoring: Aggregates `task_pulse_votes` to compute a `taskPulseScore`. [src/lib/db.ts#572-575](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L572-L575)

### 2.3 List Serialization and Mappers

Because SQLite lacks a native Array type, KenMatch uses `serializeList` and `parseList` to handle string arrays (like `deliverables` or `riskFlags`). [src/lib/db.ts#129-139](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L129-L139)

Mappers like `mapTask` and `mapProfile` ensure type safety when converting `DbRow` (where all values might be strings or numbers) into the strict types defined in `src/lib/types.ts`.

- `mapTask`: Handles JSON parsing for list fields and converts strings to enums (e.g., `TaskStage`). [src/lib/db.ts#413-441](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L413-L441)
- `mapProfile`: Maps raw fields and computes `avatarHue`. [src/lib/db.ts#389-404](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L389-L404)

Sources:[src/lib/db.ts#129-139](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L129-L139)[src/lib/db.ts#389-441](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L389-L441)[src/lib/db.ts#536-620](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L536-L620)

---

## 3. Computing Derived State

The system calculates three critical pieces of derived state during hydration that are never persisted directly:

### 3.1 `availableCredits`

Calculated for each profile by summing the quadratic cost of all their active votes and subtracting it from their `voiceCredits` (base balance).

- Formula: `availableCredits = voiceCredits - Σ(voteCount²)`
- Implementation: [src/lib/db.ts#558-568](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L558-L568) using `quadraticCost` from `src/lib/allocation.ts`.

### 3.2 `allocatedTier`

A task's tier (e.g., "Weeks") is dynamic. If a new task receives more votes, it might push an existing task from "Weeks" into the "Days" lane or "Queued" status.

- Logic: Handled by `buildCategoryRankings`, which sorts tasks by `voteCount`, then `createdAt`, then `title`. [src/lib/allocation.ts#46-105](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L46-L105)
- Integration: [src/lib/db.ts#577-580](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L577-L580)

### 3.3 `taskPulseScore`

The net value of all up-votes (+1) and down-votes (-1) for a task.

- Implementation: [src/lib/db.ts#572-575](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L572-L575)

---

## 4. Initialization and Seeding

When the application starts, `ensureDatabase()` checks if the database exists. If not, it triggers `initializeDatabase()` to create the tables and then runs the hydration/seed scripts.

Database Startup Sequence

Sources:[src/lib/db.ts#121-127](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L121-L127)[src/lib/db.ts#204-381](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L204-L381)[src/lib/db.ts#634-645](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L634-L645)

---

# Seed-Data-and-Demo-Fixtures

# Seed Data and Demo Fixtures
Relevant source files

- [src/lib/seed-plus.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed-plus.ts)
- [src/lib/seed.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed.ts)

The KenMatch platform utilizes a robust seeding system to populate demo environments with realistic, high-fidelity data. This data serves two primary purposes: providing a "batteries-included" experience for local development and demonstrating the platform's core mechanics—such as Quadratic Voting, Attestation tiers, and long-horizon task allocation—through concrete scenarios.

The seeding logic is split across two primary files: `src/lib/seed.ts` (core entities) and `src/lib/seed-plus.ts` (extended activity and metrics).

### Seed Architecture and Data Flow

The seeding process follows a linear dependency graph to ensure referential integrity within the libSQL database. The `hydrate()` function in the database layer is responsible for executing these scripts and mapping the TypeScript objects into the SQLite schema.

#### Entity Relationship Mapping

The following diagram illustrates how the seed data objects map to the system's internal code entities and database tables.

Diagram: Seed Data to Code Entity Mapping

Sources:[src/lib/seed.ts#1-21](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed.ts#L1-L21)[src/lib/seed-plus.ts#1-11](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed-plus.ts#L1-L11)[src/lib/db.ts#1-50](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L1-L50)

---

### Core Seed Entities (seed.ts)

The primary seed file defines the foundational actors and tasks that inhabit the KenMatch ecosystem.

#### Profiles and Attestation

Profiles in the seed data represent diverse personas, from open-source maintainers to policy analysts. Each profile is assigned a `voiceCredits` balance and a `credibility` score, which are used to demonstrate the [3.2. Attestation and Participation Policy](https://github.com/lowestprime/KenMatch/blob/8218181e/3.2. Attestation and Participation Policy) logic.

- Maya Chen (`maya-chen`): Open-source maintainer with high credibility (0.95) and 64 voice credits [src/lib/seed.ts#4](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed.ts#L4-L4)
- Noor Haddad (`noor-haddad`): Biomedical researcher with 82 voice credits [src/lib/seed.ts#5](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed.ts#L5-L5)

#### Task Scenarios (Kens)

The seed data includes several "Kens" (tasks) that demonstrate different stages of the lifecycle (e.g., `running`, `shipped`, `scheduled`, `blocked`).

Task IDCategoryTierStatusPurpose`home-energy-upgrade-companion`Everyday ServicesWeeksRunningUtility bill and rebate parsing [src/lib/seed.ts#22](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed.ts#L22-L22)`repair-manual-finder`Everyday ServicesDaysShippedArchival appliance repair data [src/lib/seed.ts#23](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed.ts#L23-L23)`rare-disease-evidence-atlas`Science & HealthMonthsRunningEvidence synthesis for small labs [src/lib/seed.ts#28](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed.ts#L28-L28)`autonomous-phishing-lure-optimizer`SecurityBlockedBlockedDemonstration of safety/governance rejection [src/lib/seed.ts#31](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed.ts#L31-L31)

Sources:[src/lib/seed.ts#3-35](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed.ts#L3-L35)

---

### Extended Fixtures and Activity (seed-plus.ts)

The `seed-plus.ts` file provides the "pulse" of the application, simulating user interaction, financial backing, and governance events.

#### Task Finance and Enterprise Packaging

Each task is associated with a `TaskFinanceRecord` which defines its economic viability. This includes the `sponsorPoolUsd` and `enterprisePackaging` descriptions, which explain how the task's output might be commercialized or sustained.

- Example: The `rare-disease-evidence-atlas` has a $16,000 sponsor pool and is packaged as a "Living evidence atlas for foundations" [src/lib/seed-plus.ts#20](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed-plus.ts#L20-L20)

#### The Blocked Task Example

A critical component of the seed data is the `autonomous-phishing-lure-optimizer`. This task is explicitly flagged as `safetyStatus: "blocked"`[src/lib/seed.ts#31](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed.ts#L31-L31) Its finance record specifies `sponsorPoolUsd: 0` and notes that no commercial path exists because it is "prohibited offensive work" [src/lib/seed-plus.ts#24](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed-plus.ts#L24-L24)

#### Interaction Data Flow

The seed data simulates a living community through `TaskPulseVoteRecord` and `CommentRecord` entries.

Diagram: Interaction and Governance Data Flow

Sources:[src/lib/seed-plus.ts#3-11](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed-plus.ts#L3-L11)[src/lib/seed-plus.ts#27-40](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed-plus.ts#L27-L40)[src/lib/seed-plus.ts#44-60](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed-plus.ts#L44-L60)

---

### Running the Seed Scripts

The seeding process is typically triggered during database initialization or via a manual reset. In the KenMatch environment, this is handled by the `hydrate()` function.

1. Database Reset: The system clears existing tables (profiles, tasks, votes, etc.).
2. Core Hydration: `seedProfiles`, `seedCategories`, and `seedTasks` from `src/lib/seed.ts` are inserted first to establish foreign key targets.
3. Extended Hydration: `seed-plus.ts` data is then inserted, linking comments to profiles and finance records to tasks.
4. Vote Aggregation: The `seedVotes` are processed through the `quadraticCost` formula in `src/lib/allocation.ts` to determine the initial lane assignments (Days/Weeks/Months) for the demo board.

Sources:[src/lib/db.ts#1-10](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L1-L10)[src/lib/seed.ts#1-5](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed.ts#L1-L5)[src/lib/seed-plus.ts#1-5](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/seed-plus.ts#L1-L5)

---

# Business-Logic-Libraries

# Business Logic Libraries
Relevant source files

- [src/lib/allocation.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts)
- [src/lib/attestation.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts)
- [src/lib/economics.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts)
- [src/lib/utils.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/utils.ts)

The `src/lib/` directory contains the core domain logic of KenMatch. These libraries are designed as pure-function utilities, making them highly testable and independent of the database or UI layers. They implement the fundamental rules of the system: how votes translate into resource allocation, how user identity affects participation permissions, and how treasury economics are calculated.

### System Logic Flow

The following diagram illustrates how these libraries bridge the gap between raw data (Profiles, Tasks, Votes) and the high-level system states (Tiers, Participation Policies, Runway).

Logic Integration Map

Sources: [src/lib/allocation.ts#1-132](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L1-L132)[src/lib/attestation.ts#1-70](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L1-L70)[src/lib/economics.ts#1-49](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L1-L49)[src/lib/utils.ts#1-190](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/utils.ts#L1-L190)

---

## 3.1 Allocation and Quadratic Voting

The allocation engine manages how "Voice Credits" are converted into task rankings. It uses a quadratic cost model where the cost of votes increases exponentially (`cost = votes²`), ensuring that broad consensus is favored over narrow, intense preference.

- Quadratic Cost: Handled by `quadraticCost(votes)`[src/lib/allocation.ts#5-11](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L5-L11) and `incrementalQuadraticCost`[src/lib/allocation.ts#13-15](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L13-L15)
- Ranking Pipeline: The `buildCategoryRankings` function [src/lib/allocation.ts#72-113](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L72-L113) groups tasks by category and sorts them by `totalVotes`, `createdAt`, and `title` to determine their priority.
- Tier Assignment: Tasks are assigned to an `AllocationTier` (Months, Weeks, Days, Queued, or Blocked) based on their rank [src/lib/allocation.ts#33-55](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L33-L55)

For details on the ranking formulas and the allocation test suite, see [Allocation and Quadratic Voting](#3.1).

Sources: [src/lib/allocation.ts#3-117](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L3-L117)

---

## 3.2 Attestation and Participation Policy

The attestation system governs what actions a user can perform based on their identity verification status and Sybil risk profile. It transforms raw attestation data into a `ParticipationPolicy` object containing boolean capability flags.

- Policy Resolution: `resolveParticipationPolicy`[src/lib/attestation.ts#14-70](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L14-L70) evaluates `AttestationStatus` and `SybilRiskBand`.
- Participation States: Users fall into `read-only`, `review-limited`, or `full` states [src/lib/attestation.ts#21-61](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L21-L61)
- Voice Multipliers: High-risk or unverified accounts have their `effectiveVoiceCredits` reduced by a multiplier (e.g., 0.6 or 0.8) [src/lib/attestation.ts#33-52](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L33-L52)

For details on capability flags like `canSubmit` and `canAllocateVoice`, see [Attestation and Participation Policy](#3.2).

Sources: [src/lib/attestation.ts#1-70](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L1-L70)

---

## 3.3 Economics and Treasury

The economics library calculates the financial health of the KenMatch ecosystem, managing revenue splits between the treasury and founders, and projecting compute runway.

- Revenue Splitting: `summarizeRevenueStream`[src/lib/economics.ts#3-12](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L3-L12) calculates the USD split based on `treasurySharePercent` and `founderSharePercent`.
- Treasury Aggregation: `summarizeEconomics`[src/lib/economics.ts#14-49](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L14-L49) reconciles inflows and outflows within the `compute-treasury` bucket [src/lib/economics.ts#27-29](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L27-L29)
- Runway Calculation: The system computes `coverageMonths` by dividing the current `treasuryBalanceUsd` by the `monthlyPublicBurnUsd`[src/lib/economics.ts#30](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L30-L30)

For details on restricted funding detection and verified stream counts, see [Economics and Treasury](#3.3).

Sources: [src/lib/economics.ts#1-49](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L1-L49)

---

## 3.4 Shared Utilities

The `utils.ts` library provides standardized formatting for currency, dates, and durations across the application. It also contains label mappers that convert internal code enums into user-friendly strings.

FunctionPurpose`formatCurrency`Formats numbers as USD [src/lib/utils.ts#3-9](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/utils.ts#L3-L9)`describeCountdown`Returns relative strings like "Launches in 2 weeks" [src/lib/utils.ts#88-97](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/utils.ts#L88-L97)`progressPercent`Calculates completion percentage between two dates [src/lib/utils.ts#109-123](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/utils.ts#L109-L123)`labelForTier`Maps `AllocationTier` to display strings ("Months", "Weeks", etc.) [src/lib/utils.ts#134-147](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/utils.ts#L134-L147)

Logic Dependency Graph

Sources: [src/lib/utils.ts#1-181](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/utils.ts#L1-L181)

---

# Allocation-and-Quadratic-Voting

# Allocation and Quadratic Voting
Relevant source files

- [src/components/vote-panel.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/vote-panel.tsx)
- [src/lib/allocation.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts)
- [tests/allocation.test.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/allocation.test.ts)

The allocation system in KenMatch governs how scarce AI compute resources are distributed across competing proposals (Kens). It utilizes Quadratic Voting (QV) to allow participants to express the intensity of their preferences while preventing any single high-capital entity from dominating the board. The system transforms raw vote counts into a ranked hierarchy of "Lanes" or "Tiers" that determine the duration and priority of task execution.

## Quadratic Cost Model

KenMatch uses a standard quadratic cost formula where the cost in voice credits is the square of the number of votes assigned to a single task. This mechanism ensures that the marginal cost of each additional vote increases linearly, making broad support across many tasks more "efficient" than deep support for a single task.

### Key Formulae

FunctionLogicPurpose`quadraticCost(votes)`$Cost = Votes^2$Calculates the total credit cost for a given vote count. [src/lib/allocation.ts#5-11](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L5-L11)`incrementalQuadraticCost(current, next)`$Cost_{next} - Cost_{current}$Determines the additional credits needed to upgrade a vote. [src/lib/allocation.ts#13-15](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L13-L15)`spentCredits(votes[])`$\sum (voteCount^2)$Aggregates total spent credits for a user profile across all tasks. [src/lib/allocation.ts#115-117](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L115-L117)

### Constraints

- MAX_VOTES_PER_TASK: Users are limited to a maximum of 6 votes (36 credits) per Ken to ensure diversity in allocation. [src/lib/allocation.ts#3](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L3-L3)
- Integrity: Votes must be non-negative integers. [src/lib/allocation.ts#6-8](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L6-L8)

Sources:[src/lib/allocation.ts#1-17](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L1-L17)[src/components/vote-panel.tsx#31-32](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/vote-panel.tsx#L31-L32)

## Allocation Tiers and Ranking

The system maps a Ken's relative rank within its category to specific `AllocationTier` values. These tiers represent the "Lanes" of compute availability.

### Tier Thresholds

The `tierForRank` function determines the lane based on the numerical rank:

RankTierDescriptionWeight1 - 3`months`Long-horizon execution34 - 10`weeks`Medium-horizon execution211 - 100`days`Short-burst execution1> 100 / Unranked`queued`Waiting for capacity0N/A`blocked`Safety or policy violation-1

Sources:[src/lib/allocation.ts#33-55](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L33-L55)[src/lib/allocation.ts#119-131](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L119-L131)

## The Ranking Pipeline

The `buildCategoryRankings` function implements the core logic for organizing the board. It processes a list of `RankingSeed` objects through a grouping and sorting pipeline.

### Eligibility Predicate

A Ken is only `isEligibleForAllocation` if it meets the following criteria:

1. Stage: Must not be in `review` or `blocked` stage. [src/lib/allocation.ts#22-24](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L22-L24)
2. Safety: `safetyStatus` must be `approved` (not `pending` or `blocked`). [src/lib/allocation.ts#26-28](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L26-L28)
3. Support: Must have at least 1 vote. [src/lib/allocation.ts#30](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L30-L30)

### Ranking Logic Flow

For each category, eligible Kens are sorted using a multi-pass priority:

1. Total Votes: Highest `totalVotes` first. [src/lib/allocation.ts#86-88](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L86-L88)
2. Recency: If votes are tied, the earlier `createdAt` timestamp wins. [src/lib/allocation.ts#90-92](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L90-L92)
3. Lexicographical: If still tied, sort alphabetically by `title`. [src/lib/allocation.ts#94](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L94-L94)

### Data Flow: From Votes to Tiers

This diagram illustrates how raw user input in the `VotePanel` flows through the allocation logic to produce a ranked board.

Title: Allocation Logic Pipeline

Sources:[src/lib/allocation.ts#72-113](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L72-L113)[src/components/vote-panel.tsx#28-32](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/vote-panel.tsx#L28-L32)

## Implementation in UI

The `VotePanel` component provides the interface for interacting with the quadratic model. It uses a range slider constrained by `MAX_VOTES_PER_TASK`.

### Interactive Feedback

The component calculates real-time metrics as the user adjusts the slider:

- Voice here: The raw `voteCount`. [src/components/vote-panel.tsx#57](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/vote-panel.tsx#L57-L57)
- Quadratic cost: Result of `quadraticCost(voteCount)`. [src/components/vote-panel.tsx#58](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/vote-panel.tsx#L58-L58)
- Free after save: `availableCredits - (newCost - initialCost)`. [src/components/vote-panel.tsx#59](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/vote-panel.tsx#L59-L59)

Title: Vote Interaction and State Management

Sources:[src/components/vote-panel.tsx#52-93](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/vote-panel.tsx#L52-L93)[src/lib/allocation.ts#13-15](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L13-L15)

## Testing Suite

The allocation logic is verified in `tests/allocation.test.ts` using the Node.js test runner.

### Test Coverage

1. Non-linear Growth: Confirms `quadraticCost(3) === 9` and `quadraticCost(6) === 36`. [tests/allocation.test.ts#6-10](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/allocation.test.ts#L6-L10)
2. Summation: Validates that `spentCredits` correctly reduces an array of votes. [tests/allocation.test.ts#12-14](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/allocation.test.ts#L12-L14)
3. Protocol Adherence: Ensures `tierForRank` correctly assigns the "months", "weeks", and "days" lanes. [tests/allocation.test.ts#16-22](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/allocation.test.ts#L16-L22)
4. Ranking Pipeline: A comprehensive test case involving:

- Sorting by vote count. [tests/allocation.test.ts#26-28](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/allocation.test.ts#L26-L28)
- Excluding `blocked` tasks from the ladder. [tests/allocation.test.ts#30-37](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/allocation.test.ts#L30-L37)
- Handling `review` stage tasks as `queued`. [tests/allocation.test.ts#29-36](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/allocation.test.ts#L29-L36)

Sources:[tests/allocation.test.ts#1-38](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/allocation.test.ts#L1-L38)

---

# Attestation-and-Participation-Policy

# Attestation and Participation Policy
Relevant source files

- [src/lib/attestation.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts)
- [src/lib/types.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts)
- [tests/attestation.test.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/attestation.test.ts)

The Attestation and Participation Policy defines the rules for how user identity signals (attestations) translate into functional capabilities within the KenMatch system. It governs the transition from "Natural Language Space" (identity trust) to "Code Entity Space" (permission flags and voice credit multipliers). This logic is primarily encapsulated in the `resolveParticipationPolicy` function, which determines a user's `ParticipationState` and their `effectiveVoiceCredits`.

## Participation States and Capability Flags

The system categorizes users into three distinct participation states based on their `AttestationStatus` and `SybilRiskBand`. Each state provides a specific set of boolean capability flags that control UI visibility and server-side action permissions.

### Participation State Definitions

StateDescriptionCapabilities`read-only`Access is restricted to viewing content. Public actions are paused.`canSubmit: false`, `canComment: false`, `canPulse: false`, `canAllocateVoice: false``review-limited`Public participation is allowed, but influence is throttled via a multiplier.`canSubmit: true`, `canComment: true`, `canPulse: true`, `canAllocateVoice: true``full`Complete access with 100% voice credit capacity.`canSubmit: true`, `canComment: true`, `canPulse: true`, `canAllocateVoice: true`

Sources: `<FileRef file-url="https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L46-L47" min=46 max=47 file-path="src/lib/types.ts">Hii</FileRef>`, `<FileRef file-url="https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L3-L12" min=3 max=12 file-path="src/lib/attestation.ts">Hii</FileRef>`, `<FileRef file-url="https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L19-L70" min=19 max=70 file-path="src/lib/attestation.ts">Hii</FileRef>`

## Policy Resolution Logic

The `resolveParticipationPolicy` function takes three inputs: `status` (`AttestationStatus`), `sybilRisk` (`SybilRiskBand`), and `voiceCredits` (raw balance). It returns a `ParticipationPolicy` object containing the calculated state and multipliers.

### Logic Flow and Multipliers

The function applies a hierarchical set of checks to determine the policy:

1. Hard Restriction: If `status === "limited"` or `sybilRisk === "high"`, the state is forced to `read-only` with a `voiceMultiplier` of `0``<FileRef file-url="https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L19-L30" min=19 max=30 file-path="src/lib/attestation.ts">Hii</FileRef>`.
2. Pending Review: If `status === "review"`, the state is `review-limited`. The `voiceMultiplier` is `0.7` for low sybil risk and `0.6` otherwise `<FileRef file-url="https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L32-L44" min=32 max=44 file-path="src/lib/attestation.ts">Hii</FileRef>`.
3. Medium Risk Verified: If the status is verified but `sybilRisk === "medium"`, the state is `review-limited` with a `voiceMultiplier` of `0.8``<FileRef file-url="https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L46-L58" min=46 max=58 file-path="src/lib/attestation.ts">Hii</FileRef>`.
4. Full Access: Otherwise, the state is `full` with a `voiceMultiplier` of `1``<FileRef file-url="https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L60-L69" min=60 max=69 file-path="src/lib/attestation.ts">Hii</FileRef>`.

### Effective Voice Credits Calculation

The `effectiveVoiceCredits` are calculated by applying the `voiceMultiplier` to the raw `voiceCredits`. To ensure users in limited states can still participate meaningfully (if permitted), the logic applies a floor of `1` credit, unless the state is `read-only`.

Formula:`Math.max(Math.floor(voiceCredits * voiceMultiplier), 1)`

Sources: `<FileRef file-url="https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L38-L38" min=38  file-path="src/lib/attestation.ts">Hii</FileRef>`, `<FileRef file-url="https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L52-L52" min=52  file-path="src/lib/attestation.ts">Hii</FileRef>`, `<FileRef file-url="https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L64-L64" min=64  file-path="src/lib/attestation.ts">Hii</FileRef>`

## System Mapping: Identity to Capabilities

The following diagram illustrates how identity attributes from the `ProfileAttestationRecord` are processed by the `resolveParticipationPolicy` function to produce the `ParticipationPolicy` used by the UI and Server Actions.

### Identity to Capability Mapping

Sources: `<FileRef file-url="https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L3-L12" min=3 max=12 file-path="src/lib/attestation.ts">Hii</FileRef>`, `<FileRef file-url="https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L14-L18" min=14 max=18 file-path="src/lib/attestation.ts">Hii</FileRef>`, `<FileRef file-url="https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L40-L44" min=40 max=44 file-path="src/lib/types.ts">Hii</FileRef>`

## Attestation Logic Data Flow

This diagram shows how the `ParticipationPolicy` flows from the logic layer into the system's decision-making components.

### Participation Policy Data Flow

Sources: `<FileRef file-url="https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L14-L70" min=14 max=70 file-path="src/lib/attestation.ts">Hii</FileRef>`, `<FileRef file-url="https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L63-L76" min=63 max=76 file-path="src/lib/types.ts">Hii</FileRef>`, `<FileRef file-url="https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L78-L86" min=78 max=86 file-path="src/lib/types.ts">Hii</FileRef>`

## Test Suite

The attestation logic is validated in `tests/attestation.test.ts` using the Node.js built-in test runner. The suite covers the three primary scenarios:

1. Full Capacity: Verified low-risk accounts must maintain 100% of their credits `<FileRef file-url="https://github.com/lowestprime/KenMatch/blob/8218181e/tests/attestation.test.ts#L6-L13" min=6 max=13 file-path="tests/attestation.test.ts">Hii</FileRef>`.
2. Review Throttling: Accounts in review status must have reduced but non-zero `effectiveVoiceCredits` and maintain participation flags `<FileRef file-url="https://github.com/lowestprime/KenMatch/blob/8218181e/tests/attestation.test.ts#L15-L22" min=15 max=22 file-path="tests/attestation.test.ts">Hii</FileRef>`.
3. Read-Only Lockdown: Limited or high-risk accounts must have all capability flags set to `false` and `0` effective credits `<FileRef file-url="https://github.com/lowestprime/KenMatch/blob/8218181e/tests/attestation.test.ts#L24-L32" min=24 max=32 file-path="tests/attestation.test.ts">Hii</FileRef>`.

Sources: `<FileRef file-url="https://github.com/lowestprime/KenMatch/blob/8218181e/tests/attestation.test.ts#L1-L33" min=1 max=33 file-path="tests/attestation.test.ts">Hii</FileRef>`

---

# Economics-and-Treasury

# Economics and Treasury
Relevant source files

- [src/lib/economics.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts)
- [src/lib/types.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts)
- [tests/economics.test.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/economics.test.ts)

The Economics and Treasury module provides the logic for managing KenMatch's financial sustainability and compute runway. It transforms raw revenue streams and ledger entries into high-level metrics such as monthly burn coverage, restricted funding detection, and treasury/founder share splits.

## Core Logic and Data Flow

The system processes two primary data inputs: `RevenueStreamRecord` (representing ongoing income engines) and `TreasuryEntryRecord` (representing discrete ledger events). The logic is implemented as pure functions in `src/lib/economics.ts`, ensuring that the financial state can be deterministically computed for any set of inputs.

### Revenue Splitting

The `summarizeRevenueStream` function calculates the specific USD allocations for the treasury and the founders based on percentage shares defined in the stream record [src/lib/economics.ts#3-12](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L3-L12)

FieldDescriptionCalculation`treasuryMonthlyUsd`Funds allocated to the compute treasury`(monthlyRevenueUsd * treasurySharePercent) / 100``founderMonthlyUsd`Funds allocated to operational/founder shares`(monthlyRevenueUsd * founderSharePercent) / 100`

### Economic Summarization

The `summarizeEconomics` function aggregates all streams and ledger entries to produce a comprehensive `EconomicsSummary`[src/lib/economics.ts#14-49](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L14-L49)

Data Transformation Process:

1. Filtering: It distinguishes between "committed" revenue (status `live` or `pilot`) and "planned" revenue [src/lib/economics.ts#21](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L21-L21)
2. Reconciliation: It calculates the `treasuryBalanceUsd` by summing inflows and outflows specifically for the `compute-treasury` bucket [src/lib/economics.ts#27-29](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L27-L29)
3. Runway Calculation: It computes `coverageMonths` by dividing the current treasury balance by the `monthlyPublicBurnUsd`[src/lib/economics.ts#30](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L30-L30)
4. Restricted Funding: It identifies "restricted" funds by scanning entry titles and descriptions for the keyword "restricted" [src/lib/economics.ts#31-33](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L31-L33)

### Economics Data Mapping

The following diagram bridges the natural language concepts of treasury management to the specific TypeScript interfaces and functions.

Economics Entity Mapping

Sources: [src/lib/types.ts#232-255](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L232-L255)[src/lib/economics.ts#3-49](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L3-L49)

## Implementation Details

### Treasury Reconciliation Logic

The treasury balance is not a single stored value but a derived sum of ledger entries. This ensures an audit trail for every dollar entering or leaving the compute pool.

Treasury Entry Processing

Sources: [src/lib/economics.ts#27-29](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L27-L29)[src/lib/types.ts#246-255](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L246-L255)

### Key Metrics Definitions

MetricCode ReferenceDescriptionCommitted Revenue`committedRevenueUsd`Sum of revenue from `live` and `pilot` streams only [src/lib/economics.ts#23](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L23-L23)Verified Streams`verifiedFundingStreams`Count of non-planned revenue streams [src/lib/economics.ts#34](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L34-L34)Restricted Funding`restrictedFundingUsd`Total amount in treasury tagged with "restricted" in metadata [src/lib/economics.ts#31-33](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L31-L33)Coverage Months`coverageMonths`Months of compute burn supported by current balance, fixed to 1 decimal [src/lib/economics.ts#30](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L30-L30)

Sources: [src/lib/economics.ts#14-49](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L14-L49)

## Testing Suite

The economics logic is verified in `tests/economics.test.ts` using the Node.js native test runner. The tests ensure that share splits and summary aggregations are mathematically accurate.

### Test Coverage

- Revenue Splitting: Validates that `summarizeRevenueStream` correctly applies percentage-based splits (e.g., 80/20 split on $100k revenue results in $80k treasury and $20k founder shares) [tests/economics.test.ts#6-23](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/economics.test.ts#L6-L23)
- Summary Derivation: Validates the full `summarizeEconomics` pipeline, including:

- Filtering out "planned" streams from the verified count [tests/economics.test.ts#122](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/economics.test.ts#L122-L122)
- Correctly identifying restricted inflows based on string matching [tests/economics.test.ts#120](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/economics.test.ts#L120-L120)
- Calculating the treasury balance across multiple inflows and outflows [tests/economics.test.ts#117](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/economics.test.ts#L117-L117)
- Ensuring the `coverageMonths` calculation handles burn rates correctly [tests/economics.test.ts#119](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/economics.test.ts#L119-L119)

Sources: [tests/economics.test.ts#1-123](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/economics.test.ts#L1-L123)

---

# Application-Routes-and-Server-Actions

# Application Routes and Server Actions
Relevant source files

- [src/app/action-state.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/action-state.ts)
- [src/app/actions.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts)
- [src/app/api/health/route.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/api/health/route.ts)
- [src/app/layout.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/layout.tsx)

This section provides a high-level overview of the KenMatch application structure, focusing on the Next.js App Router organization and the Server Actions mutation layer. KenMatch utilizes a unified architecture where routing, data fetching, and mutations are tightly integrated via React Server Components (RSC) and Server Actions.

## Routing Architecture

KenMatch uses the Next.js App Router. The layout is managed by a root `SiteShell` component [src/app/layout.tsx#33-35](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/layout.tsx#L33-L35) which provides consistent navigation, branding, and viewer session context across all pages.

### Primary Route Groups

The application is organized into several functional areas:

Route PathDescriptionKey Components / Logic`/`HomepageGlobal metrics and featured Kens.`/kens`Kens BoardMulti-parameter filtering and task discovery.`/kens/[slug]`Ken DetailDeep dive into a specific proposal, including audit trails and voting.`/submit`SubmissionTier-aware proposal form for new Kens.`/governance`GovernanceAttestation ladder and system-wide audit logs.`/economics`EconomicsTreasury ledger and revenue stream tracking.`/auth`AuthenticationSign-in and Sign-up panels.

For details on specific pages, see:

- [Public Board and Ken Detail Pages](#4.2)
- [Submission, Governance, and Economics Pages](#4.3)
- [Authentication Pages and Session Management](#4.4)

Sources: [src/app/layout.tsx#4-39](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/layout.tsx#L4-L39)[src/app/actions.ts#103-114](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L103-L114)

## Mutation Layer (Server Actions)

Mutations in KenMatch are handled exclusively through Next.js Server Actions defined in `src/app/actions.ts`. These functions are "use server" entry points that bridge the client-side UI (forms and buttons) to the backend database and session logic.

### Action Flow and Validation

Every mutation follows a standardized lifecycle:

1. Input Validation: Data is parsed using Zod schemas (e.g., `proposalSchema`, `voteSchema`) [src/app/actions.ts#29-82](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L29-L82)
2. Authorization: Actions often call `requireViewerProfileId()` to ensure the user is authenticated before proceeding [src/app/actions.ts#95-101](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L95-L101)
3. Data Transformation: Complex inputs (like multiline textareas) are processed via utilities like `splitLines`[src/app/actions.ts#84-86](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L84-L86)
4. Persistence: The action calls a `lib/db.ts` function to update the libSQL database [src/app/actions.ts#193-202](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L193-L202)
5. Cache Invalidation: The `revalidateCorePaths()` helper is called to purge the Next.js Data Cache for relevant routes [src/app/actions.ts#103-114](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L103-L114)
6. State Return: The action returns an `ActionState` object containing the status, message, and any field-level errors [src/app/action-state.ts#1-5](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/action-state.ts#L1-L5)

### Core Action Entities

The following diagram illustrates how Server Actions connect UI interactions to the underlying domain logic and database.

KenMatch Mutation Flow

Sources: [src/app/actions.ts#1-212](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L1-L212)[src/app/action-state.ts#1-11](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/action-state.ts#L1-L11)

## Cache Revalidation Strategy

KenMatch uses an aggressive revalidation strategy to ensure the public board and governance logs remain consistent after user actions. The `revalidateCorePaths` function [src/app/actions.ts#103-114](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L103-L114) is the central mechanism for this, clearing the cache for:

- The homepage (`/`)
- The main boards (`/kens`, `/tasks`)
- Governance and Economics dashboards
- The specific detail page for the affected Ken (`/kens/[slug]`)

This ensures that when a user votes or submits a comment, the updated "Voice Credits" and "Pulse" scores are immediately reflected across the entire application upon the next navigation.

For a deep dive into the implementation of these actions and schemas, see [Server Actions and Mutation Layer](#4.1).

## Health Monitoring

The application exposes a standard health check endpoint at `/api/health`. This route queries the database via `getHealthSummary()` to verify connectivity and system status [src/app/api/health/route.ts#5-8](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/api/health/route.ts#L5-L8)

Sources: [src/app/api/health/route.ts#1-9](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/api/health/route.ts#L1-L9)

---

# Server-Actions-and-Mutation-Layer

# Server Actions and Mutation Layer
Relevant source files

- [src/app/action-state.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/action-state.ts)
- [src/app/actions.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts)
- [src/app/api/health/route.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/api/health/route.ts)
- [src/lib/session.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/session.ts)

The Server Actions and Mutation Layer in KenMatch serves as the primary bridge between the client-side UI and the libSQL persistence layer. It implements a unified pattern for data mutations, validation, and cache invalidation using Next.js "use server" functions.

## Overview of the Mutation Flow

KenMatch utilizes a standardized mutation flow where React forms dispatch to Server Actions defined in `src/app/actions.ts`. These actions validate input using Zod schemas, enforce authorization via session guards, execute database operations, and finally trigger path-based revalidation to update the UI.

### Data Transformation and Validation

Before reaching the database, input data is transformed. A key utility is `splitLines`, which converts newline-separated strings from textareas into arrays of strings for fields like deliverables or risk flags [src/app/actions.ts#84-86](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L84-L86) Validation errors are caught by Zod and flattened into a `Record<string, string>` format via `flattenFieldErrors` to be easily consumed by UI components [src/app/actions.ts#88-93](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L88-L93)

### Action State Management

All mutation actions adhere to the `ActionState` interface, which tracks the status, a user-facing message, and optional field-level errors [src/app/action-state.ts#1-5](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/action-state.ts#L1-L5)

Mutation Logic Flow:

1. Form Submission: UI component calls a Server Action with `FormData`.
2. Validation: Zod schema parses the data.
3. Auth Guard:`requireViewerProfileId()` ensures the user is logged in [src/app/actions.ts#95-101](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L95-L101)
4. DB Execution: Action calls a specific function in `src/lib/db.ts`.
5. Revalidation:`revalidateCorePaths()` clears the Next.js Data Cache for relevant routes [src/app/actions.ts#103-114](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L103-L114)
6. Redirection: User is navigated to the result page (e.g., the new Ken detail page).

### Code Entity Mapping: Mutation Pipeline

The following diagram maps the logical flow from the UI to the underlying database functions.

Sources:[src/app/actions.ts#29-64](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L29-L64)[src/app/actions.ts#182-212](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L182-L212)[src/lib/session.ts#24-27](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/session.ts#L24-L27)[src/lib/db.ts#12-19](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L12-L19)

---

## Core Server Actions

### Authentication Actions

Authentication actions manage the user's session lifecycle by interacting with both the database and the browser's cookies.

ActionPurposeKey DB Call`signInAction`Validates credentials and sets session cookie.`authenticateAccount`[src/app/actions.ts#126](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L126-L126)`signUpAction`Creates new profile/account if `KENMATCH_ALLOW_SIGNUPS` is true.`createAccount`[src/app/actions.ts#158](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L158-L158)`signOutAction`Deletes session from DB and clears cookie.`deleteSessionByToken`[src/app/actions.ts#175](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L175-L175)

Sources:[src/app/actions.ts#116-180](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L116-L180)[src/lib/session.ts#29-37](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/session.ts#L29-L37)

### Domain Mutation Actions

These actions handle the core business logic of the KenMatch platform, such as proposing Kens, voting, and commenting.

- `createProposalAction`: Processes the multi-field Ken submission. It uses `splitLines` to format the deliverables and risk flags before calling `createProposal`[src/app/actions.ts#182-212](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L182-L212)
- `saveVoteAction`: Handles quadratic voice credit allocation. It enforces the `MAX_VOTES_PER_TASK` limit (6) via the `voteSchema`[src/app/actions.ts#48](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L48-L48)
- `saveTaskPulseAction`: Records a simple "Pulse" (up/down/neutral) signaling for a Ken [src/app/actions.ts#52-56](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L52-L56)
- `createCommentAction`: Allows users to post comments with a "Stake Credit" value (1-3) to signify the importance of the feedback [src/app/actions.ts#58-64](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L58-L64)

Sources:[src/app/actions.ts#182-250](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L182-L250)[src/lib/allocation.ts#8](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L8-L8)

---

## Authorization and Cache Management

### The `requireViewerProfileId` Guard

This function is the primary gatekeeper for mutations. It retrieves the current session via `getViewerProfileId()`[src/lib/session.ts#24](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/session.ts#L24-L24) If no active session exists, it throws an error that is caught by the action's try/catch block, returning a user-friendly error message to the UI [src/app/actions.ts#95-101](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L95-L101)

### Global Revalidation: `revalidateCorePaths`

Because KenMatch relies heavily on derived state (e.g., total votes affecting ranking and tier assignment), most mutations require a broad cache invalidation. The `revalidateCorePaths(slug?: string)` function clears:

- The homepage (`/`)
- The board (`/kens`, `/tasks`)
- Governance and Economics dashboards
- Specific Ken detail pages if a slug is provided [src/app/actions.ts#103-114](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L103-L114)

### Code Entity Mapping: Auth & Session Persistence

This diagram illustrates how the server actions interact with session utilities and the cookie store.

Sources:[src/app/actions.ts#116-138](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L116-L138)[src/lib/session.ts#29-32](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/session.ts#L29-L32)[src/lib/db.ts#10-14](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L10-L14)

---

## Validation Schemas (Zod)

The system uses Zod to enforce strict data types and business rules at the edge of the mutation layer.

SchemaConstraint ExampleFile Reference`proposalSchema``summary` must be >= 30 chars; `requestedTier` must be days/weeks/months.[src/app/actions.ts#29-43](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L29-L43)`voteSchema``voteCount` must be between 0 and `MAX_VOTES_PER_TASK`.[src/app/actions.ts#45-50](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L45-L50)`pulseSchema``value` must be exactly -1, 0, or 1.[src/app/actions.ts#52-56](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L52-L56)`commentSchema``stakeCredits` must be between 1 and 3.[src/app/actions.ts#58-64](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L58-L64)`signUpSchema`Extends `signInSchema` with bio (min 24 chars) and specialty.[src/app/actions.ts#77-82](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L77-L82)

Sources:[src/app/actions.ts#29-82](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L29-L82)

---

# Public-Board-and-Ken-Detail-Pages

# Public Board and Ken Detail Pages
Relevant source files

- [src/app/kens/[slug]/page.tsx](src/app/kens/%5Bslug%5D/page.tsx)
- [src/app/kens/page.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/kens/page.tsx)
- [src/app/page.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/page.tsx)
- [src/app/tasks/[slug]/page.tsx](src/app/tasks/%5Bslug%5D/page.tsx)
- [src/app/tasks/page.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/tasks/page.tsx)

This page covers the primary user-facing routes of the KenMatch application. It details the implementation of the high-level metrics on the home page, the multi-parameter filtering system on the Kens board, and the comprehensive detail view for individual Kens, including their audit trails and interactive voting panels.

## 1. Homepage and Metrics

The home page (`src/app/page.tsx`) serves as the entry point for both guest and authenticated users. It provides a high-level overview of the system's health and leading Kens through the `getHomeData` function.

### Implementation and Data Flow

The page is a React Server Component (RSC) that fetches a unified data object containing system-wide metrics, categories, featured tasks, and current viewer state [src/app/page.tsx#8-10](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/page.tsx#L8-L10)

- Hero Section: Displays the value proposition and primary CTAs (Browse, Submit, Funding) [src/app/page.tsx#14-27](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/page.tsx#L14-L27)
- HomepageMetrics: Renders key system statistics including total Ken proposals, active runs, bonded voice credits, and monthly treasury commitments [src/app/page.tsx#49-53](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/page.tsx#L49-L53)
- Leading Kens: Displays the top-ranked Kens currently eligible for launch using the `TaskCard` component [src/app/page.tsx#57-68](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/page.tsx#L57-L68)
- Funding Snapshot: Visualizes the separation between public ranking and revenue, showing "Coverage Months" and "Sponsor Pools" [src/app/page.tsx#85-107](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/page.tsx#L85-L107)

### Code-to-System Mapping: Home Page

The following diagram maps the visual sections of the home page to their corresponding data fetching and utility logic.

Home Page Data Association

Sources: [src/app/page.tsx#8-10](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/page.tsx#L8-L10)[src/app/page.tsx#49-53](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/page.tsx#L49-L53)[src/lib/db.ts#1-10](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L1-L10) (implied by `getHomeData` import).

---

## 2. The Kens Board (Marketplace)

The Kens board (`src/app/kens/page.tsx`) provides a searchable, filterable interface for all Kens in the system. It handles four primary filter dimensions: search query, category, allocation lane (tier), and lifecycle stage.

### Multi-Parameter Filtering

The board utilizes `searchParams` to drive its state, allowing for deep-linking to specific filtered views.

- Query (`q`): Full-text search across titles and summaries.
- Category: Filters by specific domain (e.g., "Open Tools", "Science Support").
- Tier: Filters by allocation lane (`months`, `weeks`, `days`, `queued`, `blocked`) [src/app/kens/page.tsx#20-21](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/kens/page.tsx#L20-L21)
- Stage: Filters by lifecycle state (`proposing`, `running`, `shipped`) [src/app/kens/page.tsx#21](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/kens/page.tsx#L21-L21)

The `getMarketplaceData` function in `src/lib/db.ts` processes these filters to return the subset of tasks and the relevant category metadata [src/app/kens/page.tsx#22](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/kens/page.tsx#L22-L22)

### Legacy Route Aliases

To maintain backward compatibility and handle legacy internal naming, the `/tasks` route is redirected to `/kens`.

- `src/app/tasks/page.tsx` redirects to `/kens`[src/app/tasks/page.tsx#1-5](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/tasks/page.tsx#L1-L5)
- `src/app/tasks/[slug]/page.tsx` redirects to `/kens/[slug]`[src/app/tasks/[slug]/page.tsx:1-6]().

Sources: [src/app/kens/page.tsx#15-22](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/kens/page.tsx#L15-L22)[src/app/tasks/page.tsx#1-5](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/tasks/page.tsx#L1-L5)[src/app/tasks/[slug]/page.tsx:1-6]().

---

## 3. Ken Detail View

The Ken detail page (`src/app/kens/[slug]/page.tsx`) is the most data-intensive view in the application. It aggregates the proposal details, run plans, audit logs, and interactive governance panels.

### Component Composition

The page is structured into several functional areas:

1. Hero & Metrics: Displays the Ken's title, summary, current tier, and public pulse score [src/app/kens/[slug]/page.tsx:23-46]().
2. Timing Strip: Uses `KenTimingStrip` to visualize the duration, elapsed time, and remaining window for active Kens [src/app/kens/[slug]/page.tsx:40]().
3. Run Plan & Audit: Details the compute backend, checkpoint cadence, and a historical log of `runUpdates` (the audit trail) [src/app/kens/[slug]/page.tsx:77-120]().
4. Interaction Sidebar: Contains the `VotePanel` for quadratic voting, `TaskPulsePanel` for public signaling, and `DiscussionThread` for community engagement [src/app/kens/[slug]/page.tsx:125-140]().

### Data Interaction Flow

The following diagram illustrates how the detail page interacts with server-side logic and the viewer's session.

Ken Detail Page Logic Flow

Sources: [src/app/kens/[slug]/page.tsx:11-19](), [src/app/kens/[slug]/page.tsx:125-140]().

### Interactive Panels

- VotePanel: Allows users to allocate voice credits using the quadratic formula defined in `src/lib/allocation.ts`. It displays the current credits spent by the viewer on this specific Ken [src/app/kens/[slug]/page.tsx:130]().
- TaskPulsePanel: A lower-friction signaling mechanism (up/down) that contributes to the `taskPulseScore`[src/app/kens/[slug]/page.tsx:129]().
- DiscussionThread: Implements threaded comments where users can stake credits on their contributions to signal importance or quality [src/app/kens/[slug]/page.tsx:132]().

### Run and Audit Visualization

If a Ken has an active "Run", the page renders:

- Backend Details: The compute environment (e.g., "Llama-3-70b-Instruct") [src/app/kens/[slug]/page.tsx:81]().
- Checkpoints: Scheduled milestones with release gates (required vs. actual approvals) [src/app/kens/[slug]/page.tsx:92-100]().
- Audit Trail: A reverse-chronological list of `runUpdates`, showing incremental deliverables and human-in-the-loop checkpoints [src/app/kens/[slug]/page.tsx:113-120]().

Sources: [src/app/kens/[slug]/page.tsx:77-120](), [src/app/kens/[slug]/page.tsx:125-140]().

---

# Submission,-Governance,-and-Economics-Pages

# Submission, Governance, and Economics Pages
Relevant source files

- [src/app/economics/page.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/economics/page.tsx)
- [src/app/governance/page.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/governance/page.tsx)
- [src/app/submit/page.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/submit/page.tsx)

This section covers the specialized management and intake routes of KenMatch. These pages provide the interface for proposing new work (Kens), monitoring the integrity of the system through governance logs and attestation ladders, and auditing the financial health of the compute treasury.

## 1. Ken Submission Portal

The submission route `src/app/submit/page.tsx` serves as the entry point for new proposals. It enforces an authenticated session requirement to ensure an accountability trail for every submitted Ken.

### Implementation and Data Flow

The page fetches category metadata via `getHomeData` to populate the proposal form [src/app/submit/page.tsx#9](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/submit/page.tsx#L9-L9) If a user is not authenticated, it renders a sign-in prompt [src/app/submit/page.tsx#23-27](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/submit/page.tsx#L23-L27)

Key Components:

- `ProposalForm`: A complex client-side component (`src/components/proposal-form.tsx`) that handles the multi-field intake.
- Tier-Aware Guidance: The form is designed to help users understand the requirements for different compute tiers (Days, Weeks, Months).

### Submission Logic Diagram

This diagram maps the natural language "Submit Proposal" flow to the specific code entities involved in the transaction.

Title: Proposal Submission Flow

Sources: [src/app/submit/page.tsx#7-31](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/submit/page.tsx#L7-L31)[src/app/actions.ts#74-138](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L74-L138)

---

## 2. Governance Dashboard

The governance route `src/app/governance/page.tsx` provides transparency into the system's decision-making processes. It aggregates data from the `governance_events` table and profile attestation states.

### Implementation Details

The page utilizes `getGovernanceData` to retrieve a multi-faceted dataset [src/app/governance/page.tsx#7](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/governance/page.tsx#L7-L7):

1. Attestation Ladder: Displays the top profiles, their `attestationLevel`, `sybilRisk`, and `effectiveVoiceCredits`[src/app/governance/page.tsx#31-51](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/governance/page.tsx#L31-L51)
2. Governance Log: A chronological list of decisions made by different "houses" (e.g., Safety House, Resource House) [src/app/governance/page.tsx#58-68](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/governance/page.tsx#L58-L68)
3. Blocked Kens: Specifically highlights tasks that have been assigned the `blocked` tier, ensuring the "boundary" of acceptable work is visible to the public [src/app/governance/page.tsx#71-81](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/governance/page.tsx#L71-L81)
4. Category Health: Aggregates counts of `eligible`, `running`, and `shipped` Kens per category [src/app/governance/page.tsx#87-94](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/governance/page.tsx#L87-L94)

### Governance Data Relationships

Title: Governance Entity Mapping

Sources: [src/app/governance/page.tsx#1-98](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/governance/page.tsx#L1-L98)[src/lib/db.ts#1-100](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L1-L100)

---

## 3. Economics Dashboard

The economics route `src/app/economics/page.tsx` tracks the financial sustainability of the platform. It separates "Revenue" (market activity) from "Treasury" (funds available for compute).

### Core Economic Metrics

The dashboard displays a `metric-grid` derived from the `summarizeEconomics` logic [src/app/economics/page.tsx#19-30](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/economics/page.tsx#L19-L30):

- Revenue in Market: Total monthly revenue across all streams.
- Committed Revenue: Revenue from streams marked as `committed`.
- Coverage: The calculated runway in months (`summary.coverageMonths`) based on current treasury and burn rates.
- Sponsor Pools: Funds specifically earmarked for individual Kens.

### Data Structures

The page renders three primary lists:

- Revenue Streams: Individual business units or funding sources, showing the split between `treasuryMonthlyUsd` and `founderMonthlyUsd`[src/app/economics/page.tsx#35-48](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/economics/page.tsx#L35-L48)
- Treasury Ledger: A granular log of inflows and outflows from the `treasury_entries` table [src/app/economics/page.tsx#52-64](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/economics/page.tsx#L52-L64)
- Funded Kens: A list of tasks that have successfully attracted "Sponsor Pools" or "Enterprise Packaging" [src/app/economics/page.tsx#83-93](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/economics/page.tsx#L83-L93)

### Economics Calculation Logic

The summary data is processed via `summarizeEconomics` in the business logic layer.

Title: Economics Data Aggregation

Sources: [src/app/economics/page.tsx#5-98](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/economics/page.tsx#L5-L98)[src/lib/economics.ts#25-75](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L25-L75)

### Summary Table: Key Page Functions

RoutePrimary Data FunctionKey ComponentPurpose`/submit``getHomeData``ProposalForm`Intake of new Kens with accountability trails.`/governance``getGovernanceData`N/A (Server Components)Transparency of safety decisions and contributor status.`/economics``getEconomicsData`N/A (Server Components)Audit of compute treasury and revenue splits.

Sources: [src/app/submit/page.tsx#9](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/submit/page.tsx#L9-L9)[src/app/governance/page.tsx#7](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/governance/page.tsx#L7-L7)[src/app/economics/page.tsx#7](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/economics/page.tsx#L7-L7)

---

# Authentication-Pages-and-Session-Management

# Authentication Pages and Session Management
Relevant source files

- [src/app/action-state.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/action-state.ts)
- [src/app/api/health/route.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/api/health/route.ts)
- [src/app/auth/page.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/auth/page.tsx)
- [src/components/auth-panels.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/auth-panels.tsx)
- [src/lib/session.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/session.ts)

This section covers the implementation of user authentication, session persistence, and system health monitoring in KenMatch. The system uses a cookie-based session strategy to manage "Viewer" state, allowing the application to distinguish between public readers and accountable contributors.

## Authentication Overview

KenMatch implements a custom authentication flow using Next.js Server Actions and HTTP-only cookies. The primary goal is to ensure that actions such as voting, commenting, and submitting Kens are attributable to a verified profile.

### Auth Route and Redirection

The main entry point for authentication is `src/app/auth/page.tsx`. This page serves as a gateway:

- Session Check: It calls `getViewerSession()` to determine if a user is already logged in [src/app/auth/page.tsx#7](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/auth/page.tsx#L7-L7)
- Auto-Redirect: If a valid session exists, the user is redirected to the homepage [src/app/auth/page.tsx#8-10](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/auth/page.tsx#L8-L10)
- UI Rendering: If no session is found, it renders the `AuthPanels` component [src/app/auth/page.tsx#21](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/auth/page.tsx#L21-L21)

### AuthPanels Component

The `AuthPanels` component manages the client-side state for switching between "Sign In" and "Create Account" flows [src/components/auth-panels.tsx#9](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/auth-panels.tsx#L9-L9)

- Mode Switching: Uses a local `mode` state to toggle between `signin` and `signup` forms [src/components/auth-panels.tsx#16-23](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/auth-panels.tsx#L16-L23)
- Action Integration: It utilizes the `useActionState` hook to bind the `signInAction` and `signUpAction` server actions to their respective forms [src/components/auth-panels.tsx#10-11](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/auth-panels.tsx#L10-L11)
- Feedback: Displays validation errors (via `state.fieldErrors`) and global status messages to the user [src/components/auth-panels.tsx#31-53](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/auth-panels.tsx#L31-L53)

Sources:

- [src/app/auth/page.tsx#1-24](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/auth/page.tsx#L1-L24)
- [src/components/auth-panels.tsx#1-84](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/auth-panels.tsx#L1-L84)
- [src/app/action-state.ts#1-11](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/action-state.ts#L1-L11)

---

## Session Management

Session management is handled in `src/lib/session.ts`. KenMatch uses a secure, server-side cookie to store a session token.

### Key Functions

FunctionPurpose`getViewerSession`Retrieves the session token from cookies and fetches the associated profile from the database [src/lib/session.ts#18-22](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/session.ts#L18-L22)`getViewerProfileId`A helper to extract just the `profile.id` from the current session [src/lib/session.ts#24-27](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/session.ts#L24-L27)`setViewerSessionCookie`Sets the `KENMATCH_SESSION_COOKIE` with a calculated expiry based on `KENMATCH_SESSION_DAYS`[src/lib/session.ts#29-32](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/session.ts#L29-L32)`clearViewerSessionCookie`Effectively logs out the user by setting the cookie expiry to 0 [src/lib/session.ts#34-37](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/session.ts#L34-L37)

### Cookie Configuration

The `cookieOptions` helper ensures security best practices [src/lib/session.ts#8-16](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/session.ts#L8-L16):

- httpOnly: True (prevents XSS access to the token).
- secure: True in production (requires HTTPS).
- sameSite: "lax" (balances security and usability).

### Data Flow: Authentication to Session

The following diagram illustrates how the UI components interact with the session library and database to establish a user session.

Title: Authentication Data Flow

Sources:

- [src/lib/session.ts#1-43](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/session.ts#L1-L43)
- [src/components/auth-panels.tsx#30-51](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/auth-panels.tsx#L30-L51)

---

## Feature Flags and Configuration

The authentication behavior is influenced by environment variables defined in `src/lib/env.ts` (referenced in session logic):

- KENMATCH_ALLOW_SIGNUPS: While not explicitly checked in the UI component provided, this flag typically controls the visibility or availability of the `signUpAction` in the broader application context.
- KENMATCH_SESSION_COOKIE: Defines the name of the cookie key used for sessions [src/lib/session.ts#6](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/session.ts#L6-L6)
- KENMATCH_SESSION_DAYS: Determines the duration for which a session remains valid [src/lib/session.ts#31](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/session.ts#L31-L31)

Sources:

- [src/lib/session.ts#4-6](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/session.ts#L4-L6)
- [src/lib/session.ts#31](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/session.ts#L31-L31)

---

## System Health Monitoring

KenMatch provides a dedicated endpoint for infrastructure health checks, primarily used by container orchestrators (like Synology Container Manager) to verify system readiness.

### /api/health Endpoint

The route `src/app/api/health/route.ts` implements a simple GET handler:

- Implementation: It calls `getHealthSummary()` from the database library [src/app/api/health/route.ts#6](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/api/health/route.ts#L6-L6)
- Output: Returns a JSON summary of the system state with a `200 OK` status [src/app/api/health/route.ts#7](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/api/health/route.ts#L7-L7)

Title: Health Check Mapping

Sources:

- [src/app/api/health/route.ts#1-9](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/api/health/route.ts#L1-L9)

---

# UI-Components

# UI Components
Relevant source files

- [src/app/globals.css](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/globals.css)
- [src/app/layout.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/layout.tsx)
- [src/components/site-shell.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/site-shell.tsx)

The KenMatch UI is built using React and Tailwind CSS, following a custom design system defined in `src/app/globals.css`. The component library is organized to support a high-density, information-rich "board" interface that balances technical transparency with interactive governance tools.

### Component Architecture Overview

The UI is divided into three primary layers: the Global Shell (layout and navigation), Domain Components (task cards, voting panels, and timing strips), and Input Systems (proposal forms and authentication).

#### Component Relationship to Domain Entities

This diagram maps the React components to the underlying data entities and logic they represent.

"Component to Domain Entity Map"

Sources: [src/components/site-shell.tsx#16-48](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/site-shell.tsx#L16-L48)[src/components/task-card.tsx#1-10](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-card.tsx#L1-L10)[src/lib/allocation.ts#1-20](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L1-L20)

---

### Layout Shell and Navigation

The application's frame is managed by the `SiteShell` component, which provides a persistent two-row header and a themed footer. It is responsible for displaying the user's current `ParticipationState` and available voice credits.

- Header Structure: Features a brand row with the `KenMatchMark` and a utility row containing the `ThemeToggle` and user profile summary [src/components/site-shell.tsx#21-49](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/site-shell.tsx#L21-L49)
- Navigation: Provides access to the primary routes: Overview, Kens, Submit, Governance, and Funding [src/components/site-shell.tsx#8-14](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/site-shell.tsx#L8-L14)
- Theming: Supports Light, Dark, and OLED modes via `globals.css` variables and a `themeBootScript` in the root layout [src/app/layout.tsx#16-24](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/layout.tsx#L16-L24)[src/app/globals.css#15-74](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/globals.css#L15-L74)

For details, see [Layout Shell and Navigation](#5.1).

Sources: [src/components/site-shell.tsx#1-89](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/site-shell.tsx#L1-L89)[src/app/layout.tsx#26-39](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/layout.tsx#L26-L39)[src/app/globals.css#103-150](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/globals.css#L103-L150)

---

### Task Display and Interaction

These components form the core of the "Public Board" experience, enabling users to browse AI Kens (tasks) and participate in their prioritization.

ComponentResponsibilityKey Logic Reference`TaskCard`Summary view of a Ken for board listings.`src/components/task-card.tsx``VotePanel`Interactive quadratic voting interface.`quadraticCost` in `src/lib/allocation.ts``KenTimingStrip`Visualizes countdowns and delivery progress.`src/components/ken-timing-strip.tsx``TaskPulsePanel`Quick public signaling (up/down).`src/components/task-pulse-panel.tsx``DiscussionThread`Stake-weighted commenting system.`src/components/discussion-thread.tsx`

For details, see [Task Display and Interaction Components](#5.2).

Sources: [src/components/task-card.tsx#1-20](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-card.tsx#L1-L20)[src/components/vote-panel.tsx#1-30](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/vote-panel.tsx#L1-L30)[src/lib/allocation.ts#32-45](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L32-L45)

---

### Proposal Form and Profile Switcher

Input components handle the lifecycle of Ken creation and demo-mode environment management.

- `ProposalForm`: A complex multi-step form that uses `ActionState` for client-side validation and server-side feedback. It captures technical deliverables, risk flags, and enterprise packaging details [src/components/proposal-form.tsx#1-50](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L1-L50)
- `ProfileSwitcher`: A developer utility enabled by the `KENMATCH_ENABLE_DEMO_PROFILE_SWITCHER` environment variable, allowing rapid switching between seed profiles (e.g., "Founder", "Reviewer", "Sybil") to test different `ParticipationState` permissions [src/components/profile-switcher.tsx#1-25](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/profile-switcher.tsx#L1-L25)

For details, see [Proposal Form and Profile Switcher](#5.3).

Sources: [src/components/proposal-form.tsx#1-100](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L1-L100)[src/components/profile-switcher.tsx#1-30](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/profile-switcher.tsx#L1-L30)

### UI Interaction Flow

This diagram illustrates how a user interaction in the UI triggers the mutation layer and updates the display.

"UI Interaction to Server Action Flow"

Sources: [src/app/actions.ts#130-160](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L130-L160)[src/components/vote-panel.tsx#40-60](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/vote-panel.tsx#L40-L60)[src/lib/db.ts#250-280](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L250-L280)

---

# Layout-Shell-and-Navigation

# Layout Shell and Navigation
Relevant source files

- [src/app/globals.css](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/globals.css)
- [src/app/layout.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/layout.tsx)
- [src/components/kenmatch-mark.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/kenmatch-mark.tsx)
- [src/components/site-shell.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/site-shell.tsx)
- [src/components/theme-toggle.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/theme-toggle.tsx)

This section details the global layout architecture of KenMatch, specifically the `SiteShell` component, the navigation system, and the visual theming engine. The layout provides a persistent frame for the application, managing authentication state display, global navigation, and the ambient visual aesthetic.

## SiteShell Architecture

The `SiteShell`[src/components/site-shell.tsx#16-77](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/site-shell.tsx#L16-L77) is the primary layout wrapper for the entire application. It is instantiated within the `RootLayout`[src/app/layout.tsx#33-35](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/layout.tsx#L33-L35) and receives the current `viewer` session and a list of `featuredProfiles` to populate the header.

### Header Structure

The header is organized into a two-row grid [src/app/globals.css#111-117](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/globals.css#L111-L117) designed for density and clarity:

1. Brand and Utility Row:

- Brand: Contains the `KenMatchMark`[src/components/kenmatch-mark.tsx#1-19](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/kenmatch-mark.tsx#L1-L19) and the site title/tagline.
- Utility: Houses the `ThemeToggle`[src/components/theme-toggle.tsx#44-66](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/theme-toggle.tsx#L44-L66) and the `viewer-inline-card`[src/components/site-shell.tsx#34-44](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/site-shell.tsx#L34-L44)
2. Navigation and Profile Row:

- Navigation: A horizontal list of links defined in the `nav` constant [src/components/site-shell.tsx#8-14](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/site-shell.tsx#L8-L14)
- Profile Strip: Displays the first 5 featured profiles with their `attestationLevel`[src/components/site-shell.tsx#58-64](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/site-shell.tsx#L58-L64)

### Navigation Routes

The application uses a flat navigation structure:

- `/`: Overview and high-level metrics.
- `/kens`: The primary board for filtering and viewing Kens.
- `/submit`: The proposal intake portal.
- `/governance`: Attestation ladder and system logs.
- `/economics`: Funding, treasury, and revenue stream data.

### Component Relationship Diagram

Header and Navigation Data Flow

Sources:[src/app/layout.tsx#26-39](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/layout.tsx#L26-L39)[src/components/site-shell.tsx#8-77](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/site-shell.tsx#L8-L77)[src/lib/session.ts#1-30](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/session.ts#L1-L30)

---

## Viewer Identity and Credits

The `viewer-inline-card`[src/components/site-shell.tsx#34-44](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/site-shell.tsx#L34-L44) provides immediate feedback on the user's participation status and resource availability.

- Participation State: Displays a human-readable label via `labelForParticipationState`[src/components/site-shell.tsx#79-88](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/site-shell.tsx#L79-L88) indicating if the user is "Full participation", "Review-limited", or "Read-only".
- Voice Credits: Shows `availableCredits` vs `effectiveVoiceCredits`[src/components/site-shell.tsx#38](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/site-shell.tsx#L38-L38) This represents the user's remaining voting power in the quadratic allocation system.
- Authentication: If no viewer is present, a "Sign in" link to `/auth` is shown. If a viewer is present, a sign-out form triggers the `signOutAction`[src/app/actions.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts)

Sources:[src/components/site-shell.tsx#33-47](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/site-shell.tsx#L33-L47)[src/app/actions.ts#1-20](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L1-L20)

---

## Theming and Visual Identity

KenMatch implements a multi-mode theme system (Light, Dark, and OLED) using CSS variables and a small blocking script to prevent Flash of Unstyled Content (FOUC).

### Theme Implementation

The `ThemeToggle`[src/components/theme-toggle.tsx#44-66](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/theme-toggle.tsx#L44-L66) is a client-side component that updates the `data-theme` attribute on the `html` element.

- Storage: The selected theme is persisted in `localStorage` under the key `kenmatch-theme`[src/components/theme-toggle.tsx#41](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/theme-toggle.tsx#L41-L41)
- Boot Script: A `themeBootScript`[src/app/layout.tsx#16-24](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/layout.tsx#L16-L24) is injected into the document head to apply the correct theme before the first paint.

### CSS Variables and Modes

Themes are defined in `globals.css` using the `@theme` block and specific attribute selectors:

- Light (Default): Uses an ivory/cream background (`#f3efe7`) [src/app/globals.css#16](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/globals.css#L16-L16)
- Dark: Uses a deep navy/slate palette (`#091118`) [src/app/globals.css#32](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/globals.css#L32-L32)
- OLED: Uses pure black (`#000000`) for high-contrast displays [src/app/globals.css#55](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/globals.css#L55-L55)

### Ambient Backgrounds

The layout features "ambient" decorative elements:

- Two `div` elements with classes `ambient-a` and `ambient-b`[src/components/site-shell.tsx#19-20](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/site-shell.tsx#L19-L20) provide soft radial gradients that follow the theme's accent colors [src/app/globals.css#80-91](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/globals.css#L80-L91)

Code Entity to Theme Mapping

Sources:[src/app/globals.css#1-91](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/globals.css#L1-L91)[src/components/theme-toggle.tsx#1-66](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/theme-toggle.tsx#L1-L66)[src/app/layout.tsx#16-24](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/layout.tsx#L16-L24)

---

## Global Components

### KenMatchMark

The `KenMatchMark`[src/components/kenmatch-mark.tsx#1-19](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/kenmatch-mark.tsx#L1-L19) is the SVG brand asset. It uses a linear gradient defined by CSS variables (`--accent-strong`, `--accent-glow`, `--accent-warm`) to ensure the logo remains visually consistent across different themes [src/components/kenmatch-mark.tsx#5-9](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/kenmatch-mark.tsx#L5-L9)

### Footer

The `site-footer`[src/components/site-footer.tsx#69-75](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/site-footer.tsx#L69-L75) provides a summary of the KenMatch philosophy:

- Publicity: Emphasizes that Kens remain public through their entire lifecycle.
- Separation of Concerns: Explicitly states that "Voice stays separate from money," reinforcing the quadratic voting vs. funding model [src/components/site-shell.tsx#72](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/site-shell.tsx#L72-L72)

Sources:[src/components/kenmatch-mark.tsx#1-19](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/kenmatch-mark.tsx#L1-L19)[src/components/site-shell.tsx#69-75](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/site-shell.tsx#L69-L75)

---

# Task-Display-and-Interaction-Components

# Task Display and Interaction Components
Relevant source files

- [src/components/discussion-thread.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/discussion-thread.tsx)
- [src/components/ken-timing-strip.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/ken-timing-strip.tsx)
- [src/components/task-board-filters.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-board-filters.tsx)
- [src/components/task-card.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-card.tsx)
- [src/components/task-pulse-panel.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-pulse-panel.tsx)
- [src/components/vote-panel.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/vote-panel.tsx)

This section covers the React components responsible for rendering Kens (tasks) and facilitating user engagement through filtering, quadratic voting, public signaling, and threaded discussions. These components bridge the gap between the server-side data model and the interactive user interface.

## Component Overview and Data Flow

The following diagram illustrates how the core interaction components map to the system's data entities and server actions.

### Interaction Mapping: UI to Logic

Sources: [src/components/task-card.tsx#15-49](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-card.tsx#L15-L49)[src/components/task-board-filters.tsx#15-66](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-board-filters.tsx#L15-L66)[src/components/vote-panel.tsx#7-30](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/vote-panel.tsx#L7-L30)[src/components/task-pulse-panel.tsx#6-25](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-pulse-panel.tsx#L6-L25)[src/components/discussion-thread.tsx#6-138](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/discussion-thread.tsx#L6-L138)

---

## Task Listing and Filtering

### TaskCard

`TaskCard` is the primary unit of the Ken board. it consumes a `TaskSummary` object to display metadata including the allocated tier (lane), current stage, and high-level metrics [src/components/task-card.tsx#15-17](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-card.tsx#L15-L17)

- Tier Styling: Uses a `tierStyles` record to apply specific CSS classes (e.g., `is-months`, `is-weeks`) based on the task's `allocatedTier`[src/components/task-card.tsx#7-13](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-card.tsx#L7-L13)
- Metrics: Displays `totalVotes`, `taskPulseScore`, `discussionCount`, and `sponsorPoolUsd`[src/components/task-card.tsx#31-36](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-card.tsx#L31-L36)
- Visuals: Integrates the `KenTimingStrip` in a `compact` mode [src/components/task-card.tsx#30](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-card.tsx#L30-L30)

### TaskBoardFilters

`TaskBoardFilters` provides a client-side interface for searching and filtering the Ken board. It utilizes `useTransition` and `useDeferredValue` to ensure smooth UI updates while manipulating URL parameters [src/components/task-board-filters.tsx#15-23](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-board-filters.tsx#L15-L23)

- State Management: Tracks `query`, `category`, `tier`, and `stage` locally [src/components/task-board-filters.tsx#19-22](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-board-filters.tsx#L19-L22)
- URL Synchronization: The `buildTarget` helper function constructs a new URL with search parameters, which is then pushed via `router.replace` inside a transition [src/components/task-board-filters.tsx#6-13](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-board-filters.tsx#L6-L13)[src/components/task-board-filters.tsx#32-34](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-board-filters.tsx#L32-L34)
- Debouncing: `useDeferredValue` is applied to the search query to prevent excessive URL updates during rapid typing [src/components/task-board-filters.tsx#23](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-board-filters.tsx#L23-L23)

Sources: [src/components/task-card.tsx#1-50](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-card.tsx#L1-L50)[src/components/task-board-filters.tsx#1-78](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-board-filters.tsx#L1-L78)

---

## Engagement Panels

### VotePanel (Quadratic Allocation)

`VotePanel` implements the quadratic voting interface. It allows users to allocate "Voice Credits" to a specific Ken [src/components/vote-panel.tsx#10-26](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/vote-panel.tsx#L10-L26)

- Quadratic Calculation: It imports `quadraticCost` from `@/lib/allocation` to calculate the credit cost of the selected `voteCount`[src/components/vote-panel.tsx#8](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/vote-panel.tsx#L8-L8)[src/components/vote-panel.tsx#31](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/vote-panel.tsx#L31-L31)
- Real-time Feedback: Calculates the `delta` (difference between current and previous allocation) to show the user how many credits will be "Free after save" [src/components/vote-panel.tsx#32](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/vote-panel.tsx#L32-L32)[src/components/vote-panel.tsx#59](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/vote-panel.tsx#L59-L59)
- Form Submission: Uses `useActionState` with `saveVoteAction` to handle the mutation and `router.refresh()` to update the page upon success [src/components/vote-panel.tsx#30-36](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/vote-panel.tsx#L30-L36)

### TaskPulsePanel (Public Signaling)

`TaskPulsePanel` provides a lightweight upvote/downvote mechanism ("Pulse") that is distinct from the scarce quadratic voice credits [src/components/task-pulse-panel.tsx#8-24](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-pulse-panel.tsx#L8-L24)

- Binary Signaling: Users can toggle between an upvote (1), downvote (-1), or neutral (0) state [src/components/task-pulse-panel.tsx#40-41](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-pulse-panel.tsx#L40-L41)
- Action: Dispatches `saveTaskPulseAction`[src/components/task-pulse-panel.tsx#25](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-pulse-panel.tsx#L25-L25)

Sources: [src/components/vote-panel.tsx#1-98](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/vote-panel.tsx#L1-L98)[src/components/task-pulse-panel.tsx#1-67](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/task-pulse-panel.tsx#L1-L67)

---

## Discussion and Timing

### DiscussionThread

`DiscussionThread` manages threaded comments. It supports "Stake Credits," where commenters can attach a small amount of credits to their post to signal importance or commitment [src/components/discussion-thread.tsx#10-22](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/discussion-thread.tsx#L10-L22)

- Recursive Rendering: The `CommentNode` component renders itself recursively to support nested replies [src/components/discussion-thread.tsx#129-135](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/discussion-thread.tsx#L129-L135)
- Stake Selection: The `CommentComposer` includes a dropdown for selecting `stakeCredits` (1-3) [src/components/discussion-thread.tsx#67-74](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/discussion-thread.tsx#L67-L74)
- Comment Voting: Each comment has its own up/down voting logic via `saveCommentVoteAction`[src/components/discussion-thread.tsx#112-121](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/discussion-thread.tsx#L112-L121)

### KenTimingStrip

`KenTimingStrip` visualizes the temporal state of a Ken, including launch countdowns and compute progress [src/components/ken-timing-strip.tsx#4-33](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/ken-timing-strip.tsx#L4-L33)

- Progress Calculation: Uses `progressPercent` to determine the percentage of the execution window consumed based on `startedAt` and `expectedMaxEndAt`[src/components/ken-timing-strip.tsx#5](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/ken-timing-strip.tsx#L5-L5)
- Compute Metrics: Displays `computeHoursUsed` against the `runtimeHours` target [src/components/ken-timing-strip.tsx#23](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/ken-timing-strip.tsx#L23-L23)
- Human-readable Strings: Utilizes utility functions like `describeCountdown` and `formatHoursToHuman` for the UI [src/components/ken-timing-strip.tsx#17-19](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/ken-timing-strip.tsx#L17-L19)

### Component Hierarchy: Ken Detail Page

Sources: [src/components/discussion-thread.tsx#1-140](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/discussion-thread.tsx#L1-L140)[src/components/ken-timing-strip.tsx#1-45](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/ken-timing-strip.tsx#L1-L45)[src/components/vote-panel.tsx#8-31](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/vote-panel.tsx#L8-L31)

---

# Proposal-Form-and-Profile-Switcher

# Proposal Form and Profile Switcher
Relevant source files

- [src/app/submit/page.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/submit/page.tsx)
- [src/components/profile-switcher.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/profile-switcher.tsx)
- [src/components/proposal-form.tsx](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx)

This page covers the user interface and logic for submitting new Ken proposals and the infrastructure for switching between demo profiles. The primary component, `ProposalForm`, handles complex multi-field data entry with real-time tier selection and server-side validation feedback.

## Proposal Submission Flow

The Ken submission process is centralized in the `SubmitPage` route. This page acts as a gatekeeper, ensuring that only authenticated users can access the submission interface to maintain a "bond-backed accountability trail" [src/app/submit/page.tsx#25-26](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/submit/page.tsx#L25-L26)

### Submission Logic and Validation

The `ProposalForm` component utilizes the Next.js `useActionState` hook to manage form submissions through the `createProposalAction`[src/components/proposal-form.tsx#15](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L15-L15) This pattern allows the form to handle loading states (`isPending`) and display granular validation errors returned from the server-side Zod schema [src/components/proposal-form.tsx#17](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L17-L17)

Data Flow: Proposal Submission

Sources: [src/components/proposal-form.tsx#15-20](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L15-L20)[src/app/submit/page.tsx#20-28](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/submit/page.tsx#L20-L28)

## ProposalForm Implementation

The `ProposalForm`[src/components/proposal-form.tsx#14](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L14-L14) is a "use client" component that structures a large set of qualitative and quantitative fields required for a Ken to be considered for allocation.

### Tier Selection and Policy Guidance

A key feature of the form is the "Requested lane" selector. Users choose between `days`, `weeks`, or `months`[src/components/proposal-form.tsx#34-38](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L34-L38) This selection updates a local state `requestedTier`, which dynamically renders policy descriptions to the user:

TierDescription / Policy ContextDaysFast, focused Kens for narrow deliverables.WeeksMulti-stage Kens that need continuity and review.MonthsDeep Kens with repeated checkpoints and stronger release controls.

The bond required for the Ken is calculated automatically based on this lane selection [src/components/proposal-form.tsx#43](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L43-L43)

### Input Fields and Data Structures

The form utilizes a helper `Field` component [src/components/proposal-form.tsx#76](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L76-L76) to standardize the rendering of labels, inputs/textareas, and error messages. Several fields expect list-based input (one item per line), which are later processed by the server action:

- Deliverables: Specific outputs of the Ken [src/components/proposal-form.tsx#54](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L54-L54)
- Evaluation Checks: Criteria for success [src/components/proposal-form.tsx#55](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L55-L55)
- Risk Flags: Potential constraints or hazards [src/components/proposal-form.tsx#56](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L56-L56)
- Evidence Anchors: Links or data supporting the proposal [src/components/proposal-form.tsx#57](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L57-L57)

Sources: [src/components/proposal-form.tsx#8-12](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L8-L12)[src/components/proposal-form.tsx#40-44](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L40-L44)[src/components/proposal-form.tsx#76-85](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L76-L85)

## Profile Switcher

The `ProfileSwitcher` component [src/components/profile-switcher.tsx#1](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/profile-switcher.tsx#L1-L1) is a utility designed for demo environments. It is intended to be enabled by the `KENMATCH_ENABLE_DEMO_PROFILE_SWITCHER` environment variable to allow developers and reviewers to quickly toggle between different seed profiles (e.g., switching from a "Standard User" to a "High-Attestation Reviewer") to test different permission levels and participation policies.

Entity Association: UI to Code

Sources: [src/components/proposal-form.tsx#1-5](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L1-L5)[src/components/profile-switcher.tsx#1-3](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/profile-switcher.tsx#L1-L3)

## Data Flow: Form to Database

When the user clicks "Submit Ken for review" [src/components/proposal-form.tsx#67](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L67-L67) the following sequence occurs:

1. Client-Side Capture: The `formAction` triggers the server action with `FormData`[src/components/proposal-form.tsx#20](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L20-L20)
2. Server-Side Processing: `createProposalAction` receives the data, validates it against the `proposalSchema`, and transforms newline-separated textareas (like `deliverables`) into arrays [src/components/proposal-form.tsx#54-57](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L54-L57)
3. Persistence: The validated data is inserted into the `tasks` table in the libSQL database.
4. Feedback: The `ActionState` is returned to the client. If successful, `state.status` is set to "success" and a message is displayed in teal [src/components/proposal-form.tsx#71](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L71-L71) If validation fails, `fieldErrors` are mapped back to the specific `Field` components [src/components/proposal-form.tsx#17](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L17-L17)

Sources: [src/components/proposal-form.tsx#15-17](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L15-L17)[src/components/proposal-form.tsx#71-72](https://github.com/lowestprime/KenMatch/blob/8218181e/src/components/proposal-form.tsx#L71-L72)

---

# Deployment-and-Infrastructure

# Deployment and Infrastructure
Relevant source files

- [Dockerfile](https://github.com/lowestprime/KenMatch/blob/8218181e/Dockerfile)
- [docker-compose.synology.yml](https://github.com/lowestprime/KenMatch/blob/8218181e/docker-compose.synology.yml)
- [next.config.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts)

This section provides a high-level overview of how KenMatch is built, containerized, and deployed. The system is designed to be highly portable, leveraging a standalone Next.js build that can run in any environment supporting Node.js 22 or Docker.

### System Build and Containerization

KenMatch uses a multi-stage Docker build process to ensure a small, secure production image. The build pipeline transforms the TypeScript source into a standalone Node.js server that does not require the full `node_modules` directory at runtime.

Build Pipeline Overview:

1. Dependency Phase: Installs production and development dependencies using `npm ci`[Dockerfile#1-4](https://github.com/lowestprime/KenMatch/blob/8218181e/Dockerfile#L1-L4)
2. Builder Phase: Compiles the application and generates the standalone output [Dockerfile#6-10](https://github.com/lowestprime/KenMatch/blob/8218181e/Dockerfile#L6-L10)
3. Runner Phase: A minimal Alpine-based image that copies only the necessary build artifacts and exposes port 3000 [Dockerfile#12-26](https://github.com/lowestprime/KenMatch/blob/8218181e/Dockerfile#L12-L26)

The application persists data to a local libSQL/SQLite database stored in a dedicated `/app/data` volume [Dockerfile#22](https://github.com/lowestprime/KenMatch/blob/8218181e/Dockerfile#L22-L22)

For details on the build stages and volume configuration, see [Docker Build and Container Configuration](#6.1).

### Infrastructure and Self-Hosting

KenMatch is optimized for self-hosting on consumer hardware, specifically Synology NAS devices using the Synology Container Manager. The deployment is managed via a specialized Docker Compose configuration that handles environment variables, volume mapping for persistence, and automated health monitoring.

Key Deployment Components:

- Health Monitoring: A health check loop monitors the `/api/health` endpoint to ensure the service is responsive [docker-compose.synology.yml#19-24](https://github.com/lowestprime/KenMatch/blob/8218181e/docker-compose.synology.yml#L19-L24)
- Persistence: Local mapping of `./data` to the container's `/app/data` directory ensures database continuity across restarts [docker-compose.synology.yml#18](https://github.com/lowestprime/KenMatch/blob/8218181e/docker-compose.synology.yml#L18-L18)
- Networking: Configured to bind to `0.0.0.0` on port 3000 for internal network accessibility [docker-compose.synology.yml#15-16](https://github.com/lowestprime/KenMatch/blob/8218181e/docker-compose.synology.yml#L15-L16)

For a step-by-step guide on NAS setup and SSL configuration, see [Synology NAS Self-Hosting Guide](#6.2).

### Application Configuration and Security

The application runtime is governed by `next.config.ts`, which enforces strict security headers and optimizes the server for production workloads.

Security and Runtime Constraints:

- Security Headers: Implements a strict `Content-Security-Policy` (CSP), disables camera/mic access via `Permissions-Policy`, and prevents clickjacking with `X-Frame-Options: DENY`[next.config.ts#5-26](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L5-L26)
- Resource Limits: Limits Server Action payloads to 2MB to prevent large-scale data injection [next.config.ts#34](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L34-L34)
- Deployment Tracking: Uses the `DEPLOYMENT_VERSION` environment variable as a `deploymentId` for cache busting and version tracking [next.config.ts#31](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L31-L31)

For details on security header implementation and Next.js optimization, see [Next.js Configuration and Security Headers](#6.3).

---

### Deployment Architecture: From Code to Container

The following diagram illustrates how the build artifacts are mapped from the repository structure into the final production container.

Build-to-Container Mapping

Sources:[Dockerfile#1-26](https://github.com/lowestprime/KenMatch/blob/8218181e/Dockerfile#L1-L26)[next.config.ts#28-48](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L28-L48)[docker-compose.synology.yml#1-24](https://github.com/lowestprime/KenMatch/blob/8218181e/docker-compose.synology.yml#L1-L24)

### Environment and Network Configuration

The following diagram maps the network flow from the external client through the infrastructure layers to the internal application entities.

Network and Infrastructure Flow

Sources:[docker-compose.synology.yml#19-24](https://github.com/lowestprime/KenMatch/blob/8218181e/docker-compose.synology.yml#L19-L24)[next.config.ts#5-26](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L5-L26)[Dockerfile#24-25](https://github.com/lowestprime/KenMatch/blob/8218181e/Dockerfile#L24-L25)

---

Sources:

- `Dockerfile:1-26`
- `next.config.ts:5-48`
- `docker-compose.synology.yml:1-24`

---

# Docker-Build-and-Container-Configuration

# Docker Build and Container Configuration
Relevant source files

- [.dockerignore](https://github.com/lowestprime/KenMatch/blob/8218181e/.dockerignore)
- [Dockerfile](https://github.com/lowestprime/KenMatch/blob/8218181e/Dockerfile)
- [docker-compose.synology.yml](https://github.com/lowestprime/KenMatch/blob/8218181e/docker-compose.synology.yml)

This page describes the containerization strategy for KenMatch, focusing on the multi-stage Docker build process, the standalone Next.js deployment mode, and the persistence configuration required for libSQL/SQLite.

## Purpose and Scope

KenMatch is designed to be deployed as a self-contained Docker container. The architecture prioritizes a small image footprint and efficient resource utilization, specifically optimized for environments like Synology NAS or standard cloud VPS providers. The container handles its own persistence via a local volume mount for the database and exposes a standard web interface on port 3000.

## Multi-Stage Build Pipeline

The `Dockerfile` utilizes a three-stage build process based on the `node:22-alpine` image to minimize the final image size and ensure a clean production environment.

### 1. Dependencies Stage (`deps`)

The first stage focuses on installing the project dependencies. It copies `package.json` and `package-lock.json` and executes `npm ci` to ensure a reproducible dependency tree [Dockerfile#1-5](https://github.com/lowestprime/KenMatch/blob/8218181e/Dockerfile#L1-L5)

### 2. Builder Stage (`builder`)

The builder stage inherits the `node_modules` from the `deps` stage and copies the entire source code [Dockerfile#6-9](https://github.com/lowestprime/KenMatch/blob/8218181e/Dockerfile#L6-L9) It then executes `npm run build`[Dockerfile#10](https://github.com/lowestprime/KenMatch/blob/8218181e/Dockerfile#L10-L10) This trigger invokes the Next.js build process, which is configured for `standalone` output mode.

### 3. Runner Stage (`runner`)

The final stage is the production environment. Instead of copying the entire project, it only copies the minimal assets required for execution [Dockerfile#12-20](https://github.com/lowestprime/KenMatch/blob/8218181e/Dockerfile#L12-L20):

- The `.next/standalone` directory (which contains the server-side code and necessary node_modules).
- The `.next/static` directory for client-side assets.
- The `public` directory for static files.

Build Pipeline Flow

Title: KenMatch Docker Build Stages

Sources: [Dockerfile#1-26](https://github.com/lowestprime/KenMatch/blob/8218181e/Dockerfile#L1-L26)

## Network and Environment Configuration

The container is configured to listen on all network interfaces to ensure accessibility from the host machine and reverse proxies.

- Host/Port: The environment variables `HOSTNAME=0.0.0.0` and `PORT=3000` are set within the Dockerfile [Dockerfile#15-16](https://github.com/lowestprime/KenMatch/blob/8218181e/Dockerfile#L15-L16) and reinforced in the compose configuration [docker-compose.synology.yml#15-16](https://github.com/lowestprime/KenMatch/blob/8218181e/docker-compose.synology.yml#L15-L16)
- Production Mode: `NODE_ENV` is explicitly set to `production` to enable Next.js production optimizations [Dockerfile#14](https://github.com/lowestprime/KenMatch/blob/8218181e/Dockerfile#L14-L14)
- Exposition: The container exposes port `3000`[Dockerfile#24](https://github.com/lowestprime/KenMatch/blob/8218181e/Dockerfile#L24-L24) which is typically mapped to the same port on the host [docker-compose.synology.yml#10](https://github.com/lowestprime/KenMatch/blob/8218181e/docker-compose.synology.yml#L10-L10)

Sources: [Dockerfile#12-26](https://github.com/lowestprime/KenMatch/blob/8218181e/Dockerfile#L12-L26)[docker-compose.synology.yml#1-16](https://github.com/lowestprime/KenMatch/blob/8218181e/docker-compose.synology.yml#L1-L16)

## Data Persistence and Volumes

KenMatch uses libSQL (SQLite) for persistence. Because the database is stored in a file, the container must provide a persistent location that survives container restarts and image updates.

### The /app/data Directory

The Dockerfile explicitly creates a directory at `/app/data`[Dockerfile#22](https://github.com/lowestprime/KenMatch/blob/8218181e/Dockerfile#L22-L22) This is the intended location for the SQLite database file (e.g., `kenmatch.db`).

### Volume Mapping

In the deployment configuration, a host directory is mapped to this internal path:

- Source: `./data` on the host machine.
- Destination: `/app/data` inside the container [docker-compose.synology.yml#18](https://github.com/lowestprime/KenMatch/blob/8218181e/docker-compose.synology.yml#L18-L18)

Entity Mapping: Filesystem to Code

Title: Database Persistence Mapping

Sources: [Dockerfile#22](https://github.com/lowestprime/KenMatch/blob/8218181e/Dockerfile#L22-L22)[docker-compose.synology.yml#17-18](https://github.com/lowestprime/KenMatch/blob/8218181e/docker-compose.synology.yml#L17-L18)

## Build Exclusion Patterns

The `.dockerignore` file ensures that unnecessary files and sensitive data are not included in the Docker build context, which speeds up the build and improves security.

PatternPurpose`.env`Prevents local secrets from being baked into the image [.dockerignore#3](https://github.com/lowestprime/KenMatch/blob/8218181e/.dockerignore#L3-L3)`node_modules`Prevents local OS-specific binaries from conflicting with Alpine binaries [.dockerignore#5](https://github.com/lowestprime/KenMatch/blob/8218181e/.dockerignore#L5-L5)`.next`Ensures a fresh build inside the container rather than using local cache [.dockerignore#6](https://github.com/lowestprime/KenMatch/blob/8218181e/.dockerignore#L6-L6)`data`Prevents the local database file from being included in the image [.dockerignore#7](https://github.com/lowestprime/KenMatch/blob/8218181e/.dockerignore#L7-L7)`@eaDir`, `#recycle`Excludes Synology-specific metadata and trash folders often found in NAS environments [.dockerignore#8-10](https://github.com/lowestprime/KenMatch/blob/8218181e/.dockerignore#L8-L10)

Sources: [.dockerignore#1-11](https://github.com/lowestprime/KenMatch/blob/8218181e/.dockerignore#L1-L11)

## Health Checks and Init

To ensure high availability, the container configuration includes:

- Init System: The `init: true` flag is used in the compose file to ensure proper signal handling (e.g., SIGTERM) for the Node.js process [docker-compose.synology.yml#7](https://github.com/lowestprime/KenMatch/blob/8218181e/docker-compose.synology.yml#L7-L7)
- Healthcheck: A health check executes every 30 seconds using `wget` against the `/api/health` endpoint [docker-compose.synology.yml#19-24](https://github.com/lowestprime/KenMatch/blob/8218181e/docker-compose.synology.yml#L19-L24) If the endpoint fails to respond with a success code after 5 retries, the container is marked as unhealthy.

Sources: [docker-compose.synology.yml#7-24](https://github.com/lowestprime/KenMatch/blob/8218181e/docker-compose.synology.yml#L7-L24)

---

# Synology-NAS-Self-Hosting-Guide

# Synology NAS Self-Hosting Guide
Relevant source files

- [docker-compose.synology.yml](https://github.com/lowestprime/KenMatch/blob/8218181e/docker-compose.synology.yml)
- [docs/synology-nas-deploy.md](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/synology-nas-deploy.md)
- [src/lib/env.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/env.ts)

This page provides a technical overview of deploying KenMatch on a Synology NAS running DSM 7.2+ with Container Manager. The deployment utilizes a standalone Next.js build, a persistent local libSQL database, and Synology's native Reverse Proxy for SSL termination.

## Deployment Architecture

The Synology deployment is designed to be self-contained. It leverages a multi-stage Docker build to produce a minimal runner image that executes the `server.js` entry point. Persistence is achieved through a volume mount that maps the NAS file system to the container's internal data directory.

### System Data Flow and Component Mapping

The following diagram illustrates how the Synology infrastructure interacts with the KenMatch codebase entities.

Synology Deployment Component Map

Sources: [docker-compose.synology.yml#1-24](https://github.com/lowestprime/KenMatch/blob/8218181e/docker-compose.synology.yml#L1-L24)[docs/synology-nas-deploy.md#1-10](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/synology-nas-deploy.md#L1-L10)[src/lib/env.ts#25-34](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/env.ts#L25-L34)

## Configuration and Environment

KenMatch uses a Zod-validated environment schema to manage configuration. For Synology deployments, the `DEPLOYMENT_VERSION` is typically set to `nas-demo` to identify the instance.

### Key Environment Variables

The application behavior is controlled via the `.env` file located in the project root.

VariableDefault / RecommendedPurpose`DATABASE_URL``""` (Empty)If empty, the app defaults to local libSQL mode.`KENMATCH_DB_FILE``/app/data/kenmatch.sqlite`Path to the SQLite file inside the container.`KENMATCH_SESSION_COOKIE``kenmatch-session`Name of the session cookie.`KENMATCH_ALLOW_SIGNUPS``true`Enables/disables the registration flow.`NODE_ENV``production`Ensures Next.js optimizations are active.

Sources: [src/lib/env.ts#25-36](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/env.ts#L25-L36)[docs/synology-nas-deploy.md#52-60](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/synology-nas-deploy.md#L52-L60)

## Docker Compose and Persistence

The `docker-compose.synology.yml` file defines the service structure. It ensures the container restarts automatically and maintains a healthy state through a recursive check.

### Volume Mapping

Persistence is handled by mapping a local NAS folder to the container:
`./data:/app/data`[docker-compose.synology.yml#18](https://github.com/lowestprime/KenMatch/blob/8218181e/docker-compose.synology.yml#L18-L18)
This ensures that `kenmatch.sqlite` survives container recreations and image updates.

### Health Check Implementation

The container includes a health check that polls the internal API every 30 seconds.

Health Check Logic Flow

Sources: [docker-compose.synology.yml#19-23](https://github.com/lowestprime/KenMatch/blob/8218181e/docker-compose.synology.yml#L19-L23)[docs/synology-nas-deploy.md#79-87](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/synology-nas-deploy.md#L79-L87)

## Networking and Security

### Reverse Proxy Setup

Synology DSM provides a built-in Nginx-based reverse proxy. The recommended configuration maps a public HTTPS hostname (e.g., `kenmatch.example.com`) to the container's internal port `3000` on `127.0.0.1`[docs/synology-nas-deploy.md#157-168](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/synology-nas-deploy.md#L157-L168)

### SSL/TLS

SSL is managed via DSM's Certificate Manager. Users should:

1. Generate a Let's Encrypt certificate for the specific hostname.
2. Assign the certificate to the Reverse Proxy entry in Login Portal > Advanced > Custom Certificate[docs/synology-nas-deploy.md#170-182](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/synology-nas-deploy.md#L170-L182)

## Maintenance and Upgrades

### Database Modes

KenMatch supports two libSQL operational modes on Synology:

1. Local Mode: `DATABASE_URL` is left empty. The app uses the file specified in `KENMATCH_DB_FILE`[docs/synology-nas-deploy.md#62-67](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/synology-nas-deploy.md#L62-L67)
2. Remote Mode: `DATABASE_URL` and `DATABASE_AUTH_TOKEN` are provided. The app connects to a remote Turso/libSQL instance, bypassing the local volume for data [docs/synology-nas-deploy.md#142-152](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/synology-nas-deploy.md#L142-L152)

### Upgrade Workflow

To upgrade the instance, the following sequence is executed via SSH or Container Manager:

1. `git pull`: Fetch latest source code.
2. `docker compose -f docker-compose.synology.yml up -d --build`: Rebuild the multi-stage image and recreate the container [docs/synology-nas-deploy.md#196-202](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/synology-nas-deploy.md#L196-L202)

The build process uses the `Dockerfile` to re-run `npm install` and `next build`, ensuring the `standalone` output is updated before the runner stage swaps the containers [docs/synology-nas-deploy.md#1-7](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/synology-nas-deploy.md#L1-L7)

Sources: [docs/synology-nas-deploy.md#194-210](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/synology-nas-deploy.md#L194-L210)[docker-compose.synology.yml#1-8](https://github.com/lowestprime/KenMatch/blob/8218181e/docker-compose.synology.yml#L1-L8)

---

# Next.js-Configuration-and-Security-Headers

# Next.js Configuration and Security Headers
Relevant source files

- [eslint.config.mjs](https://github.com/lowestprime/KenMatch/blob/8218181e/eslint.config.mjs)
- [next.config.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts)
- [postcss.config.mjs](https://github.com/lowestprime/KenMatch/blob/8218181e/postcss.config.mjs)
- [tsconfig.json](https://github.com/lowestprime/KenMatch/blob/8218181e/tsconfig.json)

This page details the build-time and runtime configuration for the KenMatch application. It covers the Next.js framework settings, security hardening through HTTP headers, and the secondary configuration files for TypeScript, ESLint, and PostCSS.

## Next.js Framework Configuration

The application uses `next.config.ts` to define the runtime environment and build behavior. The configuration is optimized for containerized deployment and security.

### Build and Deployment Settings

- Standalone Output: The `output: "standalone"` setting is enabled to automatically leverage the Next.js standalone build feature, which creates a minimal `node_modules` subset for production deployment [next.config.ts#30](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L30-L30)
- Deployment ID: The `deploymentId` is sourced from the `DEPLOYMENT_VERSION` environment variable, allowing for cache busting across different deployment instances [next.config.ts#31](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L31-L31)
- Powered By Header: The `x-powered-by` header is disabled to reduce information disclosure about the underlying technology stack [next.config.ts#29](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L29-L29)

### Experimental and Performance Features

- Server Actions: A custom `bodySizeLimit` of `2mb` is configured for Server Actions to accommodate detailed Ken proposals and comment data [next.config.ts#32-35](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L32-L35)
- Turbopack: The root of the Turbopack configuration is explicitly set to the current working directory [next.config.ts#37-39](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L37-L39)

### Configuration Logic Flow

The following diagram illustrates how environment variables and static settings are processed into the final `nextConfig` object.

Diagram: Next.js Configuration Initialization

Sources: [next.config.ts#1-50](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L1-L50)

## Security Headers

KenMatch implements a strict security posture by applying a comprehensive set of HTTP headers to all application routes via the `headers()` async function [next.config.ts#40-47](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L40-L47)

### Header Specifications

HeaderValuePurpose`X-Content-Type-Options``nosniff`Prevents the browser from MIME-sniffing a response away from the declared content-type [next.config.ts#6](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L6-L6)`Referrer-Policy``strict-origin-when-cross-origin`Protects privacy by only sending full URLs for same-origin requests [next.config.ts#7](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L7-L7)`X-Frame-Options``DENY`Prevents clickjacking by forbidding the site from being rendered in an iFrame [next.config.ts#8](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L8-L8)`Permissions-Policy``camera=(), microphone=(), geolocation=()`Explicitly disables access to sensitive hardware and location APIs [next.config.ts#9](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L9-L9)`Content-Security-Policy`Variable (see below)Restricts resource loading to trusted sources [next.config.ts#10-25](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L10-L25)

### Content Security Policy (CSP) Implementation

The CSP is dynamically generated based on the environment. In development, `unsafe-eval` is permitted to support Next.js Fast Refresh, while production remains strictly locked down [next.config.ts#16](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L16-L16)

- Script Sources: Restricted to `'self'` and `'unsafe-inline'` (for Next.js hydration) [next.config.ts#16](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L16-L16)
- Frame Ancestors: Set to `'none'` to reinforce the `X-Frame-Options: DENY` policy [next.config.ts#19](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L19-L19)
- Object Sources: Set to `'none'` to prevent legacy plugin exploits [next.config.ts#22](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L22-L22)
- Upgrade Insecure Requests: Forces all traffic over HTTPS [next.config.ts#23](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L23-L23)

Diagram: Security Header Application

Sources: [next.config.ts#5-26](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L5-L26)[next.config.ts#40-47](https://github.com/lowestprime/KenMatch/blob/8218181e/next.config.ts#L40-L47)

## Supporting Tooling Configuration

The repository includes several configuration files that define the development environment, linting standards, and CSS processing.

### TypeScript Configuration (`tsconfig.json`)

The project uses `ES2022` as the target and `ESNext` for modules [tsconfig.json#3-14](https://github.com/lowestprime/KenMatch/blob/8218181e/tsconfig.json#L3-L14)

- Path Aliases: The `@/*` alias is mapped to `./src/*` for cleaner imports [tsconfig.json#27-31](https://github.com/lowestprime/KenMatch/blob/8218181e/tsconfig.json#L27-L31)
- Strict Mode: `strict: true` is enabled to ensure type safety across the domain model and server actions [tsconfig.json#11](https://github.com/lowestprime/KenMatch/blob/8218181e/tsconfig.json#L11-L11)
- Module Resolution: Uses the `Bundler` strategy to align with modern toolchains [tsconfig.json#15](https://github.com/lowestprime/KenMatch/blob/8218181e/tsconfig.json#L15-L15)

### ESLint and PostCSS

- ESLint: The project extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` to enforce best practices for Next.js and TypeScript [eslint.config.mjs#1-4](https://github.com/lowestprime/KenMatch/blob/8218181e/eslint.config.mjs#L1-L4)
- PostCSS: Configured to use `@tailwindcss/postcss` for processing the utility-first CSS framework [postcss.config.mjs#1-5](https://github.com/lowestprime/KenMatch/blob/8218181e/postcss.config.mjs#L1-L5)

Sources: [tsconfig.json#1-43](https://github.com/lowestprime/KenMatch/blob/8218181e/tsconfig.json#L1-L43)[eslint.config.mjs#1-6](https://github.com/lowestprime/KenMatch/blob/8218181e/eslint.config.mjs#L1-L6)[postcss.config.mjs#1-7](https://github.com/lowestprime/KenMatch/blob/8218181e/postcss.config.mjs#L1-L7)

---

# Testing

# Testing
Relevant source files

- [src/lib/allocation.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts)
- [src/lib/attestation.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts)
- [src/lib/economics.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts)
- [tests/allocation.test.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/allocation.test.ts)
- [tests/attestation.test.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/attestation.test.ts)
- [tests/economics.test.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/economics.test.ts)

KenMatch utilizes a focused testing strategy centered on pure-function unit tests for core business logic. By isolating the complex rules governing quadratic voting, identity-based participation, and treasury economics from the side-effect-heavy UI and database layers, the system ensures that the "engine" of the platform remains mathematically and logically sound.

The test suite is built using the native Node.js test runner (`node:test`) and assertion library (`node:assert/strict`), requiring no external heavy dependencies like Jest or Vitest.

### Testing Philosophy: Pure Logic Isolation

The codebase distinguishes between Orchestration (Server Actions, UI) and Logic (Lib functions). Testing efforts are concentrated on the `src/lib/` directory because these functions are:

1. Deterministic: Given the same input, they always produce the same output.
2. Stateless: They do not query the database or read cookies directly.
3. Critical: They define the rules for how AI compute is allocated and how money is tracked.

### Core Test Files

The `tests/` directory contains three primary test files, each corresponding to a major business logic library.

#### 1. Allocation Logic (`tests/allocation.test.ts`)

This file validates the implementation of Quadratic Voting (QV) and the ranking pipeline that determines which Kens (tasks) receive compute resources.

Key Coverage:

- Quadratic Cost Calculation: Ensures `quadraticCost` correctly implements $cost = votes^2$ [src/lib/allocation.ts#5-11](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L5-L11)
- Credit Aggregation: Validates that `spentCredits` accurately sums the quadratic costs of multiple task allocations [src/lib/allocation.ts#115-117](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L115-L117)
- Tier Assignment: Verifies that `tierForRank` maps ranks to the correct lanes (Months, Weeks, Days) [src/lib/allocation.ts#33-55](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L33-L55)
- Ranking Pipeline: Tests `buildCategoryRankings`, ensuring that ineligible tasks (e.g., those in `review` stage or with `blocked` safety status) are excluded from the ladder regardless of their vote count [src/lib/allocation.ts#72-113](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L72-L113)

Data Flow: Ranking and Allocation

ComponentCode EntityRoleInput Data`RankingSeed`Interface for task metadata needed for ranking [src/lib/allocation.ts#57-65](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L57-L65)Filter/Sort`buildCategoryRankings`Groups tasks by category and sorts by votes/date [src/lib/allocation.ts#72-113](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L72-L113)Logic Gate`isEligibleForAllocation`Predicate checking `TaskStage` and `SafetyStatus`[src/lib/allocation.ts#17-31](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L17-L31)Output State`RankingResult`Contains the assigned `rank` and `AllocationTier`[src/lib/allocation.ts#67-70](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L67-L70)

Sources: [src/lib/allocation.ts#1-132](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L1-L132)[tests/allocation.test.ts#1-38](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/allocation.test.ts#L1-L38)

#### 2. Attestation Policy (`tests/attestation.test.ts`)

This suite tests the "Attestation Ladder," which dynamically adjusts a user's permissions and voting power based on their identity verification status and Sybil risk.

Key Coverage:

- Voice Multipliers: Validates that `resolveParticipationPolicy` applies the correct multipliers (e.g., 0.8 for medium risk, 1.0 for verified low risk) [src/lib/attestation.ts#14-70](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L14-L70)
- Capability Flags: Ensures that `read-only` states correctly disable `canSubmit`, `canComment`, and `canAllocateVoice`[src/lib/attestation.ts#19-30](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L19-L30)
- Floor Logic: Confirms that `effectiveVoiceCredits` never drops below 1 for accounts that are not in a `read-only` state [src/lib/attestation.ts#38-52](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L38-L52)

Mapping: Attestation Status to Code Capabilities

Sources: [src/lib/attestation.ts#1-71](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L1-L71)[tests/attestation.test.ts#1-33](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/attestation.test.ts#L1-L33)

#### 3. Economics and Treasury (`tests/economics.test.ts`)

This suite ensures the financial integrity of the platform by testing revenue splits and treasury runway calculations.

Key Coverage:

- Revenue Splits: Validates `summarizeRevenueStream` correctly calculates the `treasuryMonthlyUsd` and `founderMonthlyUsd` based on percentage shares [src/lib/economics.ts#3-12](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L3-L12)
- Treasury Reconciliation: Tests `summarizeEconomics` to ensure it correctly filters `TreasuryEntryRecord` items by the `compute-treasury` bucket and sums inflows/outflows [src/lib/economics.ts#14-49](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L14-L49)
- Runway Calculation: Verifies `coverageMonths` logic (Treasury Balance / Public Burn) [src/lib/economics.ts#30](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L30-L30)
- Restricted Funding: Confirms that entries with "restricted" in the title or description are correctly aggregated into `restrictedFundingUsd`[src/lib/economics.ts#31-33](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L31-L33)

Economic Data Aggregation

Sources: [src/lib/economics.ts#1-50](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L1-L50)[tests/economics.test.ts#1-123](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/economics.test.ts#L1-L123)

### How to Run Tests

Tests are executed directly using the Node.js binary. Because the project uses TypeScript, the tests are typically run via a loader or after compilation.

Standard Command:

```
node --test tests/*.test.ts
```

Testing Workflow:

1. Modify Logic: Change a function in `src/lib/allocation.ts`.
2. Run Test: Execute the corresponding test in `tests/allocation.test.ts`.
3. Assert: The `node:assert/strict` module provides deep equality checks (`assert.deepEqual`) and strict type comparisons, ensuring the logic behaves as expected.

### Summary Table: Test Coverage

FileLibrary TargetKey Functions Tested`allocation.test.ts``allocation.ts``quadraticCost`, `buildCategoryRankings`, `tierForRank``attestation.test.ts``attestation.ts``resolveParticipationPolicy``economics.test.ts``economics.ts``summarizeRevenueStream`, `summarizeEconomics`

Sources: [tests/allocation.test.ts#1-4](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/allocation.test.ts#L1-L4)[tests/attestation.test.ts#1-4](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/attestation.test.ts#L1-L4)[tests/economics.test.ts#1-4](https://github.com/lowestprime/KenMatch/blob/8218181e/tests/economics.test.ts#L1-L4)

---

# Glossary

# Glossary
Relevant source files

- [README.md](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md)
- [docs/architecture.md](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md)
- [src/app/actions.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts)
- [src/lib/allocation.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts)
- [src/lib/attestation.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts)
- [src/lib/db.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts)
- [src/lib/economics.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts)
- [src/lib/types.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts)

This page defines the fundamental domain concepts, technical terms, and architectural entities used throughout the KenMatch codebase. It serves as a reference for onboarding engineers to map business requirements (e.g., "Quadratic Voting") to specific implementation files and functions.

## Core Domain Concepts

The following terms represent the primary entities and rules governing the KenMatch platform.

### Ken (Task)

A Ken is the primary unit of work in the system. It represents a proposed long-horizon AI task that requires sustained computation. In the database and older parts of the code, this is often referred to as a `task`[docs/architecture.md#43](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L43-L43)

- Implementation: Defined by the `TaskRecord` interface [src/lib/types.ts#105-126](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L105-L126) and stored in the `tasks` table [src/lib/db.ts#257-285](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L257-L285)
- Stages: A Ken progresses through several stages: `review`, `voting`, `scheduled`, `running`, `shipped`, and `blocked`[src/lib/types.ts#7-8](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L7-L8)

### Voice Credits & Quadratic Voting

Voice Credits are the scarce resource allocated to contributors to express the intensity of their preference for specific Kens [README.md#18](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L18-L18) KenMatch uses Quadratic Voting to ensure that the cost of concentrating influence on a single task increases exponentially.

- Cost Formula: The cost in credits is the square of the votes assigned: $Cost = Votes^2$ [src/lib/allocation.ts#5-11](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L5-L11)
- Limit: Users are restricted to a maximum of 6 votes per task (`MAX_VOTES_PER_TASK`) [src/lib/allocation.ts#3](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L3-L3)
- Logic: Handled in `src/lib/allocation.ts`[src/lib/allocation.ts#1-132](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L1-L132)

### Lanes (Allocation Tiers)

Lanes represent the duration of sustained agentic effort assigned to a Ken based on its ranking within a category [README.md#87-95](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L87-L95)

- Months: Top 3 projects [src/lib/allocation.ts#42-44](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L42-L44)
- Weeks: Projects ranked 4-10 [src/lib/allocation.ts#46-48](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L46-L48)
- Days: Projects ranked 11-100 [src/lib/allocation.ts#50-52](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L50-L52)
- Queued/Blocked: Projects that do not meet the ranking or safety criteria [src/lib/allocation.ts#54-55](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L54-L55)

### Pulse

A Pulse is a "fast signal" (simple upvote or downvote) used for public sentiment, distinct from the "scarce voice" of quadratic credits [README.md#15-17](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L15-L17)

- Implementation: Stored in the `task_pulse_votes` table [src/lib/db.ts#311-317](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L311-L317) and validated via `pulseSchema`[src/app/actions.ts#52-56](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L52-L56)

### Attestation & Participation Policy

The system evaluates a user's identity and risk profile to determine their level of access.

- Participation States:`full`, `review-limited`, and `read-only`[src/lib/types.ts#46-47](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L46-L47)
- Resolution: The `resolveParticipationPolicy` function maps `AttestationStatus` and `SybilRiskBand` to specific boolean capabilities like `canSubmit` or `canAllocateVoice`[src/lib/attestation.ts#14-70](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L14-L70)

Sources:[README.md#1-97](https://github.com/lowestprime/KenMatch/blob/8218181e/README.md#L1-L97)[src/lib/types.ts#1-126](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L1-L126)[src/lib/allocation.ts#1-132](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/allocation.ts#L1-L132)[src/lib/attestation.ts#1-70](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/attestation.ts#L1-L70)

---

## System Architecture Mapping

The following diagram bridges the gap between the high-level system concepts and the actual code entities.

### Logic Flow: From User Action to Persistence

"This diagram illustrates how a user's intent (e.g., voting) flows through the Next.js Server Action layer into the Business Logic and finally the Database."

Sources:[src/app/actions.ts#1-212](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/actions.ts#L1-L212)[src/lib/db.ts#1-204](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L1-L204)[docs/architecture.md#1-118](https://github.com/lowestprime/KenMatch/blob/8218181e/docs/architecture.md#L1-L118)

---

## Technical Glossary

TermDefinitionCode PointerActionStateStandardized response type for Server Actions containing status and field errors.[src/app/action-state.ts](https://github.com/lowestprime/KenMatch/blob/8218181e/src/app/action-state.ts)libSQLThe database client used for local SQLite or remote Turso persistence.[src/lib/db.ts#14-17](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L14-L17)HydrationThe process of bulk-loading and calculating derived state (like rankings) into memory.[src/lib/db.ts#404-450](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L404-L450)Sybil RiskA categorization (`low`, `medium`, `high`) used to mitigate identity duplication attacks.[src/lib/types.ts#43-44](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L43-L44)Treasury ShareThe percentage of revenue from a stream routed to the public compute pool.[src/lib/economics.ts#4-5](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L4-L5)Checkpoint GateA governance mechanism requiring specific approval scores before releasing compute.[src/lib/types.ts#215-220](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L215-L220)

### Data Model Entity Relationships

"This diagram maps the core database tables and their relationships as defined in the `initializeDatabase` function."

Sources:[src/lib/db.ts#204-380](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/db.ts#L204-L380)[src/lib/types.ts#55-255](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L55-L255)

---

## Economic Terms

### Revenue Engine

The mechanism by which a Ken or the platform generates value. Engines include `enterprise`, `data-licensing`, `compute-arbitrage`, and `sponsorship`[src/lib/types.ts#25-26](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L25-L26)

### Coverage Months

A derived metric calculated by `summarizeEconomics` representing the runway of the treasury balance relative to the current monthly public burn rate [src/lib/economics.ts#30](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L30-L30)

### Restricted Funding

Inflows marked specifically for a single Ken or purpose, detected by searching for "restricted" in the entry title or description [src/lib/economics.ts#31-33](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L31-L33)

Sources:[src/lib/economics.ts#1-49](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/economics.ts#L1-L49)[src/lib/types.ts#232-255](https://github.com/lowestprime/KenMatch/blob/8218181e/src/lib/types.ts#L232-L255)