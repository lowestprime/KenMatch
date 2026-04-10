import "server-only";

import {
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual } from "node:crypto";
import { existsSync,
  mkdirSync } from "node:fs";
import { dirname,
  join } from "node:path";

import { createClient,
  type Client,
  type InStatement,
  type Value } from "@libsql/client";

import { resolveParticipationPolicy } from "@/lib/attestation";
import {
  buildCategoryRankings,
  isEligibleForAllocation,
  MAX_VOTES_PER_TASK,
  quadraticCost,
  spentCredits,
  tierWeight,
  } from "@/lib/allocation";
import { summarizeEconomics,
  summarizeRevenueStream } from "@/lib/economics";
import { env } from "@/lib/env";
import {
  seedCategories,
  seedCheckpoints,
  seedGovernanceEvents,
  seedProfiles,
  seedRuns,
  seedTasks,
  seedVotes
} from "@/lib/seed";
import {
  seedCheckpointGates,
  seedComments,
  seedCommentVotes,
  seedProfileAttestations,
  seedRevenueStreams,
  seedRunUpdates,
  seedSponsorshipCommitments,
  seedTaskFinance,
  seedTaskPulseVotes,
  seedTaskTimings,
  seedTreasuryEntries,
} from "@/lib/seed-plus";
import type {
  AccountRecord,
  CategorySummary,
  CheckpointDetail,
  CommentRecord,
  CommentVoteRecord,
  ComputeRunRecord,
  DiscussionComment,
  EconomicsSummary,
  GovernanceEventRecord,
  HomepageMetrics,
  MarketplaceFilters,
  ProfileAttestationRecord,
  ProfileRecord,
  ProfileSummary,
  RevenueStreamRecord,
  RevenueStreamSummary,
  RunUpdateRecord,
  SessionRecord,
  SponsorshipCommitmentRecord,
  TaskDetail,
  TaskFinanceRecord,
  TaskPulseVoteRecord,
  TaskRecord,
  TaskSummary,
  TaskTimingRecord,
  TreasuryEntryRecord,
  ViewerSession,
  VoteRecord,
} from "@/lib/types";

type DbRow = Record<string, Value>;

const databaseFilePath = join(process.cwd(), env.KENMATCH_DB_FILE);
const databaseUrl = env.DATABASE_URL?.trim() || `file:${databaseFilePath.replace(/\\/g, "/")}`;

const tierDefaults = {
  days: { bond: 1, checkpointTarget: 8, budgetUsd: 4_000, runtimeHours: 36 },
  weeks: { bond: 2, checkpointTarget: 14, budgetUsd: 12_000, runtimeHours: 144 },
  months: { bond: 5, checkpointTarget: 24, budgetUsd: 32_000, runtimeHours: 720 },
} as const;

declare global {
  var __kenmatchDbClient: Client | undefined;
  var __kenmatchDbReady: Promise<void> | undefined;
}

function ensureDatabaseDirectory() {
  if (!databaseUrl.startsWith("file:")) {
    return;
  }

  const directory = dirname(databaseFilePath);
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
}

function getClient() {
  if (!globalThis.__kenmatchDbClient) {
    ensureDatabaseDirectory();
    globalThis.__kenmatchDbClient = createClient({
      url: databaseUrl,
      authToken: env.DATABASE_AUTH_TOKEN || undefined,
    });
  }

  return globalThis.__kenmatchDbClient;
}

async function ensureDatabase() {
  if (!globalThis.__kenmatchDbReady) {
    globalThis.__kenmatchDbReady = initializeDatabase();
  }

  await globalThis.__kenmatchDbReady;
}

function serializeList(value: string[]) {
  return JSON.stringify(value);
}

function parseList(value: Value) {
  if (typeof value !== "string" || value.length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function getString(row: DbRow, key: string) {
  const value = row[key];
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }

  return "";
}

function getNullableString(row: DbRow, key: string) {
  const value = row[key];
  if (value === null || value === undefined) {
    return null;
  }

  return getString(row, key);
}

function getNumber(row: DbRow, key: string) {
  const value = row[key];
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return Number(value);
  }

  return 0;
}

function getCount(rows: DbRow[]) {
  return rows[0] ? getNumber(rows[0], "count") : 0;
}

async function execute(sql: string, args: Value[] = []) {
  await ensureDatabase();
  return getClient().execute({ sql, args });
}

async function batch(statements: InStatement[], mode: "write" | "read" = "write") {
  await ensureDatabase();
  return getClient().batch(statements, mode);
}

async function loadRows(sql: string, args: Value[] = []) {
  const result = await execute(sql, args);
  return result.rows as DbRow[];
}

async function loadOne(sql: string, args: Value[] = []) {
  const rows = await loadRows(sql, args);
  return rows[0] ?? null;
}

