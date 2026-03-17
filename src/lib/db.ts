import "server-only";

import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

import { createClient, type Client, type InStatement, type Value } from "@libsql/client";

import {
  buildCategoryRankings,
  isEligibleForAllocation,
  MAX_VOTES_PER_TASK,
  quadraticCost,
  spentCredits,
  tierWeight,
} from "@/lib/allocation";
import { summarizeEconomics, summarizeRevenueStream } from "@/lib/economics";
<<<<<<< HEAD
import { env } from "@/lib/env";
=======
>>>>>>> origin/main
import {
  seedCategories,
  seedCheckpointGates,
  seedCheckpoints,
  seedCommentVotes,
  seedComments,
  seedGovernanceEvents,
  seedProfiles,
  seedRevenueStreams,
  seedRuns,
  seedTaskFinance,
  seedTaskPulseVotes,
  seedTasks,
  seedTreasuryEntries,
  seedVotes,
} from "@/lib/seed";
import {
  seedCheckpointGates,
  seedComments,
  seedCommentVotes,
  seedRevenueStreams,
  seedTaskFinance,
  seedTaskPulseVotes,
  seedTreasuryEntries,
} from "@/lib/seed-plus";
import type {
  AccountRecord,
  CategorySummary,
  CheckpointDetail,
<<<<<<< HEAD
=======
  CheckpointGateRecord,
  CheckpointRecord,
>>>>>>> origin/main
  CommentRecord,
  CommentVoteRecord,
  ComputeRunRecord,
  DiscussionComment,
<<<<<<< HEAD
  EconomicsSummary,
=======
>>>>>>> origin/main
  GovernanceEventRecord,
  HomepageMetrics,
  MarketplaceFilters,
  ProfileRecord,
  ProfileSummary,
  RevenueStreamRecord,
<<<<<<< HEAD
  RevenueStreamSummary,
  SessionRecord,
=======
  SafetyStatus,
>>>>>>> origin/main
  TaskDetail,
  TaskFinanceRecord,
  TaskPulseVoteRecord,
  TaskRecord,
  TaskSummary,
  TreasuryEntryRecord,
<<<<<<< HEAD
  ViewerSession,
=======
>>>>>>> origin/main
  VoteRecord,
} from "@/lib/types";

type DbRow = Record<string, Value>;

<<<<<<< HEAD
const databaseFilePath = join(process.cwd(), env.KENMATCH_DB_FILE);
const databaseUrl = env.DATABASE_URL?.trim() || `file:${databaseFilePath.replace(/\\/g, "/")}`;

const tierDefaults = {
  days: { bond: 1, checkpointTarget: 8, budgetUsd: 4_000, runtimeHours: 36 },
  weeks: { bond: 2, checkpointTarget: 14, budgetUsd: 12_000, runtimeHours: 144 },
  months: { bond: 5, checkpointTarget: 24, budgetUsd: 32_000, runtimeHours: 720 },
} as const;
=======
type SqlRecord = Record<string, string | number | null>;
>>>>>>> origin/main

declare global {
  var __kenmatchDbClient: Client | undefined;
  var __kenmatchDbReady: Promise<void> | undefined;
}

