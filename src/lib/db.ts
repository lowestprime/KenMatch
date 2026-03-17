import "server-only";

import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import {
  buildCategoryRankings,
  isEligibleForAllocation,
  MAX_VOTES_PER_TASK,
  quadraticCost,
  spentCredits,
  tierWeight,
} from "@/lib/allocation";
import {
  seedCategories,
  seedCheckpoints,
  seedGovernanceEvents,
  seedProfiles,
  seedRuns,
  seedTasks,
  seedVotes,
} from "@/lib/seed";
import type {
  CategorySummary,
  CheckpointRecord,
  ComputeRunRecord,
  GovernanceEventRecord,
  HomepageMetrics,
  MarketplaceFilters,
  ProfileRecord,
  ProfileSummary,
  SafetyStatus,
  TaskDetail,
  TaskRecord,
  TaskSummary,
  VoteRecord,
} from "@/lib/types";

type TaskRow = Omit<TaskRecord, "deliverables" | "evaluationCriteria" | "riskFlags" | "evidence"> & {
  deliverables: string;
  evaluationCriteria: string;
  riskFlags: string;
  evidence: string;
};

type VoteRow = VoteRecord;
type RunRow = ComputeRunRecord;
type GovernanceRow = GovernanceEventRecord;
type CategoryRow = { id: string; slug: string; name: string; description: string; thesis: string };
type SqlRecord = Record<string, string | number | null>;