async function initializeDatabase() {
  const client = getClient();
  await client.batch(
    [
      "PRAGMA foreign_keys = ON",
      `CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        bio TEXT NOT NULL,
        specialty TEXT NOT NULL,
        attestation TEXT NOT NULL,
        attestationLevel TEXT NOT NULL,
        moderationStatus TEXT NOT NULL,
        voiceCredits INTEGER NOT NULL,
        credibility REAL NOT NULL,
        avatarHue INTEGER NOT NULL,
        createdAt TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        profileId TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        passwordSalt TEXT NOT NULL,
        licensingConsent TEXT NOT NULL DEFAULT 'audit-only',
        createdAt TEXT NOT NULL,
        FOREIGN KEY (profileId) REFERENCES profiles(id)
      )`,
      `CREATE TABLE IF NOT EXISTS profile_attestations (
        profileId TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        status TEXT NOT NULL,
        sybilRisk TEXT NOT NULL,
        reviewedAt TEXT NOT NULL,
        signals TEXT NOT NULL,
        note TEXT NOT NULL,
        FOREIGN KEY (profileId) REFERENCES profiles(id)
      )`,
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        accountId TEXT NOT NULL,
        tokenHash TEXT NOT NULL UNIQUE,
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (accountId) REFERENCES accounts(id)
      )`,
      `CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        profileId TEXT NOT NULL,
        taskId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (profileId) REFERENCES profiles(id),
        FOREIGN KEY (taskId) REFERENCES tasks(id),
        UNIQUE(profileId, taskId)
      )`,
      `CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        thesis TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        categoryId TEXT NOT NULL,
        proposerId TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        problem TEXT NOT NULL,
        whyNow TEXT NOT NULL,
        publicBenefit TEXT NOT NULL,
        deliverables TEXT NOT NULL,
        evaluationCriteria TEXT NOT NULL,
        riskFlags TEXT NOT NULL,
        evidence TEXT NOT NULL,
        requestedTier TEXT NOT NULL,
        stage TEXT NOT NULL,
        safetyStatus TEXT NOT NULL,
        budgetUsd INTEGER NOT NULL,
        runtimeHours INTEGER NOT NULL,
        backend TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (categoryId) REFERENCES categories(id),
        FOREIGN KEY (proposerId) REFERENCES profiles(id)
      )`,
      `CREATE TABLE IF NOT EXISTS task_finance (
        taskId TEXT PRIMARY KEY,
        qualityBondCredits INTEGER NOT NULL,
        sponsorPoolUsd INTEGER NOT NULL,
        checkpointApprovalTarget INTEGER NOT NULL,
        enterprisePackaging TEXT NOT NULL,
        dataValueNote TEXT NOT NULL,
        sandboxCapitalUsd INTEGER NOT NULL DEFAULT 0,
        sandboxApiSpendUsd INTEGER NOT NULL DEFAULT 0,
        sandboxPilotUsers INTEGER NOT NULL DEFAULT 0,
        modelLineup TEXT NOT NULL DEFAULT '[]',
        simulationSummary TEXT NOT NULL DEFAULT '',
        sampleOutcome TEXT NOT NULL DEFAULT '',
        sponsorAppeal TEXT NOT NULL DEFAULT '',
        FOREIGN KEY (taskId) REFERENCES tasks(id)
      )`,
      `CREATE TABLE IF NOT EXISTS votes (
        id TEXT PRIMARY KEY,
        taskId TEXT NOT NULL,
        profileId TEXT NOT NULL,
        voteCount INTEGER NOT NULL,
        rationale TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        UNIQUE(taskId, profileId),
        FOREIGN KEY (taskId) REFERENCES tasks(id),
        FOREIGN KEY (profileId) REFERENCES profiles(id)
      )`,
      `CREATE TABLE IF NOT EXISTS task_pulse_votes (
        id TEXT PRIMARY KEY,
        taskId TEXT NOT NULL,
        profileId TEXT NOT NULL,
        value INTEGER NOT NULL,
        updatedAt TEXT NOT NULL,
        UNIQUE(taskId, profileId),
        FOREIGN KEY (taskId) REFERENCES tasks(id),
        FOREIGN KEY (profileId) REFERENCES profiles(id)
      )`,
      `CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        taskId TEXT NOT NULL,
        profileId TEXT NOT NULL,
        parentId TEXT,
        body TEXT NOT NULL,
        stakeCredits INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (taskId) REFERENCES tasks(id),
        FOREIGN KEY (profileId) REFERENCES profiles(id),
        FOREIGN KEY (parentId) REFERENCES comments(id)
      )`,
      `CREATE TABLE IF NOT EXISTS comment_votes (
        id TEXT PRIMARY KEY,
        commentId TEXT NOT NULL,
        profileId TEXT NOT NULL,
        value INTEGER NOT NULL,
        updatedAt TEXT NOT NULL,
        UNIQUE(commentId, profileId),
        FOREIGN KEY (commentId) REFERENCES comments(id),
        FOREIGN KEY (profileId) REFERENCES profiles(id)
      )`,
      `CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        taskId TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL,
        backend TEXT NOT NULL,
        budgetUsd INTEGER NOT NULL,
        runtimeHours INTEGER NOT NULL,
        checkpointCadenceHours INTEGER NOT NULL,
        reproducibilityNotes TEXT NOT NULL,
        rollbackPlan TEXT NOT NULL,
        FOREIGN KEY (taskId) REFERENCES tasks(id)
      )`,
      `CREATE TABLE IF NOT EXISTS task_timings (
        taskId TEXT PRIMARY KEY,
        launchAt TEXT,
        startedAt TEXT,
        expectedMaxEndAt TEXT,
        computeHoursUsed INTEGER NOT NULL,
        completionMode TEXT NOT NULL,
        completionSummary TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (taskId) REFERENCES tasks(id)
      )`,
      `CREATE TABLE IF NOT EXISTS run_updates (
        id TEXT PRIMARY KEY,
        taskId TEXT NOT NULL,
        label TEXT NOT NULL,
        status TEXT NOT NULL,
        summary TEXT NOT NULL,
        artifact TEXT NOT NULL,
        evidenceNote TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (taskId) REFERENCES tasks(id)
      )`,
      `CREATE TABLE IF NOT EXISTS checkpoints (
        id TEXT PRIMARY KEY,
        taskId TEXT NOT NULL,
        label TEXT NOT NULL,
        status TEXT NOT NULL,
        detail TEXT NOT NULL,
        dueAt TEXT NOT NULL,
        FOREIGN KEY (taskId) REFERENCES tasks(id)
      )`,
      `CREATE TABLE IF NOT EXISTS checkpoint_gates (
        checkpointId TEXT PRIMARY KEY,
        approvalScore INTEGER NOT NULL,
        requiredApprovals INTEGER NOT NULL,
        releaseStatus TEXT NOT NULL,
        FOREIGN KEY (checkpointId) REFERENCES checkpoints(id)
      )`,
      `CREATE TABLE IF NOT EXISTS governance_events (
        id TEXT PRIMARY KEY,
        taskId TEXT,
        house TEXT NOT NULL,
        title TEXT NOT NULL,
        decision TEXT NOT NULL,
        outcome TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (taskId) REFERENCES tasks(id)
      )`,
      `CREATE TABLE IF NOT EXISTS revenue_streams (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        engine TEXT NOT NULL,
        description TEXT NOT NULL,
        pricingModel TEXT NOT NULL,
        status TEXT NOT NULL,
        monthlyRevenueUsd INTEGER NOT NULL,
        grossMargin REAL NOT NULL,
        treasurySharePercent INTEGER NOT NULL,
        founderSharePercent INTEGER NOT NULL,
        publicBenefitCovenant TEXT NOT NULL DEFAULT '',
        openDeliverableBoundary TEXT NOT NULL DEFAULT '',
        contributorDividendPercent INTEGER NOT NULL DEFAULT 0,
        requiresContributorConsent INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS treasury_entries (
        id TEXT PRIMARY KEY,
        streamId TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        bucket TEXT NOT NULL,
        direction TEXT NOT NULL,
        amountUsd INTEGER NOT NULL,
        fundingState TEXT NOT NULL DEFAULT 'committed',
        restrictionMode TEXT NOT NULL DEFAULT 'unrestricted',
        restrictionScope TEXT NOT NULL DEFAULT 'general',
        restrictionTargetId TEXT,
        restrictionTargetLabel TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (streamId) REFERENCES revenue_streams(id)
      )`,
      `CREATE TABLE IF NOT EXISTS sponsorship_commitments (
        id TEXT PRIMARY KEY,
        sponsorName TEXT NOT NULL,
        sponsorType TEXT NOT NULL,
        sponsorContact TEXT NOT NULL,
        note TEXT NOT NULL,
        amountUsd INTEGER NOT NULL,
        fundingState TEXT NOT NULL,
        status TEXT NOT NULL,
        restrictionScope TEXT NOT NULL,
        restrictionTargetId TEXT,
        restrictionTargetLabel TEXT,
        checkoutSessionId TEXT UNIQUE,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        paidAt TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS request_rate_limits (
        scope TEXT NOT NULL,
        identifier TEXT NOT NULL,
        bucketStart TEXT NOT NULL,
        count INTEGER NOT NULL,
        updatedAt TEXT NOT NULL,
        PRIMARY KEY (scope, identifier, bucketStart)
      )`,
      `CREATE TABLE IF NOT EXISTS security_events (
        id TEXT PRIMARY KEY,
        eventType TEXT NOT NULL,
        ipAddress TEXT,
        actorId TEXT,
        detail TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )`,
      "CREATE INDEX IF NOT EXISTS idx_votes_profileId ON votes(profileId)",
      "CREATE INDEX IF NOT EXISTS idx_votes_taskId ON votes(taskId)",
      "CREATE INDEX IF NOT EXISTS idx_tasks_categoryId ON tasks(categoryId)",
      "CREATE INDEX IF NOT EXISTS idx_comments_taskId ON comments(taskId)",
      "CREATE INDEX IF NOT EXISTS idx_comment_votes_commentId ON comment_votes(commentId)",
      "CREATE INDEX IF NOT EXISTS idx_run_updates_taskId ON run_updates(taskId)",
      "CREATE INDEX IF NOT EXISTS idx_sessions_tokenHash ON sessions(tokenHash)",
      "CREATE INDEX IF NOT EXISTS idx_task_pulse_votes_taskId ON task_pulse_votes(taskId)",
      "CREATE INDEX IF NOT EXISTS idx_sponsorship_commitments_status ON sponsorship_commitments(status)",
      "CREATE INDEX IF NOT EXISTS idx_request_rate_limits_updatedAt ON request_rate_limits(updatedAt)",
      "CREATE INDEX IF NOT EXISTS idx_security_events_createdAt ON security_events(createdAt)",
      "CREATE INDEX IF NOT EXISTS idx_bookmarks_profileId ON bookmarks(profileId)",
    ],
    "write",
  );

  await ensureColumn(client, "accounts", "licensingConsent", "TEXT NOT NULL DEFAULT 'audit-only'");
  await ensureColumn(client, "revenue_streams", "publicBenefitCovenant", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(client, "revenue_streams", "openDeliverableBoundary", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(client, "revenue_streams", "contributorDividendPercent", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(client, "revenue_streams", "requiresContributorConsent", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(client, "treasury_entries", "fundingState", "TEXT NOT NULL DEFAULT 'committed'");
  await ensureColumn(client, "treasury_entries", "restrictionMode", "TEXT NOT NULL DEFAULT 'unrestricted'");
  await ensureColumn(client, "treasury_entries", "restrictionScope", "TEXT NOT NULL DEFAULT 'general'");
  await ensureColumn(client, "treasury_entries", "restrictionTargetId", "TEXT");
  await ensureColumn(client, "treasury_entries", "restrictionTargetLabel", "TEXT");
  await ensureColumn(client, "task_finance", "sandboxCapitalUsd", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(client, "task_finance", "sandboxApiSpendUsd", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(client, "task_finance", "sandboxPilotUsers", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(client, "task_finance", "modelLineup", "TEXT NOT NULL DEFAULT '[]'");
  await ensureColumn(client, "task_finance", "simulationSummary", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(client, "task_finance", "sampleOutcome", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(client, "task_finance", "sponsorAppeal", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(client, "accounts", "systemRole", "TEXT NOT NULL DEFAULT 'contributor'");
  await ensureColumn(client, "accounts", "emailVerified", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(client, "profiles", "slug", "TEXT");

  await seedDatabase();
}

async function ensureColumn(client: Client, table: string, column: string, definition: string) {
  const info = await client.execute(`PRAGMA table_info(${table})`);
  const hasColumn = info.rows.some((row) => getString(row as DbRow, "name") === column);
  if (!hasColumn) {
    await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function normalizeSeedProfile(profile: ProfileRecord, index: number): ProfileRecord & {
  attestationLevel: NonNullable<ProfileRecord["attestationLevel"]>;
  moderationStatus: NonNullable<ProfileRecord["moderationStatus"]>;
  createdAt: string;
} {
  const attestationLevel = profile.attestationLevel ?? (profile.credibility >= 0.94 ? "expert" : "verified");
  const createdAt = profile.createdAt ?? `2026-01-${String(index + 3).padStart(2, "0")}T09:00:00.000Z`;

  return {
    ...profile,
    attestationLevel,
    moderationStatus: profile.moderationStatus ?? "active",
    createdAt,
  };
}

async function seedDatabase() {
  const profileStatements = seedProfiles.map((profile, index) => {
    const normalized = normalizeSeedProfile(profile, index);
    return {
      sql: `INSERT INTO profiles (
        id, name, role, bio, specialty, attestation, attestationLevel, moderationStatus,
        voiceCredits, credibility, avatarHue, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        role = excluded.role,
        bio = excluded.bio,
        specialty = excluded.specialty,
        attestation = excluded.attestation,
        attestationLevel = excluded.attestationLevel,
        moderationStatus = excluded.moderationStatus,
        voiceCredits = excluded.voiceCredits,
        credibility = excluded.credibility,
        avatarHue = excluded.avatarHue,
        createdAt = excluded.createdAt`,
      args: [
        normalized.id,
        normalized.name,
        normalized.role,
        normalized.bio,
        normalized.specialty,
        normalized.attestation,
        normalized.attestationLevel,
        normalized.moderationStatus,
        normalized.voiceCredits,
        normalized.credibility,
        normalized.avatarHue,
        normalized.createdAt,
      ],
    } satisfies InStatement;
  });

  const attestationStatements = seedProfileAttestations.map((entry) => ({
    sql: "INSERT OR IGNORE INTO profile_attestations (profileId, provider, status, sybilRisk, reviewedAt, signals, note) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [entry.profileId, entry.provider, entry.status, entry.sybilRisk, entry.reviewedAt, serializeList(entry.signals), entry.note],
  } satisfies InStatement));

  const categoryStatements = seedCategories.map((category) => ({
    sql: `INSERT INTO categories (id, slug, name, description, thesis) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        slug = excluded.slug,
        name = excluded.name,
        description = excluded.description,
        thesis = excluded.thesis`,
    args: [category.id, category.slug, category.name, category.description, category.thesis],
  } satisfies InStatement));

  const taskStatements = seedTasks.flatMap((task) => {
    const finance = seedTaskFinance.find((entry) => entry.taskId === task.id);
    return [
      {
        sql: `INSERT INTO tasks (
          id, slug, categoryId, proposerId, title, summary, problem, whyNow, publicBenefit,
          deliverables, evaluationCriteria, riskFlags, evidence, requestedTier, stage, safetyStatus,
          budgetUsd, runtimeHours, backend, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          slug = excluded.slug,
          categoryId = excluded.categoryId,
          proposerId = excluded.proposerId,
          title = excluded.title,
          summary = excluded.summary,
          problem = excluded.problem,
          whyNow = excluded.whyNow,
          publicBenefit = excluded.publicBenefit,
          deliverables = excluded.deliverables,
          evaluationCriteria = excluded.evaluationCriteria,
          riskFlags = excluded.riskFlags,
          evidence = excluded.evidence,
          requestedTier = excluded.requestedTier,
          stage = excluded.stage,
          safetyStatus = excluded.safetyStatus,
          budgetUsd = excluded.budgetUsd,
          runtimeHours = excluded.runtimeHours,
          backend = excluded.backend,
          createdAt = excluded.createdAt`,
        args: [
          task.id,
          task.slug,
          task.categoryId,
          task.proposerId,
          task.title,
          task.summary,
          task.problem,
          task.whyNow,
          task.publicBenefit,
          serializeList(task.deliverables),
          serializeList(task.evaluationCriteria),
          serializeList(task.riskFlags),
          serializeList(task.evidence),
          task.requestedTier,
          task.stage,
          task.safetyStatus,
          task.budgetUsd,
          task.runtimeHours,
          task.backend,
          task.createdAt,
        ],
      } satisfies InStatement,
      {
        sql: `INSERT INTO task_finance (
          taskId, qualityBondCredits, sponsorPoolUsd, checkpointApprovalTarget, enterprisePackaging, dataValueNote,
          sandboxCapitalUsd, sandboxApiSpendUsd, sandboxPilotUsers, modelLineup, simulationSummary, sampleOutcome, sponsorAppeal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(taskId) DO UPDATE SET
          qualityBondCredits = excluded.qualityBondCredits,
          sponsorPoolUsd = excluded.sponsorPoolUsd,
          checkpointApprovalTarget = excluded.checkpointApprovalTarget,
          enterprisePackaging = excluded.enterprisePackaging,
          dataValueNote = excluded.dataValueNote,
          sandboxCapitalUsd = excluded.sandboxCapitalUsd,
          sandboxApiSpendUsd = excluded.sandboxApiSpendUsd,
          sandboxPilotUsers = excluded.sandboxPilotUsers,
          modelLineup = excluded.modelLineup,
          simulationSummary = excluded.simulationSummary,
          sampleOutcome = excluded.sampleOutcome,
          sponsorAppeal = excluded.sponsorAppeal`,
        args: [
          task.id,
          finance?.qualityBondCredits ?? tierDefaults[task.requestedTier].bond,
          finance?.sponsorPoolUsd ?? 0,
          finance?.checkpointApprovalTarget ?? tierDefaults[task.requestedTier].checkpointTarget,
          finance?.enterprisePackaging ?? "Public output first, with an optional service version for groups that need support.",
          finance?.dataValueNote ?? "Corrections and audit traces remain useful public-good inputs.",
          finance?.sandboxCapitalUsd ?? 0,
          finance?.sandboxApiSpendUsd ?? 0,
          finance?.sandboxPilotUsers ?? 0,
          serializeList(finance?.modelLineup ?? []),
          finance?.simulationSummary ?? "",
          finance?.sampleOutcome ?? "",
          finance?.sponsorAppeal ?? "",
        ],
      } satisfies InStatement,
    ];
  });

  const voteStatements = seedVotes.map((vote) => ({
    sql: "INSERT OR IGNORE INTO votes (id, taskId, profileId, voteCount, rationale, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
    args: [vote.id, vote.taskId, vote.profileId, vote.voteCount, vote.rationale, vote.updatedAt],
  } satisfies InStatement));

  const pulseStatements = seedTaskPulseVotes.map((vote) => ({
    sql: "INSERT OR IGNORE INTO task_pulse_votes (id, taskId, profileId, value, updatedAt) VALUES (?, ?, ?, ?, ?)",
    args: [vote.id, vote.taskId, vote.profileId, vote.value, vote.updatedAt],
  } satisfies InStatement));

  const commentStatements = seedComments.map((comment) => ({
    sql: "INSERT OR IGNORE INTO comments (id, taskId, profileId, parentId, body, stakeCredits, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [comment.id, comment.taskId, comment.profileId, comment.parentId, comment.body, comment.stakeCredits, comment.createdAt],
  } satisfies InStatement));

  const commentVoteStatements = seedCommentVotes.map((vote) => ({
    sql: "INSERT OR IGNORE INTO comment_votes (id, commentId, profileId, value, updatedAt) VALUES (?, ?, ?, ?, ?)",
    args: [vote.id, vote.commentId, vote.profileId, vote.value, vote.updatedAt],
  } satisfies InStatement));

  const runStatements = seedRuns.map((run) => ({
    sql: "INSERT OR IGNORE INTO runs (id, taskId, status, backend, budgetUsd, runtimeHours, checkpointCadenceHours, reproducibilityNotes, rollbackPlan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [
      run.id,
      run.taskId,
      run.status,
      run.backend,
      run.budgetUsd,
      run.runtimeHours,
      run.checkpointCadenceHours,
      run.reproducibilityNotes,
      run.rollbackPlan,
    ],
  } satisfies InStatement));

  const timingStatements = seedTaskTimings.map((timing) => ({
    sql: "INSERT OR IGNORE INTO task_timings (taskId, launchAt, startedAt, expectedMaxEndAt, computeHoursUsed, completionMode, completionSummary, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    args: [timing.taskId, timing.launchAt, timing.startedAt, timing.expectedMaxEndAt, timing.computeHoursUsed, timing.completionMode, timing.completionSummary, timing.updatedAt],
  } satisfies InStatement));

  const runUpdateStatements = seedRunUpdates.map((update) => ({
    sql: "INSERT OR IGNORE INTO run_updates (id, taskId, label, status, summary, artifact, evidenceNote, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    args: [update.id, update.taskId, update.label, update.status, update.summary, update.artifact, update.evidenceNote, update.createdAt],
  } satisfies InStatement));

  const checkpointStatements = seedCheckpoints.map((checkpoint) => ({
    sql: "INSERT OR IGNORE INTO checkpoints (id, taskId, label, status, detail, dueAt) VALUES (?, ?, ?, ?, ?, ?)",
    args: [checkpoint.id, checkpoint.taskId, checkpoint.label, checkpoint.status, checkpoint.detail, checkpoint.dueAt],
  } satisfies InStatement));

  const checkpointGateStatements = seedCheckpointGates.map((gate) => ({
    sql: "INSERT OR IGNORE INTO checkpoint_gates (checkpointId, approvalScore, requiredApprovals, releaseStatus) VALUES (?, ?, ?, ?)",
    args: [gate.checkpointId, gate.approvalScore, gate.requiredApprovals, gate.releaseStatus],
  } satisfies InStatement));

  const governanceStatements = seedGovernanceEvents.map((event) => ({
    sql: "INSERT OR IGNORE INTO governance_events (id, taskId, house, title, decision, outcome, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [event.id, event.taskId, event.house, event.title, event.decision, event.outcome, event.createdAt],
  } satisfies InStatement));

  const revenueStatements = seedRevenueStreams.map((stream) => ({
    sql: `INSERT INTO revenue_streams (
      id, slug, name, engine, description, pricingModel, status, monthlyRevenueUsd, grossMargin,
      treasurySharePercent, founderSharePercent, publicBenefitCovenant, openDeliverableBoundary,
      contributorDividendPercent, requiresContributorConsent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      slug = excluded.slug,
      name = excluded.name,
      engine = excluded.engine,
      description = excluded.description,
      pricingModel = excluded.pricingModel,
      status = excluded.status,
      monthlyRevenueUsd = excluded.monthlyRevenueUsd,
      grossMargin = excluded.grossMargin,
      treasurySharePercent = excluded.treasurySharePercent,
      founderSharePercent = excluded.founderSharePercent,
      publicBenefitCovenant = excluded.publicBenefitCovenant,
      openDeliverableBoundary = excluded.openDeliverableBoundary,
      contributorDividendPercent = excluded.contributorDividendPercent,
      requiresContributorConsent = excluded.requiresContributorConsent`,
    args: [
      stream.id,
      stream.slug,
      stream.name,
      stream.engine,
      stream.description,
      stream.pricingModel,
      stream.status,
      stream.monthlyRevenueUsd,
      stream.grossMargin,
      stream.treasurySharePercent,
      stream.founderSharePercent,
      stream.publicBenefitCovenant,
      stream.openDeliverableBoundary,
      stream.contributorDividendPercent,
      stream.requiresContributorConsent ? 1 : 0,
    ],
  } satisfies InStatement));

  const treasuryStatements = seedTreasuryEntries.map((entry) => ({
    sql: `INSERT OR IGNORE INTO treasury_entries (
      id, streamId, title, description, bucket, direction, amountUsd, fundingState,
      restrictionMode, restrictionScope, restrictionTargetId, restrictionTargetLabel, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      entry.id,
      entry.streamId,
      entry.title,
      entry.description,
      entry.bucket,
      entry.direction,
      entry.amountUsd,
      entry.fundingState,
      entry.restrictionMode,
      entry.restrictionScope,
      entry.restrictionTargetId,
      entry.restrictionTargetLabel,
      entry.createdAt,
    ],
  } satisfies InStatement));

  const sponsorshipStatements = seedSponsorshipCommitments.map((commitment) => ({
    sql: `INSERT INTO sponsorship_commitments (
      id, sponsorName, sponsorType, sponsorContact, note, amountUsd, fundingState, status,
      restrictionScope, restrictionTargetId, restrictionTargetLabel, checkoutSessionId, createdAt, updatedAt, paidAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      sponsorName = excluded.sponsorName,
      sponsorType = excluded.sponsorType,
      sponsorContact = excluded.sponsorContact,
      note = excluded.note,
      amountUsd = excluded.amountUsd,
      fundingState = excluded.fundingState,
      status = excluded.status,
      restrictionScope = excluded.restrictionScope,
      restrictionTargetId = excluded.restrictionTargetId,
      restrictionTargetLabel = excluded.restrictionTargetLabel,
      checkoutSessionId = excluded.checkoutSessionId,
      createdAt = excluded.createdAt,
      updatedAt = excluded.updatedAt,
      paidAt = excluded.paidAt`,
    args: [
      commitment.id,
      commitment.sponsorName,
      commitment.sponsorType,
      commitment.sponsorContact,
      commitment.note,
      commitment.amountUsd,
      commitment.fundingState,
      commitment.status,
      commitment.restrictionScope,
      commitment.restrictionTargetId,
      commitment.restrictionTargetLabel,
      commitment.checkoutSessionId,
      commitment.createdAt,
      commitment.updatedAt,
      commitment.paidAt,
    ],
  } satisfies InStatement));

  const client = getClient();
  await client.batch(
    [
      ...profileStatements,
      ...attestationStatements,
      ...categoryStatements,
      ...taskStatements,
      ...voteStatements,
      ...pulseStatements,
      ...commentStatements,
      ...commentVoteStatements,
      ...runStatements,
      ...timingStatements,
      ...runUpdateStatements,
      ...checkpointStatements,
      ...checkpointGateStatements,
      ...governanceStatements,
      ...revenueStatements,
      ...treasuryStatements,
      ...sponsorshipStatements,
    ],
    "write",
  );
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createPasswordHash(password: string, salt = randomBytes(16).toString("hex")) {
  const derived = scryptSync(password, salt, 64).toString("hex");
  return { passwordHash: derived, passwordSalt: salt };
}

function verifyPassword(password: string, passwordHash: string, passwordSalt: string) {
  const derived = Buffer.from(scryptSync(password, passwordSalt, 64).toString("hex"), "hex");
  const existing = Buffer.from(passwordHash, "hex");
  if (derived.length !== existing.length) {
    return false;
  }

  return timingSafeEqual(derived, existing);
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(table: "tasks" | "profiles", value: string) {
  const base = slugify(value) || randomUUID().slice(0, 8);
  let candidate = base;
  let iteration = 2;

  while (
    table === "tasks"
      ? await loadOne("SELECT id FROM tasks WHERE id = ? OR slug = ? LIMIT 1", [candidate, candidate])
      : await loadOne("SELECT id FROM profiles WHERE id = ? LIMIT 1", [candidate])
  ) {
    candidate = `${base}-${iteration}`;
    iteration += 1;
  }

  return candidate;
}

function avatarHueFor(seed: string) {
  let hash = 0;
  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) % 360;
  }
  return hash;
}

function mapProfile(row: DbRow): ProfileRecord {
  return {
    id: getString(row, "id"),
    name: getString(row, "name"),
    role: getString(row, "role"),
    bio: getString(row, "bio"),
    specialty: getString(row, "specialty"),
    attestation: getString(row, "attestation"),
    attestationLevel: getString(row, "attestationLevel") as ProfileSummary["attestationLevel"],
    moderationStatus: getString(row, "moderationStatus") as ProfileSummary["moderationStatus"],
    voiceCredits: getNumber(row, "voiceCredits"),
    credibility: getNumber(row, "credibility"),
    avatarHue: getNumber(row, "avatarHue"),
    createdAt: getString(row, "createdAt"),
  };
}

function mapTask(row: DbRow): TaskRecord {
  return {
    id: getString(row, "id"),
    slug: getString(row, "slug"),
    categoryId: getString(row, "categoryId"),
    proposerId: getString(row, "proposerId"),
    title: getString(row, "title"),
    summary: getString(row, "summary"),
    problem: getString(row, "problem"),
    whyNow: getString(row, "whyNow"),
    publicBenefit: getString(row, "publicBenefit"),
    deliverables: parseList(row.deliverables),
    evaluationCriteria: parseList(row.evaluationCriteria),
    riskFlags: parseList(row.riskFlags),
    evidence: parseList(row.evidence),
    requestedTier: getString(row, "requestedTier") as TaskRecord["requestedTier"],
    stage: getString(row, "stage") as TaskRecord["stage"],
    safetyStatus: getString(row, "safetyStatus") as TaskRecord["safetyStatus"],
    budgetUsd: getNumber(row, "budgetUsd"),
    runtimeHours: getNumber(row, "runtimeHours"),
    backend: getString(row, "backend"),
    createdAt: getString(row, "createdAt"),
  };
}

function mapTaskFinance(row: DbRow): TaskFinanceRecord {
  return {
    taskId: getString(row, "taskId"),
    qualityBondCredits: getNumber(row, "qualityBondCredits"),
    sponsorPoolUsd: getNumber(row, "sponsorPoolUsd"),
    checkpointApprovalTarget: getNumber(row, "checkpointApprovalTarget"),
    enterprisePackaging: getString(row, "enterprisePackaging"),
    dataValueNote: getString(row, "dataValueNote"),
    sandboxCapitalUsd: getNumber(row, "sandboxCapitalUsd"),
    sandboxApiSpendUsd: getNumber(row, "sandboxApiSpendUsd"),
    sandboxPilotUsers: getNumber(row, "sandboxPilotUsers"),
    modelLineup: parseList(row.modelLineup),
    simulationSummary: getString(row, "simulationSummary"),
    sampleOutcome: getString(row, "sampleOutcome"),
    sponsorAppeal: getString(row, "sponsorAppeal"),
  };
}

function mapVote(row: DbRow): VoteRecord {
  return {
    id: getString(row, "id"),
    taskId: getString(row, "taskId"),
    profileId: getString(row, "profileId"),
    voteCount: getNumber(row, "voteCount"),
    rationale: getString(row, "rationale"),
    updatedAt: getString(row, "updatedAt"),
  };
}

function mapTaskPulseVote(row: DbRow): TaskPulseVoteRecord {
  return {
    id: getString(row, "id"),
    taskId: getString(row, "taskId"),
    profileId: getString(row, "profileId"),
    value: getNumber(row, "value") as TaskPulseVoteRecord["value"],
    updatedAt: getString(row, "updatedAt"),
  };
}

function mapProfileAttestation(row: DbRow): ProfileAttestationRecord {
  return {
    profileId: getString(row, "profileId"),
    provider: getString(row, "provider"),
    status: getString(row, "status") as ProfileAttestationRecord["status"],
    sybilRisk: getString(row, "sybilRisk") as ProfileAttestationRecord["sybilRisk"],
    reviewedAt: getString(row, "reviewedAt"),
    signals: parseList(row.signals),
    note: getString(row, "note"),
  };
}

function mapComment(row: DbRow): CommentRecord {
  return {
    id: getString(row, "id"),
    taskId: getString(row, "taskId"),
    profileId: getString(row, "profileId"),
    parentId: getNullableString(row, "parentId"),
    body: getString(row, "body"),
    stakeCredits: getNumber(row, "stakeCredits"),
    createdAt: getString(row, "createdAt"),
  };
}

function mapCommentVote(row: DbRow): CommentVoteRecord {
  return {
    id: getString(row, "id"),
    commentId: getString(row, "commentId"),
    profileId: getString(row, "profileId"),
    value: getNumber(row, "value") as CommentVoteRecord["value"],
    updatedAt: getString(row, "updatedAt"),
  };
}

function mapRun(row: DbRow): ComputeRunRecord {
  return {
    id: getString(row, "id"),
    taskId: getString(row, "taskId"),
    status: getString(row, "status") as ComputeRunRecord["status"],
    backend: getString(row, "backend"),
    budgetUsd: getNumber(row, "budgetUsd"),
    runtimeHours: getNumber(row, "runtimeHours"),
    checkpointCadenceHours: getNumber(row, "checkpointCadenceHours"),
    reproducibilityNotes: getString(row, "reproducibilityNotes"),
    rollbackPlan: getString(row, "rollbackPlan"),
  };
}

function mapTaskTiming(row: DbRow): TaskTimingRecord {
  return {
    taskId: getString(row, "taskId"),
    launchAt: getNullableString(row, "launchAt"),
    startedAt: getNullableString(row, "startedAt"),
    expectedMaxEndAt: getNullableString(row, "expectedMaxEndAt"),
    computeHoursUsed: getNumber(row, "computeHoursUsed"),
    completionMode: getString(row, "completionMode") as TaskTimingRecord["completionMode"],
    completionSummary: getString(row, "completionSummary"),
    updatedAt: getString(row, "updatedAt"),
  };
}

function mapRunUpdate(row: DbRow): RunUpdateRecord {
  return {
    id: getString(row, "id"),
    taskId: getString(row, "taskId"),
    label: getString(row, "label"),
    status: getString(row, "status") as RunUpdateRecord["status"],
    summary: getString(row, "summary"),
    artifact: getString(row, "artifact"),
    evidenceNote: getString(row, "evidenceNote"),
    createdAt: getString(row, "createdAt"),
  };
}

function mapCheckpoint(row: DbRow) {
  return {
    id: getString(row, "id"),
    taskId: getString(row, "taskId"),
    label: getString(row, "label"),
    status: getString(row, "status") as CheckpointDetail["status"],
    detail: getString(row, "detail"),
    dueAt: getString(row, "dueAt"),
  };
}

function mapCheckpointGate(row: DbRow) {
  return {
    checkpointId: getString(row, "checkpointId"),
    approvalScore: getNumber(row, "approvalScore"),
    requiredApprovals: getNumber(row, "requiredApprovals"),
    releaseStatus: getString(row, "releaseStatus") as CheckpointDetail["releaseStatus"],
  };
}

function mapGovernance(row: DbRow): GovernanceEventRecord {
  return {
    id: getString(row, "id"),
    taskId: getNullableString(row, "taskId"),
    house: getString(row, "house") as GovernanceEventRecord["house"],
    title: getString(row, "title"),
    decision: getString(row, "decision"),
    outcome: getString(row, "outcome"),
    createdAt: getString(row, "createdAt"),
  };
}

function mapRevenueStream(row: DbRow): RevenueStreamRecord {
  return {
    id: getString(row, "id"),
    slug: getString(row, "slug"),
    name: getString(row, "name"),
    engine: getString(row, "engine") as RevenueStreamRecord["engine"],
    description: getString(row, "description"),
    pricingModel: getString(row, "pricingModel"),
    status: getString(row, "status") as RevenueStreamRecord["status"],
    monthlyRevenueUsd: getNumber(row, "monthlyRevenueUsd"),
    grossMargin: getNumber(row, "grossMargin"),
    treasurySharePercent: getNumber(row, "treasurySharePercent"),
    founderSharePercent: getNumber(row, "founderSharePercent"),
    publicBenefitCovenant: getString(row, "publicBenefitCovenant"),
    openDeliverableBoundary: getString(row, "openDeliverableBoundary"),
    contributorDividendPercent: getNumber(row, "contributorDividendPercent"),
    requiresContributorConsent: getNumber(row, "requiresContributorConsent") > 0,
  };
}

function mapTreasuryEntry(row: DbRow): TreasuryEntryRecord {
  return {
    id: getString(row, "id"),
    streamId: getNullableString(row, "streamId"),
    title: getString(row, "title"),
    description: getString(row, "description"),
    bucket: getString(row, "bucket"),
    direction: getString(row, "direction") as TreasuryEntryRecord["direction"],
    amountUsd: getNumber(row, "amountUsd"),
    fundingState: getString(row, "fundingState") as TreasuryEntryRecord["fundingState"],
    restrictionMode: getString(row, "restrictionMode") as TreasuryEntryRecord["restrictionMode"],
    restrictionScope: getString(row, "restrictionScope") as TreasuryEntryRecord["restrictionScope"],
    restrictionTargetId: getNullableString(row, "restrictionTargetId"),
    restrictionTargetLabel: getNullableString(row, "restrictionTargetLabel"),
    createdAt: getString(row, "createdAt"),
  };
}

function mapSponsorshipCommitment(row: DbRow): SponsorshipCommitmentRecord {
  return {
    id: getString(row, "id"),
    sponsorName: getString(row, "sponsorName"),
    sponsorType: getString(row, "sponsorType") as SponsorshipCommitmentRecord["sponsorType"],
    sponsorContact: getString(row, "sponsorContact"),
    note: getString(row, "note"),
    amountUsd: getNumber(row, "amountUsd"),
    fundingState: getString(row, "fundingState") as SponsorshipCommitmentRecord["fundingState"],
    status: getString(row, "status") as SponsorshipCommitmentRecord["status"],
    restrictionScope: getString(row, "restrictionScope") as SponsorshipCommitmentRecord["restrictionScope"],
    restrictionTargetId: getNullableString(row, "restrictionTargetId"),
    restrictionTargetLabel: getNullableString(row, "restrictionTargetLabel"),
    checkoutSessionId: getNullableString(row, "checkoutSessionId"),
    createdAt: getString(row, "createdAt"),
    updatedAt: getString(row, "updatedAt"),
    paidAt: getNullableString(row, "paidAt"),
  };
}

function mapAccount(row: DbRow): AccountRecord {
  return {
    id: getString(row, "id"),
    profileId: getString(row, "profileId"),
    email: getString(row, "email"),
    passwordHash: getString(row, "passwordHash"),
    passwordSalt: getString(row, "passwordSalt"),
    licensingConsent: getString(row, "licensingConsent") as AccountRecord["licensingConsent"],
    systemRole: (getString(row, "systemRole") || "contributor") as AccountRecord["systemRole"],
    emailVerified: Boolean(getNumber(row, "emailVerified")),
    createdAt: getString(row, "createdAt"),
  };
}

function mapSession(row: DbRow): SessionRecord {
  return {
    id: getString(row, "id"),
    accountId: getString(row, "accountId"),
    tokenHash: getString(row, "tokenHash"),
    expiresAt: getString(row, "expiresAt"),
    createdAt: getString(row, "createdAt"),
  };
}

const loadProfiles = () => loadRows("SELECT * FROM profiles ORDER BY credibility DESC, name ASC").then((rows) => rows.map(mapProfile));
const loadProfileAttestations = () => loadRows("SELECT * FROM profile_attestations ORDER BY reviewedAt DESC").then((rows) => rows.map(mapProfileAttestation));
const loadCategories = () =>
  loadRows("SELECT * FROM categories ORDER BY name ASC").then((rows) =>
    rows.map((row) => ({
      id: getString(row, "id"),
      slug: getString(row, "slug"),
      name: getString(row, "name"),
      description: getString(row, "description"),
      thesis: getString(row, "thesis"),
    })),
  );
const loadTasks = () => loadRows("SELECT * FROM tasks ORDER BY createdAt DESC").then((rows) => rows.map(mapTask));
const loadTaskFinance = () => loadRows("SELECT * FROM task_finance").then((rows) => rows.map(mapTaskFinance));
const loadVotes = () => loadRows("SELECT * FROM votes ORDER BY updatedAt DESC").then((rows) => rows.map(mapVote));
const loadTaskPulseVotes = () => loadRows("SELECT * FROM task_pulse_votes ORDER BY updatedAt DESC").then((rows) => rows.map(mapTaskPulseVote));
const loadComments = () => loadRows("SELECT * FROM comments ORDER BY createdAt ASC").then((rows) => rows.map(mapComment));
const loadCommentVotes = () => loadRows("SELECT * FROM comment_votes ORDER BY updatedAt DESC").then((rows) => rows.map(mapCommentVote));
const loadRuns = () => loadRows("SELECT * FROM runs").then((rows) => rows.map(mapRun));
const loadTaskTimings = () => loadRows("SELECT * FROM task_timings").then((rows) => rows.map(mapTaskTiming));
const loadRunUpdates = () => loadRows("SELECT * FROM run_updates ORDER BY createdAt DESC").then((rows) => rows.map(mapRunUpdate));
const loadCheckpoints = () => loadRows("SELECT * FROM checkpoints ORDER BY dueAt ASC").then((rows) => rows.map(mapCheckpoint));
const loadCheckpointGates = () => loadRows("SELECT * FROM checkpoint_gates").then((rows) => rows.map(mapCheckpointGate));
const loadGovernanceEvents = () => loadRows("SELECT * FROM governance_events ORDER BY createdAt DESC").then((rows) => rows.map(mapGovernance));
const loadRevenueStreams = () => loadRows("SELECT * FROM revenue_streams ORDER BY monthlyRevenueUsd DESC").then((rows) => rows.map(mapRevenueStream));
const loadTreasuryEntries = () => loadRows("SELECT * FROM treasury_entries ORDER BY createdAt DESC").then((rows) => rows.map(mapTreasuryEntry));
const loadSponsorshipCommitments = () =>
  loadRows("SELECT * FROM sponsorship_commitments ORDER BY updatedAt DESC, createdAt DESC").then((rows) => rows.map(mapSponsorshipCommitment));

async function findProfileById(profileId: string) {
  const row = await loadOne("SELECT * FROM profiles WHERE id = ? LIMIT 1", [profileId]);
  return row ? mapProfile(row) : null;
}

async function findTaskById(taskId: string) {
  const row = await loadOne("SELECT * FROM tasks WHERE id = ? LIMIT 1", [taskId]);
  return row ? mapTask(row) : null;
}


async function findCategoryBySlug(slug: string) {
  const row = await loadOne("SELECT * FROM categories WHERE slug = ? LIMIT 1", [slug]);
  return row
    ? {
        id: getString(row, "id"),
        slug: getString(row, "slug"),
        name: getString(row, "name"),
        description: getString(row, "description"),
        thesis: getString(row, "thesis"),
      }
    : null;
}

async function findAccountByEmail(email: string) {
  const row = await loadOne("SELECT * FROM accounts WHERE lower(email) = lower(?) LIMIT 1", [email]);
  return row ? mapAccount(row) : null;
}

async function findAccountById(accountId: string) {
  const row = await loadOne("SELECT * FROM accounts WHERE id = ? LIMIT 1", [accountId]);
  return row ? mapAccount(row) : null;
}

async function findSessionByTokenHash(tokenHash: string) {
  const row = await loadOne("SELECT * FROM sessions WHERE tokenHash = ? LIMIT 1", [tokenHash]);
  return row ? mapSession(row) : null;
}

function activeBondedCredits(profileId: string, tasks: TaskRecord[], finances: TaskFinanceRecord[]) {
  const financeMap = new Map(finances.map((finance) => [finance.taskId, finance]));
  return tasks
    .filter((task) => task.proposerId === profileId && ["review", "voting", "blocked"].includes(task.stage))
    .reduce((total, task) => total + (financeMap.get(task.id)?.qualityBondCredits ?? tierDefaults[task.requestedTier].bond), 0);
}

function buildDiscussionTree(
  comments: CommentRecord[],
  commentVotes: CommentVoteRecord[],
  profileMap: Map<string, ProfileSummary>,
  viewerProfileId?: string | null,
): DiscussionComment[] {
  const votesByComment = new Map<string, CommentVoteRecord[]>();
  for (const vote of commentVotes) {
    const bucket = votesByComment.get(vote.commentId) ?? [];
    bucket.push(vote);
    votesByComment.set(vote.commentId, bucket);
  }

  const mapped = new Map<string, DiscussionComment>();
  for (const comment of comments) {
    const votes = votesByComment.get(comment.id) ?? [];
    const profile = profileMap.get(comment.profileId);
    const upvotes = votes.filter((vote) => vote.value > 0).length;
    const downvotes = votes.filter((vote) => vote.value < 0).length;
    mapped.set(comment.id, {
      ...comment,
      profileName: profile?.name ?? "Unknown contributor",
      profileRole: profile?.role ?? "Unverified contributor",
      score: upvotes - downvotes,
      upvotes,
      downvotes,
      userVote: votes.find((vote) => vote.profileId === viewerProfileId)?.value ?? 0,
      replies: [],
    });
  }

  const roots: DiscussionComment[] = [];
  for (const comment of comments) {
    const mappedComment = mapped.get(comment.id);
    if (!mappedComment) {
      continue;
    }

    if (comment.parentId) {
      const parent = mapped.get(comment.parentId);
      if (parent) {
        parent.replies.push(mappedComment);
        continue;
      }
    }

    roots.push(mappedComment);
  }

  const sortComments = (items: DiscussionComment[]) => {
    items.sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.createdAt.localeCompare(right.createdAt);
    });
    items.forEach((item) => sortComments(item.replies));
  };

  sortComments(roots);
  return roots;
}

