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
import { summarizeEconomics, summarizeRevenueStream } from "@/lib/economics";
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
import type {
  CategorySummary,
  CheckpointDetail,
  CheckpointGateRecord,
  CheckpointRecord,
  CommentRecord,
  CommentVoteRecord,
  ComputeRunRecord,
  DiscussionComment,
  GovernanceEventRecord,
  HomepageMetrics,
  MarketplaceFilters,
  ProfileRecord,
  ProfileSummary,
  RevenueStreamRecord,
  SafetyStatus,
  TaskDetail,
  TaskFinanceRecord,
  TaskPulseVoteRecord,
  TaskRecord,
  TaskSummary,
  TreasuryEntryRecord,
  VoteRecord,
} from "@/lib/types";

type TaskRow = Omit<TaskRecord, "deliverables" | "evaluationCriteria" | "riskFlags" | "evidence"> & {
  deliverables: string;
  evaluationCriteria: string;
  riskFlags: string;
  evidence: string;
};

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
}

function loadTasks(): TaskRecord[] {
  return (statement("SELECT * FROM tasks ORDER BY createdAt DESC").all() as unknown as TaskRow[]).map(mapTask);
}

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
}

function loadCheckpoints(): CheckpointRecord[] {
  return statement("SELECT * FROM checkpoints ORDER BY dueAt ASC").all() as unknown as CheckpointRecord[];
}

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

  for (const vote of votes) {
    const taskBucket = votesByTask.get(vote.taskId) ?? [];
    taskBucket.push(vote);
    votesByTask.set(vote.taskId, taskBucket);

    const profileBucket = votesByProfile.get(vote.profileId) ?? [];
    profileBucket.push(vote);
    votesByProfile.set(vote.profileId, profileBucket);
  }

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
    })),
  );

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
    if (right.taskPulseScore !== left.taskPulseScore) {
      return right.taskPulseScore - left.taskPulseScore;
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
    voiceSpent: snapshot.profiles.reduce((total, profile) => total + profile.voteCreditsSpent, 0),
    bondedVoice: snapshot.profiles.reduce((total, profile) => total + profile.bondedCredits, 0),
    publicSignal: snapshot.tasks.reduce((total, task) => total + task.taskPulseScore, 0),
    treasuryMonthlyUsd: snapshot.economics.treasuryMonthlyUsd,
  };

  return {
    metrics,
    categories: snapshot.categories,
    featuredTasks: tasks.slice(0, 6),
    contributors: [...snapshot.profiles].sort((left, right) => right.credibility - left.credibility).slice(0, 5),
    governance: snapshot.governance.slice(0, 5),
    sponsoredTasks: [...snapshot.tasks].sort((left, right) => right.sponsorPoolUsd - left.sponsorPoolUsd).slice(0, 4),
    streams: snapshot.streams,
    economics: snapshot.economics,
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
    economics: snapshot.economics,
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
    checkpoints: snapshot.checkpointsByTask.get(task.id) ?? [],
    governanceEvents: snapshot.governanceByTask.get(task.id) ?? [],
    comments: buildDiscussionTree(task.id, snapshot.comments, snapshot.commentVotesByComment, snapshot.profileMap, activeProfileId),
  };
}

export function getGovernanceData(activeProfileId: string) {
  const snapshot = hydrate(activeProfileId);
  return {
    activeProfile: snapshot.profileMap.get(activeProfileId) ?? snapshot.profiles[0],
    governance: snapshot.governance,
    tasks: sortTasks(snapshot.tasks),
    categories: snapshot.categories,
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
  qualityBondCredits: number;
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

  const existingVotes = statement("SELECT * FROM votes WHERE profileId = :profileId").all({ profileId }) as unknown as VoteRecord[];
  const existingVote = existingVotes.find((vote) => vote.taskId === taskId);
  const otherVotes = existingVotes.filter((vote) => vote.taskId !== taskId);
  const proposalBondSpend = proposalBondSpendForProfile(profileId);
  const nextSpent = spentCredits(otherVotes) + quadraticCost(voteCount) + proposalBondSpend;

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
}