<<<<<<< HEAD
function ensureDatabaseDirectory() {
  if (!databaseUrl.startsWith("file:")) {
    return;
  }

  const directory = dirname(databaseFilePath);
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
=======
const databasePath = join(process.cwd(), "data", "kenmatch.sqlite");

function asSqlRecord<T>(value: T): SqlRecord {
  return value as unknown as SqlRecord;
}

function parseList(value: string): string[] {
  return JSON.parse(value) as string[];
}

function serializeList(value: string[]): string {
  return JSON.stringify(value);
}

function statement(sql: string) {
  const prepared = getDatabase().prepare(sql);
  prepared.setAllowBareNamedParameters(true);
  return prepared;
}

function withTransaction<T>(work: () => T): T {
  const db = getDatabase();
  db.exec("BEGIN");

  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function initializeDatabase(db: DatabaseSync) {
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      bio TEXT NOT NULL,
      specialty TEXT NOT NULL,
      attestation TEXT NOT NULL,
      voiceCredits INTEGER NOT NULL,
      credibility REAL NOT NULL,
      avatarHue INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      thesis TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
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
    );

    CREATE TABLE IF NOT EXISTS task_finance (
      taskId TEXT PRIMARY KEY,
      qualityBondCredits INTEGER NOT NULL,
      sponsorPoolUsd INTEGER NOT NULL,
      checkpointApprovalTarget INTEGER NOT NULL,
      enterprisePackaging TEXT NOT NULL,
      dataValueNote TEXT NOT NULL,
      FOREIGN KEY (taskId) REFERENCES tasks(id)
    );

    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      profileId TEXT NOT NULL,
      voteCount INTEGER NOT NULL,
      rationale TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE(taskId, profileId),
      FOREIGN KEY (taskId) REFERENCES tasks(id),
      FOREIGN KEY (profileId) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS task_pulse_votes (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      profileId TEXT NOT NULL,
      value INTEGER NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE(taskId, profileId),
      FOREIGN KEY (taskId) REFERENCES tasks(id),
      FOREIGN KEY (profileId) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS runs (
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
    );

    CREATE TABLE IF NOT EXISTS checkpoints (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      label TEXT NOT NULL,
      status TEXT NOT NULL,
      detail TEXT NOT NULL,
      dueAt TEXT NOT NULL,
      FOREIGN KEY (taskId) REFERENCES tasks(id)
    );

    CREATE TABLE IF NOT EXISTS checkpoint_gates (
      checkpointId TEXT PRIMARY KEY,
      approvalScore INTEGER NOT NULL,
      requiredApprovals INTEGER NOT NULL,
      releaseStatus TEXT NOT NULL,
      FOREIGN KEY (checkpointId) REFERENCES checkpoints(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
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
    );

    CREATE TABLE IF NOT EXISTS comment_votes (
      id TEXT PRIMARY KEY,
      commentId TEXT NOT NULL,
      profileId TEXT NOT NULL,
      value INTEGER NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE(commentId, profileId),
      FOREIGN KEY (commentId) REFERENCES comments(id),
      FOREIGN KEY (profileId) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS governance_events (
      id TEXT PRIMARY KEY,
      taskId TEXT,
      house TEXT NOT NULL,
      title TEXT NOT NULL,
      decision TEXT NOT NULL,
      outcome TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (taskId) REFERENCES tasks(id)
    );

    CREATE TABLE IF NOT EXISTS revenue_streams (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      engine TEXT NOT NULL,
      description TEXT NOT NULL,
      pricingModel TEXT NOT NULL,
      status TEXT NOT NULL,
      monthlyRevenueUsd INTEGER NOT NULL,
      grossMargin REAL NOT NULL,
      treasurySharePercent INTEGER NOT NULL,
      founderSharePercent INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS treasury_entries (
      id TEXT PRIMARY KEY,
      streamId TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      bucket TEXT NOT NULL,
      direction TEXT NOT NULL,
      amountUsd INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (streamId) REFERENCES revenue_streams(id)
    );
  `);

  withTransaction(() => {
    const insertProfile = statement(`
      INSERT OR IGNORE INTO profiles (id, name, role, bio, specialty, attestation, voiceCredits, credibility, avatarHue)
      VALUES (:id, :name, :role, :bio, :specialty, :attestation, :voiceCredits, :credibility, :avatarHue)
    `);
    const insertCategory = statement(`
      INSERT OR IGNORE INTO categories (id, slug, name, description, thesis)
      VALUES (:id, :slug, :name, :description, :thesis)
    `);
    const insertTask = statement(`
      INSERT OR IGNORE INTO tasks (
        id, slug, categoryId, proposerId, title, summary, problem, whyNow, publicBenefit,
        deliverables, evaluationCriteria, riskFlags, evidence, requestedTier, stage, safetyStatus,
        budgetUsd, runtimeHours, backend, createdAt
      ) VALUES (
        :id, :slug, :categoryId, :proposerId, :title, :summary, :problem, :whyNow, :publicBenefit,
        :deliverables, :evaluationCriteria, :riskFlags, :evidence, :requestedTier, :stage, :safetyStatus,
        :budgetUsd, :runtimeHours, :backend, :createdAt
      )
    `);
    const insertTaskFinance = statement(`
      INSERT OR IGNORE INTO task_finance (
        taskId, qualityBondCredits, sponsorPoolUsd, checkpointApprovalTarget, enterprisePackaging, dataValueNote
      ) VALUES (
        :taskId, :qualityBondCredits, :sponsorPoolUsd, :checkpointApprovalTarget, :enterprisePackaging, :dataValueNote
      )
    `);
    const insertVote = statement(`
      INSERT OR IGNORE INTO votes (id, taskId, profileId, voteCount, rationale, updatedAt)
      VALUES (:id, :taskId, :profileId, :voteCount, :rationale, :updatedAt)
    `);
    const insertTaskPulse = statement(`
      INSERT OR IGNORE INTO task_pulse_votes (id, taskId, profileId, value, updatedAt)
      VALUES (:id, :taskId, :profileId, :value, :updatedAt)
    `);
    const insertRun = statement(`
      INSERT OR IGNORE INTO runs (
        id, taskId, status, backend, budgetUsd, runtimeHours, checkpointCadenceHours, reproducibilityNotes, rollbackPlan
      ) VALUES (
        :id, :taskId, :status, :backend, :budgetUsd, :runtimeHours, :checkpointCadenceHours, :reproducibilityNotes, :rollbackPlan
      )
    `);
    const insertCheckpoint = statement(`
      INSERT OR IGNORE INTO checkpoints (id, taskId, label, status, detail, dueAt)
      VALUES (:id, :taskId, :label, :status, :detail, :dueAt)
    `);
    const insertCheckpointGate = statement(`
      INSERT OR IGNORE INTO checkpoint_gates (checkpointId, approvalScore, requiredApprovals, releaseStatus)
      VALUES (:checkpointId, :approvalScore, :requiredApprovals, :releaseStatus)
    `);
    const insertComment = statement(`
      INSERT OR IGNORE INTO comments (id, taskId, profileId, parentId, body, stakeCredits, createdAt)
      VALUES (:id, :taskId, :profileId, :parentId, :body, :stakeCredits, :createdAt)
    `);
    const insertCommentVote = statement(`
      INSERT OR IGNORE INTO comment_votes (id, commentId, profileId, value, updatedAt)
      VALUES (:id, :commentId, :profileId, :value, :updatedAt)
    `);
    const insertGovernance = statement(`
      INSERT OR IGNORE INTO governance_events (id, taskId, house, title, decision, outcome, createdAt)
      VALUES (:id, :taskId, :house, :title, :decision, :outcome, :createdAt)
    `);
    const insertRevenueStream = statement(`
      INSERT OR IGNORE INTO revenue_streams (
        id, slug, name, engine, description, pricingModel, status,
        monthlyRevenueUsd, grossMargin, treasurySharePercent, founderSharePercent
      ) VALUES (
        :id, :slug, :name, :engine, :description, :pricingModel, :status,
        :monthlyRevenueUsd, :grossMargin, :treasurySharePercent, :founderSharePercent
      )
    `);
    const insertTreasuryEntry = statement(`
      INSERT OR IGNORE INTO treasury_entries (id, streamId, title, description, bucket, direction, amountUsd, createdAt)
      VALUES (:id, :streamId, :title, :description, :bucket, :direction, :amountUsd, :createdAt)
    `);

    seedProfiles.forEach((profile) => insertProfile.run(asSqlRecord(profile)));
    seedCategories.forEach((category) => insertCategory.run(asSqlRecord(category)));
    seedTasks.forEach((task) => {
      insertTask.run(
        asSqlRecord({
          ...task,
          deliverables: serializeList(task.deliverables),
          evaluationCriteria: serializeList(task.evaluationCriteria),
          riskFlags: serializeList(task.riskFlags),
          evidence: serializeList(task.evidence),
        }),
      );
    });
    seedTaskFinance.forEach((row) => insertTaskFinance.run(asSqlRecord(row)));
    seedVotes.forEach((vote) => insertVote.run(asSqlRecord(vote)));
    seedTaskPulseVotes.forEach((vote) => insertTaskPulse.run(asSqlRecord(vote)));
    seedRuns.forEach((run) => insertRun.run(asSqlRecord(run)));
    seedCheckpoints.forEach((checkpoint) => insertCheckpoint.run(asSqlRecord(checkpoint)));
    seedCheckpointGates.forEach((gate) => insertCheckpointGate.run(asSqlRecord(gate)));
    seedComments.forEach((comment) => insertComment.run(asSqlRecord(comment)));
    seedCommentVotes.forEach((vote) => insertCommentVote.run(asSqlRecord(vote)));
    seedGovernanceEvents.forEach((event) => insertGovernance.run(asSqlRecord(event)));
    seedRevenueStreams.forEach((stream) => insertRevenueStream.run(asSqlRecord(stream)));
    seedTreasuryEntries.forEach((entry) => insertTreasuryEntry.run(asSqlRecord(entry)));
  });
>>>>>>> origin/main
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

  return JSON.parse(value) as string[];
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
        createdAt TEXT NOT NULL,
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
        founderSharePercent INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS treasury_entries (
        id TEXT PRIMARY KEY,
        streamId TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        bucket TEXT NOT NULL,
        direction TEXT NOT NULL,
        amountUsd INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (streamId) REFERENCES revenue_streams(id)
      )`,
      "CREATE INDEX IF NOT EXISTS idx_votes_profileId ON votes(profileId)",
      "CREATE INDEX IF NOT EXISTS idx_votes_taskId ON votes(taskId)",
      "CREATE INDEX IF NOT EXISTS idx_tasks_categoryId ON tasks(categoryId)",
      "CREATE INDEX IF NOT EXISTS idx_comments_taskId ON comments(taskId)",
      "CREATE INDEX IF NOT EXISTS idx_comment_votes_commentId ON comment_votes(commentId)",
      "CREATE INDEX IF NOT EXISTS idx_sessions_tokenHash ON sessions(tokenHash)",
      "CREATE INDEX IF NOT EXISTS idx_task_pulse_votes_taskId ON task_pulse_votes(taskId)",
    ],
    "write",
  );

  const profileCount = getCount(await loadRows("SELECT COUNT(*) AS count FROM profiles"));
  if (profileCount > 0) {
    return;
  }

  await seedDatabase();
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
      sql: `INSERT OR IGNORE INTO profiles (
        id, name, role, bio, specialty, attestation, attestationLevel, moderationStatus,
        voiceCredits, credibility, avatarHue, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

  const categoryStatements = seedCategories.map((category) => ({
    sql: "INSERT OR IGNORE INTO categories (id, slug, name, description, thesis) VALUES (?, ?, ?, ?, ?)",
    args: [category.id, category.slug, category.name, category.description, category.thesis],
  } satisfies InStatement));

  const taskStatements = seedTasks.flatMap((task) => {
    const finance = seedTaskFinance.find((entry) => entry.taskId === task.id);
    return [
      {
        sql: `INSERT OR IGNORE INTO tasks (
          id, slug, categoryId, proposerId, title, summary, problem, whyNow, publicBenefit,
          deliverables, evaluationCriteria, riskFlags, evidence, requestedTier, stage, safetyStatus,
          budgetUsd, runtimeHours, backend, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        sql: "INSERT OR IGNORE INTO task_finance (taskId, qualityBondCredits, sponsorPoolUsd, checkpointApprovalTarget, enterprisePackaging, dataValueNote) VALUES (?, ?, ?, ?, ?, ?)",
        args: [
          task.id,
          finance?.qualityBondCredits ?? tierDefaults[task.requestedTier].bond,
          finance?.sponsorPoolUsd ?? 0,
          finance?.checkpointApprovalTarget ?? tierDefaults[task.requestedTier].checkpointTarget,
          finance?.enterprisePackaging ?? "Open output first, commercial packaging optional.",
          finance?.dataValueNote ?? "Preference and correction traces remain auditable public-good inputs.",
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
    sql: `INSERT OR IGNORE INTO revenue_streams (
      id, slug, name, engine, description, pricingModel, status, monthlyRevenueUsd, grossMargin,
      treasurySharePercent, founderSharePercent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    ],
  } satisfies InStatement));

  const treasuryStatements = seedTreasuryEntries.map((entry) => ({
    sql: "INSERT OR IGNORE INTO treasury_entries (id, streamId, title, description, bucket, direction, amountUsd, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    args: [entry.id, entry.streamId, entry.title, entry.description, entry.bucket, entry.direction, entry.amountUsd, entry.createdAt],
  } satisfies InStatement));

  await batch(
    [
      ...profileStatements,
      ...categoryStatements,
      ...taskStatements,
      ...voteStatements,
      ...pulseStatements,
      ...commentStatements,
      ...commentVoteStatements,
      ...runStatements,
      ...checkpointStatements,
      ...checkpointGateStatements,
      ...governanceStatements,
      ...revenueStatements,
      ...treasuryStatements,
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

<<<<<<< HEAD
function mapTaskFinance(row: DbRow): TaskFinanceRecord {
  return {
    taskId: getString(row, "taskId"),
    qualityBondCredits: getNumber(row, "qualityBondCredits"),
    sponsorPoolUsd: getNumber(row, "sponsorPoolUsd"),
    checkpointApprovalTarget: getNumber(row, "checkpointApprovalTarget"),
    enterprisePackaging: getString(row, "enterprisePackaging"),
    dataValueNote: getString(row, "dataValueNote"),
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
=======
function defaultFinance(taskId: string): TaskFinanceRecord {
  return {
    taskId,
    qualityBondCredits: 0,
    sponsorPoolUsd: 0,
    checkpointApprovalTarget: 0,
    enterprisePackaging: "Commercial packaging not assessed yet.",
    dataValueNote: "No preference-data note has been recorded yet.",
  };
}

function buildDiscussionTree(
  taskId: string,
  comments: CommentRecord[],
  commentVotesByComment: Map<string, CommentVoteRecord[]>,
  profileMap: Map<string, ProfileSummary>,
  activeProfileId: string,
) {
  const taskComments = comments.filter((comment) => comment.taskId === taskId);
  const byParent = new Map<string | null, DiscussionComment[]>();

  for (const comment of taskComments) {
    const votes = commentVotesByComment.get(comment.id) ?? [];
    const profile = profileMap.get(comment.profileId);
    const node: DiscussionComment = {
      ...comment,
      profileName: profile?.name ?? "Unknown contributor",
      profileRole: profile?.role ?? "Unknown role",
      score: votes.reduce((total, vote) => total + vote.value, 0),
      upvotes: votes.filter((vote) => vote.value > 0).length,
      downvotes: votes.filter((vote) => vote.value < 0).length,
      userVote: votes.find((vote) => vote.profileId === activeProfileId)?.value ?? 0,
      replies: [],
    };
    const bucket = byParent.get(comment.parentId) ?? [];
    bucket.push(node);
    byParent.set(comment.parentId, bucket);
  }

  const sortNodes = (items: DiscussionComment[]): DiscussionComment[] =>
    [...items]
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        if (right.stakeCredits !== left.stakeCredits) {
          return right.stakeCredits - left.stakeCredits;
        }
        return left.createdAt.localeCompare(right.createdAt);
      })
      .map((node) => ({
        ...node,
        replies: sortNodes(byParent.get(node.id) ?? []),
      }));

  return sortNodes(byParent.get(null) ?? []);
}

function loadProfiles(): ProfileRecord[] {
  return statement("SELECT * FROM profiles ORDER BY name").all() as unknown as ProfileRecord[];
}

function loadCategories() {
  return statement("SELECT * FROM categories ORDER BY name").all() as unknown as CategorySummary[];
>>>>>>> origin/main
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

<<<<<<< HEAD
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
=======
function loadTaskFinance(): TaskFinanceRecord[] {
  return statement("SELECT * FROM task_finance").all() as unknown as TaskFinanceRecord[];
}

function loadVotes(): VoteRecord[] {
  return statement("SELECT * FROM votes ORDER BY updatedAt DESC").all() as unknown as VoteRecord[];
}

function loadTaskPulseVotes(): TaskPulseVoteRecord[] {
  return statement("SELECT * FROM task_pulse_votes ORDER BY updatedAt DESC").all() as unknown as TaskPulseVoteRecord[];
}

function loadRuns(): ComputeRunRecord[] {
  return statement("SELECT * FROM runs").all() as unknown as ComputeRunRecord[];
>>>>>>> origin/main
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

<<<<<<< HEAD
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
=======
function loadCheckpointGates(): CheckpointGateRecord[] {
  return statement("SELECT * FROM checkpoint_gates").all() as unknown as CheckpointGateRecord[];
}

function loadComments(): CommentRecord[] {
  return statement("SELECT * FROM comments ORDER BY createdAt ASC").all() as unknown as CommentRecord[];
}

function loadCommentVotes(): CommentVoteRecord[] {
  return statement("SELECT * FROM comment_votes ORDER BY updatedAt DESC").all() as unknown as CommentVoteRecord[];
}

function loadGovernance(): GovernanceEventRecord[] {
  return statement("SELECT * FROM governance_events ORDER BY createdAt DESC").all() as unknown as GovernanceEventRecord[];
}

function loadRevenueStreams(): RevenueStreamRecord[] {
  return statement("SELECT * FROM revenue_streams ORDER BY monthlyRevenueUsd DESC").all() as unknown as RevenueStreamRecord[];
}

function loadTreasuryEntries(): TreasuryEntryRecord[] {
  return statement("SELECT * FROM treasury_entries ORDER BY createdAt DESC").all() as unknown as TreasuryEntryRecord[];
}

function proposalBondSpendForProfile(profileId: string) {
  const row = statement(`
    SELECT COALESCE(SUM(task_finance.qualityBondCredits), 0) AS total
    FROM task_finance
    INNER JOIN tasks ON tasks.id = task_finance.taskId
    WHERE tasks.proposerId = :profileId
  `).get({ profileId }) as unknown as { total: number };
  return row.total;
}

function hydrate(activeProfileId: string) {
  const profiles = loadProfiles();
  const categories = loadCategories();
  const tasks = loadTasks();
  const taskFinance = loadTaskFinance();
  const votes = loadVotes();
  const taskPulseVotes = loadTaskPulseVotes();
  const runs = loadRuns();
  const checkpoints = loadCheckpoints();
  const checkpointGates = loadCheckpointGates();
  const comments = loadComments();
  const commentVotes = loadCommentVotes();
  const governance = loadGovernance();
  const revenueStreams = loadRevenueStreams();
  const treasuryEntries = loadTreasuryEntries();

  const votesByTask = new Map<string, VoteRecord[]>();
  const votesByProfile = new Map<string, VoteRecord[]>();
  const pulsesByTask = new Map<string, TaskPulseVoteRecord[]>();
  const commentsByTask = new Map<string, CommentRecord[]>();
  const commentVotesByComment = new Map<string, CommentVoteRecord[]>();
>>>>>>> origin/main

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
    createdAt: getString(row, "createdAt"),
  };
}

<<<<<<< HEAD
function mapAccount(row: DbRow): AccountRecord {
  return {
    id: getString(row, "id"),
    profileId: getString(row, "profileId"),
    email: getString(row, "email"),
    passwordHash: getString(row, "passwordHash"),
    passwordSalt: getString(row, "passwordSalt"),
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
const loadCategories = () =>
  loadRows("SELECT * FROM categories ORDER BY name ASC").then((rows) =>
    rows.map((row) => ({
      id: getString(row, "id"),
      slug: getString(row, "slug"),
      name: getString(row, "name"),
      description: getString(row, "description"),
      thesis: getString(row, "thesis"),
=======
  for (const vote of taskPulseVotes) {
    const bucket = pulsesByTask.get(vote.taskId) ?? [];
    bucket.push(vote);
    pulsesByTask.set(vote.taskId, bucket);
  }

  for (const comment of comments) {
    const bucket = commentsByTask.get(comment.taskId) ?? [];
    bucket.push(comment);
    commentsByTask.set(comment.taskId, bucket);
  }

  for (const vote of commentVotes) {
    const bucket = commentVotesByComment.get(vote.commentId) ?? [];
    bucket.push(vote);
    commentVotesByComment.set(vote.commentId, bucket);
  }

  const profileSummaries: ProfileSummary[] = profiles.map((profile) => {
    const voteCreditsSpent = spentCredits(votesByProfile.get(profile.id) ?? []);
    const bondedCredits = proposalBondSpendForProfile(profile.id);
    const spent = voteCreditsSpent + bondedCredits;

    return {
      ...profile,
      voteCreditsSpent,
      bondedCredits,
      spentCredits: spent,
      availableCredits: Math.max(profile.voiceCredits - spent, 0),
    };
  });

  const profileMap = new Map(profileSummaries.map((profile) => [profile.id, profile]));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const taskFinanceMap = new Map(taskFinance.map((row) => [row.taskId, row]));
  const runMap = new Map(runs.map((run) => [run.taskId, run]));
  const checkpointGateMap = new Map(checkpointGates.map((gate) => [gate.checkpointId, gate]));
  const checkpointsByTask = new Map<string, CheckpointDetail[]>();
  const governanceByTask = new Map<string, typeof governance>();

  for (const checkpoint of checkpoints) {
    const gate = checkpointGateMap.get(checkpoint.id) ?? {
      checkpointId: checkpoint.id,
      approvalScore: 0,
      requiredApprovals: 0,
      releaseStatus: "pending",
    };
    const bucket = checkpointsByTask.get(checkpoint.taskId) ?? [];
    bucket.push({ ...checkpoint, ...gate });
    checkpointsByTask.set(checkpoint.taskId, bucket);
  }

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
      totalVotes: (votesByTask.get(task.id) ?? []).reduce((total, vote) => total + vote.voteCount, 0),
      stage: task.stage,
      safetyStatus: task.safetyStatus,
>>>>>>> origin/main
    })),
  );
const loadTasks = () => loadRows("SELECT * FROM tasks ORDER BY createdAt DESC").then((rows) => rows.map(mapTask));
const loadTaskFinance = () => loadRows("SELECT * FROM task_finance").then((rows) => rows.map(mapTaskFinance));
const loadVotes = () => loadRows("SELECT * FROM votes ORDER BY updatedAt DESC").then((rows) => rows.map(mapVote));
const loadTaskPulseVotes = () => loadRows("SELECT * FROM task_pulse_votes ORDER BY updatedAt DESC").then((rows) => rows.map(mapTaskPulseVote));
const loadComments = () => loadRows("SELECT * FROM comments ORDER BY createdAt ASC").then((rows) => rows.map(mapComment));
const loadCommentVotes = () => loadRows("SELECT * FROM comment_votes ORDER BY updatedAt DESC").then((rows) => rows.map(mapCommentVote));
const loadRuns = () => loadRows("SELECT * FROM runs").then((rows) => rows.map(mapRun));
const loadCheckpoints = () => loadRows("SELECT * FROM checkpoints ORDER BY dueAt ASC").then((rows) => rows.map(mapCheckpoint));
const loadCheckpointGates = () => loadRows("SELECT * FROM checkpoint_gates").then((rows) => rows.map(mapCheckpointGate));
const loadGovernanceEvents = () => loadRows("SELECT * FROM governance_events ORDER BY createdAt DESC").then((rows) => rows.map(mapGovernance));
const loadRevenueStreams = () => loadRows("SELECT * FROM revenue_streams ORDER BY monthlyRevenueUsd DESC").then((rows) => rows.map(mapRevenueStream));
const loadTreasuryEntries = () => loadRows("SELECT * FROM treasury_entries ORDER BY createdAt DESC").then((rows) => rows.map(mapTreasuryEntry));

<<<<<<< HEAD
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
=======
  const taskSummaries: TaskSummary[] = tasks.map((task) => {
    const category = categoryMap.get(task.categoryId);
    const proposer = profileMap.get(task.proposerId);
    const taskVotes = votesByTask.get(task.id) ?? [];
    const pulseVotes = pulsesByTask.get(task.id) ?? [];
    const finance = taskFinanceMap.get(task.id) ?? defaultFinance(task.id);
    const ranking = rankings.get(task.id);
    const userVote = taskVotes.find((vote) => vote.profileId === activeProfileId);
    const userPulse = pulseVotes.find((vote) => vote.profileId === activeProfileId);
    const taskPulseScore = pulseVotes.reduce((total, vote) => total + vote.value, 0);

    return {
      ...task,
      ...finance,
      categoryName: category?.name ?? "Unknown",
      categorySlug: category?.slug ?? "unknown",
      proposerName: proposer?.name ?? "Unknown proposer",
      totalVotes: taskVotes.reduce((total, vote) => total + vote.voteCount, 0),
      supporterCount: taskVotes.length,
      categoryRank: ranking?.rank ?? null,
      allocatedTier: ranking?.tier ?? (task.safetyStatus === "blocked" ? "blocked" : "queued"),
      userVotes: userVote?.voteCount ?? 0,
      userCost: quadraticCost(userVote?.voteCount ?? 0),
      taskPulseScore,
      taskPulseVotes: pulseVotes.length,
      positivePulseCount: pulseVotes.filter((vote) => vote.value > 0).length,
      negativePulseCount: pulseVotes.filter((vote) => vote.value < 0).length,
      userTaskPulse: userPulse?.value ?? 0,
      discussionCount: commentsByTask.get(task.id)?.length ?? 0,
      bondStatus: task.safetyStatus === "blocked" || taskPulseScore < 0 ? "watch" : "secure",
    };
  });

  const monthlyPublicBurnUsd = taskSummaries
    .filter((task) => task.allocatedTier === "months" || task.allocatedTier === "weeks" || task.allocatedTier === "days")
    .reduce((total, task) => total + task.budgetUsd, 0);

  return {
    profiles: profileSummaries,
    categories: categories.map((category) => {
      const categoryTasks = taskSummaries.filter((task) => task.categoryId === category.id);
      return {
        ...category,
        proposalCount: categoryTasks.length,
        eligibleCount: categoryTasks.filter((task) => isEligibleForAllocation(task.totalVotes, task.stage, task.safetyStatus)).length,
        runningCount: categoryTasks.filter((task) => task.stage === "running").length,
        shippedCount: categoryTasks.filter((task) => task.stage === "shipped").length,
      } satisfies CategorySummary;
    }),
    tasks: taskSummaries,
    votes,
    comments,
    commentVotesByComment,
    checkpointsByTask,
    governance,
    governanceByTask,
    runMap,
    profileMap,
    treasuryEntries,
    streams: revenueStreams.map(summarizeRevenueStream),
    economics: summarizeEconomics(revenueStreams, treasuryEntries, monthlyPublicBurnUsd),
>>>>>>> origin/main
  };

  sortComments(roots);
  return roots;
}

function sortTasks(tasks: TaskSummary[]) {
  return [...tasks].sort((left, right) => {
    const tierDelta = tierWeight(right.allocatedTier) - tierWeight(left.allocatedTier);
    if (tierDelta !== 0) {
      return tierDelta;
    }

    if (right.totalVotes !== left.totalVotes) {
      return right.totalVotes - left.totalVotes;
    }
<<<<<<< HEAD

    if (right.taskPulseScore !== left.taskPulseScore) {
      return right.taskPulseScore - left.taskPulseScore;
    }

=======
    if (right.taskPulseScore !== left.taskPulseScore) {
      return right.taskPulseScore - left.taskPulseScore;
    }
>>>>>>> origin/main
    return left.createdAt.localeCompare(right.createdAt);
  });
}

async function hydrate(viewerProfileId?: string | null) {
  const [profiles, categories, tasks, finances, votes, pulseVotes, comments, commentVotes, runs, checkpoints, checkpointGates, governance, revenueStreams, treasuryEntries] =
    await Promise.all([
      loadProfiles(),
      loadCategories(),
      loadTasks(),
      loadTaskFinance(),
      loadVotes(),
      loadTaskPulseVotes(),
      loadComments(),
      loadCommentVotes(),
      loadRuns(),
      loadCheckpoints(),
      loadCheckpointGates(),
      loadGovernanceEvents(),
      loadRevenueStreams(),
      loadTreasuryEntries(),
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
  const profileSummaries: ProfileSummary[] = profiles.map((profile) => {
    const castVotes = voteByProfile.get(profile.id) ?? [];
    const voteCreditsSpent = spentCredits(castVotes);
    const bondedCredits = activeBondedCredits(profile.id, tasks, finances);
    const spent = voteCreditsSpent + bondedCredits;
    return {
      ...profile,
      attestationLevel: profile.attestationLevel ?? "provisional",
      moderationStatus: profile.moderationStatus ?? "active",
      createdAt: profile.createdAt ?? new Date().toISOString(),
      voteCreditsSpent,
      bondedCredits,
      spentCredits: spent,
      availableCredits: Math.max(profile.voiceCredits - spent, 0),
    };
  });

  const profileMap = new Map(profileSummaries.map((profile) => [profile.id, profile]));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const runMap = new Map(runs.map((run) => [run.taskId, run]));

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
      enterprisePackaging: "Open output first, commercial packaging optional.",
      dataValueNote: "Preference and correction traces remain auditable public-good inputs.",
    };
    const category = categoryMap.get(task.categoryId);
    const proposer = profileMap.get(task.proposerId);
    const taskVotes = voteByTask.get(task.id) ?? [];
    const pulse = pulseByTask.get(task.id) ?? [];
    const positivePulseCount = pulse.filter((vote) => vote.value > 0).length;
    const negativePulseCount = pulse.filter((vote) => vote.value < 0).length;
    const ranking = rankings.get(task.id);
    const userVote = taskVotes.find((vote) => vote.profileId === viewerProfileId);
    const userTaskPulse = pulse.find((vote) => vote.profileId === viewerProfileId)?.value ?? 0;
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
      discussionCount: (commentByTask.get(task.id) ?? []).length,
      bondStatus: task.stage === "review" || task.stage === "blocked" ? "watch" : "secure",
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
  const economics = summarizeEconomics(revenueStreams, treasuryEntries, monthlyPublicBurnUsd);

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
    economics,
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
    account: { id: account.id, email: account.email, createdAt: account.createdAt },
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
    voiceIssued: snapshot.profiles.reduce((total, profile) => total + profile.voiceCredits, 0),
    voiceSpent: snapshot.profiles.reduce((total, profile) => total + profile.voteCreditsSpent, 0),
    bondedVoice: snapshot.profiles.reduce((total, profile) => total + profile.bondedCredits, 0),
<<<<<<< HEAD
    publicSignal: snapshot.tasks.reduce((total, task) => total + Math.max(task.taskPulseScore, 0), 0),
=======
    publicSignal: snapshot.tasks.reduce((total, task) => total + task.taskPulseScore, 0),
>>>>>>> origin/main
    treasuryMonthlyUsd: snapshot.economics.treasuryMonthlyUsd,
  };

  return {
    viewer: snapshot.viewer,
    metrics,
    categories: snapshot.categories,
<<<<<<< HEAD
    featuredTasks: snapshot.tasks.slice(0, 6),
    contributors: [...snapshot.profiles].sort((left, right) => right.credibility - left.credibility).slice(0, 6),
    governance: snapshot.governance.slice(0, 6),
    economics: snapshot.economics,
    revenueStreams: snapshot.revenueSummaries.slice(0, 4),
=======
    featuredTasks: tasks.slice(0, 6),
    contributors: [...snapshot.profiles].sort((left, right) => right.credibility - left.credibility).slice(0, 5),
    governance: snapshot.governance.slice(0, 5),
    sponsoredTasks: [...snapshot.tasks].sort((left, right) => right.sponsorPoolUsd - left.sponsorPoolUsd).slice(0, 4),
    streams: snapshot.streams,
    economics: snapshot.economics,
    activeProfile: snapshot.profileMap.get(activeProfileId) ?? snapshot.profiles[0],
>>>>>>> origin/main
  };
}

export async function getMarketplaceData(viewerProfileId: string | null | undefined, filters: MarketplaceFilters) {
  const snapshot = await hydrate(viewerProfileId);
  const query = filters.query?.trim().toLowerCase() ?? "";
  return {
    viewer: snapshot.viewer,
    categories: snapshot.categories,
    tasks: snapshot.tasks.filter((task) => {
      if (query) {
        const haystack = [task.title, task.summary, task.problem, task.categoryName, task.enterprisePackaging, task.dataValueNote].join(" ").toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      if (filters.category && filters.category !== "all" && task.categorySlug !== filters.category) {
        return false;
      }
<<<<<<< HEAD
      if (filters.tier && filters.tier !== "all" && task.allocatedTier !== filters.tier) {
        return false;
      }
      if (filters.stage && filters.stage !== "all" && task.stage !== filters.stage) {
        return false;
      }
      return true;
    }),
=======
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

  return {
    tasks: filtered,
    categories: snapshot.categories,
    activeProfile: snapshot.profileMap.get(activeProfileId) ?? snapshot.profiles[0],
    economics: snapshot.economics,
>>>>>>> origin/main
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
<<<<<<< HEAD
    checkpoints: (snapshot.checkpointMap.get(task.id) ?? []).sort((left, right) => left.dueAt.localeCompare(right.dueAt)),
    governanceEvents: snapshot.governanceByTask.get(task.id) ?? [],
    comments: snapshot.discussionFor(task.id),
=======
    checkpoints: snapshot.checkpointsByTask.get(task.id) ?? [],
    governanceEvents: snapshot.governanceByTask.get(task.id) ?? [],
    comments: buildDiscussionTree(task.id, snapshot.comments, snapshot.commentVotesByComment, snapshot.profileMap, activeProfileId),
>>>>>>> origin/main
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
<<<<<<< HEAD
    profiles: snapshot.profiles,
=======
    economics: snapshot.economics,
  };
}

export function getEconomicsData(activeProfileId: string) {
  const snapshot = hydrate(activeProfileId);
  return {
    activeProfile: snapshot.profileMap.get(activeProfileId) ?? snapshot.profiles[0],
    summary: snapshot.economics,
    streams: snapshot.streams,
    treasuryEntries: snapshot.treasuryEntries,
    sponsoredTasks: [...snapshot.tasks].sort((left, right) => right.sponsorPoolUsd - left.sponsorPoolUsd).slice(0, 8),
    fundableTasks: sortTasks(snapshot.tasks)
      .filter((task) => task.safetyStatus !== "blocked")
      .slice(0, 6),
>>>>>>> origin/main
  };
}

export async function getEconomicsData(viewerProfileId?: string | null): Promise<{
  viewer: ProfileSummary | null;
  summary: EconomicsSummary;
  revenueStreams: RevenueStreamSummary[];
  treasuryEntries: TreasuryEntryRecord[];
  fundedTasks: TaskSummary[];
}> {
  const snapshot = await hydrate(viewerProfileId);
  const fundedTaskIds = new Set(snapshot.tasks.filter((task) => task.sponsorPoolUsd > 0).map((task) => task.id));
  return {
    viewer: snapshot.viewer,
    summary: snapshot.economics,
    revenueStreams: snapshot.revenueSummaries,
    treasuryEntries: snapshot.treasuryEntries,
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
        sql: "INSERT INTO accounts (id, profileId, email, passwordHash, passwordSalt, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
        args: [accountId, profileId, input.email.toLowerCase(), passwordHash, passwordSalt, now],
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
<<<<<<< HEAD
  requestedTier: TaskRecord["requestedTier"];
=======
  requestedTier: "days" | "weeks" | "months";
  qualityBondCredits: number;
>>>>>>> origin/main
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

<<<<<<< HEAD
  const snapshot = await hydrate(proposerId);
  const proposerSummary = snapshot.viewer ?? snapshot.profiles.find((profileEntry) => profileEntry.id === proposerId) ?? null;
  if (!proposerSummary) {
    throw new Error("Contributor profile not found.");
  }

  const defaults = tierDefaults[input.requestedTier];
  if (proposerSummary.availableCredits < defaults.bond) {
    throw new Error(`Submitting a ${input.requestedTier} proposal requires ${defaults.bond} free voice credits for the quality bond.`);
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
        sql: "INSERT INTO task_finance (taskId, qualityBondCredits, sponsorPoolUsd, checkpointApprovalTarget, enterprisePackaging, dataValueNote) VALUES (?, ?, ?, ?, ?, ?)",
        args: [slug, defaults.bond, 0, defaults.checkpointTarget, input.enterprisePackaging, input.dataValueNote],
      },
      {
        sql: "INSERT INTO governance_events (id, taskId, house, title, decision, outcome, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [
          randomUUID(),
          slug,
          "safety-council",
          "Queued for safety review",
          "New proposal entered the public intake queue. It can collect pulse, comments, and quadratic support immediately, but execution remains gated until safety review and checkpoint policy are set.",
          "Visible on the public board with its quality bond locked until the review state changes.",
          now,
        ],
      },
    ],
    "write",
  );
=======
  const profile = statement("SELECT * FROM profiles WHERE id = :id").get({ id: proposerId }) as unknown as ProfileRecord | null;
  if (!profile) {
    throw new Error("Unknown proposer.");
  }

  const existingVotes = statement("SELECT * FROM votes WHERE profileId = :profileId").all({ profileId: proposerId }) as unknown as VoteRecord[];
  const existingBondSpend = proposalBondSpendForProfile(proposerId);
  const nextSpent = spentCredits(existingVotes) + existingBondSpend + input.qualityBondCredits;
  if (nextSpent > profile.voiceCredits) {
    throw new Error("Not enough voice credits to post that proposal bond.");
  }

  const now = new Date().toISOString();
  const slug = uniqueSlug(input.title);
  const taskId = slug;
  const checkpointApprovalTarget = input.requestedTier === "months" ? 24 : input.requestedTier === "weeks" ? 16 : 8;

  withTransaction(() => {
    statement(`
      INSERT INTO tasks (
        id, slug, categoryId, proposerId, title, summary, problem, whyNow, publicBenefit,
        deliverables, evaluationCriteria, riskFlags, evidence, requestedTier, stage, safetyStatus,
        budgetUsd, runtimeHours, backend, createdAt
      ) VALUES (
        :id, :slug, :categoryId, :proposerId, :title, :summary, :problem, :whyNow, :publicBenefit,
        :deliverables, :evaluationCriteria, :riskFlags, :evidence, :requestedTier, :stage, :safetyStatus,
        :budgetUsd, :runtimeHours, :backend, :createdAt
      )
    `).run(
      asSqlRecord({
        id: taskId,
        slug,
        categoryId: category.id,
        proposerId,
        title: input.title,
        summary: input.summary,
        problem: input.problem,
        whyNow: input.whyNow,
        publicBenefit: input.publicBenefit,
        deliverables: serializeList(input.deliverables),
        evaluationCriteria: serializeList(input.evaluationCriteria),
        riskFlags: serializeList(input.riskFlags),
        evidence: serializeList(input.evidence),
        requestedTier: input.requestedTier,
        stage: "review",
        safetyStatus: "pending",
        budgetUsd: 0,
        runtimeHours: 0,
        backend: "Pending safety review",
        createdAt: now,
      }),
    );

    statement(`
      INSERT INTO task_finance (
        taskId, qualityBondCredits, sponsorPoolUsd, checkpointApprovalTarget, enterprisePackaging, dataValueNote
      ) VALUES (
        :taskId, :qualityBondCredits, :sponsorPoolUsd, :checkpointApprovalTarget, :enterprisePackaging, :dataValueNote
      )
    `).run(
      asSqlRecord({
        taskId,
        qualityBondCredits: input.qualityBondCredits,
        sponsorPoolUsd: 0,
        checkpointApprovalTarget,
        enterprisePackaging: "No commercial packaging assessed yet. Public deliberation and safety review come first.",
        dataValueNote: "No preference-data value note has been recorded yet. Any later licensing must remain privacy-screened and opt-in.",
      }),
    );

    statement(`
      INSERT INTO governance_events (id, taskId, house, title, decision, outcome, createdAt)
      VALUES (:id, :taskId, :house, :title, :decision, :outcome, :createdAt)
    `).run(
      asSqlRecord({
        id: randomUUID(),
        taskId,
        house: "safety-council",
        title: "Queued for safety review",
        decision: "New proposal entered the intake queue and posted a quality bond. It can collect comments immediately but will not receive compute until it clears policy review.",
        outcome: "Visible for public debate and pulse voting; allocation remains queued until reviewed.",
        createdAt: now,
      }),
    );
  });
>>>>>>> origin/main

  return slug;
}

export async function saveVote(taskId: string, profileId: string, voteCount: number, rationale: string) {
  if (!Number.isInteger(voteCount) || voteCount < 0 || voteCount > MAX_VOTES_PER_TASK) {
    throw new Error(`Votes must be between 0 and ${MAX_VOTES_PER_TASK}.`);
  }

  const task = await findTaskById(taskId);
  if (!task) {
    throw new Error("Task not found.");
  }
  if (task.stage === "blocked" || task.safetyStatus === "blocked") {
    throw new Error("Blocked tasks cannot receive quadratic support.");
  }

  const snapshot = await hydrate(profileId);
  if (!snapshot.viewer) {
    throw new Error("Authenticated contributor session required.");
  }

<<<<<<< HEAD
  const existingVotes = snapshot.votes.filter((vote) => vote.profileId === profileId);
  const existingVote = existingVotes.find((vote) => vote.taskId === taskId);
  const otherVotes = existingVotes.filter((vote) => vote.taskId !== taskId);
  const nextSpent = spentCredits(otherVotes) + quadraticCost(voteCount) + snapshot.viewer.bondedCredits;
  if (nextSpent > snapshot.viewer.voiceCredits) {
    throw new Error("Not enough free voice credits for that allocation.");
=======
  const existingVotes = statement("SELECT * FROM votes WHERE profileId = :profileId").all({ profileId }) as unknown as VoteRecord[];
  const existingVote = existingVotes.find((vote) => vote.taskId === taskId);
  const otherVotes = existingVotes.filter((vote) => vote.taskId !== taskId);
  const proposalBondSpend = proposalBondSpendForProfile(profileId);
  const nextSpent = spentCredits(otherVotes) + quadraticCost(voteCount) + proposalBondSpend;

  if (nextSpent > profile.voiceCredits) {
    throw new Error("Not enough voice credits for that vote allocation.");
>>>>>>> origin/main
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
    throw new Error("Task not found.");
  }
  if (task.stage === "blocked" || task.safetyStatus === "blocked") {
    throw new Error("Blocked tasks stay visible, but public curation is frozen.");
  }

  const existing = await loadOne("SELECT * FROM task_pulse_votes WHERE taskId = ? AND profileId = ? LIMIT 1", [taskId, profileId]);
  if (value === 0) {
    if (existing) {
      await execute("DELETE FROM task_pulse_votes WHERE taskId = ? AND profileId = ?", [taskId, profileId]);
    }
<<<<<<< HEAD
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
    throw new Error("Task not found.");
  }

  if (input.parentId) {
    const parent = await loadOne("SELECT taskId FROM comments WHERE id = ? LIMIT 1", [input.parentId]);
    if (!parent || getString(parent, "taskId") !== input.taskId) {
      throw new Error("Reply target not found on this task.");
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
=======
  });
}

export function saveTaskPulseVote(taskId: string, profileId: string, value: -1 | 0 | 1) {
  if (![-1, 0, 1].includes(value)) {
    throw new Error("Task pulse votes must be -1, 0, or 1.");
  }

  const task = statement("SELECT id, stage, safetyStatus FROM tasks WHERE id = :id").get({ id: taskId }) as unknown as {
    id: string;
    stage: string;
    safetyStatus: SafetyStatus;
  } | null;
  if (!task) {
    throw new Error("Task not found.");
  }
  if (task.stage === "blocked" || task.safetyStatus === "blocked") {
    throw new Error("Blocked tasks cannot receive public ranking votes.");
  }

  if (!statement("SELECT id FROM profiles WHERE id = :id").get({ id: profileId })) {
    throw new Error("Profile not found.");
  }

  const existing = statement("SELECT id FROM task_pulse_votes WHERE taskId = :taskId AND profileId = :profileId").get({ taskId, profileId }) as unknown as { id: string } | null;
  const now = new Date().toISOString();

  withTransaction(() => {
    if (existing && value === 0) {
      statement("DELETE FROM task_pulse_votes WHERE taskId = :taskId AND profileId = :profileId").run(asSqlRecord({ taskId, profileId }));
      return;
    }

    if (existing) {
      statement(`
        UPDATE task_pulse_votes
        SET value = :value, updatedAt = :updatedAt
        WHERE taskId = :taskId AND profileId = :profileId
      `).run(asSqlRecord({ taskId, profileId, value, updatedAt: now }));
      return;
    }

    if (value !== 0) {
      statement(`
        INSERT INTO task_pulse_votes (id, taskId, profileId, value, updatedAt)
        VALUES (:id, :taskId, :profileId, :value, :updatedAt)
      `).run(asSqlRecord({ id: randomUUID(), taskId, profileId, value, updatedAt: now }));
    }
  });
}

export function createComment(taskId: string, profileId: string, body: string, parentId?: string | null) {
  if (!statement("SELECT id FROM tasks WHERE id = :id").get({ id: taskId })) {
    throw new Error("Task not found.");
  }
  if (!statement("SELECT id FROM profiles WHERE id = :id").get({ id: profileId })) {
    throw new Error("Profile not found.");
  }

  if (parentId) {
    const parent = statement("SELECT taskId FROM comments WHERE id = :id").get({ id: parentId }) as unknown as { taskId: string } | null;
    if (!parent || parent.taskId !== taskId) {
      throw new Error("Reply target not found for this task.");
    }
  }

  statement(`
    INSERT INTO comments (id, taskId, profileId, parentId, body, stakeCredits, createdAt)
    VALUES (:id, :taskId, :profileId, :parentId, :body, :stakeCredits, :createdAt)
  `).run(
    asSqlRecord({
      id: randomUUID(),
      taskId,
      profileId,
      parentId: parentId ?? null,
      body,
      stakeCredits: parentId ? 1 : 2,
      createdAt: new Date().toISOString(),
    }),
  );
}

export function saveCommentVote(commentId: string, profileId: string, value: -1 | 0 | 1) {
  if (![-1, 0, 1].includes(value)) {
    throw new Error("Comment votes must be -1, 0, or 1.");
  }

  const comment = statement("SELECT id, profileId FROM comments WHERE id = :id").get({ id: commentId }) as unknown as {
    id: string;
    profileId: string;
  } | null;
  if (!comment) {
    throw new Error("Comment not found.");
  }
  if (comment.profileId === profileId) {
    throw new Error("You cannot vote on your own comment.");
  }

  if (!statement("SELECT id FROM profiles WHERE id = :id").get({ id: profileId })) {
    throw new Error("Profile not found.");
  }

  const existing = statement("SELECT id FROM comment_votes WHERE commentId = :commentId AND profileId = :profileId").get({ commentId, profileId }) as unknown as { id: string } | null;
  const now = new Date().toISOString();

  withTransaction(() => {
    if (existing && value === 0) {
      statement("DELETE FROM comment_votes WHERE commentId = :commentId AND profileId = :profileId").run(asSqlRecord({ commentId, profileId }));
      return;
    }

    if (existing) {
      statement(`
        UPDATE comment_votes
        SET value = :value, updatedAt = :updatedAt
        WHERE commentId = :commentId AND profileId = :profileId
      `).run(asSqlRecord({ commentId, profileId, value, updatedAt: now }));
      return;
    }

    if (value !== 0) {
      statement(`
        INSERT INTO comment_votes (id, commentId, profileId, value, updatedAt)
        VALUES (:id, :commentId, :profileId, :value, :updatedAt)
      `).run(asSqlRecord({ id: randomUUID(), commentId, profileId, value, updatedAt: now }));
    }
  });
>>>>>>> origin/main
}



<<<<<<< HEAD
=======



>>>>>>> origin/main