function sortTasks(tasks: TaskSummary[]) {
  const stageWeight: Record<TaskSummary["stage"], number> = {
    running: 5,
    voting: 4,
    scheduled: 3,
    review: 2,
    shipped: 1,
    blocked: 0,
  };

  return [...tasks].sort((left, right) => {
    const stageDelta = stageWeight[right.stage] - stageWeight[left.stage];
    if (stageDelta !== 0) {
      return stageDelta;
    }

    if (right.taskPulseScore !== left.taskPulseScore) {
      return right.taskPulseScore - left.taskPulseScore;
    }

    if (right.discussionCount !== left.discussionCount) {
      return right.discussionCount - left.discussionCount;
    }

    if (right.totalVotes !== left.totalVotes) {
      return right.totalVotes - left.totalVotes;
    }

    const tierDelta = tierWeight(right.allocatedTier) - tierWeight(left.allocatedTier);
    if (tierDelta !== 0) {
      return tierDelta;
    }

    return right.lastActivityAt.localeCompare(left.lastActivityAt);
  });
}

async function hydrate(viewerProfileId?: string | null) {
  const [profiles, profileAttestations, categories, tasks, finances, votes, pulseVotes, comments, commentVotes, runs, taskTimings, runUpdates, checkpoints, checkpointGates, governance, revenueStreams, treasuryEntries, sponsorshipCommitments] =
    await Promise.all([
      loadProfiles(),
      loadProfileAttestations(),
      loadCategories(),
      loadTasks(),
      loadTaskFinance(),
      loadVotes(),
      loadTaskPulseVotes(),
      loadComments(),
      loadCommentVotes(),
      loadRuns(),
      loadTaskTimings(),
      loadRunUpdates(),
      loadCheckpoints(),
      loadCheckpointGates(),
      loadGovernanceEvents(),
      loadRevenueStreams(),
      loadTreasuryEntries(),
      loadSponsorshipCommitments(),
    ]);

  const voteByTask = new Map<string, VoteRecord[]>();
  const voteByProfile = new Map<string, VoteRecord[]>();
  for (const vote of votes) {
    const taskBucket = voteByTask.get(vote.taskId) ?? [];
    taskBucket.push(vote);
    voteByTask.set(vote.taskId, taskBucket);

    const profileBucket = voteByProfile.get(vote.profileId) ?? [];
    profileBucket.push(vote);
    voteByProfile.set(vote.profileId, profileBucket);
  }

  const financeMap = new Map(finances.map((finance) => [finance.taskId, finance]));
  const attestationMap = new Map(profileAttestations.map((entry) => [entry.profileId, entry]));
  const profileSummaries: ProfileSummary[] = profiles.map((profile) => {
    const castVotes = voteByProfile.get(profile.id) ?? [];
    const voteCreditsSpent = spentCredits(castVotes);
    const bondedCredits = activeBondedCredits(profile.id, tasks, finances);
    const spent = voteCreditsSpent + bondedCredits;
    const attestation = attestationMap.get(profile.id);
    const createdAt = profile.createdAt ?? new Date().toISOString();
    const attestationStatus = attestation?.status ?? "review";
    const sybilRisk = attestation?.sybilRisk ?? "medium";
    const policy = resolveParticipationPolicy(attestationStatus, sybilRisk, profile.voiceCredits);
    return {
      ...profile,
      attestationLevel: profile.attestationLevel ?? "provisional",
      moderationStatus: profile.moderationStatus ?? "active",
      createdAt,
      attestationProvider: attestation?.provider ?? "Email + profile review",
      attestationStatus,
      sybilRisk,
      attestationSignals: attestation?.signals ?? ["Verified email", "Rate limits"],
      attestationReviewedAt: attestation?.reviewedAt ?? createdAt,
      attestationNote: attestation?.note ?? profile.attestation,
      participationState: policy.state,
      participationNote: policy.note,
      voiceMultiplier: policy.voiceMultiplier,
      effectiveVoiceCredits: policy.effectiveVoiceCredits,
      canSubmit: policy.canSubmit,
      canComment: policy.canComment,
      canPulse: policy.canPulse,
      canAllocateVoice: policy.canAllocateVoice,
      voteCreditsSpent,
      bondedCredits,
      spentCredits: spent,
      availableCredits: Math.max(policy.effectiveVoiceCredits - spent, 0),
    };
  });

  const profileMap = new Map(profileSummaries.map((profile) => [profile.id, profile]));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const runMap = new Map(runs.map((run) => [run.taskId, run]));
  const timingMap = new Map(taskTimings.map((timing) => [timing.taskId, timing]));

  const pulseByTask = new Map<string, TaskPulseVoteRecord[]>();
  for (const vote of pulseVotes) {
    const bucket = pulseByTask.get(vote.taskId) ?? [];
    bucket.push(vote);
    pulseByTask.set(vote.taskId, bucket);
  }

  const commentByTask = new Map<string, CommentRecord[]>();
  for (const comment of comments) {
    const bucket = commentByTask.get(comment.taskId) ?? [];
    bucket.push(comment);
    commentByTask.set(comment.taskId, bucket);
  }

  const runUpdatesByTask = new Map<string, RunUpdateRecord[]>();
  for (const update of runUpdates) {
    const bucket = runUpdatesByTask.get(update.taskId) ?? [];
    bucket.push(update);
    runUpdatesByTask.set(update.taskId, bucket);
  }

  const checkpointMap = new Map<string, CheckpointDetail[]>();
  const gateMap = new Map(checkpointGates.map((gate) => [gate.checkpointId, gate]));
  for (const checkpoint of checkpoints) {
    const gate = gateMap.get(checkpoint.id);
    const bucket = checkpointMap.get(checkpoint.taskId) ?? [];
    bucket.push({
      ...checkpoint,
      checkpointId: checkpoint.id,
      approvalScore: gate?.approvalScore ?? 0,
      requiredApprovals: gate?.requiredApprovals ?? 0,
      releaseStatus: gate?.releaseStatus ?? "pending",
    });
    checkpointMap.set(checkpoint.taskId, bucket);
  }

  const governanceByTask = new Map<string, GovernanceEventRecord[]>();
  for (const event of governance) {
    if (!event.taskId) {
      continue;
    }

    const bucket = governanceByTask.get(event.taskId) ?? [];
    bucket.push(event);
    governanceByTask.set(event.taskId, bucket);
  }

  const rankings = buildCategoryRankings(
    tasks.map((task) => ({
      id: task.id,
      categoryId: task.categoryId,
      title: task.title,
      createdAt: task.createdAt,
      totalVotes: (voteByTask.get(task.id) ?? []).reduce((total, vote) => total + vote.voteCount, 0),
      stage: task.stage,
      safetyStatus: task.safetyStatus,
    })),
  );

  const taskSummaries: TaskSummary[] = tasks.map((task) => {
    const finance = financeMap.get(task.id) ?? {
      taskId: task.id,
      qualityBondCredits: tierDefaults[task.requestedTier].bond,
      sponsorPoolUsd: 0,
      checkpointApprovalTarget: tierDefaults[task.requestedTier].checkpointTarget,
      enterprisePackaging: "Public output first, with an optional service version for groups that need support.",
      dataValueNote: "Corrections and audit traces remain useful public-good inputs.",
      sandboxCapitalUsd: 0,
      sandboxApiSpendUsd: 0,
      sandboxPilotUsers: 0,
      modelLineup: [],
      simulationSummary: "",
      sampleOutcome: "",
      sponsorAppeal: "",
    };
    const timing = timingMap.get(task.id) ?? {
      taskId: task.id,
      launchAt: null,
      startedAt: null,
      expectedMaxEndAt: null,
      computeHoursUsed: 0,
      completionMode: task.stage === "blocked" ? "blocked" : "planned",
      completionSummary: task.stage === "blocked" ? "Blocked before launch." : "Waiting for review and allocation.",
      updatedAt: task.createdAt,
    } satisfies TaskTimingRecord;
    const category = categoryMap.get(task.categoryId);
    const proposer = profileMap.get(task.proposerId);
    const taskVotes = voteByTask.get(task.id) ?? [];
    const pulse = pulseByTask.get(task.id) ?? [];
    const updates = runUpdatesByTask.get(task.id) ?? [];
    const governanceEvents = governanceByTask.get(task.id) ?? [];
    const taskComments = commentByTask.get(task.id) ?? [];
    const positivePulseCount = pulse.filter((vote) => vote.value > 0).length;
    const negativePulseCount = pulse.filter((vote) => vote.value < 0).length;
    const ranking = rankings.get(task.id);
    const userVote = taskVotes.find((vote) => vote.profileId === viewerProfileId);
    const userTaskPulse = pulse.find((vote) => vote.profileId === viewerProfileId)?.value ?? 0;
    const lastActivityAt = [
      task.createdAt,
      timing.updatedAt,
      ...taskVotes.map((vote) => vote.updatedAt),
      ...pulse.map((vote) => vote.updatedAt),
      ...taskComments.map((comment) => comment.createdAt),
      ...updates.map((update) => update.createdAt),
      ...governanceEvents.map((event) => event.createdAt),
    ].sort().at(-1) ?? task.createdAt;
    return {
      ...task,
      ...finance,
      categoryName: category?.name ?? "Unknown category",
      categorySlug: category?.slug ?? "unknown",
      proposerName: proposer?.name ?? "Unknown proposer",
      totalVotes: taskVotes.reduce((total, vote) => total + vote.voteCount, 0),
      supporterCount: taskVotes.length,
      categoryRank: ranking?.rank ?? null,
      allocatedTier: ranking?.tier ?? (task.safetyStatus === "blocked" ? "blocked" : "queued"),
      userVotes: userVote?.voteCount ?? 0,
      userCost: quadraticCost(userVote?.voteCount ?? 0),
      taskPulseScore: positivePulseCount - negativePulseCount,
      taskPulseVotes: pulse.length,
      positivePulseCount,
      negativePulseCount,
      userTaskPulse,
      discussionCount: taskComments.length,
      bondStatus: task.stage === "review" || task.stage === "blocked" ? "watch" : "secure",
      launchAt: timing.launchAt,
      startedAt: timing.startedAt,
      expectedMaxEndAt: timing.expectedMaxEndAt,
      computeHoursUsed: timing.computeHoursUsed,
      completionMode: timing.completionMode,
      completionSummary: timing.completionSummary,
      lastActivityAt,
      updateCount: updates.length,
      latestUpdateLabel: updates[0]?.label ?? null,
    };
  });

  const categorySummaries: CategorySummary[] = categories.map((category) => {
    const categoryTasks = taskSummaries.filter((task) => task.categoryId === category.id);
    return {
      ...category,
      proposalCount: categoryTasks.length,
      eligibleCount: categoryTasks.filter((task) => isEligibleForAllocation(task.totalVotes, task.stage, task.safetyStatus)).length,
      runningCount: categoryTasks.filter((task) => task.stage === "running").length,
      shippedCount: categoryTasks.filter((task) => task.stage === "shipped").length,
    };
  });

  const revenueSummaries = revenueStreams.map((stream) => summarizeRevenueStream(stream));
  const monthlyPublicBurnUsd = treasuryEntries
    .filter((entry) => entry.bucket === "compute-treasury" && entry.direction === "outflow")
    .reduce((total, entry) => total + entry.amountUsd, 0);
  const sponsorPoolsUsd = taskSummaries.reduce((total, task) => total + task.sponsorPoolUsd, 0);
  const economics = summarizeEconomics(
    revenueStreams,
    treasuryEntries,
    sponsorshipCommitments,
    monthlyPublicBurnUsd,
    sponsorPoolsUsd,
    env.KENMATCH_TREASURY_TARGET_MONTHS,
  );

  return {
    profiles: profileSummaries,
    profileMap,
    categories: categorySummaries,
    tasks: sortTasks(taskSummaries),
    votes,
    commentVotes,
    runMap,
    checkpointMap,
    governance,
    governanceByTask,
    revenueSummaries,
    treasuryEntries,
    sponsorshipCommitments,
    economics,
    runUpdatesByTask,
    viewer: viewerProfileId ? profileMap.get(viewerProfileId) ?? null : null,
    discussionFor(taskId: string) {
      return buildDiscussionTree(commentByTask.get(taskId) ?? [], commentVotes, profileMap, viewerProfileId);
    },
  };
}