declare global {
  var __kenmatchDb: DatabaseSync | undefined;
}

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
  `);

  const count = statement("SELECT COUNT(*) AS count FROM profiles").get() as unknown as { count: number };
  if (count.count > 0) {
    return;
  }

  withTransaction(() => {
    const insertProfile = statement(`
      INSERT INTO profiles (id, name, role, bio, specialty, attestation, voiceCredits, credibility, avatarHue)
      VALUES (:id, :name, :role, :bio, :specialty, :attestation, :voiceCredits, :credibility, :avatarHue)
    `);
    const insertCategory = statement(`
      INSERT INTO categories (id, slug, name, description, thesis)
      VALUES (:id, :slug, :name, :description, :thesis)
    `);
    const insertTask = statement(`
      INSERT INTO tasks (
        id, slug, categoryId, proposerId, title, summary, problem, whyNow, publicBenefit,
        deliverables, evaluationCriteria, riskFlags, evidence, requestedTier, stage, safetyStatus,
        budgetUsd, runtimeHours, backend, createdAt
      ) VALUES (
        :id, :slug, :categoryId, :proposerId, :title, :summary, :problem, :whyNow, :publicBenefit,
        :deliverables, :evaluationCriteria, :riskFlags, :evidence, :requestedTier, :stage, :safetyStatus,
        :budgetUsd, :runtimeHours, :backend, :createdAt
      )
    `);
    const insertVote = statement(`
      INSERT INTO votes (id, taskId, profileId, voteCount, rationale, updatedAt)
      VALUES (:id, :taskId, :profileId, :voteCount, :rationale, :updatedAt)
    `);
    const insertRun = statement(`
      INSERT INTO runs (id, taskId, status, backend, budgetUsd, runtimeHours, checkpointCadenceHours, reproducibilityNotes, rollbackPlan)
      VALUES (:id, :taskId, :status, :backend, :budgetUsd, :runtimeHours, :checkpointCadenceHours, :reproducibilityNotes, :rollbackPlan)
    `);
    const insertCheckpoint = statement(`
      INSERT INTO checkpoints (id, taskId, label, status, detail, dueAt)
      VALUES (:id, :taskId, :label, :status, :detail, :dueAt)
    `);
    const insertGovernance = statement(`
      INSERT INTO governance_events (id, taskId, house, title, decision, outcome, createdAt)
      VALUES (:id, :taskId, :house, :title, :decision, :outcome, :createdAt)
    `);

    seedProfiles.forEach((profile) => insertProfile.run(asSqlRecord(profile)));
    seedCategories.forEach((category) => insertCategory.run(asSqlRecord(category)));
    seedTasks.forEach((task) =>
      insertTask.run(
        asSqlRecord({
          ...task,
          deliverables: serializeList(task.deliverables),
          evaluationCriteria: serializeList(task.evaluationCriteria),
          riskFlags: serializeList(task.riskFlags),
          evidence: serializeList(task.evidence),
        }),
      ),
    );
    seedVotes.forEach((vote) => insertVote.run(asSqlRecord(vote)));
    seedRuns.forEach((run) => insertRun.run(asSqlRecord(run)));
    seedCheckpoints.forEach((checkpoint) => insertCheckpoint.run(asSqlRecord(checkpoint)));
    seedGovernanceEvents.forEach((event) => insertGovernance.run(asSqlRecord(event)));
  });
}

function getDatabase() {
  if (!globalThis.__kenmatchDb) {
    const directory = dirname(databasePath);
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }

    globalThis.__kenmatchDb = new DatabaseSync(databasePath);
    initializeDatabase(globalThis.__kenmatchDb);
  }

  return globalThis.__kenmatchDb;
}

function mapTask(row: TaskRow): TaskRecord {
  return {
    ...row,
    deliverables: parseList(row.deliverables),
    evaluationCriteria: parseList(row.evaluationCriteria),
    riskFlags: parseList(row.riskFlags),
    evidence: parseList(row.evidence),
  };
}

function loadProfiles(): ProfileRecord[] {
  return statement("SELECT * FROM profiles ORDER BY name").all() as unknown as ProfileRecord[];
}

function loadCategories(): CategoryRow[] {
  return statement("SELECT * FROM categories ORDER BY name").all() as unknown as CategoryRow[];
}

function loadTasks(): TaskRecord[] {
  return (statement("SELECT * FROM tasks ORDER BY createdAt DESC").all() as unknown as TaskRow[]).map(mapTask);
}

function loadVotes(): VoteRecord[] {
  return statement("SELECT * FROM votes ORDER BY updatedAt DESC").all() as unknown as VoteRow[];
}

function loadRuns(): ComputeRunRecord[] {
  return statement("SELECT * FROM runs").all() as unknown as RunRow[];
}

function loadCheckpoints(): CheckpointRecord[] {
  return statement("SELECT * FROM checkpoints ORDER BY dueAt ASC").all() as unknown as CheckpointRecord[];
}

function loadGovernance(): GovernanceEventRecord[] {
  return statement("SELECT * FROM governance_events ORDER BY createdAt DESC").all() as unknown as GovernanceRow[];
}

function hydrate(activeProfileId: string) {
  const profiles = loadProfiles();
  const categories = loadCategories();
  const tasks = loadTasks();
  const votes = loadVotes();
  const runs = loadRuns();
  const checkpoints = loadCheckpoints();
  const governance = loadGovernance();

  const votesByTask = new Map<string, VoteRecord[]>();
  const votesByProfile = new Map<string, VoteRecord[]>();

  for (const vote of votes) {
    const taskBucket = votesByTask.get(vote.taskId) ?? [];
    taskBucket.push(vote);
    votesByTask.set(vote.taskId, taskBucket);

    const profileBucket = votesByProfile.get(vote.profileId) ?? [];
    profileBucket.push(vote);
    votesByProfile.set(vote.profileId, profileBucket);
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
    })),
  );

  const profileSummaries: ProfileSummary[] = profiles.map((profile) => {
    const castVotes = votesByProfile.get(profile.id) ?? [];
    const spent = spentCredits(castVotes);
    return {
      ...profile,
      spentCredits: spent,
      availableCredits: profile.voiceCredits - spent,
    };
  });

  const profileMap = new Map(profileSummaries.map((profile) => [profile.id, profile]));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const runMap = new Map(runs.map((run) => [run.taskId, run]));
  const checkpointMap = new Map<string, CheckpointRecord[]>();
  const governanceMap = new Map<string, GovernanceEventRecord[]>();

  for (const checkpoint of checkpoints) {
    const bucket = checkpointMap.get(checkpoint.taskId) ?? [];
    bucket.push(checkpoint);
    checkpointMap.set(checkpoint.taskId, bucket);
  }

  for (const event of governance) {
    if (!event.taskId) {
      continue;
    }
    const bucket = governanceMap.get(event.taskId) ?? [];
    bucket.push(event);
    governanceMap.set(event.taskId, bucket);
  }

  const taskSummaries: TaskSummary[] = tasks.map((task) => {
    const category = categoryMap.get(task.categoryId);
    const proposer = profileMap.get(task.proposerId);
    const taskVotes = votesByTask.get(task.id) ?? [];
    const ranking = rankings.get(task.id);
    const userVote = taskVotes.find((vote) => vote.profileId === activeProfileId);

    return {
      ...task,
      categoryName: category?.name ?? "Unknown",
      categorySlug: category?.slug ?? "unknown",
      proposerName: proposer?.name ?? "Unknown proposer",
      totalVotes: taskVotes.reduce((total, vote) => total + vote.voteCount, 0),
      supporterCount: taskVotes.length,
      categoryRank: ranking?.rank ?? null,
      allocatedTier: ranking?.tier ?? (task.safetyStatus === "blocked" ? "blocked" : "queued"),
      userVotes: userVote?.voteCount ?? 0,
      userCost: quadraticCost(userVote?.voteCount ?? 0),
    };
  });

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
    runs,
    checkpoints: checkpointMap,
    governance,
    governanceByTask: governanceMap,
    runMap,
    profileMap,
  };
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
    return left.createdAt.localeCompare(right.createdAt);
  });
}

export function listProfiles(): ProfileSummary[] {
  return hydrate(seedProfiles[0].id).profiles;
}

export function getDefaultProfileId(): string {
  return seedProfiles[0].id;
}

export function getHomeData(activeProfileId: string) {
  const snapshot = hydrate(activeProfileId);
  const tasks = sortTasks(snapshot.tasks);
  const metrics: HomepageMetrics = {
    proposals: snapshot.tasks.length,
    eligible: snapshot.tasks.filter((task) => isEligibleForAllocation(task.totalVotes, task.stage, task.safetyStatus)).length,
    activeRuns: snapshot.tasks.filter((task) => task.stage === "running").length,
    shipped: snapshot.tasks.filter((task) => task.stage === "shipped").length,
    voiceIssued: snapshot.profiles.reduce((total, profile) => total + profile.voiceCredits, 0),
    voiceSpent: snapshot.profiles.reduce((total, profile) => total + profile.spentCredits, 0),
  };

  return {
    metrics,
    categories: snapshot.categories,
    featuredTasks: tasks.slice(0, 6),
    contributors: [...snapshot.profiles].sort((left, right) => right.credibility - left.credibility).slice(0, 5),
    governance: snapshot.governance.slice(0, 5),
    activeProfile: snapshot.profileMap.get(activeProfileId) ?? snapshot.profiles[0],
  };
}

export function getMarketplaceData(activeProfileId: string, filters: MarketplaceFilters) {
  const snapshot = hydrate(activeProfileId);
  const query = filters.query?.trim().toLowerCase() ?? "";
  const filtered = sortTasks(snapshot.tasks).filter((task) => {
    if (query) {
      const haystack = [task.title, task.summary, task.problem, task.categoryName].join(" ").toLowerCase();
      if (!haystack.includes(query)) {
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

  return {
    tasks: filtered,
    categories: snapshot.categories,
    activeProfile: snapshot.profileMap.get(activeProfileId) ?? snapshot.profiles[0],
  };
}

export function getTaskDetail(slug: string, activeProfileId: string): TaskDetail | null {
  const snapshot = hydrate(activeProfileId);
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
    checkpoints: snapshot.checkpoints.get(task.id) ?? [],
    governanceEvents: snapshot.governanceByTask.get(task.id) ?? [],
  };
}

export function getGovernanceData(activeProfileId: string) {
  const snapshot = hydrate(activeProfileId);
  return {
    activeProfile: snapshot.profileMap.get(activeProfileId) ?? snapshot.profiles[0],
    governance: snapshot.governance,
    tasks: sortTasks(snapshot.tasks),
    categories: snapshot.categories,
  };
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function uniqueSlug(base: string) {
  const existing = new Set((statement("SELECT slug FROM tasks").all() as unknown as Array<{ slug: string }>).map((row) => row.slug));
  let candidate = slugify(base);
  let iteration = 2;

  while (existing.has(candidate)) {
    candidate = `${slugify(base)}-${iteration}`;
    iteration += 1;
  }

  return candidate;
}

export interface CreateProposalInput {
  title: string;
  categorySlug: string;
  summary: string;
  problem: string;
  whyNow: string;
  publicBenefit: string;
  requestedTier: "days" | "weeks" | "months";
  deliverables: string[];
  evaluationCriteria: string[];
  riskFlags: string[];
  evidence: string[];
}

export function createProposal(input: CreateProposalInput, proposerId: string) {
  const category = loadCategories().find((entry) => entry.slug === input.categorySlug);
  if (!category) {
    throw new Error("Unknown category.");
  }

  if (!statement("SELECT id FROM profiles WHERE id = :id").get({ id: proposerId })) {
    throw new Error("Unknown proposer.");
  }

  const now = new Date().toISOString();
  const slug = uniqueSlug(input.title);
  const taskId = slug;

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
      INSERT INTO governance_events (id, taskId, house, title, decision, outcome, createdAt)
      VALUES (:id, :taskId, :house, :title, :decision, :outcome, :createdAt)
    `).run(
      asSqlRecord({
        id: randomUUID(),
        taskId,
        house: "safety-council",
        title: "Queued for safety review",
        decision: "New proposal entered the intake queue and will not receive compute until it clears policy review.",
        outcome: "Visible for discussion immediately; allocation remains queued until reviewed.",
        createdAt: now,
      }),
    );
  });

  return slug;
}