export async function listProfiles() {
  return hydrate().then((snapshot) => snapshot.profiles);
}

export async function getViewerSessionByToken(token: string): Promise<ViewerSession | null> {
  if (!token) {
    return null;
  }

  const session = await findSessionByTokenHash(hashToken(token));
  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt) <= new Date()) {
    await deleteSessionByTokenHash(session.tokenHash);
    return null;
  }

  const account = await findAccountById(session.accountId);
  if (!account) {
    return null;
  }

  const snapshot = await hydrate(account.profileId);
  if (!snapshot.viewer) {
    return null;
  }

  return {
    account: { id: account.id, email: account.email, createdAt: account.createdAt, systemRole: account.systemRole ?? "contributor", emailVerified: Boolean(account.emailVerified) },
    profile: snapshot.viewer,
  };
}

export async function getHomeData(viewerProfileId?: string | null) {
  const snapshot = await hydrate(viewerProfileId);
  const metrics: HomepageMetrics = {
    proposals: snapshot.tasks.length,
    eligible: snapshot.tasks.filter((task) => isEligibleForAllocation(task.totalVotes, task.stage, task.safetyStatus)).length,
    activeRuns: snapshot.tasks.filter((task) => task.stage === "running").length,
    shipped: snapshot.tasks.filter((task) => task.stage === "shipped").length,
    voiceIssued: snapshot.profiles.reduce((total, profile) => total + profile.effectiveVoiceCredits, 0),
    voiceSpent: snapshot.profiles.reduce((total, profile) => total + profile.voteCreditsSpent, 0),
    bondedVoice: snapshot.profiles.reduce((total, profile) => total + profile.bondedCredits, 0),
    publicSignal: snapshot.tasks.reduce((total, task) => total + Math.max(task.taskPulseScore, 0), 0),
    treasuryMonthlyUsd: snapshot.economics.committedTreasuryMonthlyUsd,
  };

  return {
    viewer: snapshot.viewer,
    metrics,
    categories: snapshot.categories,
    featuredTasks: snapshot.tasks.slice(0, 4),
    contributors: [...snapshot.profiles].sort((left, right) => right.credibility - left.credibility).slice(0, 6),
    governance: snapshot.governance.slice(0, 6),
    economics: snapshot.economics,
    revenueStreams: snapshot.revenueSummaries.slice(0, 4),
  };
}

export async function getMarketplaceData(viewerProfileId: string | null | undefined, filters: MarketplaceFilters) {
  const snapshot = await hydrate(viewerProfileId);
  const queryTokens = (filters.query?.trim().toLowerCase() ?? "").split(/\s+/).filter(Boolean);
  const filtered = snapshot.tasks.filter((task) => {
    if (queryTokens.length > 0) {
      const haystack = [
        task.title,
        task.summary,
        task.problem,
        task.categoryName,
        task.enterprisePackaging,
        task.dataValueNote,
        task.simulationSummary,
        task.sampleOutcome,
        task.sponsorAppeal,
        ...task.modelLineup,
      ].join(" ").toLowerCase();
      if (!queryTokens.every((token) => haystack.includes(token))) {
        return false;
      }
    }
    if (filters.category && filters.category !== "all" && task.categorySlug !== filters.category) {
      return false;
    }
    if (filters.tier && filters.tier !== "all" && task.allocatedTier !== filters.tier) {
      return false;
    }
    if (filters.stage && filters.stage !== "all" && task.stage !== filters.stage) {
      return false;
    }
    return true;
  });

  const sort = filters.sort ?? "pulse";
  filtered.sort((a, b) => {
    switch (sort) {
      case "voice":
        return b.totalVotes - a.totalVotes;
      case "recent":
        return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return b.taskPulseScore - a.taskPulseScore;
    }
  });

  return {
    viewer: snapshot.viewer,
    categories: snapshot.categories,
    tasks: filtered,
  };
}