export function saveVote(taskId: string, profileId: string, voteCount: number, rationale: string) {
  if (!Number.isInteger(voteCount) || voteCount < 0 || voteCount > MAX_VOTES_PER_TASK) {
    throw new Error(`Votes must be between 0 and ${MAX_VOTES_PER_TASK}.`);
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
    throw new Error("Blocked tasks cannot receive votes.");
  }

  const profile = statement("SELECT * FROM profiles WHERE id = :id").get({ id: profileId }) as unknown as ProfileRecord | null;
  if (!profile) {
    throw new Error("Profile not found.");
  }

  const existingVotes = statement("SELECT * FROM votes WHERE profileId = :profileId").all({ profileId }) as unknown as VoteRow[];
  const existingVote = existingVotes.find((vote) => vote.taskId === taskId);
  const otherVotes = existingVotes.filter((vote) => vote.taskId !== taskId);
  const nextSpent = spentCredits(otherVotes) + quadraticCost(voteCount);

  if (nextSpent > profile.voiceCredits) {
    throw new Error("Not enough voice credits for that vote allocation.");
  }

  const now = new Date().toISOString();
  withTransaction(() => {
    if (existingVote && voteCount === 0) {
      statement("DELETE FROM votes WHERE taskId = :taskId AND profileId = :profileId").run(asSqlRecord({ taskId, profileId }));
      return;
    }

    if (existingVote) {
      statement(`
        UPDATE votes
        SET voteCount = :voteCount, rationale = :rationale, updatedAt = :updatedAt
        WHERE taskId = :taskId AND profileId = :profileId
      `).run(asSqlRecord({ taskId, profileId, voteCount, rationale, updatedAt: now }));
      return;
    }

    if (voteCount > 0) {
      statement(`
        INSERT INTO votes (id, taskId, profileId, voteCount, rationale, updatedAt)
        VALUES (:id, :taskId, :profileId, :voteCount, :rationale, :updatedAt)
      `).run(asSqlRecord({ id: randomUUID(), taskId, profileId, voteCount, rationale, updatedAt: now }));
    }
  });
}