export async function getTaskDetail(slug: string, viewerProfileId?: string | null): Promise<TaskDetail | null> {
  const snapshot = await hydrate(viewerProfileId);
  const task = snapshot.tasks.find((candidate) => candidate.slug === slug);
  if (!task) {
    return null;
  }

  return {
    ...task,
    votes: snapshot.votes
      .filter((vote) => vote.taskId === task.id)
      .map((vote) => ({ ...vote, profileName: snapshot.profileMap.get(vote.profileId)?.name ?? "Unknown voter" }))
      .sort((left, right) => right.voteCount - left.voteCount),
    run: snapshot.runMap.get(task.id) ?? null,
    checkpoints: (snapshot.checkpointMap.get(task.id) ?? []).sort((left, right) => left.dueAt.localeCompare(right.dueAt)),
    governanceEvents: snapshot.governanceByTask.get(task.id) ?? [],
    comments: snapshot.discussionFor(task.id),
    runUpdates: snapshot.runUpdatesByTask.get(task.id) ?? [],
  };
}

export async function getGovernanceData(viewerProfileId?: string | null) {
  const snapshot = await hydrate(viewerProfileId);
  return {
    viewer: snapshot.viewer,
    governance: snapshot.governance,
    tasks: snapshot.tasks,
    blockedTasks: snapshot.tasks.filter((task) => task.allocatedTier === "blocked"),
    categories: snapshot.categories,
    profiles: snapshot.profiles,
  };
}

export async function getEconomicsData(viewerProfileId?: string | null): Promise<{
  viewer: ProfileSummary | null;
  summary: EconomicsSummary;
  revenueStreams: RevenueStreamSummary[];
  treasuryEntries: TreasuryEntryRecord[];
  sponsorshipCommitments: SponsorshipCommitmentRecord[];
  fundedTasks: TaskSummary[];
}> {
  const snapshot = await hydrate(viewerProfileId);
  const fundedTaskIds = new Set(snapshot.tasks.filter((task) => task.sponsorPoolUsd > 0).map((task) => task.id));
  return {
    viewer: snapshot.viewer,
    summary: snapshot.economics,
    revenueStreams: snapshot.revenueSummaries,
    treasuryEntries: snapshot.treasuryEntries,
    sponsorshipCommitments: snapshot.sponsorshipCommitments,
    fundedTasks: snapshot.tasks.filter((task) => fundedTaskIds.has(task.id)).slice(0, 8),
  };
}

export async function createAccount(input: {
  email: string;
  password: string;
  name: string;
  role: string;
  specialty: string;
  bio: string;
  licensingConsent: AccountRecord["licensingConsent"];
}) {
  const existing = await findAccountByEmail(input.email);
  if (existing) {
    throw new Error("An account with that email already exists.");
  }

  const now = new Date().toISOString();
  const profileId = await uniqueSlug("profiles", input.name);
  const accountId = randomUUID();
  const { passwordHash, passwordSalt } = createPasswordHash(input.password);

  await batch(
    [
      {
        sql: `INSERT INTO profiles (
          id, name, role, bio, specialty, attestation, attestationLevel, moderationStatus,
          voiceCredits, credibility, avatarHue, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          profileId,
          input.name,
          input.role,
          input.bio,
          input.specialty,
          "Self-attested contributor profile pending verification.",
          "provisional",
          "active",
          12,
          0.62,
          avatarHueFor(input.email),
          now,
        ],
      },
      {
        sql: "INSERT INTO profile_attestations (profileId, provider, status, sybilRisk, reviewedAt, signals, note) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [profileId, "Email + profile review", "review", "medium", now, serializeList(["Verified email", "Fresh profile", "Rate limits"]), "New accounts can read immediately and participate with provisional standing while review is pending."],
      },
      {
        sql: "INSERT INTO accounts (id, profileId, email, passwordHash, passwordSalt, licensingConsent, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [accountId, profileId, input.email.toLowerCase(), passwordHash, passwordSalt, input.licensingConsent, now],
      },
    ],
    "write",
  );

  return { accountId, profileId };
}

export async function authenticateAccount(email: string, password: string) {
  const account = await findAccountByEmail(email.toLowerCase());
  return account && verifyPassword(password, account.passwordHash, account.passwordSalt) ? account : null;
}

export async function updateProfile(profileId: string, input: {
  name: string;
  role: string;
  specialty: string;
  bio: string;
}) {
  await execute(
    "UPDATE profiles SET name = ?, role = ?, specialty = ?, bio = ? WHERE id = ?",
    [input.name, input.role, input.specialty, input.bio, profileId],
  );
}

export async function changePassword(accountId: string, newPassword: string) {
  const { passwordHash, passwordSalt } = createPasswordHash(newPassword);
  await execute(
    "UPDATE accounts SET passwordHash = ?, passwordSalt = ? WHERE id = ?",
    [passwordHash, passwordSalt, accountId],
  );
}

export async function updateLicensingConsent(accountId: string, consent: AccountRecord["licensingConsent"]) {
  await execute("UPDATE accounts SET licensingConsent = ? WHERE id = ?", [consent, accountId]);
}

export async function toggleBookmark(profileId: string, taskId: string): Promise<boolean> {
  const existing = await loadOne("SELECT id FROM bookmarks WHERE profileId = ? AND taskId = ?", [profileId, taskId]);
  if (existing) {
    await execute("DELETE FROM bookmarks WHERE id = ?", [getString(existing, "id")]);
    return false;
  }
  await execute("INSERT INTO bookmarks (id, profileId, taskId, createdAt) VALUES (?, ?, ?, ?)", [randomUUID(), profileId, taskId, new Date().toISOString()]);
  return true;
}

export async function getBookmarkedTaskIds(profileId: string): Promise<string[]> {
  const rows = await loadRows("SELECT taskId FROM bookmarks WHERE profileId = ? ORDER BY createdAt DESC", [profileId]);
  return rows.map((row) => getString(row, "taskId"));
}

export async function getSearchData() {
  const snapshot = await hydrate();
  return {
    kens: snapshot.tasks.map((t) => ({ slug: t.slug, title: t.title, summary: t.summary, categoryName: t.categoryName })),
    profiles: snapshot.profiles.map((p) => ({ id: p.id, name: p.name, role: p.role, specialty: p.specialty })),
    governance: snapshot.governance.map((g) => ({ id: g.id, title: g.title, decision: g.decision, house: g.house })),
    categories: snapshot.categories.map((c) => ({ slug: c.slug, name: c.name, description: c.description })),
  };
}

export async function getProfileBySlug(slug: string): Promise<ProfileSummary | null> {
  const snapshot = await hydrate();
  return snapshot.profiles.find((p) => p.id === slug || p.name.toLowerCase().replace(/\s+/g, "-") === slug) ?? null;
}

export async function getProfileActivity(profileId: string) {
  const snapshot = await hydrate(profileId);
  const proposedTasks = snapshot.tasks.filter((t) => t.proposerId === profileId);
  const votes = snapshot.votes
    .filter((v) => v.profileId === profileId)
    .map((v) => {
      const task = snapshot.tasks.find((t) => t.id === v.taskId);
      return { ...v, taskTitle: task?.title ?? "Unknown Ken" };
    });
  return { proposedTasks, votes, profile: snapshot.profileMap.get(profileId) ?? null };
}

export async function createSession(accountId: string) {
  const token = randomBytes(24).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + env.KENMATCH_SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await execute("INSERT INTO sessions (id, accountId, tokenHash, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)", [
    randomUUID(),
    accountId,
    hashToken(token),
    expiresAt,
    now.toISOString(),
  ]);
  return { token, expiresAt };
}

export async function deleteSessionByTokenHash(tokenHash: string) {
  await execute("DELETE FROM sessions WHERE tokenHash = ?", [tokenHash]);
}

export async function deleteSessionByToken(token: string) {
  if (token) {
    await deleteSessionByTokenHash(hashToken(token));
  }
}

export interface CreateProposalInput {
  title: string;
  categorySlug: string;
  summary: string;
  problem: string;
  whyNow: string;
  publicBenefit: string;
  requestedTier: TaskRecord["requestedTier"];
  deliverables: string[];
  evaluationCriteria: string[];
  riskFlags: string[];
  evidence: string[];
  enterprisePackaging: string;
  dataValueNote: string;
}

export async function createProposal(input: CreateProposalInput, proposerId: string) {
  const profile = await findProfileById(proposerId);
  if (!profile) {
    throw new Error("Contributor profile not found.");
  }

  const category = await findCategoryBySlug(input.categorySlug);
  if (!category) {
    throw new Error("Unknown category.");
  }

  const snapshot = await hydrate(proposerId);
  const proposerSummary = snapshot.viewer ?? snapshot.profiles.find((profileEntry) => profileEntry.id === proposerId) ?? null;
  if (!proposerSummary) {
    throw new Error("Contributor profile not found.");
  }
  if (!proposerSummary.canSubmit) {
    throw new Error(proposerSummary.participationNote);
  }

  const defaults = tierDefaults[input.requestedTier];
  if (proposerSummary.availableCredits < defaults.bond) {
    throw new Error(`Submitting a ${input.requestedTier} Ken requires ${defaults.bond} free voice credits for the quality bond.`);
  }

  const slug = await uniqueSlug("tasks", input.title);
  const now = new Date().toISOString();

  await batch(
    [
      {
        sql: `INSERT INTO tasks (
          id, slug, categoryId, proposerId, title, summary, problem, whyNow, publicBenefit,
          deliverables, evaluationCriteria, riskFlags, evidence, requestedTier, stage, safetyStatus,
          budgetUsd, runtimeHours, backend, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          slug,
          slug,
          category.id,
          proposerId,
          input.title,
          input.summary,
          input.problem,
          input.whyNow,
          input.publicBenefit,
          serializeList(input.deliverables),
          serializeList(input.evaluationCriteria),
          serializeList(input.riskFlags),
          serializeList(input.evidence),
          input.requestedTier,
          "review",
          "pending",
          defaults.budgetUsd,
          defaults.runtimeHours,
          "Pending safety review and execution routing",
          now,
        ],
      },
      {
        sql: `INSERT INTO task_finance (
          taskId, qualityBondCredits, sponsorPoolUsd, checkpointApprovalTarget, enterprisePackaging, dataValueNote,
          sandboxCapitalUsd, sandboxApiSpendUsd, sandboxPilotUsers, modelLineup, simulationSummary, sampleOutcome, sponsorAppeal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          slug,
          defaults.bond,
          0,
          defaults.checkpointTarget,
          input.enterprisePackaging,
          input.dataValueNote,
          0,
          0,
          0,
          serializeList([]),
          "",
          "",
          "",
        ],
      },
      {
        sql: "INSERT INTO task_timings (taskId, launchAt, startedAt, expectedMaxEndAt, computeHoursUsed, completionMode, completionSummary, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        args: [slug, null, null, null, 0, "planned", "Waiting for review, public signal, and allocation.", now],
      },
      {
        sql: "INSERT INTO governance_events (id, taskId, house, title, decision, outcome, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [
          randomUUID(),
          slug,
          "safety-council",
          "Queued for safety review",
          "New Ken entered the public intake queue. It can collect signal, comments, and quadratic support immediately, but execution remains gated until safety review and checkpoint policy are set.",
          "Visible on the public board with its quality bond locked until the review state changes.",
          now,
        ],
      },
    ],
    "write",
  );

  return slug;
}

export async function saveVote(taskId: string, profileId: string, voteCount: number, rationale: string) {
  if (!Number.isInteger(voteCount) || voteCount < 0 || voteCount > MAX_VOTES_PER_TASK) {
    throw new Error(`Votes must be between 0 and ${MAX_VOTES_PER_TASK}.`);
  }

  const task = await findTaskById(taskId);
  if (!task) {
    throw new Error("Ken not found.");
  }
  if (task.stage === "blocked" || task.safetyStatus === "blocked") {
    throw new Error("Blocked Kens cannot receive quadratic support.");
  }

  const snapshot = await hydrate(profileId);
  if (!snapshot.viewer) {
    throw new Error("Authenticated contributor session required.");
  }
  if (!snapshot.viewer.canAllocateVoice) {
    throw new Error(snapshot.viewer.participationNote);
  }

  const existingVotes = snapshot.votes.filter((vote) => vote.profileId === profileId);
  const existingVote = existingVotes.find((vote) => vote.taskId === taskId);
  const otherVotes = existingVotes.filter((vote) => vote.taskId !== taskId);
  const nextSpent = spentCredits(otherVotes) + quadraticCost(voteCount) + snapshot.viewer.bondedCredits;
  if (nextSpent > snapshot.viewer.effectiveVoiceCredits) {
    throw new Error("Not enough free voice credits for that allocation.");
  }

  const now = new Date().toISOString();
  if (existingVote && voteCount === 0) {
    await execute("DELETE FROM votes WHERE taskId = ? AND profileId = ?", [taskId, profileId]);
    return;
  }
  if (existingVote) {
    await execute("UPDATE votes SET voteCount = ?, rationale = ?, updatedAt = ? WHERE taskId = ? AND profileId = ?", [voteCount, rationale, now, taskId, profileId]);
    return;
  }
  if (voteCount > 0) {
    await execute("INSERT INTO votes (id, taskId, profileId, voteCount, rationale, updatedAt) VALUES (?, ?, ?, ?, ?, ?)", [randomUUID(), taskId, profileId, voteCount, rationale, now]);
  }
}

export async function saveTaskPulse(taskId: string, profileId: string, value: -1 | 0 | 1) {
  const task = await findTaskById(taskId);
  if (!task) {
    throw new Error("Ken not found.");
  }
  if (task.stage === "blocked" || task.safetyStatus === "blocked") {
    throw new Error("Blocked Kens stay visible, but public voting is frozen.");
  }

  const snapshot = await hydrate(profileId);
  if (!snapshot.viewer) {
    throw new Error("Authenticated contributor session required.");
  }
  if (!snapshot.viewer.canPulse) {
    throw new Error(snapshot.viewer.participationNote);
  }

  const existing = await loadOne("SELECT * FROM task_pulse_votes WHERE taskId = ? AND profileId = ? LIMIT 1", [taskId, profileId]);
  if (value === 0) {
    if (existing) {
      await execute("DELETE FROM task_pulse_votes WHERE taskId = ? AND profileId = ?", [taskId, profileId]);
    }
    return;
  }

  const now = new Date().toISOString();
  if (existing) {
    await execute("UPDATE task_pulse_votes SET value = ?, updatedAt = ? WHERE taskId = ? AND profileId = ?", [value, now, taskId, profileId]);
    return;
  }

  await execute("INSERT INTO task_pulse_votes (id, taskId, profileId, value, updatedAt) VALUES (?, ?, ?, ?, ?)", [randomUUID(), taskId, profileId, value, now]);
}

export async function createComment(input: {
  taskId: string;
  profileId: string;
  parentId?: string | null;
  body: string;
  stakeCredits: number;
}) {
  if (!(await findTaskById(input.taskId))) {
    throw new Error("Ken not found.");
  }

  const snapshot = await hydrate(input.profileId);
  if (!snapshot.viewer) {
    throw new Error("Authenticated contributor session required.");
  }
  if (!snapshot.viewer.canComment) {
    throw new Error(snapshot.viewer.participationNote);
  }

  if (input.parentId) {
    const parent = await loadOne("SELECT taskId FROM comments WHERE id = ? LIMIT 1", [input.parentId]);
    if (!parent || getString(parent, "taskId") !== input.taskId) {
      throw new Error("Reply target not found on this Ken.");
    }
  }

  await execute("INSERT INTO comments (id, taskId, profileId, parentId, body, stakeCredits, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)", [
    randomUUID(),
    input.taskId,
    input.profileId,
    input.parentId ?? null,
    input.body,
    Math.max(1, Math.min(input.stakeCredits, 3)),
    new Date().toISOString(),
  ]);
}

export async function saveCommentVote(commentId: string, profileId: string, value: -1 | 0 | 1) {
  const comment = await loadOne("SELECT id FROM comments WHERE id = ? LIMIT 1", [commentId]);
  if (!comment) {
    throw new Error("Comment not found.");
  }

  const snapshot = await hydrate(profileId);
  if (!snapshot.viewer) {
    throw new Error("Authenticated contributor session required.");
  }
  if (!snapshot.viewer.canComment) {
    throw new Error(snapshot.viewer.participationNote);
  }

  const existing = await loadOne("SELECT * FROM comment_votes WHERE commentId = ? AND profileId = ? LIMIT 1", [commentId, profileId]);
  if (value === 0) {
    if (existing) {
      await execute("DELETE FROM comment_votes WHERE commentId = ? AND profileId = ?", [commentId, profileId]);
    }
    return;
  }

  const now = new Date().toISOString();
  if (existing) {
    await execute("UPDATE comment_votes SET value = ?, updatedAt = ? WHERE commentId = ? AND profileId = ?", [value, now, commentId, profileId]);
    return;
  }

  await execute("INSERT INTO comment_votes (id, commentId, profileId, value, updatedAt) VALUES (?, ?, ?, ?, ?)", [randomUUID(), commentId, profileId, value, now]);
}

function bucketStartIso(windowSeconds: number, reference = Date.now()) {
  const windowMs = windowSeconds * 1000;
  return new Date(Math.floor(reference / windowMs) * windowMs).toISOString();
}

export async function consumeRateLimit(input: {
  scope: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
}) {
  const now = Date.now();
  const bucketStart = bucketStartIso(input.windowSeconds, now);
  const bucketCutoff = new Date(now - input.windowSeconds * 3 * 1000).toISOString();
  await execute("DELETE FROM request_rate_limits WHERE updatedAt < ?", [bucketCutoff]);

  const existing = await loadOne(
    "SELECT count FROM request_rate_limits WHERE scope = ? AND identifier = ? AND bucketStart = ? LIMIT 1",
    [input.scope, input.identifier, bucketStart],
  );
  const current = existing ? getNumber(existing, "count") : 0;
  const resetAt = new Date(new Date(bucketStart).getTime() + input.windowSeconds * 1000).toISOString();

  if (current >= input.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      count: current,
    };
  }

  if (existing) {
    await execute(
      "UPDATE request_rate_limits SET count = ?, updatedAt = ? WHERE scope = ? AND identifier = ? AND bucketStart = ?",
      [current + 1, new Date(now).toISOString(), input.scope, input.identifier, bucketStart],
    );
  } else {
    await execute(
      "INSERT INTO request_rate_limits (scope, identifier, bucketStart, count, updatedAt) VALUES (?, ?, ?, ?, ?)",
      [input.scope, input.identifier, bucketStart, 1, new Date(now).toISOString()],
    );
  }

  return {
    allowed: true,
    remaining: Math.max(input.limit - (current + 1), 0),
    resetAt,
    count: current + 1,
  };
}

export async function logSecurityEvent(input: {
  eventType: string;
  detail: string;
  ipAddress?: string | null;
  actorId?: string | null;
}) {
  await execute(
    "INSERT INTO security_events (id, eventType, ipAddress, actorId, detail, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    [randomUUID(), input.eventType, input.ipAddress ?? null, input.actorId ?? null, input.detail, new Date().toISOString()],
  );
}

export async function resolveSponsorRestrictionTarget(
  scope: SponsorshipCommitmentRecord["restrictionScope"],
  targetId?: string | null,
) {
  if (scope === "general") {
    return { id: null, label: "Shared compute treasury" };
  }

  if (scope === "safety-reserve") {
    return { id: "safety-reserve", label: "Safety and audit reserve" };
  }

  if (!targetId) {
    throw new Error("Choose where the sponsorship should be restricted.");
  }

  if (scope === "ken") {
    const task = await findTaskById(targetId);
    if (!task) {
      throw new Error("Selected Ken was not found.");
    }
    return { id: task.id, label: task.title };
  }

  const category = await loadOne("SELECT id, name FROM categories WHERE id = ? OR slug = ? LIMIT 1", [targetId, targetId]);
  if (!category) {
    throw new Error("Selected category was not found.");
  }

  return { id: getString(category, "id"), label: getString(category, "name") };
}

async function applySponsorshipTreasuryEffects(commitment: SponsorshipCommitmentRecord) {
  const entryId = `treasury-sponsor-${commitment.id}`;
  const existing = await loadOne("SELECT id FROM treasury_entries WHERE id = ? LIMIT 1", [entryId]);
  if (existing) {
    return;
  }

  const bucket = commitment.restrictionScope === "safety-reserve" ? "safety-reserve" : "compute-treasury";
  const restrictionMode = commitment.restrictionScope === "general" ? "unrestricted" : "restricted";
  const targetLabel = commitment.restrictionTargetLabel ?? "Shared compute treasury";

  await execute(
    `INSERT INTO treasury_entries (
      id, streamId, title, description, bucket, direction, amountUsd, fundingState,
      restrictionMode, restrictionScope, restrictionTargetId, restrictionTargetLabel, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entryId,
      "revenue-4",
      `Sponsor contribution from ${commitment.sponsorName}`,
      commitment.note || `Sponsored contribution reserved for ${targetLabel}.`,
      bucket,
      "inflow",
      commitment.amountUsd,
      commitment.fundingState,
      restrictionMode,
      commitment.restrictionScope,
      commitment.restrictionTargetId,
      targetLabel,
      commitment.paidAt ?? commitment.updatedAt,
    ],
  );

  if (commitment.restrictionScope === "ken" && commitment.restrictionTargetId) {
    await execute("UPDATE task_finance SET sponsorPoolUsd = sponsorPoolUsd + ? WHERE taskId = ?", [
      commitment.amountUsd,
      commitment.restrictionTargetId,
    ]);
  }
}

export async function createSponsorshipCommitment(input: {
  sponsorName: string;
  sponsorType: SponsorshipCommitmentRecord["sponsorType"];
  sponsorContact: string;
  note: string;
  amountUsd: number;
  fundingState: SponsorshipCommitmentRecord["fundingState"];
  status: SponsorshipCommitmentRecord["status"];
  restrictionScope: SponsorshipCommitmentRecord["restrictionScope"];
  restrictionTargetId?: string | null;
  restrictionTargetLabel?: string | null;
  checkoutSessionId?: string | null;
}) {
  const now = new Date().toISOString();
  const commitment: SponsorshipCommitmentRecord = {
    id: randomUUID(),
    sponsorName: input.sponsorName,
    sponsorType: input.sponsorType,
    sponsorContact: input.sponsorContact,
    note: input.note,
    amountUsd: input.amountUsd,
    fundingState: input.fundingState,
    status: input.status,
    restrictionScope: input.restrictionScope,
    restrictionTargetId: input.restrictionTargetId ?? null,
    restrictionTargetLabel: input.restrictionTargetLabel ?? null,
    checkoutSessionId: input.checkoutSessionId ?? null,
    createdAt: now,
    updatedAt: now,
    paidAt: input.status === "paid" ? now : null,
  };

  await execute(
    `INSERT INTO sponsorship_commitments (
      id, sponsorName, sponsorType, sponsorContact, note, amountUsd, fundingState, status,
      restrictionScope, restrictionTargetId, restrictionTargetLabel, checkoutSessionId, createdAt, updatedAt, paidAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      commitment.id,
      commitment.sponsorName,
      commitment.sponsorType,
      commitment.sponsorContact,
      commitment.note,
      commitment.amountUsd,
      commitment.fundingState,
      commitment.status,
      commitment.restrictionScope,
      commitment.restrictionTargetId,
      commitment.restrictionTargetLabel,
      commitment.checkoutSessionId,
      commitment.createdAt,
      commitment.updatedAt,
      commitment.paidAt,
    ],
  );

  if (commitment.status === "paid") {
    await applySponsorshipTreasuryEffects(commitment);
  }

  return commitment;
}

export async function bindSponsorshipCheckoutSession(commitmentId: string, checkoutSessionId: string) {
  const now = new Date().toISOString();
  await execute(
    "UPDATE sponsorship_commitments SET checkoutSessionId = ?, status = 'checkout', updatedAt = ? WHERE id = ?",
    [checkoutSessionId, now, commitmentId],
  );
}

export async function markSponsorshipCheckoutPaid(checkoutSessionId: string) {
  const row = await loadOne("SELECT * FROM sponsorship_commitments WHERE checkoutSessionId = ? LIMIT 1", [checkoutSessionId]);
  if (!row) {
    return null;
  }

  const now = new Date().toISOString();
  await execute(
    "UPDATE sponsorship_commitments SET fundingState = 'committed', status = 'paid', paidAt = ?, updatedAt = ? WHERE checkoutSessionId = ?",
    [now, now, checkoutSessionId],
  );
  const updatedRow = await loadOne("SELECT * FROM sponsorship_commitments WHERE checkoutSessionId = ? LIMIT 1", [checkoutSessionId]);
  const commitment = updatedRow ? mapSponsorshipCommitment(updatedRow) : null;
  if (commitment) {
    await applySponsorshipTreasuryEffects(commitment);
  }
  return commitment;
}

export async function getHealthSummary() {
  await ensureDatabase();
  const counts = await Promise.all([
    loadRows("SELECT COUNT(*) AS count FROM profiles"),
    loadRows("SELECT COUNT(*) AS count FROM tasks"),
    loadRows("SELECT COUNT(*) AS count FROM votes"),
    loadRows("SELECT COUNT(*) AS count FROM comments"),
  ]);

  return {
    ok: true,
    databaseMode: databaseUrl.startsWith("file:") ? "local-file" : "remote-libsql",
    profileCount: getCount(counts[0]),
    taskCount: getCount(counts[1]),
    voteCount: getCount(counts[2]),
    commentCount: getCount(counts[3]),
    checkedAt: new Date().toISOString(),
  };
}




