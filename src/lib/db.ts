import "server-only";

import {
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual } from "node:crypto";
import { existsSync,
  mkdirSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";

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
import {
  DEFAULT_CAPACITY_OVERRIDE,
  deriveAutomaticCapacityState,
  isRunDecisionCompatible,
  resolveCapacityState,
  runDecisionTransition,
} from "@/lib/run-governance";
import {
  INSERT_RUN_DECISION_SQL,
  RUN_DECISION_SCHEMA_STATEMENTS,
} from "@/lib/run-governance-schema";
import {
  DEFAULT_MARKETPLACE_PAGE_SIZE,
  getDiscoveryReasons,
  normalizeMarketplacePage,
  normalizeMarketplacePageSize,
  normalizeMarketplaceQuery,
} from "@/lib/discovery";
import {
  escapeAuditLikePattern,
  normalizeAuditLogFilters,
  type AuditLogPage,
} from "@/lib/audit-log";
import {
  analyticsBucketSql,
  analyticsPeriod,
  buildAnalyticsBuckets,
  normalizeAnalyticsFilters,
  VISITOR_ANALYTICS_RETENTION_DAYS,
  type AdminHistoricalAnalytics,
  type AnalyticsSummaryValues,
} from "@/lib/admin-analytics";
import {
  evaluateCategoryIntake,
  evaluateKenIntake,
  normalizeReviewText,
  normalizedReviewSlug,
  parseIntakeResult,
  type CategoryIntakeResult,
  type KenIntakeResult,
} from "@/lib/intake-review";
import {
  assertReviewActionAuthorized,
  decisionNeedsPublicReason,
  isSameFinalDecision,
  isReviewerRole,
  nextReviewStatus,
  type ReviewAction,
} from "@/lib/review-policy";
import {
  INSERT_APPROVED_CATEGORY_SQL,
  INSERT_REVIEW_EVENT_SQL,
  REVIEW_SCHEMA_STATEMENTS,
} from "@/lib/review-schema";
import { PUBLIC_CONTENT_LAST_MODIFIED_SQL } from "@/lib/seo-sitemap";
import { env, isAdminEmail, isOwnerEmail, canonicalOrigin, notificationEmails, ownerEmail, smtpConfigured, visitorHashSalt } from "@/lib/env";
import {
  seedCategories,
  seedCheckpoints,
  seedGovernanceEvents,
  seedProfiles,
  seedRuns,
  seedTasks,
  seedVotes,
  retiredSeedCategoryIds,
  retiredSeedTaskIds,
} from "@/lib/seed";
import {
  seedChangelogEntries,
  seedCheckpointGates,
  seedComments,
  seedCommentVotes,
  seedProfileAttestations,
  seedRevenueStreams,
  seedRunDecisions,
  seedRunUpdates,
  seedSponsorshipCommitments,
  seedTaskFinance,
  seedTaskPulseVotes,
  seedTaskTimings,
  seedTreasuryEntries,
} from "@/lib/seed-plus";
import type {
  AboutPageContent,
  AccountRecord,
  AdminSmtpSettings,
  AdminNotificationSettings,
  AuditLogRecord,
  BookmarkRecord,
  CapacityOverrideState,
  CapacityState,
  CapacityStateResolution,
  ChangelogEntryRecord,
  ContactAttachmentRecord,
  ContactSubmissionRecord,
  CategoryProposalRecord,
  CategorySummary,
  CheckpointDetail,
  CommentRecord,
  CommentVoteRecord,
  ComputeRunRecord,
  DiscussionComment,
  EconomicsSummary,
  EmailTokenPurpose,
  EmailTokenRecord,
  GovernanceEventRecord,
  HomepageMetrics,
  MaintenanceState,
  MarketplaceFilters,
  KenSubmissionRecord,
  ProfileAttestationRecord,
  ProfileLink,
  ProfileRecord,
  ProfileSummary,
  RevenueStreamRecord,
  RevenueStreamSummary,
  ReviewEntityType,
  ReviewEventAction,
  ReviewEventRecord,
  ReviewQueuePage,
  RunDecisionEventRecord,
  RunUpdateRecord,
  SearchResultItem,
  SessionRecord,
  SiteSettingRecord,
  SponsorshipCommitmentRecord,
  SystemRole,
  TaskDetail,
  TaskFinanceRecord,
  TaskIllustrationRecord,
  TaskPulseVoteRecord,
  TaskRecord,
  TaskSummary,
  TaskTimingRecord,
  TreasuryEntryRecord,
  VerificationStatus,
  ViewerSession,
  VisitorAggregate,
  VisitorStats,
  VisitorRecord,
  VoteRecord,
} from "@/lib/types";
import { DEFAULT_ABOUT_PAGE } from "@/lib/about-defaults";
import { FAQ_ENTRIES } from "@/lib/faq";
import { laneVisuals } from "@/lib/taxonomy";
import { configEncryptionAvailable, decryptConfigSecret, encryptConfigSecret } from "@/lib/config-crypto";
import { TEST_AUTH_USERS, type TestAuthMode } from "@/lib/test-auth";
import {
  redactCategoryProposalForSubmitter,
  redactKenSubmissionForPublic,
  redactReviewEventForPublic,
} from "@/lib/review-redaction";
import { hashPrivateIdentifier } from "@/lib/privacy";

type DbRow = Record<string, Value>;

const databaseFilePath = isAbsolute(env.KENMATCH_DB_FILE)
  ? env.KENMATCH_DB_FILE
  : join(process.cwd(), env.KENMATCH_DB_FILE);
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

export async function ensureDatabaseReady() {
  await ensureDatabase();
}

function logPhase(label: string, start: number) {
  const elapsed = Date.now() - start;
  console.log(`[db] ${label} done in ${elapsed}ms`);
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
  const overallStart = Date.now();
  console.log(`[db] initializeDatabase start (url=${databaseUrl})`);
  const client = getClient();
  const tablesStart = Date.now();
  await client.batch(
    [
      "PRAGMA foreign_keys = ON",
      `CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        username TEXT,
        showRealName INTEGER NOT NULL DEFAULT 1,
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
        avatarImage TEXT,
        avatarGradient TEXT,
        avatarImageScale REAL NOT NULL DEFAULT 1,
        avatarImageX REAL NOT NULL DEFAULT 50,
        avatarImageY REAL NOT NULL DEFAULT 50,
        links TEXT NOT NULL DEFAULT '[]',
        location TEXT,
        pronouns TEXT,
        verificationStatus TEXT NOT NULL DEFAULT 'none',
        verificationRequestedAt TEXT,
        verificationNote TEXT,
        createdAt TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        profileId TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        username TEXT,
        passwordHash TEXT NOT NULL,
        passwordSalt TEXT NOT NULL,
        licensingConsent TEXT NOT NULL DEFAULT 'audit-only',
        systemRole TEXT NOT NULL DEFAULT 'contributor',
        emailVerified INTEGER NOT NULL DEFAULT 0,
        emailVerifiedAt TEXT,
        lastLoginAt TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (profileId) REFERENCES profiles(id)
      )`,
      `CREATE TABLE IF NOT EXISTS email_tokens (
        id TEXT PRIMARY KEY,
        accountId TEXT NOT NULL,
        email TEXT NOT NULL,
        purpose TEXT NOT NULL,
        tokenHash TEXT NOT NULL UNIQUE,
        expiresAt TEXT NOT NULL,
        consumedAt TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (accountId) REFERENCES accounts(id)
      )`,
      `CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        profileId TEXT NOT NULL,
        taskId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        UNIQUE(profileId, taskId),
        FOREIGN KEY (profileId) REFERENCES profiles(id),
        FOREIGN KEY (taskId) REFERENCES tasks(id)
      )`,
      `CREATE TABLE IF NOT EXISTS visitors (
        id TEXT PRIMARY KEY,
        visitorHash TEXT NOT NULL UNIQUE,
        countryCode TEXT,
        countryName TEXT,
        region TEXT,
        city TEXT,
        latitude REAL,
        longitude REAL,
        userAgent TEXT,
        firstSeenAt TEXT NOT NULL,
        lastSeenAt TEXT NOT NULL,
        pageViews INTEGER NOT NULL DEFAULT 1,
        accountCreated INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS visitor_daily_activity (
        day TEXT NOT NULL,
        visitorId TEXT NOT NULL,
        countryCode TEXT,
        countryName TEXT,
        pageViews INTEGER NOT NULL DEFAULT 1,
        firstSeenAt TEXT NOT NULL,
        lastSeenAt TEXT NOT NULL,
        PRIMARY KEY (day, visitorId),
        FOREIGN KEY (visitorId) REFERENCES visitors(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS notification_delivery_events (
        id TEXT PRIMARY KEY,
        purpose TEXT NOT NULL,
        status TEXT NOT NULL,
        transportSource TEXT NOT NULL,
        recipientCount INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        updatedBy TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        accountId TEXT,
        action TEXT NOT NULL,
        detail TEXT NOT NULL,
        metadata TEXT,
        ipAddress TEXT,
        createdAt TEXT NOT NULL
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
      `CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        thesis TEXT NOT NULL,
        symbolKey TEXT NOT NULL DEFAULT ''
      )`,
      `CREATE TABLE IF NOT EXISTS category_proposals (
        id TEXT PRIMARY KEY,
        proposerProfileId TEXT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT NOT NULL,
        publicBenefit TEXT NOT NULL,
        exampleKens TEXT NOT NULL,
        reviewStatus TEXT NOT NULL DEFAULT 'pending',
        reviewNote TEXT,
        internalReviewNote TEXT,
        reviewedBy TEXT,
        assigneeAccountId TEXT,
        mergedCategoryId TEXT,
        intakeResultJson TEXT NOT NULL DEFAULT '{}',
        reviewedAt TEXT,
        firstApprovalBy TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (proposerProfileId) REFERENCES profiles(id)
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
      ...REVIEW_SCHEMA_STATEMENTS,
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
      `CREATE TABLE IF NOT EXISTS task_illustrations (
        taskId TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        url TEXT NOT NULL,
        altText TEXT NOT NULL,
        mimeType TEXT NOT NULL,
        sizeBytes INTEGER NOT NULL,
        width INTEGER,
        height INTEGER,
        storagePath TEXT,
        updatedAt TEXT NOT NULL,
        updatedBy TEXT,
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
      ...RUN_DECISION_SCHEMA_STATEMENTS,
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
      `CREATE TABLE IF NOT EXISTS changelog_entries (
        id TEXT PRIMARY KEY,
        entryDate TEXT NOT NULL,
        title TEXT NOT NULL,
        entryType TEXT NOT NULL,
        summary TEXT NOT NULL,
        details TEXT NOT NULL,
        visible INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        updatedBy TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS contact_submissions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        topic TEXT NOT NULL,
        replyEmail TEXT NOT NULL,
        bodyMarkdown TEXT NOT NULL,
        attachmentCount INTEGER NOT NULL DEFAULT 0,
        emailStatus TEXT NOT NULL,
        emailError TEXT,
        ipAddress TEXT,
        userAgent TEXT,
        createdAt TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS contact_attachments (
        id TEXT PRIMARY KEY,
        submissionId TEXT NOT NULL,
        fileName TEXT NOT NULL,
        mimeType TEXT NOT NULL,
        sizeBytes INTEGER NOT NULL,
        contentBase64 TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (submissionId) REFERENCES contact_submissions(id) ON DELETE CASCADE
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
      "CREATE INDEX IF NOT EXISTS idx_tasks_discovery ON tasks(stage, safetyStatus, categoryId, createdAt, id)",
      "CREATE INDEX IF NOT EXISTS idx_tasks_category_discovery ON tasks(categoryId, stage, safetyStatus, createdAt, id)",
      "CREATE INDEX IF NOT EXISTS idx_votes_task_signal ON votes(taskId, voteCount, updatedAt)",
      "CREATE INDEX IF NOT EXISTS idx_category_proposals_status ON category_proposals(reviewStatus)",
      "CREATE INDEX IF NOT EXISTS idx_category_proposals_proposer ON category_proposals(proposerProfileId)",
      "CREATE INDEX IF NOT EXISTS idx_comments_taskId ON comments(taskId)",
      "CREATE INDEX IF NOT EXISTS idx_comments_task_activity ON comments(taskId, createdAt)",
      "CREATE INDEX IF NOT EXISTS idx_comment_votes_commentId ON comment_votes(commentId)",
      "CREATE INDEX IF NOT EXISTS idx_run_updates_taskId ON run_updates(taskId)",
      "CREATE INDEX IF NOT EXISTS idx_run_updates_task_activity ON run_updates(taskId, createdAt)",
      "CREATE INDEX IF NOT EXISTS idx_checkpoints_task_status ON checkpoints(taskId, status, dueAt)",
      "CREATE INDEX IF NOT EXISTS idx_governance_events_task_activity ON governance_events(taskId, createdAt)",
      "CREATE INDEX IF NOT EXISTS idx_sessions_tokenHash ON sessions(tokenHash)",
      "CREATE INDEX IF NOT EXISTS idx_task_pulse_votes_taskId ON task_pulse_votes(taskId)",
      "CREATE INDEX IF NOT EXISTS idx_task_pulse_votes_signal ON task_pulse_votes(taskId, value, updatedAt)",
      "CREATE INDEX IF NOT EXISTS idx_sponsorship_commitments_status ON sponsorship_commitments(status)",
      "CREATE INDEX IF NOT EXISTS idx_changelog_entries_visible ON changelog_entries(visible, entryDate)",
      "CREATE INDEX IF NOT EXISTS idx_contact_submissions_createdAt ON contact_submissions(createdAt)",
      "CREATE INDEX IF NOT EXISTS idx_contact_attachments_submissionId ON contact_attachments(submissionId)",
      "CREATE INDEX IF NOT EXISTS idx_request_rate_limits_updatedAt ON request_rate_limits(updatedAt)",
      "CREATE INDEX IF NOT EXISTS idx_security_events_createdAt ON security_events(createdAt)",
      "CREATE INDEX IF NOT EXISTS idx_bookmarks_profileId ON bookmarks(profileId)",
      "CREATE INDEX IF NOT EXISTS idx_email_tokens_accountId ON email_tokens(accountId)",
      "CREATE INDEX IF NOT EXISTS idx_email_tokens_purpose ON email_tokens(purpose)",
      "CREATE INDEX IF NOT EXISTS idx_visitors_firstSeenAt ON visitors(firstSeenAt)",
      "CREATE INDEX IF NOT EXISTS idx_visitors_countryCode ON visitors(countryCode)",
      "CREATE INDEX IF NOT EXISTS idx_visitor_daily_activity_day ON visitor_daily_activity(day)",
      "CREATE INDEX IF NOT EXISTS idx_visitor_daily_activity_country_day ON visitor_daily_activity(countryCode, day)",
      "CREATE INDEX IF NOT EXISTS idx_notification_delivery_createdAt ON notification_delivery_events(createdAt)",
      "CREATE INDEX IF NOT EXISTS idx_notification_delivery_status_createdAt ON notification_delivery_events(status, createdAt)",
      "CREATE INDEX IF NOT EXISTS idx_accounts_createdAt ON accounts(createdAt)",
      "CREATE INDEX IF NOT EXISTS idx_audit_log_createdAt ON audit_log(createdAt)",
      "CREATE INDEX IF NOT EXISTS idx_audit_log_accountId ON audit_log(accountId)",
      "CREATE INDEX IF NOT EXISTS idx_audit_log_action_createdAt ON audit_log(action, createdAt)",
    ],
    "write",
  );
  logPhase("tables+indexes", tablesStart);

  const columnsStart = Date.now();
  await ensureColumn(client, "accounts", "licensingConsent", "TEXT NOT NULL DEFAULT 'audit-only'");
  await ensureColumn(client, "accounts", "systemRole", "TEXT NOT NULL DEFAULT 'contributor'");
  await ensureColumn(client, "accounts", "emailVerified", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(client, "accounts", "emailVerifiedAt", "TEXT");
  await ensureColumn(client, "accounts", "lastLoginAt", "TEXT");
  await ensureColumn(client, "accounts", "username", "TEXT");
  await ensureColumn(client, "profiles", "username", "TEXT");
  await ensureColumn(client, "profiles", "showRealName", "INTEGER NOT NULL DEFAULT 1");
  await ensureColumn(client, "profiles", "avatarImage", "TEXT");
  await ensureColumn(client, "profiles", "avatarGradient", "TEXT");
  await ensureColumn(client, "profiles", "avatarImageScale", "REAL NOT NULL DEFAULT 1");
  await ensureColumn(client, "profiles", "avatarImageX", "REAL NOT NULL DEFAULT 50");
  await ensureColumn(client, "profiles", "avatarImageY", "REAL NOT NULL DEFAULT 50");
  await ensureColumn(client, "profiles", "links", "TEXT NOT NULL DEFAULT '[]'");
  await ensureColumn(client, "profiles", "location", "TEXT");
  await ensureColumn(client, "profiles", "pronouns", "TEXT");
  await ensureColumn(client, "profiles", "verificationStatus", "TEXT NOT NULL DEFAULT 'none'");
  await ensureColumn(client, "profiles", "verificationRequestedAt", "TEXT");
  await ensureColumn(client, "profiles", "verificationNote", "TEXT");
  await ensureColumn(client, "categories", "symbolKey", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(client, "category_proposals", "internalReviewNote", "TEXT");
  await ensureColumn(client, "category_proposals", "assigneeAccountId", "TEXT");
  await ensureColumn(client, "category_proposals", "mergedCategoryId", "TEXT");
  await ensureColumn(client, "category_proposals", "intakeResultJson", "TEXT NOT NULL DEFAULT '{}'");
  await ensureColumn(client, "category_proposals", "reviewedAt", "TEXT");
  await ensureColumn(client, "category_proposals", "firstApprovalBy", "TEXT");
  await client.execute("CREATE INDEX IF NOT EXISTS idx_category_proposals_assignee ON category_proposals(assigneeAccountId, reviewStatus, updatedAt)");
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
  await ensureColumn(client, "security_events", "networkHash", "TEXT");
  await client.execute("UPDATE audit_log SET ipAddress = NULL WHERE ipAddress IS NOT NULL");
  await client.execute("UPDATE contact_submissions SET ipAddress = NULL WHERE ipAddress IS NOT NULL");
  await client.execute("UPDATE security_events SET ipAddress = NULL WHERE ipAddress IS NOT NULL");
  await client.execute("UPDATE visitors SET region = NULL, city = NULL, latitude = NULL, longitude = NULL, userAgent = NULL WHERE region IS NOT NULL OR city IS NOT NULL OR latitude IS NOT NULL OR longitude IS NOT NULL OR userAgent IS NOT NULL");
  await client.execute("DELETE FROM request_rate_limits WHERE identifier NOT LIKE 'sha256:%'");
  await client.execute("UPDATE profiles SET username = id WHERE username IS NULL OR trim(username) = ''");
  await client.execute("UPDATE accounts SET username = profileId WHERE username IS NULL OR trim(username) = ''");
  await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username) WHERE username IS NOT NULL");
  await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE username IS NOT NULL");
  logPhase("column migrations", columnsStart);

  const seedStart = Date.now();
  await seedDatabase();
  logPhase("seedDatabase", seedStart);

  const ownerStart = Date.now();
  await ensureOwnerSystemRole(client);
  logPhase("ensureOwnerSystemRole", ownerStart);

  const settingsStart = Date.now();
  await ensureDefaultSiteSettings(client);
  logPhase("ensureDefaultSiteSettings", settingsStart);

  logPhase("initializeDatabase total", overallStart);
}

async function ensureColumn(client: Client, table: string, column: string, definition: string) {
  const info = await client.execute(`PRAGMA table_info(${table})`);
  const hasColumn = info.rows.some((row) => getString(row as DbRow, "name") === column);
  if (!hasColumn) {
    console.log(`[db] ensureColumn: adding ${table}.${column}`);
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
        id, username, showRealName, name, role, bio, specialty, attestation, attestationLevel, moderationStatus,
        voiceCredits, credibility, avatarHue, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        username = excluded.username,
        showRealName = excluded.showRealName,
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
        normalized.username ?? normalized.id,
        normalized.showRealName === false ? 0 : 1,
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
    sql: `INSERT INTO profile_attestations (profileId, provider, status, sybilRisk, reviewedAt, signals, note) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(profileId) DO UPDATE SET
        provider = excluded.provider,
        status = excluded.status,
        sybilRisk = excluded.sybilRisk,
        reviewedAt = excluded.reviewedAt,
        signals = excluded.signals,
        note = excluded.note`,
    args: [entry.profileId, entry.provider, entry.status, entry.sybilRisk, entry.reviewedAt, serializeList(entry.signals), entry.note],
  } satisfies InStatement));

  const categoryStatements = seedCategories.map((category) => ({
    sql: `INSERT INTO categories (id, slug, name, description, thesis, symbolKey) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        slug = excluded.slug,
        name = excluded.name,
        description = excluded.description,
        thesis = excluded.thesis,
        symbolKey = excluded.symbolKey`,
    args: [category.id, category.slug, category.name, category.description, category.thesis, category.symbolKey ?? category.slug],
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
    sql: "INSERT OR REPLACE INTO votes (id, taskId, profileId, voteCount, rationale, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
    args: [vote.id, vote.taskId, vote.profileId, vote.voteCount, vote.rationale, vote.updatedAt],
  } satisfies InStatement));

  const pulseStatements = seedTaskPulseVotes.map((vote) => ({
    sql: "INSERT OR REPLACE INTO task_pulse_votes (id, taskId, profileId, value, updatedAt) VALUES (?, ?, ?, ?, ?)",
    args: [vote.id, vote.taskId, vote.profileId, vote.value, vote.updatedAt],
  } satisfies InStatement));

  const commentStatements = seedComments.map((comment) => ({
    sql: `INSERT INTO comments (id, taskId, profileId, parentId, body, stakeCredits, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        taskId = excluded.taskId,
        profileId = excluded.profileId,
        parentId = excluded.parentId,
        body = excluded.body,
        stakeCredits = excluded.stakeCredits,
        createdAt = excluded.createdAt`,
    args: [comment.id, comment.taskId, comment.profileId, comment.parentId, comment.body, comment.stakeCredits, comment.createdAt],
  } satisfies InStatement));

  const commentVoteStatements = seedCommentVotes.map((vote) => ({
    sql: "INSERT OR REPLACE INTO comment_votes (id, commentId, profileId, value, updatedAt) VALUES (?, ?, ?, ?, ?)",
    args: [vote.id, vote.commentId, vote.profileId, vote.value, vote.updatedAt],
  } satisfies InStatement));

  const runStatements = seedRuns.map((run) => ({
    sql: `INSERT INTO runs (id, taskId, status, backend, budgetUsd, runtimeHours, checkpointCadenceHours, reproducibilityNotes, rollbackPlan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        taskId = excluded.taskId,
        status = excluded.status,
        backend = excluded.backend,
        budgetUsd = excluded.budgetUsd,
        runtimeHours = excluded.runtimeHours,
        checkpointCadenceHours = excluded.checkpointCadenceHours,
        reproducibilityNotes = excluded.reproducibilityNotes,
        rollbackPlan = excluded.rollbackPlan`,
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
    sql: `INSERT INTO task_timings (taskId, launchAt, startedAt, expectedMaxEndAt, computeHoursUsed, completionMode, completionSummary, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(taskId) DO UPDATE SET
        launchAt = excluded.launchAt,
        startedAt = excluded.startedAt,
        expectedMaxEndAt = excluded.expectedMaxEndAt,
        computeHoursUsed = excluded.computeHoursUsed,
        completionMode = excluded.completionMode,
        completionSummary = excluded.completionSummary,
        updatedAt = excluded.updatedAt`,
    args: [timing.taskId, timing.launchAt, timing.startedAt, timing.expectedMaxEndAt, timing.computeHoursUsed, timing.completionMode, timing.completionSummary, timing.updatedAt],
  } satisfies InStatement));

  const runUpdateStatements = seedRunUpdates.map((update) => ({
    sql: `INSERT INTO run_updates (id, taskId, label, status, summary, artifact, evidenceNote, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        taskId = excluded.taskId,
        label = excluded.label,
        status = excluded.status,
        summary = excluded.summary,
        artifact = excluded.artifact,
        evidenceNote = excluded.evidenceNote,
        createdAt = excluded.createdAt`,
    args: [update.id, update.taskId, update.label, update.status, update.summary, update.artifact, update.evidenceNote, update.createdAt],
  } satisfies InStatement));

  const checkpointStatements = seedCheckpoints.map((checkpoint) => ({
    sql: `INSERT INTO checkpoints (id, taskId, label, status, detail, dueAt) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        taskId = excluded.taskId,
        label = excluded.label,
        status = excluded.status,
        detail = excluded.detail,
        dueAt = excluded.dueAt`,
    args: [checkpoint.id, checkpoint.taskId, checkpoint.label, checkpoint.status, checkpoint.detail, checkpoint.dueAt],
  } satisfies InStatement));

  const checkpointGateStatements = seedCheckpointGates.map((gate) => ({
    sql: `INSERT INTO checkpoint_gates (checkpointId, approvalScore, requiredApprovals, releaseStatus) VALUES (?, ?, ?, ?)
      ON CONFLICT(checkpointId) DO UPDATE SET
        approvalScore = excluded.approvalScore,
        requiredApprovals = excluded.requiredApprovals,
        releaseStatus = excluded.releaseStatus`,
    args: [gate.checkpointId, gate.approvalScore, gate.requiredApprovals, gate.releaseStatus],
  } satisfies InStatement));

  const governanceStatements = seedGovernanceEvents.map((event) => ({
    sql: `INSERT INTO governance_events (id, taskId, house, title, decision, outcome, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        taskId = excluded.taskId,
        house = excluded.house,
        title = excluded.title,
        decision = excluded.decision,
        outcome = excluded.outcome,
        createdAt = excluded.createdAt`,
    args: [event.id, event.taskId, event.house, event.title, event.decision, event.outcome, event.createdAt],
  } satisfies InStatement));

  const runDecisionStatements = seedRunDecisions.map((event) => ({
    sql: INSERT_RUN_DECISION_SQL.replace("INSERT INTO", "INSERT OR IGNORE INTO"),
    args: [
      event.id,
      event.taskId,
      event.checkpointId,
      event.eventType,
      event.decisionCode,
      event.publicReason,
      event.artifactLabel,
      event.artifactUrl,
      event.artifactDigest,
      event.actorAccountId,
      event.actorRole,
      event.createdAt,
    ],
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
    sql: `INSERT INTO treasury_entries (
      id, streamId, title, description, bucket, direction, amountUsd, fundingState,
      restrictionMode, restrictionScope, restrictionTargetId, restrictionTargetLabel, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      streamId = excluded.streamId,
      title = excluded.title,
      description = excluded.description,
      bucket = excluded.bucket,
      direction = excluded.direction,
      amountUsd = excluded.amountUsd,
      fundingState = excluded.fundingState,
      restrictionMode = excluded.restrictionMode,
      restrictionScope = excluded.restrictionScope,
      restrictionTargetId = excluded.restrictionTargetId,
      restrictionTargetLabel = excluded.restrictionTargetLabel,
      createdAt = excluded.createdAt`,
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

  const changelogStatements = seedChangelogEntries.map((entry) => ({
    sql: `INSERT INTO changelog_entries (
      id, entryDate, title, entryType, summary, details, visible, createdAt, updatedAt, updatedBy
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      entryDate = excluded.entryDate,
      title = excluded.title,
      entryType = excluded.entryType,
      summary = excluded.summary,
      details = excluded.details,
      visible = excluded.visible,
      updatedAt = excluded.updatedAt,
      updatedBy = excluded.updatedBy`,
    args: [
      entry.id,
      entry.entryDate,
      entry.title,
      entry.entryType,
      entry.summary,
      entry.details,
      entry.visible ? 1 : 0,
      entry.createdAt,
      entry.updatedAt,
      entry.updatedBy,
    ],
  } satisfies InStatement));

  const client = getClient();
  if (retiredSeedTaskIds.length > 0) {
    const placeholders = retiredSeedTaskIds.map(() => "?").join(",");
    const cleanupStatements: InStatement[] = [
      { sql: `DELETE FROM comment_votes WHERE commentId IN (SELECT id FROM comments WHERE taskId IN (${placeholders}))`, args: retiredSeedTaskIds },
      { sql: `DELETE FROM comments WHERE taskId IN (${placeholders})`, args: retiredSeedTaskIds },
      { sql: `DELETE FROM task_pulse_votes WHERE taskId IN (${placeholders})`, args: retiredSeedTaskIds },
      { sql: `DELETE FROM votes WHERE taskId IN (${placeholders})`, args: retiredSeedTaskIds },
      { sql: `DELETE FROM checkpoint_gates WHERE checkpointId IN (SELECT id FROM checkpoints WHERE taskId IN (${placeholders}))`, args: retiredSeedTaskIds },
      { sql: `DELETE FROM checkpoints WHERE taskId IN (${placeholders})`, args: retiredSeedTaskIds },
      { sql: `DELETE FROM run_updates WHERE taskId IN (${placeholders})`, args: retiredSeedTaskIds },
      { sql: `DELETE FROM run_decision_events WHERE taskId IN (${placeholders})`, args: retiredSeedTaskIds },
      { sql: `DELETE FROM governance_events WHERE taskId IN (${placeholders})`, args: retiredSeedTaskIds },
      { sql: `DELETE FROM bookmarks WHERE taskId IN (${placeholders})`, args: retiredSeedTaskIds },
      { sql: `DELETE FROM task_timings WHERE taskId IN (${placeholders})`, args: retiredSeedTaskIds },
      { sql: `DELETE FROM runs WHERE taskId IN (${placeholders})`, args: retiredSeedTaskIds },
      { sql: `DELETE FROM task_illustrations WHERE taskId IN (${placeholders})`, args: retiredSeedTaskIds },
      { sql: `DELETE FROM task_finance WHERE taskId IN (${placeholders})`, args: retiredSeedTaskIds },
      { sql: `DELETE FROM tasks WHERE id IN (${placeholders})`, args: retiredSeedTaskIds },
    ];
    await client.batch(cleanupStatements, "write");
  }
  if (retiredSeedCategoryIds.length > 0) {
    const placeholders = retiredSeedCategoryIds.map(() => "?").join(",");
    await client.execute({ sql: `DELETE FROM categories WHERE id IN (${placeholders}) AND id NOT IN (SELECT categoryId FROM tasks)`, args: retiredSeedCategoryIds });
  }
  const allStatements = [
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
    ...runDecisionStatements,
    ...revenueStatements,
    ...treasuryStatements,
    ...sponsorshipStatements,
    ...changelogStatements,
  ];
  console.log(`[db] seedDatabase: dispatching ${allStatements.length} statements`);
  await client.batch(allStatements, "write");
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

export function normalizeUsername(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
}

function assertValidUsername(username: string) {
  if (!/^[a-z0-9][a-z0-9_-]{2,23}$/.test(username)) {
    throw new Error("Username must be 3-24 characters using letters, numbers, underscores, or hyphens.");
  }
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

function publicProfileName(profile: Pick<ProfileRecord, "name" | "username" | "showRealName">) {
  if (profile.showRealName === false && profile.username) {
    return `@${profile.username}`;
  }
  return profile.name;
}

function parseLinks(value: Value): ProfileLink[] {
  if (typeof value !== "string" || value.length === 0) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is ProfileLink => Boolean(entry) && typeof entry === "object" && typeof entry.label === "string" && typeof entry.url === "string")
      .slice(0, 8);
  } catch {
    return [];
  }
}

function mapProfile(row: DbRow): ProfileRecord {
  return {
    id: getString(row, "id"),
    username: getNullableString(row, "username"),
    showRealName: getNumber(row, "showRealName") !== 0,
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
    avatarImage: getNullableString(row, "avatarImage"),
    avatarGradient: getNullableString(row, "avatarGradient"),
    avatarImageScale: getNumber(row, "avatarImageScale") || 1,
    avatarImageX: getNumber(row, "avatarImageX") || 50,
    avatarImageY: getNumber(row, "avatarImageY") || 50,
    links: parseLinks(row.links),
    location: getNullableString(row, "location"),
    pronouns: getNullableString(row, "pronouns"),
    verificationStatus: (getNullableString(row, "verificationStatus") as VerificationStatus | null) ?? "none",
    verificationRequestedAt: getNullableString(row, "verificationRequestedAt"),
    verificationNote: getNullableString(row, "verificationNote"),
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

function mapTaskIllustration(row: DbRow): TaskIllustrationRecord {
  return {
    taskId: getString(row, "taskId"),
    source: getString(row, "source") as TaskIllustrationRecord["source"],
    url: getString(row, "url"),
    altText: getString(row, "altText"),
    mimeType: getString(row, "mimeType"),
    sizeBytes: getNumber(row, "sizeBytes"),
    width: row.width === null || row.width === undefined ? null : getNumber(row, "width"),
    height: row.height === null || row.height === undefined ? null : getNumber(row, "height"),
    storagePath: getNullableString(row, "storagePath"),
    updatedAt: getString(row, "updatedAt"),
    updatedBy: getNullableString(row, "updatedBy"),
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

function mapRunDecision(row: DbRow): RunDecisionEventRecord {
  return {
    id: getString(row, "id"),
    taskId: getString(row, "taskId"),
    checkpointId: getNullableString(row, "checkpointId"),
    eventType: getString(row, "eventType") as RunDecisionEventRecord["eventType"],
    decisionCode: getString(row, "decisionCode") as RunDecisionEventRecord["decisionCode"],
    publicReason: getString(row, "publicReason"),
    artifactLabel: getNullableString(row, "artifactLabel"),
    artifactUrl: getNullableString(row, "artifactUrl"),
    artifactDigest: getNullableString(row, "artifactDigest"),
    actorAccountId: getNullableString(row, "actorAccountId"),
    actorRole: getString(row, "actorRole") as RunDecisionEventRecord["actorRole"],
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
    username: getNullableString(row, "username"),
    passwordHash: getString(row, "passwordHash"),
    passwordSalt: getString(row, "passwordSalt"),
    licensingConsent: getString(row, "licensingConsent") as AccountRecord["licensingConsent"],
    systemRole: (getNullableString(row, "systemRole") as SystemRole | null) ?? "contributor",
    emailVerified: getNumber(row, "emailVerified") > 0,
    emailVerifiedAt: getNullableString(row, "emailVerifiedAt"),
    lastLoginAt: getNullableString(row, "lastLoginAt"),
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
      symbolKey: getString(row, "symbolKey") || getString(row, "slug"),
    })),
  );
function mapCategoryProposal(row: DbRow): CategoryProposalRecord {
  return {
    id: getString(row, "id"),
    proposerProfileId: getString(row, "proposerProfileId"),
    proposerName: getNullableString(row, "proposerName"),
    name: getString(row, "name"),
    slug: getString(row, "slug"),
    description: getString(row, "description"),
    publicBenefit: getString(row, "publicBenefit"),
    exampleKens: parseList(row.exampleKens),
    reviewStatus: getString(row, "reviewStatus") as CategoryProposalRecord["reviewStatus"],
    reviewNote: getNullableString(row, "reviewNote"),
    internalReviewNote: getNullableString(row, "internalReviewNote"),
    reviewedBy: getNullableString(row, "reviewedBy"),
    assigneeAccountId: getNullableString(row, "assigneeAccountId"),
    mergedCategoryId: getNullableString(row, "mergedCategoryId"),
    intakeResultJson: getString(row, "intakeResultJson") || "{}",
    reviewedAt: getNullableString(row, "reviewedAt"),
    firstApprovalBy: getNullableString(row, "firstApprovalBy"),
    createdAt: getString(row, "createdAt"),
    updatedAt: getString(row, "updatedAt"),
  };
}

function mapKenSubmission(row: DbRow): KenSubmissionRecord {
  return {
    id: getString(row, "id"),
    taskId: getString(row, "taskId"),
    taskSlug: getString(row, "taskSlug"),
    taskTitle: getString(row, "taskTitle"),
    taskSummary: getString(row, "taskSummary"),
    proposerProfileId: getString(row, "proposerProfileId"),
    proposerName: getNullableString(row, "proposerName"),
    requestedTier: getString(row, "requestedTier") as KenSubmissionRecord["requestedTier"],
    estimatedTier: getString(row, "estimatedTier") as KenSubmissionRecord["estimatedTier"],
    intakeStatus: getString(row, "intakeStatus") as KenSubmissionRecord["intakeStatus"],
    intakeResultJson: getString(row, "intakeResultJson") || "{}",
    riskFlags: parseList(row.riskFlags),
    reviewNote: getNullableString(row, "reviewNote"),
    internalReviewNote: getNullableString(row, "internalReviewNote"),
    assigneeAccountId: getNullableString(row, "assigneeAccountId"),
    mergedTaskId: getNullableString(row, "mergedTaskId"),
    firstApprovalBy: getNullableString(row, "firstApprovalBy"),
    submittedAt: getString(row, "submittedAt"),
    assignedAt: getNullableString(row, "assignedAt"),
    reviewedAt: getNullableString(row, "reviewedAt"),
    updatedAt: getString(row, "updatedAt"),
  };
}

function mapReviewEvent(row: DbRow): ReviewEventRecord {
  return {
    id: getString(row, "id"),
    entityType: getString(row, "entityType") as ReviewEventRecord["entityType"],
    entityId: getString(row, "entityId"),
    action: getString(row, "action") as ReviewEventRecord["action"],
    fromStatus: getNullableString(row, "fromStatus"),
    toStatus: getNullableString(row, "toStatus"),
    actorAccountId: getNullableString(row, "actorAccountId"),
    actorName: getNullableString(row, "actorName"),
    publicNote: getNullableString(row, "publicNote"),
    internalNote: getNullableString(row, "internalNote"),
    metadataJson: getNullableString(row, "metadataJson"),
    isPublic: getNumber(row, "isPublic") > 0,
    createdAt: getString(row, "createdAt"),
  };
}
const loadTasks = () => loadRows("SELECT * FROM tasks ORDER BY createdAt DESC").then((rows) => rows.map(mapTask));
const loadTaskFinance = () => loadRows("SELECT * FROM task_finance").then((rows) => rows.map(mapTaskFinance));
const loadTaskIllustrations = () => loadRows("SELECT * FROM task_illustrations").then((rows) => rows.map(mapTaskIllustration));
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
const loadRunDecisions = () => loadRows("SELECT * FROM run_decision_events ORDER BY createdAt DESC, id DESC").then((rows) => rows.map(mapRunDecision));
const loadRevenueStreams = () => loadRows("SELECT * FROM revenue_streams ORDER BY monthlyRevenueUsd DESC").then((rows) => rows.map(mapRevenueStream));
const loadTreasuryEntries = () => loadRows("SELECT * FROM treasury_entries ORDER BY createdAt DESC").then((rows) => rows.map(mapTreasuryEntry));
const loadSponsorshipCommitments = () =>
  loadRows("SELECT * FROM sponsorship_commitments ORDER BY updatedAt DESC, createdAt DESC").then((rows) => rows.map(mapSponsorshipCommitment));
export async function listCategoriesForReview() {
  return loadCategories();
}

const kenSubmissionSelect = `
  SELECT
    submission.*,
    task.slug AS taskSlug,
    task.title AS taskTitle,
    task.summary AS taskSummary,
    task.riskFlags,
    profile.name AS proposerName
  FROM ken_submissions submission
  JOIN tasks task ON task.id = submission.taskId
  LEFT JOIN profiles profile ON profile.id = submission.proposerProfileId
`;

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
        symbolKey: getString(row, "symbolKey") || getString(row, "slug"),
      }
    : null;
}

async function findAccountByEmail(email: string) {
  const row = await loadOne("SELECT * FROM accounts WHERE lower(email) = lower(?) LIMIT 1", [email]);
  return row ? mapAccount(row) : null;
}

async function findAccountByUsername(username: string) {
  const row = await loadOne("SELECT * FROM accounts WHERE lower(username) = lower(?) LIMIT 1", [username]);
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
  accountByProfile: Map<string, AccountRecord>,
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
    const account = accountByProfile.get(comment.profileId);
    const upvotes = votes.filter((vote) => vote.value > 0).length;
    const downvotes = votes.filter((vote) => vote.value < 0).length;
    mapped.set(comment.id, {
      ...comment,
      profileName: profile ? publicProfileName(profile) : "Unknown contributor",
      profileUsername: profile?.username ?? null,
      profileRole: profile?.role ?? "Unverified contributor",
      profileSystemRole: account?.systemRole,
      score: upvotes - downvotes,
      upvotes,
      downvotes,
      userVote: votes.find((vote) => vote.profileId === viewerProfileId)?.value ?? 0,
      replies: [],
      avatarHue: profile?.avatarHue ?? 210,
      avatarImage: profile?.avatarImage ?? null,
      avatarGradient: profile?.avatarGradient ?? null,
      avatarImageScale: profile?.avatarImageScale ?? 1,
      avatarImageX: profile?.avatarImageX ?? 50,
      avatarImageY: profile?.avatarImageY ?? 50,
      depth: 0,
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
        mappedComment.depth = parent.depth + 1;
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

async function hydrate(
  viewerProfileId?: string | null,
  options: { includeUnapprovedSubmissions?: boolean } = {},
) {
  const [profiles, profileAttestations, categories, allTasks, finances, illustrations, votes, pulseVotes, comments, commentVotes, runs, taskTimings, runUpdates, checkpoints, checkpointGates, governance, runDecisions, revenueStreams, treasuryEntries, sponsorshipCommitments, bookmarks, accounts, submissionVisibilityRows] =
    await Promise.all([
      loadProfiles(),
      loadProfileAttestations(),
      loadCategories(),
      loadTasks(),
      loadTaskFinance(),
      loadTaskIllustrations(),
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
      loadRunDecisions(),
      loadRevenueStreams(),
      loadTreasuryEntries(),
      loadSponsorshipCommitments(),
      viewerProfileId ? loadBookmarksForProfile(viewerProfileId) : Promise.resolve<BookmarkRecord[]>([]),
      loadAccounts(),
      loadRows("SELECT taskId, intakeStatus FROM ken_submissions"),
    ]);

  const bookmarkSet = new Set(bookmarks.map((bookmark) => bookmark.taskId));
  const accountByProfile = new Map(accounts.map((account) => [account.profileId, account]));
  const unpublishedTaskIds = new Set(
    submissionVisibilityRows
      .filter((row) => getString(row, "intakeStatus") !== "approved")
      .map((row) => getString(row, "taskId")),
  );
  const tasks = options.includeUnapprovedSubmissions
    ? allTasks
    : allTasks.filter((task) => !unpublishedTaskIds.has(task.id));

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
  const illustrationMap = new Map(illustrations.map((illustration) => [illustration.taskId, illustration]));
  const attestationMap = new Map(profileAttestations.map((entry) => [entry.profileId, entry]));
  const profileSummaries: ProfileSummary[] = profiles.map((profile) => {
    const castVotes = voteByProfile.get(profile.id) ?? [];
    const voteCreditsSpent = spentCredits(castVotes);
    const bondedCredits = activeBondedCredits(profile.id, allTasks, finances);
    const spent = voteCreditsSpent + bondedCredits;
    const attestation = attestationMap.get(profile.id);
    const createdAt = profile.createdAt ?? new Date().toISOString();
    const attestationStatus = attestation?.status ?? "review";
    const sybilRisk = attestation?.sybilRisk ?? "medium";
    const policy = resolveParticipationPolicy(attestationStatus, sybilRisk, profile.voiceCredits);
    return {
      ...profile,
      username: profile.username ?? profile.id,
      showRealName: profile.showRealName !== false,
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
      links: profile.links ?? [],
      location: profile.location ?? null,
      pronouns: profile.pronouns ?? null,
      verificationStatus: profile.verificationStatus ?? "none",
      verificationRequestedAt: profile.verificationRequestedAt ?? null,
      verificationNote: profile.verificationNote ?? null,
      avatarImage: profile.avatarImage ?? null,
      avatarGradient: profile.avatarGradient ?? null,
      avatarImageScale: profile.avatarImageScale ?? 1,
      avatarImageX: profile.avatarImageX ?? 50,
      avatarImageY: profile.avatarImageY ?? 50,
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

  const runDecisionsByTask = new Map<string, RunDecisionEventRecord[]>();
  for (const event of runDecisions) {
    const bucket = runDecisionsByTask.get(event.taskId) ?? [];
    bucket.push(event);
    runDecisionsByTask.set(event.taskId, bucket);
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
    const illustration = illustrationMap.get(task.id);
    const proposer = profileMap.get(task.proposerId);
    const taskVotes = voteByTask.get(task.id) ?? [];
    const pulse = pulseByTask.get(task.id) ?? [];
    const updates = runUpdatesByTask.get(task.id) ?? [];
    const governanceEvents = governanceByTask.get(task.id) ?? [];
    const taskRunDecisions = runDecisionsByTask.get(task.id) ?? [];
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
      ...taskRunDecisions.map((event) => event.createdAt),
    ].sort().at(-1) ?? task.createdAt;
    return {
      ...task,
      ...finance,
      categoryName: category?.name ?? "Unknown category",
      categorySlug: category?.slug ?? "unknown",
      categorySymbolKey: category?.symbolKey || category?.slug || "default",
      proposerName: proposer ? publicProfileName(proposer) : "Unknown proposer",
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
      bookmarked: bookmarkSet.has(task.id),
      illustrationUrl: illustration?.url ?? null,
      illustrationAlt: illustration?.altText ?? null,
      illustrationSource: illustration?.source ?? "deterministic",
      illustrationUpdatedAt: illustration?.updatedAt ?? null,
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
    runDecisionsByTask,
    revenueSummaries,
    treasuryEntries,
    sponsorshipCommitments,
    economics,
    runUpdatesByTask,
    viewer: viewerProfileId ? profileMap.get(viewerProfileId) ?? null : null,
    discussionFor(taskId: string) {
      return buildDiscussionTree(commentByTask.get(taskId) ?? [], commentVotes, profileMap, accountByProfile, viewerProfileId);
    },
    accountByProfile,
  };
}

export async function listProfiles() {
  return hydrate().then((snapshot) => snapshot.profiles);
}

export async function listPublicCategories() {
  return loadCategories();
}

export async function listPublicSitemapEntities() {
  const [kenRows, profileRows, contentRow] = await Promise.all([
    loadRows(
      `SELECT
         task.slug,
         task.stage,
         MAX(
           task.createdAt,
           COALESCE((SELECT MAX(updatedAt) FROM votes WHERE taskId = task.id), ''),
           COALESCE((SELECT MAX(updatedAt) FROM task_pulse_votes WHERE taskId = task.id), ''),
           COALESCE((SELECT MAX(createdAt) FROM comments WHERE taskId = task.id), ''),
           COALESCE((SELECT MAX(createdAt) FROM run_updates WHERE taskId = task.id), ''),
           COALESCE((SELECT MAX(createdAt) FROM governance_events WHERE taskId = task.id), ''),
           COALESCE((SELECT MAX(createdAt) FROM run_decision_events WHERE taskId = task.id), ''),
           COALESCE((SELECT MAX(updatedAt) FROM task_timings WHERE taskId = task.id), '')
         ) AS lastModified
       FROM tasks task
       LEFT JOIN ken_submissions submission ON submission.taskId = task.id
       WHERE submission.id IS NULL OR submission.intakeStatus = 'approved'
       ORDER BY task.slug ASC`,
    ),
    loadRows(
      `SELECT COALESCE(NULLIF(trim(username), ''), id) AS slug, createdAt AS lastModified
       FROM profiles
       WHERE moderationStatus <> 'suspended'
       ORDER BY slug ASC`,
    ),
    loadOne(PUBLIC_CONTENT_LAST_MODIFIED_SQL),
  ]);

  const kens = kenRows.map((row) => {
    const stage = getString(row, "stage");
    return {
      slug: getString(row, "slug"),
      lastModified: getString(row, "lastModified"),
      changeFrequency: (
        stage === "running" || stage === "scheduled" || stage === "voting"
          ? "daily"
          : stage === "shipped" || stage === "blocked"
            ? "monthly"
            : "weekly"
      ) as "daily" | "weekly" | "monthly",
    };
  });
  const profiles = profileRows.map((row) => ({
    slug: getString(row, "slug"),
    lastModified: getString(row, "lastModified"),
  }));
  const latestEntityDate = [...kens, ...profiles]
    .map((entry) => entry.lastModified)
    .filter(Boolean)
    .sort()
    .at(-1);

  return {
    generatedAt: (contentRow ? getNullableString(contentRow, "lastModified") : null)
      ?? latestEntityDate
      ?? "2026-07-28T00:00:00.000Z",
    kens,
    profiles,
  };
}

export async function getVisualAuditPublicInventory() {
  const [taskRows, profileRows, categoryRows, countRow, modifiedRow] = await Promise.all([
    loadRows(
      `SELECT
         task.slug,
         task.stage,
         task.safetyStatus,
         task.requestedTier,
         category.slug AS categorySlug,
         illustration.url AS illustrationUrl,
         illustration.source AS illustrationSource,
         CASE WHEN EXISTS (
           SELECT 1 FROM comments comment WHERE comment.taskId = task.id
         ) THEN 1 ELSE 0 END AS hasComments
       FROM tasks task
       JOIN categories category ON category.id = task.categoryId
       LEFT JOIN task_illustrations illustration ON illustration.taskId = task.id
       LEFT JOIN ken_submissions submission ON submission.taskId = task.id
       WHERE submission.id IS NULL OR submission.intakeStatus = 'approved'
       ORDER BY task.slug ASC`,
    ),
    loadRows(
      `SELECT trim(username) AS slug
       FROM profiles
       WHERE moderationStatus <> 'suspended'
         AND username IS NOT NULL
         AND trim(username) <> ''
       ORDER BY slug ASC`,
    ),
    loadRows(
      `SELECT slug
       FROM categories
       ORDER BY slug ASC`,
    ),
    loadOne(
      `SELECT
         (SELECT COUNT(*) FROM tasks task
           LEFT JOIN ken_submissions submission ON submission.taskId = task.id
           WHERE submission.id IS NULL OR submission.intakeStatus = 'approved') AS kens,
         (SELECT COUNT(*) FROM profiles
           WHERE moderationStatus <> 'suspended'
             AND username IS NOT NULL
             AND trim(username) <> '') AS profiles,
         (SELECT COUNT(*) FROM categories) AS categories`,
    ),
    loadOne(PUBLIC_CONTENT_LAST_MODIFIED_SQL),
  ]);

  const tasks = taskRows.map((row) => ({
    slug: getString(row, "slug"),
    stage: getString(row, "stage"),
    safetyStatus: getString(row, "safetyStatus"),
    requestedLane: getString(row, "requestedTier"),
    categorySlug: getString(row, "categorySlug"),
    illustrationUrl: getNullableString(row, "illustrationUrl"),
    illustrationSource: getNullableString(row, "illustrationSource"),
    hasComments: getNumber(row, "hasComments") === 1,
  }));

  return {
    lastModified: modifiedRow ? getNullableString(modifiedRow, "lastModified") : null,
    counts: {
      kens: countRow ? getNumber(countRow, "kens") : tasks.length,
      profiles: countRow ? getNumber(countRow, "profiles") : profileRows.length,
      categories: countRow ? getNumber(countRow, "categories") : categoryRows.length,
    },
    kens: tasks,
    profiles: profileRows.map((row) => ({ slug: getString(row, "slug") })),
    categories: categoryRows.map((row) => ({ slug: getString(row, "slug") })),
  };
}

export async function getPublicKenSeoRecord(slug: string) {
  const row = await loadOne(
    `SELECT
       task.slug,
       task.title,
       task.summary,
       task.createdAt,
       task.stage,
       task.safetyStatus,
       category.name AS categoryName,
       category.slug AS categorySlug,
       CASE
         WHEN profile.showRealName = 0 AND profile.username IS NOT NULL AND trim(profile.username) <> ''
           THEN '@' || profile.username
         ELSE COALESCE(profile.name, 'Unknown proposer')
       END AS proposerName,
       MAX(
         task.createdAt,
         COALESCE((SELECT MAX(updatedAt) FROM votes WHERE taskId = task.id), ''),
         COALESCE((SELECT MAX(updatedAt) FROM task_pulse_votes WHERE taskId = task.id), ''),
         COALESCE((SELECT MAX(createdAt) FROM comments WHERE taskId = task.id), ''),
         COALESCE((SELECT MAX(createdAt) FROM run_updates WHERE taskId = task.id), ''),
         COALESCE((SELECT MAX(createdAt) FROM governance_events WHERE taskId = task.id), ''),
         COALESCE((SELECT MAX(createdAt) FROM run_decision_events WHERE taskId = task.id), ''),
         COALESCE((SELECT MAX(updatedAt) FROM task_timings WHERE taskId = task.id), '')
       ) AS lastModified
     FROM tasks task
     JOIN categories category ON category.id = task.categoryId
     LEFT JOIN profiles profile ON profile.id = task.proposerId
     LEFT JOIN ken_submissions submission ON submission.taskId = task.id
     WHERE task.slug = ?
       AND (submission.id IS NULL OR submission.intakeStatus = 'approved')
     LIMIT 1`,
    [slug],
  );
  if (!row) return null;
  return {
    slug: getString(row, "slug"),
    title: getString(row, "title"),
    summary: getString(row, "summary"),
    createdAt: getString(row, "createdAt"),
    lastModified: getString(row, "lastModified"),
    stage: getString(row, "stage"),
    safetyStatus: getString(row, "safetyStatus"),
    categoryName: getString(row, "categoryName"),
    categorySlug: getString(row, "categorySlug"),
    proposerName: getString(row, "proposerName"),
  };
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
    account: {
      id: account.id,
      email: account.email,
      username: account.username,
      createdAt: account.createdAt,
      systemRole: account.systemRole,
      emailVerified: account.emailVerified,
      emailVerifiedAt: account.emailVerifiedAt,
      licensingConsent: account.licensingConsent,
    },
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
    featuredTasks: snapshot.tasks.slice(0, 6),
    contributors: [...snapshot.profiles].sort((left, right) => right.credibility - left.credibility).slice(0, 6),
    governance: snapshot.governance.slice(0, 6),
    economics: snapshot.economics,
    revenueStreams: snapshot.revenueSummaries.slice(0, 4),
  };
}

const marketplaceCommonTableExpressions = `
  WITH
  vote_stats AS (
    SELECT
      taskId,
      COALESCE(SUM(voteCount), 0) AS totalVotes,
      COUNT(*) AS supporterCount,
      MAX(updatedAt) AS lastVoteAt
    FROM votes
    GROUP BY taskId
  ),
  pulse_stats AS (
    SELECT
      pulse.taskId,
      COALESCE(SUM(pulse.value), 0) AS taskPulseScore,
      COUNT(*) AS taskPulseVotes,
      COALESCE(SUM(CASE WHEN pulse.value > 0 THEN 1 ELSE 0 END), 0) AS positivePulseCount,
      COALESCE(SUM(CASE WHEN pulse.value < 0 THEN 1 ELSE 0 END), 0) AS negativePulseCount,
      COALESCE(SUM(CASE
        WHEN attest.status = 'verified' AND attest.sybilRisk = 'low' THEN pulse.value
        ELSE 0
      END), 0) AS trustedPulseScore,
      MAX(pulse.updatedAt) AS lastPulseAt
    FROM task_pulse_votes pulse
    LEFT JOIN profile_attestations attest ON attest.profileId = pulse.profileId
    GROUP BY pulse.taskId
  ),
  comment_stats AS (
    SELECT taskId, COUNT(*) AS discussionCount, MAX(createdAt) AS lastCommentAt
    FROM comments
    GROUP BY taskId
  ),
  update_stats AS (
    SELECT taskId, COUNT(*) AS updateCount, MAX(createdAt) AS lastUpdateAt
    FROM run_updates
    GROUP BY taskId
  ),
  checkpoint_stats AS (
    SELECT
      taskId,
      COALESCE(SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END), 0) AS completedCheckpointCount
    FROM checkpoints
    GROUP BY taskId
  ),
  governance_stats AS (
    SELECT taskId, MAX(createdAt) AS lastGovernanceAt
    FROM governance_events
    WHERE taskId IS NOT NULL
    GROUP BY taskId
  ),
  eligible_rankings AS (
    SELECT
      eligible.id,
      ROW_NUMBER() OVER (
        PARTITION BY eligible.categoryId
        ORDER BY eligible.totalVotes DESC, eligible.createdAt ASC, eligible.title COLLATE NOCASE ASC, eligible.id ASC
      ) AS categoryRank
    FROM (
      SELECT
        task.id,
        task.categoryId,
        task.createdAt,
        task.title,
        COALESCE(vote.totalVotes, 0) AS totalVotes
      FROM tasks task
      LEFT JOIN vote_stats vote ON vote.taskId = task.id
      LEFT JOIN ken_submissions submission ON submission.taskId = task.id
      WHERE task.stage NOT IN ('review', 'blocked')
        AND task.safetyStatus NOT IN ('pending', 'blocked')
        AND (submission.id IS NULL OR submission.intakeStatus = 'approved')
        AND COALESCE(vote.totalVotes, 0) > 0
    ) eligible
  ),
  marketplace_base AS (
    SELECT
      task.*,
      category.name AS categoryName,
      category.slug AS categorySlug,
      COALESCE(NULLIF(category.symbolKey, ''), category.slug, 'default') AS categorySymbolKey,
      CASE
        WHEN profile.showRealName = 0 AND profile.username IS NOT NULL AND trim(profile.username) <> ''
          THEN '@' || profile.username
        ELSE COALESCE(profile.name, 'Unknown proposer')
      END AS proposerName,
      COALESCE(vote.totalVotes, 0) AS totalVotes,
      COALESCE(vote.supporterCount, 0) AS supporterCount,
      ranking.categoryRank AS categoryRank,
      CASE
        WHEN task.stage = 'blocked' OR task.safetyStatus = 'blocked' THEN 'blocked'
        WHEN ranking.categoryRank BETWEEN 1 AND 3 THEN 'months'
        WHEN ranking.categoryRank BETWEEN 4 AND 10 THEN 'weeks'
        WHEN ranking.categoryRank BETWEEN 11 AND 100 THEN 'days'
        ELSE 'queued'
      END AS allocatedTier,
      COALESCE(pulse.taskPulseScore, 0) AS taskPulseScore,
      COALESCE(pulse.taskPulseVotes, 0) AS taskPulseVotes,
      COALESCE(pulse.positivePulseCount, 0) AS positivePulseCount,
      COALESCE(pulse.negativePulseCount, 0) AS negativePulseCount,
      COALESCE(pulse.trustedPulseScore, 0) AS trustedPulseScore,
      COALESCE(comment.discussionCount, 0) AS discussionCount,
      COALESCE(update_summary.updateCount, 0) AS updateCount,
      COALESCE(checkpoint.completedCheckpointCount, 0) AS completedCheckpointCount,
      (
        SELECT update_item.label
        FROM run_updates update_item
        WHERE update_item.taskId = task.id
        ORDER BY update_item.createdAt DESC, update_item.id ASC
        LIMIT 1
      ) AS latestUpdateLabel,
      MAX(
        task.createdAt,
        COALESCE(timing.updatedAt, ''),
        COALESCE(vote.lastVoteAt, ''),
        COALESCE(pulse.lastPulseAt, ''),
        COALESCE(comment.lastCommentAt, ''),
        COALESCE(update_summary.lastUpdateAt, ''),
        COALESCE(governance.lastGovernanceAt, '')
      ) AS lastActivityAt,
      finance.taskId AS financeTaskId,
      finance.qualityBondCredits,
      finance.sponsorPoolUsd,
      finance.checkpointApprovalTarget,
      finance.enterprisePackaging,
      finance.dataValueNote,
      finance.sandboxCapitalUsd,
      finance.sandboxApiSpendUsd,
      finance.sandboxPilotUsers,
      finance.modelLineup,
      finance.simulationSummary,
      finance.sampleOutcome,
      finance.sponsorAppeal,
      timing.taskId AS timingTaskId,
      timing.launchAt,
      timing.startedAt,
      timing.expectedMaxEndAt,
      timing.computeHoursUsed,
      timing.completionMode,
      timing.completionSummary,
      illustration.taskId AS illustrationTaskId,
      illustration.url AS illustrationUrl,
      illustration.altText AS illustrationAlt,
      illustration.source AS illustrationSource,
      illustration.updatedAt AS illustrationUpdatedAt
    FROM tasks task
    JOIN categories category ON category.id = task.categoryId
    LEFT JOIN profiles profile ON profile.id = task.proposerId
    LEFT JOIN vote_stats vote ON vote.taskId = task.id
    LEFT JOIN pulse_stats pulse ON pulse.taskId = task.id
    LEFT JOIN comment_stats comment ON comment.taskId = task.id
    LEFT JOIN update_stats update_summary ON update_summary.taskId = task.id
    LEFT JOIN checkpoint_stats checkpoint ON checkpoint.taskId = task.id
    LEFT JOIN governance_stats governance ON governance.taskId = task.id
    LEFT JOIN eligible_rankings ranking ON ranking.id = task.id
    LEFT JOIN task_finance finance ON finance.taskId = task.id
    LEFT JOIN task_timings timing ON timing.taskId = task.id
    LEFT JOIN task_illustrations illustration ON illustration.taskId = task.id
    LEFT JOIN ken_submissions submission ON submission.taskId = task.id
    WHERE submission.id IS NULL OR submission.intakeStatus = 'approved'
  )
`;

function escapeLikePattern(value: string) {
  return value.replaceAll("!", "!!").replaceAll("%", "!%").replaceAll("_", "!_");
}

function buildMarketplaceFilterClause(filters: ReturnType<typeof normalizeMarketplaceQuery>) {
  const conditions: string[] = [];
  const args: Value[] = [];

  if (filters.query) {
    conditions.push(`LOWER(
      title || ' ' || summary || ' ' || problem || ' ' || whyNow || ' ' || publicBenefit || ' '
      || categoryName || ' ' || COALESCE(enterprisePackaging, '') || ' ' || COALESCE(dataValueNote, '') || ' '
      || COALESCE(simulationSummary, '') || ' ' || COALESCE(sampleOutcome, '') || ' '
      || COALESCE(sponsorAppeal, '') || ' ' || COALESCE(modelLineup, '')
    ) LIKE ? ESCAPE '!'`);
    args.push(`%${escapeLikePattern(filters.query.toLowerCase())}%`);
  }
  if (filters.category !== "all") {
    conditions.push("categorySlug = ?");
    args.push(filters.category);
  }
  if (filters.tier !== "all") {
    conditions.push("allocatedTier = ?");
    args.push(filters.tier);
  }
  if (filters.stage !== "all") {
    conditions.push("stage = ?");
    args.push(filters.stage);
  }

  return {
    sql: conditions.length > 0 ? conditions.join(" AND ") : "1 = 1",
    args,
  };
}

const marketplaceDiscoveryBaseOrder = `
  discoveryBand ASC,
  stageWeight DESC,
  completedCheckpointCount DESC,
  totalVotes DESC,
  supporterCount DESC,
  trustedPulseScore DESC,
  positivePulseCount DESC,
  lastActivityAt DESC,
  id ASC
`;

function marketplaceOrderBy(sort: ReturnType<typeof normalizeMarketplaceQuery>["sort"]) {
  switch (sort) {
    case "pulse":
      return "trustedPulseScore DESC, positivePulseCount DESC, taskPulseScore DESC, taskPulseVotes DESC, totalVotes DESC, lastActivityAt DESC, id ASC";
    case "voice":
      return "totalVotes DESC, supporterCount DESC, categoryRank ASC, lastActivityAt DESC, id ASC";
    case "recent":
      return "lastActivityAt DESC, id ASC";
    case "newest":
      return "createdAt DESC, id ASC";
    case "active":
      return `
        CASE WHEN discoveryBand < 4 THEN 0 ELSE 1 END ASC,
        CASE WHEN discoveryBand < 4 THEN proposerSlot ELSE 2147483647 END ASC,
        CASE
          WHEN discoveryBand >= 4 THEN 2147483647
          WHEN categorySlot > 3 THEN 3
          ELSE categorySlot
        END ASC,
        CASE WHEN discoveryBand < 4 THEN bandSlot ELSE 2147483647 END ASC,
        discoveryBand ASC,
        categorySlot ASC,
        stageWeight DESC,
        completedCheckpointCount DESC,
        totalVotes DESC,
        trustedPulseScore DESC,
        lastActivityAt DESC,
        id ASC
      `;
  }
}

function mapMarketplaceTask(row: DbRow): TaskSummary {
  const task = mapTask(row);
  const hasFinance = getNullableString(row, "financeTaskId") !== null;
  const hasTiming = getNullableString(row, "timingTaskId") !== null;
  const hasIllustration = getNullableString(row, "illustrationTaskId") !== null;
  const totalVotes = getNumber(row, "totalVotes");
  const taskPulseScore = getNumber(row, "taskPulseScore");
  const taskPulseVotes = getNumber(row, "taskPulseVotes");
  const positivePulseCount = getNumber(row, "positivePulseCount");
  const negativePulseCount = getNumber(row, "negativePulseCount");
  const trustedPulseScore = getNumber(row, "trustedPulseScore");
  const supporterCount = getNumber(row, "supporterCount");
  const discussionCount = getNumber(row, "discussionCount");
  const updateCount = getNumber(row, "updateCount");
  const completedCheckpointCount = getNumber(row, "completedCheckpointCount");
  const categoryRank = row.categoryRank === null || row.categoryRank === undefined ? null : getNumber(row, "categoryRank");
  const allocatedTier = getString(row, "allocatedTier") as TaskSummary["allocatedTier"];
  const lastActivityAt = getString(row, "lastActivityAt") || task.createdAt;

  const summary: TaskSummary = {
    ...task,
    ...(hasFinance
      ? mapTaskFinance({ ...row, taskId: row.financeTaskId })
      : {
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
        }),
    categoryName: getString(row, "categoryName"),
    categorySlug: getString(row, "categorySlug"),
    categorySymbolKey: getString(row, "categorySymbolKey"),
    proposerName: getString(row, "proposerName"),
    totalVotes,
    supporterCount,
    categoryRank,
    allocatedTier,
    userVotes: 0,
    userCost: 0,
    taskPulseScore,
    taskPulseVotes,
    positivePulseCount,
    negativePulseCount,
    userTaskPulse: 0,
    discussionCount,
    bondStatus: task.stage === "review" || task.stage === "blocked" ? "watch" : "secure",
    launchAt: hasTiming ? getNullableString(row, "launchAt") : null,
    startedAt: hasTiming ? getNullableString(row, "startedAt") : null,
    expectedMaxEndAt: hasTiming ? getNullableString(row, "expectedMaxEndAt") : null,
    computeHoursUsed: hasTiming ? getNumber(row, "computeHoursUsed") : 0,
    completionMode: hasTiming
      ? getString(row, "completionMode") as TaskTimingRecord["completionMode"]
      : task.stage === "blocked" ? "blocked" : "planned",
    completionSummary: hasTiming
      ? getString(row, "completionSummary")
      : task.stage === "blocked" ? "Blocked before launch." : "Waiting for review and allocation.",
    lastActivityAt,
    updateCount,
    latestUpdateLabel: getNullableString(row, "latestUpdateLabel"),
    bookmarked: false,
    illustrationUrl: hasIllustration ? getNullableString(row, "illustrationUrl") : null,
    illustrationAlt: hasIllustration ? getNullableString(row, "illustrationAlt") : null,
    illustrationSource: hasIllustration
      ? getString(row, "illustrationSource") as TaskIllustrationRecord["source"]
      : "deterministic",
    illustrationUpdatedAt: hasIllustration ? getNullableString(row, "illustrationUpdatedAt") : null,
    completedCheckpointCount,
    trustedPulseScore,
  };

  summary.discoveryReasons = getDiscoveryReasons({
    id: summary.id,
    proposerId: summary.proposerId,
    categoryId: summary.categoryId,
    createdAt: summary.createdAt,
    lastActivityAt: summary.lastActivityAt,
    stage: summary.stage,
    safetyStatus: summary.safetyStatus,
    totalVotes: summary.totalVotes,
    supporterCount: summary.supporterCount,
    taskPulseScore: summary.taskPulseScore,
    taskPulseVotes: summary.taskPulseVotes,
    positivePulseCount: summary.positivePulseCount,
    negativePulseCount: summary.negativePulseCount,
    trustedPulseScore,
    completedCheckpointCount,
    updateCount: summary.updateCount,
    categoryRank: summary.categoryRank,
  });

  return summary;
}

async function applyMarketplaceViewerState(tasks: TaskSummary[], viewerProfileId?: string | null) {
  if (!viewerProfileId || tasks.length === 0) {
    return tasks;
  }

  const placeholders = tasks.map(() => "?").join(", ");
  const taskIds = tasks.map((task) => task.id);
  const [viewerVotes, viewerPulses, bookmarks] = await Promise.all([
    loadRows(`SELECT * FROM votes WHERE profileId = ? AND taskId IN (${placeholders})`, [viewerProfileId, ...taskIds]),
    loadRows(`SELECT * FROM task_pulse_votes WHERE profileId = ? AND taskId IN (${placeholders})`, [viewerProfileId, ...taskIds]),
    loadRows(`SELECT * FROM bookmarks WHERE profileId = ? AND taskId IN (${placeholders})`, [viewerProfileId, ...taskIds]),
  ]);

  const votesByTask = new Map(viewerVotes.map((row) => [getString(row, "taskId"), getNumber(row, "voteCount")]));
  const pulseByTask = new Map(viewerPulses.map((row) => [getString(row, "taskId"), getNumber(row, "value")]));
  const bookmarkedTaskIds = new Set(bookmarks.map((row) => getString(row, "taskId")));

  return tasks.map((task) => {
    const userVotes = votesByTask.get(task.id) ?? 0;
    return {
      ...task,
      userVotes,
      userCost: quadraticCost(userVotes),
      userTaskPulse: pulseByTask.get(task.id) ?? 0,
      bookmarked: bookmarkedTaskIds.has(task.id),
    };
  });
}

export async function getMarketplaceData(viewerProfileId: string | null | undefined, filters: MarketplaceFilters) {
  const normalized = normalizeMarketplaceQuery(filters);
  const pageSize = normalizeMarketplacePageSize(filters.pageSize ?? DEFAULT_MARKETPLACE_PAGE_SIZE);
  const filter = buildMarketplaceFilterClause(normalized);
  const filteredCtes = `
    ${marketplaceCommonTableExpressions},
    marketplace_filtered AS (
      SELECT
        marketplace_base.*,
        CASE
          WHEN stage = 'blocked' OR safetyStatus = 'blocked' THEN 5
          WHEN stage = 'review' OR safetyStatus = 'pending' THEN 4
          WHEN completedCheckpointCount > 0 OR updateCount > 0 THEN 0
          WHEN julianday('now') - julianday(createdAt) <= 30 AND supporterCount <= 2 THEN 1
          WHEN categoryRank = 1 THEN 2
          ELSE 3
        END AS discoveryBand,
        CASE stage
          WHEN 'running' THEN 5
          WHEN 'scheduled' THEN 4
          WHEN 'voting' THEN 3
          WHEN 'shipped' THEN 2
          WHEN 'review' THEN 1
          ELSE 0
        END AS stageWeight
      FROM marketplace_base
      WHERE ${filter.sql}
    )
  `;

  const [countRow, categories, viewer] = await Promise.all([
    loadOne(
      `${filteredCtes}
       SELECT
         COUNT(*) AS count,
         COALESCE(SUM(CASE WHEN stage IN ('running', 'scheduled') THEN 1 ELSE 0 END), 0) AS activeCount,
         COALESCE(SUM(CASE WHEN sandboxCapitalUsd > 0 THEN 1 ELSE 0 END), 0) AS demoCount,
         COALESCE(SUM(CASE WHEN stage = 'shipped' THEN 1 ELSE 0 END), 0) AS shippedCount
       FROM marketplace_filtered`,
      filter.args,
    ),
    loadCategories(),
    viewerProfileId ? findProfileById(viewerProfileId) : Promise.resolve(null),
  ]);

  const totalResults = countRow ? getNumber(countRow, "count") : 0;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const requestedPage = normalizeMarketplacePage(normalized.page);
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;
  const orderBy = marketplaceOrderBy(normalized.sort);
  const rows = await loadRows(
    `${filteredCtes},
     marketplace_diversified AS (
       SELECT
         marketplace_filtered.*,
         ROW_NUMBER() OVER (PARTITION BY proposerId ORDER BY ${marketplaceDiscoveryBaseOrder}) AS proposerSlot,
         ROW_NUMBER() OVER (PARTITION BY categoryId ORDER BY ${marketplaceDiscoveryBaseOrder}) AS categorySlot,
         ROW_NUMBER() OVER (PARTITION BY discoveryBand ORDER BY ${marketplaceDiscoveryBaseOrder}) AS bandSlot
       FROM marketplace_filtered
     )
     SELECT *
     FROM marketplace_diversified
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...filter.args, pageSize, offset],
  );
  const tasks = await applyMarketplaceViewerState(rows.map(mapMarketplaceTask), viewerProfileId);

  return {
    viewer,
    categories,
    tasks,
    pageInfo: {
      page,
      pageSize,
      totalResults,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
    resultCounts: {
      active: countRow ? getNumber(countRow, "activeCount") : 0,
      withDemos: countRow ? getNumber(countRow, "demoCount") : 0,
      shipped: countRow ? getNumber(countRow, "shippedCount") : 0,
    },
  };
}

export async function getTaskDetail(slug: string, viewerProfileId?: string | null): Promise<TaskDetail | null> {
  const submissionRow = await loadOne(`${kenSubmissionSelect} WHERE task.slug = ? LIMIT 1`, [slug]);
  const submission = submissionRow ? mapKenSubmission(submissionRow) : null;
  let includeUnapproved = false;
  let includePrivateReviewEvents = false;
  if (submission && submission.intakeStatus !== "approved") {
    if (!viewerProfileId) return null;
    const accountRow = await loadOne("SELECT * FROM accounts WHERE profileId = ? LIMIT 1", [viewerProfileId]);
    const account = accountRow ? mapAccount(accountRow) : null;
    const isProposer = submission.proposerProfileId === viewerProfileId;
    const isReviewer = account ? isReviewerRole(account.systemRole) : false;
    if (!isProposer && !isReviewer) return null;
    includeUnapproved = true;
    includePrivateReviewEvents = isReviewer;
  }
  const snapshot = await hydrate(viewerProfileId, { includeUnapprovedSubmissions: includeUnapproved });
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
    runDecisions: snapshot.runDecisionsByTask.get(task.id) ?? [],
    comments: snapshot.discussionFor(task.id),
    runUpdates: snapshot.runUpdatesByTask.get(task.id) ?? [],
    intakeReview: submission
      ? {
          submission: includePrivateReviewEvents
            ? submission
            : redactKenSubmissionForPublic(submission),
          events: await listReviewEvents("ken-submission", submission.id, includePrivateReviewEvents),
          canParticipate: submission.intakeStatus === "approved",
        }
      : null,
  };
}

export async function getGovernanceData(viewerProfileId?: string | null) {
  const snapshot = await hydrate(viewerProfileId);
  const capacity = await getCapacityState(snapshot.economics);
  return {
    viewer: snapshot.viewer,
    governance: snapshot.governance,
    tasks: snapshot.tasks,
    blockedTasks: snapshot.tasks.filter((task) => task.allocatedTier === "blocked"),
    categories: snapshot.categories,
    profiles: snapshot.profiles,
    capacity,
  };
}

export async function getEconomicsData(viewerProfileId?: string | null): Promise<{
  viewer: ProfileSummary | null;
  summary: EconomicsSummary;
  capacity: CapacityStateResolution;
  revenueStreams: RevenueStreamSummary[];
  treasuryEntries: TreasuryEntryRecord[];
  sponsorshipCommitments: SponsorshipCommitmentRecord[];
  fundedTasks: TaskSummary[];
}> {
  const snapshot = await hydrate(viewerProfileId);
  const capacity = await getCapacityState(snapshot.economics);
  const fundedTaskIds = new Set(snapshot.tasks.filter((task) => task.sponsorPoolUsd > 0).map((task) => task.id));
  return {
    viewer: snapshot.viewer,
    summary: snapshot.economics,
    capacity,
    revenueStreams: snapshot.revenueSummaries,
    treasuryEntries: snapshot.treasuryEntries,
    sponsorshipCommitments: snapshot.sponsorshipCommitments,
    fundedTasks: snapshot.tasks.filter((task) => fundedTaskIds.has(task.id)).slice(0, 8),
  };
}

export async function recordRunDecision(input: {
  taskId: string;
  checkpointId?: string | null;
  eventType: RunDecisionEventRecord["eventType"];
  decisionCode: RunDecisionEventRecord["decisionCode"];
  publicReason: string;
  artifactLabel?: string | null;
  artifactUrl?: string | null;
  artifactDigest?: string | null;
  actorAccountId: string;
  actorRole: Exclude<RunDecisionEventRecord["actorRole"], "system">;
}) {
  const task = await findTaskById(input.taskId);
  if (!task) throw new Error("The selected Ken does not exist.");
  if (!isRunDecisionCompatible(input.eventType, input.decisionCode)) {
    throw new Error("The decision code does not match the selected event type.");
  }
  const publicReason = input.publicReason.trim().slice(0, 2000);
  if (publicReason.length < 20) {
    throw new Error("A public run decision reason of at least 20 characters is required.");
  }
  const checkpointId = input.checkpointId?.trim() || null;
  if (checkpointId) {
    const checkpoint = await loadOne("SELECT taskId FROM checkpoints WHERE id = ? LIMIT 1", [checkpointId]);
    if (!checkpoint || getString(checkpoint, "taskId") !== task.id) {
      throw new Error("The selected checkpoint does not belong to this Ken.");
    }
  }
  if (input.eventType === "checkpoint" && !checkpointId) {
    throw new Error("Checkpoint decisions require a checkpoint.");
  }

  const artifactLabel = input.artifactLabel?.trim().slice(0, 240) || null;
  const artifactUrl = input.artifactUrl?.trim().slice(0, 1000) || null;
  const artifactDigest = input.artifactDigest?.trim().toLowerCase() || null;
  if (artifactUrl && !artifactUrl.startsWith("/") && !/^https?:\/\//i.test(artifactUrl)) {
    throw new Error("Artifact URLs must be site-relative or use HTTP(S).");
  }
  if (artifactDigest && !/^sha256:[a-f0-9]{64}$/.test(artifactDigest)) {
    throw new Error("Artifact digests must use sha256 followed by 64 hexadecimal characters.");
  }
  if (input.eventType === "release" && (!artifactLabel || (!artifactUrl && !artifactDigest))) {
    throw new Error("Release decisions require an artifact label and either a URL or SHA-256 digest.");
  }

  const event: RunDecisionEventRecord = {
    id: randomUUID(),
    taskId: task.id,
    checkpointId,
    eventType: input.eventType,
    decisionCode: input.decisionCode,
    publicReason,
    artifactLabel,
    artifactUrl,
    artifactDigest,
    actorAccountId: input.actorAccountId,
    actorRole: input.actorRole,
    createdAt: new Date().toISOString(),
  };
  const statements: InStatement[] = [
    {
      sql: INSERT_RUN_DECISION_SQL,
      args: [
        event.id,
        event.taskId,
        event.checkpointId,
        event.eventType,
        event.decisionCode,
        event.publicReason,
        event.artifactLabel,
        event.artifactUrl,
        event.artifactDigest,
        event.actorAccountId,
        event.actorRole,
        event.createdAt,
      ],
    },
  ];

  if (checkpointId && input.eventType === "checkpoint") {
    const checkpointStatus = input.decisionCode === "checkpoint-approved" ? "complete" : "active";
    const releaseStatus = input.decisionCode === "checkpoint-approved" ? "approved" : "held";
    statements.push(
      { sql: "UPDATE checkpoints SET status = ? WHERE id = ?", args: [checkpointStatus, checkpointId] },
      { sql: "UPDATE checkpoint_gates SET releaseStatus = ? WHERE checkpointId = ?", args: [releaseStatus, checkpointId] },
    );
  }

  const transition = runDecisionTransition(input.decisionCode);
  if (transition) {
    statements.push(
      { sql: "UPDATE tasks SET stage = ? WHERE id = ?", args: [transition.stage, task.id] },
      {
        sql: `INSERT INTO task_timings (
          taskId, launchAt, startedAt, expectedMaxEndAt, computeHoursUsed,
          completionMode, completionSummary, updatedAt
        ) VALUES (?, NULL, NULL, NULL, 0, ?, ?, ?)
        ON CONFLICT(taskId) DO UPDATE SET
          completionMode = excluded.completionMode,
          completionSummary = excluded.completionSummary,
          updatedAt = excluded.updatedAt`,
        args: [task.id, transition.completionMode, publicReason, event.createdAt],
      },
      {
        sql: "UPDATE runs SET status = ? WHERE taskId = ?",
        args: [transition.stage === "scheduled" ? "scheduled" : "complete", task.id],
      },
    );
  }

  await batch(statements, "write");
  return { event, slug: task.slug };
}

export async function createAccount(input: {
  email: string;
  username: string;
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
  const username = normalizeUsername(input.username);
  assertValidUsername(username);
  if (await findAccountByUsername(username)) {
    throw new Error("That username is already taken.");
  }

  const now = new Date().toISOString();
  const profileId = await uniqueSlug("profiles", username || input.name);
  const accountId = randomUUID();
  const { passwordHash, passwordSalt } = createPasswordHash(input.password);
  const normalizedEmail = input.email.toLowerCase();

  const systemRole: SystemRole = isOwnerEmail(normalizedEmail)
    ? "owner"
    : isAdminEmail(normalizedEmail)
      ? "admin"
      : "contributor";
  const emailVerified = systemRole === "owner" || !env.KENMATCH_REQUIRE_EMAIL_VERIFICATION;
  const emailVerifiedAt = emailVerified ? now : null;
  const voiceCredits = systemRole === "owner" ? 120 : systemRole === "admin" ? 48 : 12;
  const credibility = systemRole === "owner" ? 0.98 : systemRole === "admin" ? 0.9 : 0.62;
  const attestationLevel = systemRole === "owner" ? "expert" : systemRole === "admin" ? "verified" : "provisional";
  const verificationStatus: VerificationStatus = systemRole === "owner" ? "approved" : "none";

  await batch(
    [
      {
        sql: `INSERT INTO profiles (
          id, username, showRealName, name, role, bio, specialty, attestation, attestationLevel, moderationStatus,
          voiceCredits, credibility, avatarHue, avatarImage, avatarGradient, avatarImageScale, avatarImageX, avatarImageY, links, location, pronouns,
          verificationStatus, verificationRequestedAt, verificationNote, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          profileId,
          username,
          1,
          input.name,
          input.role,
          input.bio,
          input.specialty,
          systemRole === "owner"
            ? "Founder and administrator account."
            : "Self-attested contributor profile pending verification.",
          attestationLevel,
          "active",
          voiceCredits,
          credibility,
          avatarHueFor(input.email),
          null,
          null,
          1,
          50,
          50,
          "[]",
          null,
          null,
          verificationStatus,
          null,
          null,
          now,
        ],
      },
      {
        sql: "INSERT INTO profile_attestations (profileId, provider, status, sybilRisk, reviewedAt, signals, note) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [
          profileId,
          systemRole === "owner" ? "Owner attestation" : "Email + profile review",
          systemRole === "owner" ? "verified" : "review",
          systemRole === "owner" ? "low" : "medium",
          now,
          serializeList(systemRole === "owner" ? ["Verified email", "Owner attestation"] : ["Verified email", "Fresh profile", "Rate limits"]),
          systemRole === "owner"
            ? "Founder account with full platform privileges."
            : "New accounts can read immediately and participate with provisional standing while review is pending.",
        ],
      },
      {
        sql: `INSERT INTO accounts (
          id, profileId, email, username, passwordHash, passwordSalt, licensingConsent, systemRole,
          emailVerified, emailVerifiedAt, lastLoginAt, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          accountId,
          profileId,
          normalizedEmail,
          username,
          passwordHash,
          passwordSalt,
          input.licensingConsent,
          systemRole,
          emailVerified ? 1 : 0,
          emailVerifiedAt,
          null,
          now,
        ],
      },
    ],
    "write",
  );

  return { accountId, profileId, systemRole, emailVerified };
}

export async function authenticateAccount(identifier: string, password: string) {
  const value = identifier.trim().toLowerCase();
  const account = value.includes("@")
    ? await findAccountByEmail(value)
    : await findAccountByUsername(normalizeUsername(value));
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

export async function ensureTestAuthAccount(mode: TestAuthMode) {
  const config = TEST_AUTH_USERS[mode];
  const now = new Date().toISOString();
  const existing = await findAccountByEmail(config.email);
  const systemRole = config.systemRole;
  const elevated = systemRole !== "contributor";
  const voiceCredits = systemRole === "owner" ? 120 : systemRole === "admin" ? 48 : systemRole === "moderator" ? 24 : 12;
  const credibility = systemRole === "owner" ? 0.98 : systemRole === "admin" ? 0.9 : systemRole === "moderator" ? 0.82 : 0.66;
  const attestationLevel = systemRole === "owner" ? "expert" : elevated ? "verified" : "provisional";
  const roleLabel = `Local validation ${systemRole}`;
  const accountDescription = `Local-only deterministic ${systemRole} account used for CI and browser validation. Disabled outside loopback development or an isolated audit lab.`;
  const attestation = `Local ${systemRole} validation account.`;
  const verificationNote = elevated ? `Local-only ${systemRole} bypass account.` : null;
  const profileId = existing?.profileId ?? `local-${mode}`;

  if (existing) {
    await batch(
      [
        {
          sql: `UPDATE profiles SET
            username = ?, showRealName = 0, name = ?, role = ?, bio = ?, specialty = ?, attestation = ?,
            attestationLevel = ?, moderationStatus = 'active', voiceCredits = ?, credibility = ?,
            verificationStatus = ?, verificationRequestedAt = NULL, verificationNote = ?
            WHERE id = ?`,
          args: [
            config.username,
            config.name,
            roleLabel,
            accountDescription,
            "KenMatch validation",
            attestation,
            attestationLevel,
            voiceCredits,
            credibility,
            elevated ? "approved" : "none",
            verificationNote,
            existing.profileId,
          ],
        },
        {
          sql: `UPDATE accounts SET
            username = ?, systemRole = ?, emailVerified = 1, emailVerifiedAt = COALESCE(emailVerifiedAt, ?)
            WHERE id = ?`,
          args: [config.username, systemRole, now, existing.id],
        },
        {
          sql: "INSERT OR REPLACE INTO profile_attestations (profileId, provider, status, sybilRisk, reviewedAt, signals, note) VALUES (?, ?, ?, ?, ?, ?, ?)",
          args: [
            existing.profileId,
            "Local test auth bypass",
            elevated ? "verified" : "review",
            "low",
            now,
            serializeList(["Loopback only", "Non-production only", "Deterministic account"]),
            "Local-only account used for automated browser validation.",
          ],
        },
      ],
      "write",
    );
    return existing.id;
  }

  const { passwordHash, passwordSalt } = createPasswordHash(randomUUID());
  const accountId = randomUUID();
  await batch(
    [
      {
        sql: `INSERT INTO profiles (
          id, username, showRealName, name, role, bio, specialty, attestation, attestationLevel, moderationStatus,
          voiceCredits, credibility, avatarHue, avatarImage, avatarGradient, avatarImageScale, avatarImageX, avatarImageY, links, location, pronouns,
          verificationStatus, verificationRequestedAt, verificationNote, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          profileId,
          config.username,
          0,
          config.name,
          roleLabel,
          accountDescription,
          "KenMatch validation",
          attestation,
          attestationLevel,
          "active",
          voiceCredits,
          credibility,
          avatarHueFor(config.email),
          null,
          null,
          1,
          50,
          50,
          "[]",
          null,
          null,
          elevated ? "approved" : "none",
          null,
          verificationNote,
          now,
        ],
      },
      {
        sql: "INSERT INTO profile_attestations (profileId, provider, status, sybilRisk, reviewedAt, signals, note) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [
          profileId,
          "Local test auth bypass",
          elevated ? "verified" : "review",
          "low",
          now,
          serializeList(["Loopback only", "Non-production only", "Deterministic account"]),
          "Local-only account used for automated browser validation.",
        ],
      },
      {
        sql: `INSERT INTO accounts (
          id, profileId, email, username, passwordHash, passwordSalt, licensingConsent, systemRole,
          emailVerified, emailVerifiedAt, lastLoginAt, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          accountId,
          profileId,
          config.email,
          config.username,
          passwordHash,
          passwordSalt,
          "audit-only",
          systemRole,
          1,
          now,
          null,
          now,
        ],
      },
    ],
    "write",
  );

  return accountId;
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

export interface ReviewQueueFilters {
  status?: string;
  assignee?: string;
  query?: string;
  page?: number;
  pageSize?: number;
}

export interface ReviewActorInput {
  accountId: string;
  profileId: string;
  role: SystemRole;
}

function reviewEventStatement(input: {
  dedupeKey: string;
  entityType: ReviewEntityType;
  entityId: string;
  action: ReviewEventAction;
  fromStatus?: string | null;
  toStatus?: string | null;
  actorAccountId?: string | null;
  publicNote?: string | null;
  internalNote?: string | null;
  metadata?: Record<string, unknown> | null;
  isPublic?: boolean;
  createdAt: string;
}): InStatement {
  return {
    sql: INSERT_REVIEW_EVENT_SQL,
    args: [
      randomUUID(),
      input.dedupeKey,
      input.entityType,
      input.entityId,
      input.action,
      input.fromStatus ?? null,
      input.toStatus ?? null,
      input.actorAccountId ?? null,
      input.publicNote?.slice(0, 2000) ?? null,
      input.internalNote?.slice(0, 4000) ?? null,
      input.metadata ? JSON.stringify(input.metadata).slice(0, 12_000) : null,
      input.isPublic ? 1 : 0,
      input.createdAt,
    ],
  };
}

function normalizeQueuePage(value: number | undefined) {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : 1;
}

function normalizeQueuePageSize(value: number | undefined) {
  if (!Number.isInteger(value) || Number(value) <= 0) return 12;
  return Math.min(Number(value), 50);
}

async function reviewStatusCounts(table: "category_proposals" | "ken_submissions", statusColumn: "reviewStatus" | "intakeStatus") {
  const rows = await loadRows(`SELECT ${statusColumn} AS status, COUNT(*) AS count FROM ${table} GROUP BY ${statusColumn}`);
  return Object.fromEntries(rows.map((row) => [getString(row, "status"), getNumber(row, "count")]));
}

export async function listCategoryProposalQueue(
  filters: ReviewQueueFilters = {},
): Promise<ReviewQueuePage<CategoryProposalRecord>> {
  const pageSize = normalizeQueuePageSize(filters.pageSize);
  const requestedPage = normalizeQueuePage(filters.page);
  const conditions: string[] = [];
  const args: Value[] = [];
  if (filters.status && filters.status !== "all") {
    conditions.push("proposal.reviewStatus = ?");
    args.push(filters.status);
  }
  if (filters.assignee && filters.assignee !== "all") {
    conditions.push(filters.assignee === "unassigned" ? "proposal.assigneeAccountId IS NULL" : "proposal.assigneeAccountId = ?");
    if (filters.assignee !== "unassigned") args.push(filters.assignee);
  }
  if (filters.query?.trim()) {
    conditions.push("LOWER(proposal.name || ' ' || proposal.description || ' ' || proposal.publicBenefit) LIKE ? ESCAPE '!'");
    args.push(`%${escapeLikePattern(filters.query.trim().toLowerCase())}%`);
  }
  const where = conditions.length > 0 ? conditions.join(" AND ") : "1 = 1";
  const [countRow, counts] = await Promise.all([
    loadOne(`SELECT COUNT(*) AS count FROM category_proposals proposal WHERE ${where}`, args),
    reviewStatusCounts("category_proposals", "reviewStatus"),
  ]);
  const totalItems = countRow ? getNumber(countRow, "count") : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const rows = await loadRows(
    `SELECT proposal.*, profile.name AS proposerName
     FROM category_proposals proposal
     LEFT JOIN profiles profile ON profile.id = proposal.proposerProfileId
     WHERE ${where}
     ORDER BY
       CASE proposal.reviewStatus
         WHEN 'appealed' THEN 0
         WHEN 'held' THEN 1
         WHEN 'second-review' THEN 2
         WHEN 'pending' THEN 3
         WHEN 'needs-revision' THEN 4
         ELSE 5
       END,
       proposal.updatedAt ASC,
       proposal.id ASC
     LIMIT ? OFFSET ?`,
    [...args, pageSize, (page - 1) * pageSize],
  );
  return { items: rows.map(mapCategoryProposal), page, pageSize, totalItems, totalPages, counts };
}

export async function listKenSubmissionQueue(
  filters: ReviewQueueFilters = {},
): Promise<ReviewQueuePage<KenSubmissionRecord>> {
  const pageSize = normalizeQueuePageSize(filters.pageSize);
  const requestedPage = normalizeQueuePage(filters.page);
  const conditions: string[] = [];
  const args: Value[] = [];
  if (filters.status && filters.status !== "all") {
    conditions.push("submission.intakeStatus = ?");
    args.push(filters.status);
  }
  if (filters.assignee && filters.assignee !== "all") {
    conditions.push(filters.assignee === "unassigned" ? "submission.assigneeAccountId IS NULL" : "submission.assigneeAccountId = ?");
    if (filters.assignee !== "unassigned") args.push(filters.assignee);
  }
  if (filters.query?.trim()) {
    conditions.push("LOWER(task.title || ' ' || task.summary || ' ' || task.publicBenefit) LIKE ? ESCAPE '!'");
    args.push(`%${escapeLikePattern(filters.query.trim().toLowerCase())}%`);
  }
  const where = conditions.length > 0 ? conditions.join(" AND ") : "1 = 1";
  const [countRow, counts] = await Promise.all([
    loadOne(
      `SELECT COUNT(*) AS count
       FROM ken_submissions submission
       JOIN tasks task ON task.id = submission.taskId
       WHERE ${where}`,
      args,
    ),
    reviewStatusCounts("ken_submissions", "intakeStatus"),
  ]);
  const totalItems = countRow ? getNumber(countRow, "count") : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const rows = await loadRows(
    `${kenSubmissionSelect}
     WHERE ${where}
     ORDER BY
       CASE submission.intakeStatus
         WHEN 'appealed' THEN 0
         WHEN 'held' THEN 1
         WHEN 'second-review' THEN 2
         WHEN 'pending' THEN 3
         WHEN 'needs-revision' THEN 4
         ELSE 5
       END,
       submission.updatedAt ASC,
       submission.id ASC
     LIMIT ? OFFSET ?`,
    [...args, pageSize, (page - 1) * pageSize],
  );
  return { items: rows.map(mapKenSubmission), page, pageSize, totalItems, totalPages, counts };
}

export async function listReviewEvents(
  entityType: ReviewEntityType,
  entityId: string,
  includePrivate = false,
) {
  const rows = await loadRows(
    `SELECT event.*, profile.name AS actorName
     FROM review_events event
     LEFT JOIN accounts account ON account.id = event.actorAccountId
     LEFT JOIN profiles profile ON profile.id = account.profileId
     WHERE event.entityType = ? AND event.entityId = ? ${includePrivate ? "" : "AND event.isPublic = 1"}
     ORDER BY event.createdAt ASC, event.id ASC`,
    [entityType, entityId],
  );
  return rows.map((row) => {
    const event = mapReviewEvent(row);
    return includePrivate ? event : redactReviewEventForPublic(event);
  });
}

export async function listReviewEventsForQueue(
  entityType: ReviewEntityType,
  entityIds: string[],
) {
  if (entityIds.length === 0) return {} as Record<string, ReviewEventRecord[]>;
  const placeholders = entityIds.map(() => "?").join(", ");
  const rows = await loadRows(
    `SELECT event.*, profile.name AS actorName
     FROM review_events event
     LEFT JOIN accounts account ON account.id = event.actorAccountId
     LEFT JOIN profiles profile ON profile.id = account.profileId
     WHERE event.entityType = ? AND event.entityId IN (${placeholders})
     ORDER BY event.createdAt ASC, event.id ASC`,
    [entityType, ...entityIds],
  );
  const grouped: Record<string, ReviewEventRecord[]> = Object.fromEntries(
    entityIds.map((entityId) => [entityId, []]),
  );
  for (const row of rows) {
    const event = mapReviewEvent(row);
    grouped[event.entityId]?.push(event);
  }
  return grouped;
}

export async function listPublicReviewOutcomes(limit = 100) {
  const rows = await loadRows(
    `SELECT
       event.*,
       profile.name AS actorName,
       COALESCE(category_proposal.name, task.title, event.entityId) AS entityLabel,
       category_proposal.slug AS categorySlug,
       task.slug AS taskSlug
     FROM review_events event
     LEFT JOIN accounts account ON account.id = event.actorAccountId
     LEFT JOIN profiles profile ON profile.id = account.profileId
     LEFT JOIN category_proposals category_proposal
       ON event.entityType = 'category-proposal' AND category_proposal.id = event.entityId
     LEFT JOIN ken_submissions submission
       ON event.entityType = 'ken-submission' AND submission.id = event.entityId
     LEFT JOIN tasks task ON task.id = submission.taskId
     WHERE event.isPublic = 1
       AND event.action IN ('revision-requested', 'held', 'approved', 'merged', 'rejected', 'appeal-resolved')
     ORDER BY event.createdAt DESC, event.id DESC
     LIMIT ?`,
    [Math.min(Math.max(limit, 1), 250)],
  );
  return rows.map((row) => {
    const event = redactReviewEventForPublic(mapReviewEvent(row));
    return {
      ...event,
      entityLabel: getString(row, "entityLabel"),
      href: getNullableString(row, "taskSlug")
        ? `/kens/${getString(row, "taskSlug")}`
        : getNullableString(row, "categorySlug")
          ? `/kens?category=${encodeURIComponent(getString(row, "categorySlug"))}`
          : "/reviews",
    };
  });
}

export async function createCategoryProposal(input: {
  name: string;
  description: string;
  publicBenefit: string;
  exampleKens: string[];
}, proposerId: string) {
  const profile = await findProfileById(proposerId);
  if (!profile) {
    throw new Error("Contributor profile not found.");
  }
  if (new Set(input.exampleKens.map((item) => normalizeReviewText(item)).filter(Boolean)).size < 2) {
    throw new Error("Provide at least two distinct example Kens.");
  }

  const now = new Date().toISOString();
  const slug = normalizedReviewSlug(input.name) || randomUUID().slice(0, 8);
  const existingCategory = await loadOne("SELECT id, name FROM categories WHERE slug = ? LIMIT 1", [slug]);
  if (existingCategory) {
    throw new Error(`A category named ${getString(existingCategory, "name")} already uses this normalized name. Propose a boundary change instead.`);
  }
  const existingProposal = await loadOne(
    `SELECT id FROM category_proposals
     WHERE slug = ? AND reviewStatus NOT IN ('rejected', 'merged')
     LIMIT 1`,
    [slug],
  );
  if (existingProposal) {
    throw new Error("An active proposal already uses this normalized category name.");
  }
  const [categories, proposals] = await Promise.all([
    loadCategories(),
    loadRows(
      "SELECT id, name, description FROM category_proposals WHERE reviewStatus NOT IN ('rejected', 'merged')",
    ),
  ]);
  const intake = evaluateCategoryIntake(input, [
    ...categories.map((category) => ({ id: category.id, name: category.name, description: category.description })),
    ...proposals.map((proposal) => ({
      id: getString(proposal, "id"),
      name: getString(proposal, "name"),
      description: getString(proposal, "description"),
    })),
  ]);
  const proposalId = randomUUID();
  await batch(
    [
      {
        sql: `INSERT INTO category_proposals (
          id, proposerProfileId, name, slug, description, publicBenefit, exampleKens,
          reviewStatus, reviewNote, internalReviewNote, reviewedBy, assigneeAccountId,
          mergedCategoryId, intakeResultJson, reviewedAt, firstApprovalBy, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, NULL, NULL, NULL, ?, NULL, NULL, ?, ?)`,
        args: [
          proposalId,
          proposerId,
          input.name.trim().slice(0, 80),
          slug,
          input.description.trim().slice(0, 800),
          input.publicBenefit.trim().slice(0, 800),
          serializeList(input.exampleKens.slice(0, 8)),
          JSON.stringify(intake),
          now,
          now,
        ],
      },
      reviewEventStatement({
        dedupeKey: `category-proposal:${proposalId}:submitted`,
        entityType: "category-proposal",
        entityId: proposalId,
        action: "submitted",
        toStatus: "pending",
        publicNote: "Category proposal entered review.",
        isPublic: false,
        createdAt: now,
      }),
      reviewEventStatement({
        dedupeKey: `category-proposal:${proposalId}:automated-check:v1`,
        entityType: "category-proposal",
        entityId: proposalId,
        action: "automated-check",
        fromStatus: "pending",
        toStatus: "pending",
        metadata: { intake },
        isPublic: false,
        createdAt: now,
      }),
    ],
    "write",
  );

  return slug;
}

const finalReviewStatuses = new Set(["approved", "merged", "rejected"]);

function reviewEventAction(action: ReviewAction, toStatus: string): ReviewEventAction {
  if (action === "request-revision") return "revision-requested";
  if (action === "hold") return "held";
  if (action === "approve") return toStatus === "second-review" ? "approval-proposed" : "approved";
  if (action === "merge") return "merged";
  if (action === "reject") return "rejected";
  if (action === "recuse") return "recused";
  if (action === "assign") return "assigned";
  if (action === "appeal") return "appealed";
  return "appeal-resolved";
}

async function validateReviewActor(
  actor: ReviewActorInput,
  action: ReviewAction,
  proposerProfileId: string,
  entityType: ReviewEntityType,
  entityId: string,
) {
  const account = await findAccountById(actor.accountId);
  if (
    !account
    || account.profileId !== actor.profileId
    || account.systemRole !== actor.role
    || !isReviewerRole(account.systemRole)
  ) {
    throw new Error("Reviewer session is no longer authorized.");
  }
  const recusal = await loadOne(
    `SELECT id FROM review_events
     WHERE entityType = ? AND entityId = ? AND action = 'recused' AND actorAccountId = ?
     LIMIT 1`,
    [entityType, entityId, actor.accountId],
  );
  assertReviewActionAuthorized({
    role: actor.role,
    action,
    actorProfileId: actor.profileId,
    proposerProfileId,
    actorPreviouslyRecused: Boolean(recusal),
  });
}

async function validateAssignee(accountId: string, proposerProfileId: string) {
  const account = await findAccountById(accountId);
  if (!account || !isReviewerRole(account.systemRole)) {
    throw new Error("Choose an active moderator, administrator, or owner as assignee.");
  }
  if (account.profileId === proposerProfileId) {
    throw new Error("A submission cannot be assigned to its proposer.");
  }
  return account;
}

export async function reviewCategoryProposal(input: {
  proposalId: string;
  action: Exclude<ReviewAction, "appeal">;
  publicNote?: string | null;
  internalNote?: string | null;
  targetAssigneeAccountId?: string | null;
  mergeCategoryId?: string | null;
  actor: ReviewActorInput;
}) {
  const row = await loadOne("SELECT * FROM category_proposals WHERE id = ? LIMIT 1", [input.proposalId]);
  if (!row) throw new Error("Category proposal not found.");
  const proposal = mapCategoryProposal(row);
  await validateReviewActor(
    input.actor,
    input.action,
    proposal.proposerProfileId,
    "category-proposal",
    proposal.id,
  );
  if (
    proposal.assigneeAccountId
    && proposal.assigneeAccountId !== input.actor.accountId
    && input.actor.role !== "owner"
    && input.action !== "assign"
    && !(proposal.reviewStatus === "second-review" && input.action === "approve")
  ) {
    throw new Error("This proposal is assigned to another reviewer. Reassign it or ask the owner to override.");
  }

  const publicNote = input.publicNote?.trim().slice(0, 2000) || null;
  const internalNote = input.internalNote?.trim().slice(0, 4000) || null;
  if (decisionNeedsPublicReason(input.action) && !publicNote) {
    throw new Error("Add a public reason for this review decision.");
  }
  if (finalReviewStatuses.has(proposal.reviewStatus)) {
    const sameFinalDecision = isSameFinalDecision(proposal.reviewStatus, input.action);
    if (sameFinalDecision) {
      return {
        changed: false,
        status: proposal.reviewStatus,
        proposerProfileId: proposal.proposerProfileId,
        label: proposal.name,
      };
    }
    throw new Error("This proposal already has a final outcome. An appeal is required before another decision.");
  }

  const now = new Date().toISOString();
  let toStatus = proposal.reviewStatus;
  let assigneeAccountId = proposal.assigneeAccountId;
  let mergedCategoryId = proposal.mergedCategoryId;
  let firstApprovalBy = proposal.firstApprovalBy;
  const statements: InStatement[] = [];

  if (input.action === "assign") {
    if (!input.targetAssigneeAccountId) throw new Error("Choose a reviewer to assign.");
    await validateAssignee(input.targetAssigneeAccountId, proposal.proposerProfileId);
    assigneeAccountId = input.targetAssigneeAccountId;
  } else if (input.action === "recuse") {
    if (assigneeAccountId === input.actor.accountId) assigneeAccountId = null;
  } else if (input.action === "merge") {
    if (!input.mergeCategoryId) throw new Error("Choose the existing category to merge into.");
    const target = await loadOne("SELECT id FROM categories WHERE id = ? LIMIT 1", [input.mergeCategoryId]);
    if (!target) throw new Error("The merge target category was not found.");
    mergedCategoryId = input.mergeCategoryId;
    toStatus = "merged";
  } else if (input.action === "approve") {
    const collision = await loadOne(
      "SELECT id, name FROM categories WHERE (slug = ? OR lower(trim(name)) = lower(trim(?))) AND id != ? LIMIT 1",
      [proposal.slug, proposal.name, proposal.slug],
    );
    if (collision) {
      throw new Error(`A matching category already exists (${getString(collision, "name")}). Merge this proposal instead.`);
    }
    const intake = parseIntakeResult<CategoryIntakeResult>(proposal.intakeResultJson, {
      version: 1,
      outcome: "review",
      checks: [],
      similarityHints: [],
      normalizedName: normalizeReviewText(proposal.name),
      normalizedSlug: proposal.slug,
    });
    const highRisk = intake.checks.some((checkItem) => checkItem.id === "safety-language" && checkItem.level === "attention");
    toStatus = nextReviewStatus("approve", {
      highRisk,
      firstApprovalBy,
      actorAccountId: input.actor.accountId,
    });
    if (toStatus === "second-review" && !firstApprovalBy) {
      firstApprovalBy = input.actor.accountId;
    }
    if (toStatus === "approved") {
      statements.push({
        sql: INSERT_APPROVED_CATEGORY_SQL,
        args: [proposal.slug, proposal.slug, proposal.name, proposal.description, proposal.publicBenefit, proposal.slug],
      });
    }
  } else {
    toStatus = nextReviewStatus(input.action);
  }

  const eventAction = reviewEventAction(input.action, toStatus);
  const reviewedAt = input.action === "assign" || input.action === "recuse" ? proposal.reviewedAt : now;
  statements.push(
    {
      sql: `UPDATE category_proposals
            SET reviewStatus = ?, reviewNote = COALESCE(?, reviewNote),
                internalReviewNote = COALESCE(?, internalReviewNote), reviewedBy = ?,
                assigneeAccountId = ?, mergedCategoryId = ?, reviewedAt = ?,
                firstApprovalBy = ?, updatedAt = ?
            WHERE id = ?`,
      args: [
        toStatus,
        publicNote,
        internalNote,
        input.actor.accountId,
        assigneeAccountId,
        mergedCategoryId,
        reviewedAt,
        firstApprovalBy,
        now,
        proposal.id,
      ],
    },
    reviewEventStatement({
      dedupeKey: [
        "category-proposal",
        proposal.id,
        eventAction,
        proposal.reviewStatus,
        toStatus,
        input.actor.accountId,
        assigneeAccountId ?? "",
        mergedCategoryId ?? "",
      ].join(":"),
      entityType: "category-proposal",
      entityId: proposal.id,
      action: eventAction,
      fromStatus: proposal.reviewStatus,
      toStatus,
      actorAccountId: input.actor.accountId,
      publicNote,
      internalNote,
      metadata: {
        assigneeAccountId,
        mergedCategoryId,
        requiresSecondReview: toStatus === "second-review",
      },
      isPublic: Boolean(publicNote) && eventAction !== "assigned" && eventAction !== "recused",
      createdAt: now,
    }),
  );
  await batch(statements, "write");
  return {
    changed: toStatus !== proposal.reviewStatus || assigneeAccountId !== proposal.assigneeAccountId,
    status: toStatus,
    proposerProfileId: proposal.proposerProfileId,
    label: proposal.name,
  };
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
  const existingTasks = await loadRows("SELECT id, title, summary FROM tasks ORDER BY createdAt DESC LIMIT 1000");
  const intake = evaluateKenIntake(
    input,
    existingTasks.map((task) => ({
      id: getString(task, "id"),
      title: getString(task, "title"),
      summary: getString(task, "summary"),
    })),
  );
  const submissionId = randomUUID();

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
        sql: `INSERT INTO ken_submissions (
          id, taskId, proposerProfileId, requestedTier, estimatedTier, intakeStatus, intakeResultJson,
          reviewNote, internalReviewNote, assigneeAccountId, mergedTaskId, firstApprovalBy,
          submittedAt, assignedAt, reviewedAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, 'pending', ?, NULL, NULL, NULL, NULL, NULL, ?, NULL, NULL, ?)`,
        args: [
          submissionId,
          slug,
          proposerId,
          input.requestedTier,
          intake.estimatedTier,
          JSON.stringify(intake),
          now,
          now,
        ],
      },
      reviewEventStatement({
        dedupeKey: `ken-submission:${submissionId}:submitted`,
        entityType: "ken-submission",
        entityId: submissionId,
        action: "submitted",
        toStatus: "pending",
        publicNote: "Ken entered the private intake queue.",
        isPublic: false,
        createdAt: now,
      }),
      reviewEventStatement({
        dedupeKey: `ken-submission:${submissionId}:automated-check:v1`,
        entityType: "ken-submission",
        entityId: submissionId,
        action: "automated-check",
        fromStatus: "pending",
        toStatus: "pending",
        metadata: { intake },
        isPublic: false,
        createdAt: now,
      }),
    ],
    "write",
  );

  return slug;
}

export async function reviewKenSubmission(input: {
  submissionId: string;
  action: Exclude<ReviewAction, "appeal">;
  publicNote?: string | null;
  internalNote?: string | null;
  targetAssigneeAccountId?: string | null;
  mergeTaskId?: string | null;
  actor: ReviewActorInput;
}) {
  const row = await loadOne(`${kenSubmissionSelect} WHERE submission.id = ? LIMIT 1`, [input.submissionId]);
  if (!row) throw new Error("Ken submission not found.");
  const submission = mapKenSubmission(row);
  await validateReviewActor(
    input.actor,
    input.action,
    submission.proposerProfileId,
    "ken-submission",
    submission.id,
  );
  if (
    submission.assigneeAccountId
    && submission.assigneeAccountId !== input.actor.accountId
    && input.actor.role !== "owner"
    && input.action !== "assign"
    && !(submission.intakeStatus === "second-review" && input.action === "approve")
  ) {
    throw new Error("This Ken is assigned to another reviewer. Reassign it or ask the owner to override.");
  }

  const publicNote = input.publicNote?.trim().slice(0, 2000) || null;
  const internalNote = input.internalNote?.trim().slice(0, 4000) || null;
  if (decisionNeedsPublicReason(input.action) && !publicNote) {
    throw new Error("Add a public reason for this review decision.");
  }
  if (finalReviewStatuses.has(submission.intakeStatus)) {
    const sameFinalDecision = isSameFinalDecision(submission.intakeStatus, input.action);
    if (sameFinalDecision) {
      return {
        changed: false,
        status: submission.intakeStatus,
        taskSlug: submission.taskSlug,
        proposerProfileId: submission.proposerProfileId,
        label: submission.taskTitle,
      };
    }
    throw new Error("This Ken already has a final outcome. The submitter must appeal before another decision.");
  }

  const now = new Date().toISOString();
  let toStatus = submission.intakeStatus;
  let assigneeAccountId = submission.assigneeAccountId;
  let mergedTaskId = submission.mergedTaskId;
  let firstApprovalBy = submission.firstApprovalBy;
  const statements: InStatement[] = [];

  if (input.action === "assign") {
    if (!input.targetAssigneeAccountId) throw new Error("Choose a reviewer to assign.");
    await validateAssignee(input.targetAssigneeAccountId, submission.proposerProfileId);
    assigneeAccountId = input.targetAssigneeAccountId;
  } else if (input.action === "recuse") {
    if (assigneeAccountId === input.actor.accountId) assigneeAccountId = null;
  } else if (input.action === "merge") {
    if (!input.mergeTaskId || input.mergeTaskId === submission.taskId) {
      throw new Error("Choose a different existing Ken to merge into.");
    }
    const target = await loadOne(
      `SELECT task.id
       FROM tasks task
       LEFT JOIN ken_submissions target_submission ON target_submission.taskId = task.id
       WHERE task.id = ?
         AND (target_submission.id IS NULL OR target_submission.intakeStatus = 'approved')
       LIMIT 1`,
      [input.mergeTaskId],
    );
    if (!target) throw new Error("The merge target must be an existing public Ken.");
    mergedTaskId = input.mergeTaskId;
    toStatus = "merged";
  } else if (input.action === "approve") {
    const intake = parseIntakeResult<KenIntakeResult>(submission.intakeResultJson, {
      version: 1,
      outcome: "review",
      checks: [],
      similarityHints: [],
      estimatedTier: submission.estimatedTier,
      scopeMismatch: submission.estimatedTier !== submission.requestedTier,
      highRisk: true,
    });
    toStatus = nextReviewStatus("approve", {
      highRisk: intake.highRisk,
      firstApprovalBy,
      actorAccountId: input.actor.accountId,
    });
    if (toStatus === "second-review" && !firstApprovalBy) {
      firstApprovalBy = input.actor.accountId;
    }
    if (toStatus === "approved") {
      statements.push(
        {
          sql: "UPDATE tasks SET stage = 'voting', safetyStatus = 'approved', backend = ? WHERE id = ?",
          args: ["Awaiting allocation and execution routing", submission.taskId],
        },
        {
          sql: `INSERT INTO governance_events (id, taskId, house, title, decision, outcome, createdAt)
                VALUES (?, ?, 'safety-council', ?, ?, ?, ?)`,
          args: [
            randomUUID(),
            submission.taskId,
            "Intake review approved",
            publicNote ?? "The submission met the published intake requirements.",
            "The Ken is now public and can receive pulse, comments, and scarce voice.",
            now,
          ],
        },
      );
    }
  } else {
    toStatus = nextReviewStatus(input.action);
  }

  const eventAction = reviewEventAction(input.action, toStatus);
  const reviewedAt = input.action === "assign" || input.action === "recuse" ? submission.reviewedAt : now;
  const assignedAt =
    input.action === "assign" && assigneeAccountId !== submission.assigneeAccountId
      ? now
      : submission.assignedAt;
  statements.push(
    {
      sql: `UPDATE ken_submissions
            SET intakeStatus = ?, reviewNote = COALESCE(?, reviewNote),
                internalReviewNote = COALESCE(?, internalReviewNote),
                assigneeAccountId = ?, mergedTaskId = ?, firstApprovalBy = ?,
                assignedAt = ?, reviewedAt = ?, updatedAt = ?
            WHERE id = ?`,
      args: [
        toStatus,
        publicNote,
        internalNote,
        assigneeAccountId,
        mergedTaskId,
        firstApprovalBy,
        assignedAt,
        reviewedAt,
        now,
        submission.id,
      ],
    },
    reviewEventStatement({
      dedupeKey: [
        "ken-submission",
        submission.id,
        eventAction,
        submission.intakeStatus,
        toStatus,
        input.actor.accountId,
        assigneeAccountId ?? "",
        mergedTaskId ?? "",
      ].join(":"),
      entityType: "ken-submission",
      entityId: submission.id,
      action: eventAction,
      fromStatus: submission.intakeStatus,
      toStatus,
      actorAccountId: input.actor.accountId,
      publicNote,
      internalNote,
      metadata: {
        assigneeAccountId,
        mergedTaskId,
        requestedTier: submission.requestedTier,
        estimatedTier: submission.estimatedTier,
        requiresSecondReview: toStatus === "second-review",
      },
      isPublic: Boolean(publicNote) && eventAction !== "assigned" && eventAction !== "recused",
      createdAt: now,
    }),
  );
  await batch(statements, "write");
  return {
    changed: toStatus !== submission.intakeStatus || assigneeAccountId !== submission.assigneeAccountId,
    status: toStatus,
    taskSlug: submission.taskSlug,
    proposerProfileId: submission.proposerProfileId,
    label: submission.taskTitle,
  };
}

export async function appealReviewDecision(input: {
  entityType: ReviewEntityType;
  entityId: string;
  proposerProfileId: string;
  publicNote: string;
}) {
  const note = input.publicNote.trim().slice(0, 2000);
  if (note.length < 20) throw new Error("Explain the factual basis for the appeal.");
  const now = new Date().toISOString();

  if (input.entityType === "category-proposal") {
    const row = await loadOne("SELECT * FROM category_proposals WHERE id = ? LIMIT 1", [input.entityId]);
    if (!row) throw new Error("Category proposal not found.");
    const proposal = mapCategoryProposal(row);
    if (proposal.proposerProfileId !== input.proposerProfileId) throw new Error("Only the proposer can appeal this decision.");
    if (!["rejected", "merged"].includes(proposal.reviewStatus)) {
      throw new Error("Only a rejected or merged category outcome can be appealed.");
    }
    await batch([
      {
        sql: `UPDATE category_proposals
              SET reviewStatus = 'appealed', reviewNote = ?, reviewedBy = NULL,
                  assigneeAccountId = NULL, firstApprovalBy = NULL, updatedAt = ?
              WHERE id = ?`,
        args: [note, now, proposal.id],
      },
      reviewEventStatement({
        dedupeKey: `category-proposal:${proposal.id}:appealed:${proposal.updatedAt}`,
        entityType: "category-proposal",
        entityId: proposal.id,
        action: "appealed",
        fromStatus: proposal.reviewStatus,
        toStatus: "appealed",
        publicNote: note,
        isPublic: true,
        createdAt: now,
      }),
    ]);
    return;
  }

  const row = await loadOne(`${kenSubmissionSelect} WHERE submission.id = ? LIMIT 1`, [input.entityId]);
  if (!row) throw new Error("Ken submission not found.");
  const submission = mapKenSubmission(row);
  if (submission.proposerProfileId !== input.proposerProfileId) throw new Error("Only the submitter can appeal this decision.");
  if (!["rejected", "merged"].includes(submission.intakeStatus)) {
    throw new Error("Only a rejected or merged Ken outcome can be appealed.");
  }
  await batch([
    {
      sql: `UPDATE ken_submissions
            SET intakeStatus = 'appealed', reviewNote = ?, assigneeAccountId = NULL,
                firstApprovalBy = NULL, updatedAt = ?
            WHERE id = ?`,
      args: [note, now, submission.id],
    },
    reviewEventStatement({
      dedupeKey: `ken-submission:${submission.id}:appealed:${submission.updatedAt}`,
      entityType: "ken-submission",
      entityId: submission.id,
      action: "appealed",
      fromStatus: submission.intakeStatus,
      toStatus: "appealed",
      publicNote: note,
      isPublic: true,
      createdAt: now,
    }),
  ]);
}

export async function listMyReviewSubmissions(profileId: string) {
  const [categoryRows, kenRows, eventRows] = await Promise.all([
    loadRows(
      `SELECT proposal.*, profile.name AS proposerName
       FROM category_proposals proposal
       LEFT JOIN profiles profile ON profile.id = proposal.proposerProfileId
       WHERE proposal.proposerProfileId = ?
       ORDER BY proposal.updatedAt DESC`,
      [profileId],
    ),
    loadRows(`${kenSubmissionSelect} WHERE submission.proposerProfileId = ? ORDER BY submission.updatedAt DESC`, [profileId]),
    loadRows(
      `SELECT event.*, profile.name AS actorName
       FROM review_events event
       LEFT JOIN accounts account ON account.id = event.actorAccountId
       LEFT JOIN profiles profile ON profile.id = account.profileId
       WHERE event.isPublic = 1
         AND (
           (event.entityType = 'category-proposal' AND event.entityId IN (
             SELECT id FROM category_proposals WHERE proposerProfileId = ?
           ))
           OR
           (event.entityType = 'ken-submission' AND event.entityId IN (
             SELECT id FROM ken_submissions WHERE proposerProfileId = ?
           ))
         )
       ORDER BY event.createdAt ASC, event.id ASC`,
      [profileId, profileId],
    ),
  ]);
  return {
    categories: categoryRows.map(mapCategoryProposal).map(redactCategoryProposalForSubmitter),
    kens: kenRows.map(mapKenSubmission).map(redactKenSubmissionForPublic),
    events: eventRows.map(mapReviewEvent).map(redactReviewEventForPublic),
  };
}

async function findKenSubmissionForTask(taskId: string) {
  const row = await loadOne(`${kenSubmissionSelect} WHERE submission.taskId = ? LIMIT 1`, [taskId]);
  return row ? mapKenSubmission(row) : null;
}

async function assertTaskPublishedForParticipation(taskId: string) {
  const submission = await findKenSubmissionForTask(taskId);
  if (submission && submission.intakeStatus !== "approved") {
    throw new Error("This Ken is still in intake review and cannot receive public participation yet.");
  }
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
  await assertTaskPublishedForParticipation(taskId);

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
  await assertTaskPublishedForParticipation(taskId);

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
  await assertTaskPublishedForParticipation(input.taskId);

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
  const comment = await loadOne("SELECT id, taskId FROM comments WHERE id = ? LIMIT 1", [commentId]);
  if (!comment) {
    throw new Error("Comment not found.");
  }
  await assertTaskPublishedForParticipation(getString(comment, "taskId"));

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
  networkIdentifier?: string | null;
  actorId?: string | null;
}) {
  const networkHash = hashPrivateIdentifier(
    input.networkIdentifier,
    "security-network",
    visitorHashSalt,
  );
  await execute(
    "INSERT INTO security_events (id, eventType, networkHash, actorId, detail, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    [randomUUID(), input.eventType, networkHash, input.actorId ?? null, input.detail, new Date().toISOString()],
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
    loadRows("SELECT COUNT(*) AS count FROM visitors"),
    loadRows("SELECT COUNT(*) AS count FROM accounts"),
  ]);

  return {
    ok: true,
    databaseMode: databaseUrl.startsWith("file:") ? "local-file" : "remote-libsql",
    profileCount: getCount(counts[0]),
    taskCount: getCount(counts[1]),
    voteCount: getCount(counts[2]),
    commentCount: getCount(counts[3]),
    visitorCount: getCount(counts[4]),
    accountCount: getCount(counts[5]),
    checkedAt: new Date().toISOString(),
  };
}

function loadAccounts() {
  return loadRows("SELECT * FROM accounts").then((rows) => rows.map(mapAccount));
}

function mapBookmark(row: DbRow): BookmarkRecord {
  return {
    id: getString(row, "id"),
    profileId: getString(row, "profileId"),
    taskId: getString(row, "taskId"),
    createdAt: getString(row, "createdAt"),
  };
}

function mapEmailToken(row: DbRow): EmailTokenRecord {
  return {
    id: getString(row, "id"),
    accountId: getString(row, "accountId"),
    email: getString(row, "email"),
    purpose: getString(row, "purpose") as EmailTokenPurpose,
    tokenHash: getString(row, "tokenHash"),
    expiresAt: getString(row, "expiresAt"),
    consumedAt: getNullableString(row, "consumedAt"),
    createdAt: getString(row, "createdAt"),
  };
}

function mapVisitor(row: DbRow): VisitorRecord {
  return {
    id: getString(row, "id"),
    countryCode: getNullableString(row, "countryCode"),
    countryName: getNullableString(row, "countryName"),
    firstSeenAt: getString(row, "firstSeenAt"),
    lastSeenAt: getString(row, "lastSeenAt"),
    pageViews: getNumber(row, "pageViews"),
    accountCreated: getNumber(row, "accountCreated") > 0,
  };
}

function loadBookmarksForProfile(profileId: string) {
  return loadRows("SELECT * FROM bookmarks WHERE profileId = ?", [profileId]).then((rows) =>
    rows.map(mapBookmark),
  );
}

export async function createBookmark(profileId: string, taskId: string) {
  const existing = await loadOne("SELECT id FROM bookmarks WHERE profileId = ? AND taskId = ? LIMIT 1", [profileId, taskId]);
  if (existing) {
    await execute("DELETE FROM bookmarks WHERE profileId = ? AND taskId = ?", [profileId, taskId]);
    return { bookmarked: false };
  }
  await execute("INSERT INTO bookmarks (id, profileId, taskId, createdAt) VALUES (?, ?, ?, ?)", [
    randomUUID(),
    profileId,
    taskId,
    new Date().toISOString(),
  ]);
  return { bookmarked: true };
}

export async function listBookmarks(profileId: string) {
  const bookmarks = await loadBookmarksForProfile(profileId);
  if (bookmarks.length === 0) return [];
  const snapshot = await hydrate(profileId);
  const set = new Set(bookmarks.map((bookmark) => bookmark.taskId));
  return snapshot.tasks.filter((task) => set.has(task.id));
}

export async function createEmailToken(input: {
  accountId: string;
  email: string;
  purpose: EmailTokenPurpose;
  ttlMinutes?: number;
}) {
  const token = randomBytes(24).toString("hex");
  const now = new Date();
  const ttl = input.ttlMinutes ?? (input.purpose === "email-verification" ? 60 * 48 : 30);
  const expiresAt = new Date(now.getTime() + ttl * 60 * 1000).toISOString();

  await execute(
    `INSERT INTO email_tokens (id, accountId, email, purpose, tokenHash, expiresAt, consumedAt, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?)`,
    [randomUUID(), input.accountId, input.email.toLowerCase(), input.purpose, hashToken(token), expiresAt, now.toISOString()],
  );

  return { token, expiresAt };
}

export async function consumeEmailToken(purpose: EmailTokenPurpose, token: string) {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const row = await loadOne(
    "SELECT * FROM email_tokens WHERE tokenHash = ? AND purpose = ? LIMIT 1",
    [tokenHash, purpose],
  );
  if (!row) return null;
  const record = mapEmailToken(row);
  if (record.consumedAt) return null;
  if (new Date(record.expiresAt) <= new Date()) return null;
  await execute("UPDATE email_tokens SET consumedAt = ? WHERE id = ?", [new Date().toISOString(), record.id]);
  return record;
}

export async function markEmailVerified(accountId: string) {
  const now = new Date().toISOString();
  await execute("UPDATE accounts SET emailVerified = 1, emailVerifiedAt = ? WHERE id = ?", [now, accountId]);
}

export async function updateAccountPassword(accountId: string, newPassword: string) {
  const { passwordHash, passwordSalt } = createPasswordHash(newPassword);
  await execute("UPDATE accounts SET passwordHash = ?, passwordSalt = ? WHERE id = ?", [passwordHash, passwordSalt, accountId]);
  await execute("DELETE FROM sessions WHERE accountId = ?", [accountId]);
}

export async function updateAccountLastLogin(accountId: string) {
  await execute("UPDATE accounts SET lastLoginAt = ? WHERE id = ?", [new Date().toISOString(), accountId]);
}

export async function findAccountByEmailExported(email: string) {
  return findAccountByEmail(email);
}

export async function findAccountByIdExported(accountId: string) {
  return findAccountById(accountId);
}

export async function findAccountByProfileIdExported(profileId: string) {
  const row = await loadOne("SELECT * FROM accounts WHERE profileId = ? LIMIT 1", [profileId]);
  return row ? mapAccount(row) : null;
}

export async function updateProfileDetails(
  profileId: string,
  input: {
    username?: string | null;
    showRealName?: boolean;
    name?: string;
    role?: string;
    bio?: string;
    specialty?: string;
    location?: string | null;
    pronouns?: string | null;
    links?: ProfileLink[];
    avatarImage?: string | null;
    avatarGradient?: string | null;
    avatarImageScale?: number;
    avatarImageX?: number;
    avatarImageY?: number;
  },
) {
  const profile = await findProfileById(profileId);
  if (!profile) throw new Error("Profile not found.");
  const currentAccount = await loadOne("SELECT id FROM accounts WHERE profileId = ? LIMIT 1", [profileId]);
  const nextUsername = input.username === undefined ? profile.username ?? profile.id : normalizeUsername(input.username ?? "");
  assertValidUsername(nextUsername);
  const existingUsername = await loadOne("SELECT profileId FROM accounts WHERE lower(username) = lower(?) AND profileId != ? LIMIT 1", [nextUsername, profileId]);
  if (existingUsername) {
    throw new Error("That username is already taken.");
  }
  const next = {
    username: nextUsername,
    showRealName: input.showRealName ?? profile.showRealName ?? true,
    name: (input.name ?? profile.name).slice(0, 80),
    role: (input.role ?? profile.role).slice(0, 120),
    bio: (input.bio ?? profile.bio).slice(0, 2000),
    specialty: (input.specialty ?? profile.specialty).slice(0, 120),
    location: input.location === undefined ? profile.location ?? null : (input.location ? input.location.slice(0, 120) : null),
    pronouns: input.pronouns === undefined ? profile.pronouns ?? null : (input.pronouns ? input.pronouns.slice(0, 40) : null),
    links: input.links === undefined ? profile.links ?? [] : input.links.slice(0, 8),
    avatarImage: input.avatarImage === undefined ? profile.avatarImage ?? null : input.avatarImage,
    avatarGradient: input.avatarGradient === undefined ? profile.avatarGradient ?? null : input.avatarGradient,
    avatarImageScale: Math.max(1, Math.min(input.avatarImageScale ?? profile.avatarImageScale ?? 1, 2.5)),
    avatarImageX: Math.max(0, Math.min(input.avatarImageX ?? profile.avatarImageX ?? 50, 100)),
    avatarImageY: Math.max(0, Math.min(input.avatarImageY ?? profile.avatarImageY ?? 50, 100)),
  };
  await batch(
    [
      {
        sql: `UPDATE profiles SET
          username = ?, showRealName = ?, name = ?, role = ?, bio = ?, specialty = ?, location = ?, pronouns = ?,
          links = ?, avatarImage = ?, avatarGradient = ?, avatarImageScale = ?, avatarImageX = ?, avatarImageY = ?
          WHERE id = ?`,
        args: [
          next.username,
          next.showRealName ? 1 : 0,
          next.name,
          next.role,
          next.bio,
          next.specialty,
          next.location,
          next.pronouns,
          JSON.stringify(next.links),
          next.avatarImage,
          next.avatarGradient,
          next.avatarImageScale,
          next.avatarImageX,
          next.avatarImageY,
          profileId,
        ],
      },
      ...(currentAccount
        ? [{
            sql: "UPDATE accounts SET username = ? WHERE profileId = ?",
            args: [next.username, profileId],
          } satisfies InStatement]
        : []),
    ],
    "write",
  );
}

export async function requestVerification(profileId: string, note: string) {
  const now = new Date().toISOString();
  const clean = note.trim().slice(0, 1000);
  await execute(
    "UPDATE profiles SET verificationStatus = 'pending', verificationRequestedAt = ?, verificationNote = ? WHERE id = ?",
    [now, clean, profileId],
  );
}

export async function decideVerification(profileId: string, status: VerificationStatus, note: string | null) {
  await execute(
    "UPDATE profiles SET verificationStatus = ?, verificationNote = ? WHERE id = ?",
    [status, note, profileId],
  );
  if (status === "approved") {
    await execute("UPDATE profiles SET attestationLevel = 'verified' WHERE id = ?", [profileId]);
    await execute("UPDATE profile_attestations SET status = 'verified', reviewedAt = ? WHERE profileId = ?", [new Date().toISOString(), profileId]);
  }
}

export async function setAccountRole(accountId: string, role: SystemRole) {
  await execute("UPDATE accounts SET systemRole = ? WHERE id = ?", [role, accountId]);
}

export async function suspendProfile(profileId: string, status: "active" | "restricted" | "suspended") {
  await execute("UPDATE profiles SET moderationStatus = ? WHERE id = ?", [status, profileId]);
}

export async function recordVisitor(input: {
  visitorHash: string;
  countryCode: string | null;
  countryName: string | null;
}) {
  const existing = await loadOne(
    `SELECT id, countryCode, countryName, firstSeenAt, lastSeenAt, pageViews, accountCreated
     FROM visitors
     WHERE visitorHash = ?
     LIMIT 1`,
    [input.visitorHash],
  );
  const now = new Date().toISOString();
  if (existing) {
    await execute(
      `UPDATE visitors
       SET lastSeenAt = ?,
           pageViews = pageViews + 1,
           countryCode = COALESCE(countryCode, ?),
           countryName = COALESCE(countryName, ?)
       WHERE visitorHash = ?`,
      [now, input.countryCode, input.countryName, input.visitorHash],
    );
    await recordDailyVisitorActivity({
      visitorId: getString(existing, "id"),
      countryCode: getNullableString(existing, "countryCode") ?? input.countryCode,
      countryName: getNullableString(existing, "countryName") ?? input.countryName,
      firstSeenAt: getString(existing, "firstSeenAt"),
      seenAt: now,
    });
    return {
      isNew: false,
      record: {
        ...mapVisitor(existing),
        countryCode: getNullableString(existing, "countryCode") ?? input.countryCode,
        countryName: getNullableString(existing, "countryName") ?? input.countryName,
        lastSeenAt: now,
        pageViews: getNumber(existing, "pageViews") + 1,
      },
    };
  }
  const record: VisitorRecord = {
    id: randomUUID(),
    countryCode: input.countryCode,
    countryName: input.countryName,
    firstSeenAt: now,
    lastSeenAt: now,
    pageViews: 1,
    accountCreated: false,
  };
  await execute(
    `INSERT INTO visitors (
      id, visitorHash, countryCode, countryName, firstSeenAt, lastSeenAt, pageViews, accountCreated
    ) VALUES (?, ?, ?, ?, ?, ?, 1, 0)`,
    [
      record.id,
      input.visitorHash,
      record.countryCode,
      record.countryName,
      record.firstSeenAt,
      record.lastSeenAt,
    ],
  );
  await recordDailyVisitorActivity({
    visitorId: record.id,
    countryCode: record.countryCode,
    countryName: record.countryName,
    firstSeenAt: now,
    seenAt: now,
  });
  return { isNew: true, record };
}

async function recordDailyVisitorActivity(input: {
  visitorId: string;
  countryCode: string | null;
  countryName: string | null;
  firstSeenAt: string;
  seenAt: string;
}) {
  const day = input.seenAt.slice(0, 10);
  await execute(
    `INSERT INTO visitor_daily_activity (
       day, visitorId, countryCode, countryName, pageViews, firstSeenAt, lastSeenAt
     ) VALUES (?, ?, ?, ?, 1, ?, ?)
     ON CONFLICT(day, visitorId) DO UPDATE SET
       countryCode = COALESCE(visitor_daily_activity.countryCode, excluded.countryCode),
       countryName = COALESCE(visitor_daily_activity.countryName, excluded.countryName),
       pageViews = visitor_daily_activity.pageViews + 1,
       lastSeenAt = excluded.lastSeenAt`,
    [day, input.visitorId, input.countryCode, input.countryName, input.firstSeenAt, input.seenAt],
  );
  const cutoff = new Date(Date.parse(`${day}T00:00:00.000Z`) - VISITOR_ANALYTICS_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  await execute("DELETE FROM visitor_daily_activity WHERE day < ?", [cutoff]);
}

export async function markVisitorAccountCreated(visitorHash: string) {
  await execute("UPDATE visitors SET accountCreated = 1 WHERE visitorHash = ?", [visitorHash]);
}

export async function listVisitors(limit = 1000) {
  const rows = await loadRows(
    "SELECT id, countryCode, countryName, firstSeenAt, lastSeenAt, pageViews, accountCreated FROM visitors ORDER BY lastSeenAt DESC LIMIT ?",
    [limit],
  );
  return rows.map(mapVisitor);
}

export async function aggregateVisitorsByCountry(): Promise<VisitorAggregate[]> {
  const rows = await loadRows(
    `SELECT countryCode, countryName, NULL AS latitude, NULL AS longitude,
            COUNT(*) AS visitorCount, MAX(lastSeenAt) AS lastSeenAt
     FROM visitors
     WHERE countryCode IS NOT NULL
     GROUP BY countryCode, countryName
     ORDER BY visitorCount DESC`,
  );
  return rows.map((row) => ({
    countryCode: getNullableString(row, "countryCode"),
    countryName: getNullableString(row, "countryName"),
    latitude: typeof row.latitude === "number" ? row.latitude : null,
    longitude: typeof row.longitude === "number" ? row.longitude : null,
    visitorCount: getNumber(row, "visitorCount"),
    lastSeenAt: getString(row, "lastSeenAt"),
  }));
}

export async function getVisitorStats(): Promise<VisitorStats> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [totals, recent24h, recent7d, countries, accountCreated, topCountries] = await Promise.all([
    loadOne("SELECT COUNT(*) AS count FROM visitors"),
    loadOne("SELECT COUNT(*) AS count FROM visitors WHERE lastSeenAt >= ?", [since24h]),
    loadOne("SELECT COUNT(*) AS count FROM visitors WHERE lastSeenAt >= ?", [since7d]),
    loadOne("SELECT COUNT(DISTINCT countryCode) AS count FROM visitors WHERE countryCode IS NOT NULL AND trim(countryCode) != ''"),
    loadOne("SELECT COUNT(*) AS count FROM visitors WHERE accountCreated = 1"),
    loadRows(
      `SELECT COALESCE(countryName, countryCode, 'Unknown') AS countryName, COUNT(*) AS visitorCount
       FROM visitors
       GROUP BY COALESCE(countryName, countryCode, 'Unknown')
       ORDER BY visitorCount DESC
       LIMIT 8`,
    ),
  ]);

  return {
    totalUnique: totals ? getNumber(totals, "count") : 0,
    recent24h: recent24h ? getNumber(recent24h, "count") : 0,
    recent7d: recent7d ? getNumber(recent7d, "count") : 0,
    countries: countries ? getNumber(countries, "count") : 0,
    accountCreated: accountCreated ? getNumber(accountCreated, "count") : 0,
    topCountries: topCountries.map((row) => ({
      countryName: getString(row, "countryName"),
      visitorCount: getNumber(row, "visitorCount"),
    })),
  };
}

function mapAnalyticsSummary(row: DbRow | null, newAccounts: number): AnalyticsSummaryValues {
  const uniqueVisitors = row ? getNumber(row, "uniqueVisitors") : 0;
  const firstTimeVisitors = row ? getNumber(row, "firstTimeVisitors") : 0;
  return {
    uniqueVisitors,
    pageViews: row ? getNumber(row, "pageViews") : 0,
    newAccounts,
    countries: row ? getNumber(row, "countries") : 0,
    firstTimeVisitors,
    returningVisitors: Math.max(0, uniqueVisitors - firstTimeVisitors),
    unknownCountryVisitors: row ? getNumber(row, "unknownCountryVisitors") : 0,
  };
}

export async function getAdminHistoricalAnalytics(input: {
  rangeDays?: number | string;
  bucket?: string;
} = {}): Promise<AdminHistoricalAnalytics> {
  const filters = normalizeAnalyticsFilters(input);
  const period = analyticsPeriod(filters.rangeDays);
  const visitorBucket = analyticsBucketSql("day", filters.bucket);
  const accountBucket = analyticsBucketSql("day", filters.bucket);
  const notificationBucket = analyticsBucketSql("day", filters.bucket);
  const summarySql = `SELECT
      COUNT(DISTINCT visitorId) AS uniqueVisitors,
      COALESCE(SUM(pageViews), 0) AS pageViews,
      COUNT(DISTINCT CASE WHEN countryCode IS NOT NULL AND trim(countryCode) != '' THEN countryCode END) AS countries,
      COUNT(DISTINCT CASE WHEN substr(firstSeenAt, 1, 10) BETWEEN ? AND ? THEN visitorId END) AS firstTimeVisitors,
      COUNT(DISTINCT CASE WHEN countryCode IS NULL OR trim(countryCode) = '' THEN visitorId END) AS unknownCountryVisitors
    FROM visitor_daily_activity
    WHERE day BETWEEN ? AND ?`;

  const [
    visitorTrendRows,
    accountTrendRows,
    notificationTrendRows,
    currentVisitorRow,
    previousVisitorRow,
    currentAccountRow,
    previousAccountRow,
    currentCountryRows,
    previousCountryRows,
    currentNotificationRow,
    previousNotificationRow,
    telemetryRow,
  ] = await Promise.all([
    loadRows(
      `SELECT ${visitorBucket} AS bucket,
              COUNT(DISTINCT visitorId) AS uniqueVisitors,
              COALESCE(SUM(pageViews), 0) AS pageViews,
              COUNT(DISTINCT CASE WHEN substr(firstSeenAt, 1, 10) = day THEN visitorId END) AS firstTimeVisitors,
              COUNT(DISTINCT CASE WHEN countryCode IS NULL OR trim(countryCode) = '' THEN visitorId END) AS unknownCountryVisitors
       FROM visitor_daily_activity
       WHERE day BETWEEN ? AND ?
       GROUP BY bucket
       ORDER BY bucket ASC`,
      [period.startDate, period.endDate],
    ),
    loadRows(
      `WITH account_days AS (
         SELECT substr(createdAt, 1, 10) AS day FROM accounts
       )
       SELECT ${accountBucket} AS bucket, COUNT(*) AS newAccounts
       FROM account_days
       WHERE day BETWEEN ? AND ?
       GROUP BY bucket
       ORDER BY bucket ASC`,
      [period.startDate, period.endDate],
    ),
    loadRows(
      `WITH notification_days AS (
         SELECT substr(createdAt, 1, 10) AS day, status FROM notification_delivery_events
       )
       SELECT ${notificationBucket} AS bucket,
              SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS sent,
              SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
              SUM(CASE WHEN status = 'not-configured' THEN 1 ELSE 0 END) AS skipped
       FROM notification_days
       WHERE day BETWEEN ? AND ?
       GROUP BY bucket
       ORDER BY bucket ASC`,
      [period.startDate, period.endDate],
    ),
    loadOne(summarySql, [period.startDate, period.endDate, period.startDate, period.endDate]),
    loadOne(summarySql, [
      period.previousStartDate,
      period.previousEndDate,
      period.previousStartDate,
      period.previousEndDate,
    ]),
    loadOne("SELECT COUNT(*) AS count FROM accounts WHERE substr(createdAt, 1, 10) BETWEEN ? AND ?", [
      period.startDate,
      period.endDate,
    ]),
    loadOne("SELECT COUNT(*) AS count FROM accounts WHERE substr(createdAt, 1, 10) BETWEEN ? AND ?", [
      period.previousStartDate,
      period.previousEndDate,
    ]),
    loadRows(
      `SELECT COALESCE(countryCode, 'unknown') AS countryCode,
              COALESCE(countryName, 'Unknown') AS countryName,
              COUNT(DISTINCT visitorId) AS visitors,
              COALESCE(SUM(pageViews), 0) AS pageViews,
              MAX(lastSeenAt) AS lastSeenAt
       FROM visitor_daily_activity
       WHERE day BETWEEN ? AND ?
       GROUP BY COALESCE(countryCode, 'unknown'), COALESCE(countryName, 'Unknown')
       ORDER BY visitors DESC, countryName ASC`,
      [period.startDate, period.endDate],
    ),
    loadRows(
      `SELECT COALESCE(countryCode, 'unknown') AS countryCode,
              COALESCE(countryName, 'Unknown') AS countryName,
              COUNT(DISTINCT visitorId) AS visitors
       FROM visitor_daily_activity
       WHERE day BETWEEN ? AND ?
       GROUP BY COALESCE(countryCode, 'unknown'), COALESCE(countryName, 'Unknown')`,
      [period.previousStartDate, period.previousEndDate],
    ),
    loadOne(
      `SELECT SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS sent,
              SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
              SUM(CASE WHEN status = 'not-configured' THEN 1 ELSE 0 END) AS skipped
       FROM notification_delivery_events
       WHERE substr(createdAt, 1, 10) BETWEEN ? AND ?`,
      [period.startDate, period.endDate],
    ),
    loadOne(
      `SELECT SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS sent,
              SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
              SUM(CASE WHEN status = 'not-configured' THEN 1 ELSE 0 END) AS skipped
       FROM notification_delivery_events
       WHERE substr(createdAt, 1, 10) BETWEEN ? AND ?`,
      [period.previousStartDate, period.previousEndDate],
    ),
    loadOne(
      `SELECT
         (SELECT MIN(day) FROM visitor_daily_activity) AS collectionStartedAt,
         (SELECT MAX(lastSeenAt) FROM visitor_daily_activity) AS latestActivityAt,
         (SELECT MIN(firstSeenAt) FROM visitors) AS legacyVisitorStartedAt,
         (SELECT MAX(createdAt) FROM notification_delivery_events) AS latestNotificationAt`,
    ),
  ]);

  const current = mapAnalyticsSummary(currentVisitorRow, currentAccountRow ? getNumber(currentAccountRow, "count") : 0);
  const previous = mapAnalyticsSummary(previousVisitorRow, previousAccountRow ? getNumber(previousAccountRow, "count") : 0);
  const visitorByBucket = new Map(visitorTrendRows.map((row) => [getString(row, "bucket"), row]));
  const accountsByBucket = new Map(accountTrendRows.map((row) => [getString(row, "bucket"), row]));
  const notificationsByBucket = new Map(notificationTrendRows.map((row) => [getString(row, "bucket"), row]));
  const points = buildAnalyticsBuckets(period, filters.bucket).map(({ key, label }) => {
    const visitor = visitorByBucket.get(key);
    const accounts = accountsByBucket.get(key);
    const notifications = notificationsByBucket.get(key);
    const uniqueVisitors = visitor ? getNumber(visitor, "uniqueVisitors") : 0;
    const firstTimeVisitors = visitor ? getNumber(visitor, "firstTimeVisitors") : 0;
    return {
      key,
      label,
      uniqueVisitors,
      pageViews: visitor ? getNumber(visitor, "pageViews") : 0,
      newAccounts: accounts ? getNumber(accounts, "newAccounts") : 0,
      firstTimeVisitors,
      returningVisitors: Math.max(0, uniqueVisitors - firstTimeVisitors),
      unknownCountryVisitors: visitor ? getNumber(visitor, "unknownCountryVisitors") : 0,
      notificationsSent: notifications ? getNumber(notifications, "sent") : 0,
      notificationsFailed: notifications ? getNumber(notifications, "failed") : 0,
      notificationsSkipped: notifications ? getNumber(notifications, "skipped") : 0,
    };
  });

  const countryMap = new Map<string, AdminHistoricalAnalytics["countries"][number]>();
  for (const row of previousCountryRows) {
    const countryCode = getString(row, "countryCode");
    countryMap.set(countryCode, {
      countryCode,
      countryName: getString(row, "countryName"),
      currentVisitors: 0,
      previousVisitors: getNumber(row, "visitors"),
      pageViews: 0,
      share: 0,
      lastSeenAt: null,
    });
  }
  for (const row of currentCountryRows) {
    const countryCode = getString(row, "countryCode");
    countryMap.set(countryCode, {
      countryCode,
      countryName: getString(row, "countryName"),
      currentVisitors: getNumber(row, "visitors"),
      previousVisitors: countryMap.get(countryCode)?.previousVisitors ?? 0,
      pageViews: getNumber(row, "pageViews"),
      share: current.uniqueVisitors > 0 ? getNumber(row, "visitors") / current.uniqueVisitors : 0,
      lastSeenAt: getNullableString(row, "lastSeenAt"),
    });
  }

  const collectionStartedAt = telemetryRow ? getNullableString(telemetryRow, "collectionStartedAt") : null;
  const legacyVisitorStartedAt = telemetryRow ? getNullableString(telemetryRow, "legacyVisitorStartedAt") : null;
  return {
    filters,
    period,
    points,
    current,
    previous,
    countries: [...countryMap.values()].sort(
      (left, right) => right.currentVisitors - left.currentVisitors || right.previousVisitors - left.previousVisitors || left.countryName.localeCompare(right.countryName),
    ),
    notificationHealth: {
      sent: currentNotificationRow ? getNumber(currentNotificationRow, "sent") : 0,
      failed: currentNotificationRow ? getNumber(currentNotificationRow, "failed") : 0,
      skipped: currentNotificationRow ? getNumber(currentNotificationRow, "skipped") : 0,
      previousSent: previousNotificationRow ? getNumber(previousNotificationRow, "sent") : 0,
      previousFailed: previousNotificationRow ? getNumber(previousNotificationRow, "failed") : 0,
      previousSkipped: previousNotificationRow ? getNumber(previousNotificationRow, "skipped") : 0,
      latestAt: telemetryRow ? getNullableString(telemetryRow, "latestNotificationAt") : null,
    },
    telemetry: {
      collectionStartedAt,
      latestActivityAt: telemetryRow ? getNullableString(telemetryRow, "latestActivityAt") : null,
      retainedDays: VISITOR_ANALYTICS_RETENTION_DAYS,
      hasPreUpgradeGap: Boolean(
        legacyVisitorStartedAt && (!collectionStartedAt || legacyVisitorStartedAt.slice(0, 10) < collectionStartedAt),
      ),
    },
  };
}

export async function recordNotificationDelivery(input: {
  purpose?: string;
  status: "sent" | "failed" | "not-configured";
  transportSource: "env" | "database" | "none";
  recipientCount: number;
}) {
  const createdAt = new Date().toISOString();
  await execute(
    `INSERT INTO notification_delivery_events (
       id, purpose, status, transportSource, recipientCount, createdAt
     ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      (input.purpose ?? "transactional").trim().slice(0, 60) || "transactional",
      input.status,
      input.transportSource,
      Math.max(0, Math.min(input.recipientCount, 100)),
      createdAt,
    ],
  );
  const cutoff = new Date(Date.now() - VISITOR_ANALYTICS_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await execute("DELETE FROM notification_delivery_events WHERE createdAt < ?", [cutoff]);
}

export async function listTaskIllustrations(): Promise<TaskIllustrationRecord[]> {
  return loadTaskIllustrations();
}

export async function upsertTaskIllustration(input: Omit<TaskIllustrationRecord, "updatedAt" | "updatedBy">, updatedBy: string | null) {
  const task = await findTaskById(input.taskId);
  if (!task) {
    throw new Error("Ken not found.");
  }
  const now = new Date().toISOString();
  await execute(
    `INSERT INTO task_illustrations (
      taskId, source, url, altText, mimeType, sizeBytes, width, height, storagePath, updatedAt, updatedBy
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(taskId) DO UPDATE SET
      source = excluded.source,
      url = excluded.url,
      altText = excluded.altText,
      mimeType = excluded.mimeType,
      sizeBytes = excluded.sizeBytes,
      width = excluded.width,
      height = excluded.height,
      storagePath = excluded.storagePath,
      updatedAt = excluded.updatedAt,
      updatedBy = excluded.updatedBy`,
    [
      input.taskId,
      input.source,
      input.url,
      input.altText.trim().slice(0, 240),
      input.mimeType,
      input.sizeBytes,
      input.width,
      input.height,
      input.storagePath,
      now,
      updatedBy,
    ],
  );
}

export async function removeTaskIllustration(taskId: string) {
  await execute("DELETE FROM task_illustrations WHERE taskId = ?", [taskId]);
}

export async function getSiteSetting(key: string): Promise<SiteSettingRecord | null> {
  const row = await loadOne("SELECT * FROM site_settings WHERE key = ? LIMIT 1", [key]);
  if (!row) return null;
  return {
    key: getString(row, "key"),
    value: getString(row, "value"),
    updatedAt: getString(row, "updatedAt"),
    updatedBy: getNullableString(row, "updatedBy"),
  };
}

export async function setSiteSetting(key: string, value: string, updatedBy: string | null) {
  const now = new Date().toISOString();
  const existing = await getSiteSetting(key);
  if (existing) {
    await execute("UPDATE site_settings SET value = ?, updatedAt = ?, updatedBy = ? WHERE key = ?", [value, now, updatedBy, key]);
  } else {
    await execute("INSERT INTO site_settings (key, value, updatedAt, updatedBy) VALUES (?, ?, ?, ?)", [key, value, now, updatedBy]);
  }
}

function isCapacityState(value: unknown): value is CapacityState {
  return value === "normal" || value === "constrained" || value === "new-launches-paused" || value === "critical-maintenance-only";
}

export async function getCapacityOverrideState(): Promise<CapacityOverrideState> {
  const record = await getSiteSetting("operations.capacity");
  if (!record) return DEFAULT_CAPACITY_OVERRIDE;
  try {
    const parsed = JSON.parse(record.value) as Partial<CapacityOverrideState>;
    const mode = parsed.mode === "manual" ? "manual" : "automatic";
    const manualState = isCapacityState(parsed.manualState) ? parsed.manualState : null;
    return {
      mode,
      manualState: mode === "manual" ? manualState : null,
      publicReason: typeof parsed.publicReason === "string" ? parsed.publicReason.trim().slice(0, 1000) : "",
      updatedAt: record.updatedAt,
      updatedBy: record.updatedBy,
    };
  } catch {
    return DEFAULT_CAPACITY_OVERRIDE;
  }
}

export async function setCapacityOverrideState(
  input: Pick<CapacityOverrideState, "mode" | "manualState" | "publicReason">,
  updatedBy: string | null,
) {
  const mode = input.mode === "manual" ? "manual" : "automatic";
  const manualState = mode === "manual" && isCapacityState(input.manualState) ? input.manualState : null;
  const publicReason = input.publicReason.trim().slice(0, 1000);
  if (mode === "manual" && (!manualState || publicReason.length < 20)) {
    throw new Error("Manual capacity restrictions require a state and a public reason of at least 20 characters.");
  }
  const payload: CapacityOverrideState = {
    mode,
    manualState,
    publicReason: mode === "manual" ? publicReason : "",
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  await setSiteSetting("operations.capacity", JSON.stringify(payload), updatedBy);
}

export async function getCapacityState(summary?: EconomicsSummary): Promise<CapacityStateResolution> {
  let economics = summary;
  if (!economics) {
    const [revenueStreams, treasuryEntries, sponsorshipCommitments] = await Promise.all([
      loadRevenueStreams(),
      loadTreasuryEntries(),
      loadSponsorshipCommitments(),
    ]);
    const monthlyPublicBurnUsd = treasuryEntries
      .filter((entry) => entry.bucket === "compute-treasury" && entry.direction === "outflow")
      .reduce((total, entry) => total + entry.amountUsd, 0);
    economics = summarizeEconomics(
      revenueStreams,
      treasuryEntries,
      sponsorshipCommitments,
      monthlyPublicBurnUsd,
      0,
      env.KENMATCH_TREASURY_TARGET_MONTHS,
    );
  }
  const automaticState = deriveAutomaticCapacityState(
    economics.coverageMonths,
    economics.coverageTargetMonths,
    economics.monthlyPublicBurnUsd,
  );
  return resolveCapacityState(automaticState, await getCapacityOverrideState());
}

const DEFAULT_MAINTENANCE_STATE: MaintenanceState = {
  mode: "off",
  message: "KenMatch is temporarily paused for maintenance. User data remains intact.",
  expectedReturn: "",
  updatedAt: new Date(0).toISOString(),
  updatedBy: null,
};

export async function getMaintenanceState(): Promise<MaintenanceState> {
  if (env.KENMATCH_MAINTENANCE_MODE === "on") {
    return {
      mode: "on",
      message: env.KENMATCH_MAINTENANCE_MESSAGE?.trim() || DEFAULT_MAINTENANCE_STATE.message,
      expectedReturn: env.KENMATCH_MAINTENANCE_EXPECTED_RETURN?.trim() || "",
      updatedAt: new Date().toISOString(),
      updatedBy: "environment",
    };
  }

  const record = await getSiteSetting("site.maintenance");
  if (!record) return DEFAULT_MAINTENANCE_STATE;
  try {
    const parsed = JSON.parse(record.value) as Partial<MaintenanceState>;
    return {
      mode: parsed.mode === "on" ? "on" : "off",
      message: typeof parsed.message === "string" && parsed.message.trim()
        ? parsed.message.slice(0, 600)
        : DEFAULT_MAINTENANCE_STATE.message,
      expectedReturn: typeof parsed.expectedReturn === "string" ? parsed.expectedReturn.slice(0, 160) : "",
      updatedAt: record.updatedAt,
      updatedBy: record.updatedBy,
    };
  } catch {
    return DEFAULT_MAINTENANCE_STATE;
  }
}

export async function setMaintenanceState(input: Pick<MaintenanceState, "mode" | "message" | "expectedReturn">, updatedBy: string | null) {
  const payload: MaintenanceState = {
    mode: input.mode === "on" ? "on" : "off",
    message: input.message.trim().slice(0, 600) || DEFAULT_MAINTENANCE_STATE.message,
    expectedReturn: input.expectedReturn.trim().slice(0, 160),
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  await setSiteSetting("site.maintenance", JSON.stringify(payload), updatedBy);
}

export async function publicWritesOpen() {
  const state = await getMaintenanceState();
  return state.mode !== "on";
}

export async function listChangelogEntries(includeHidden = false, limit = 50): Promise<ChangelogEntryRecord[]> {
  const rows = await loadRows(
    `SELECT * FROM changelog_entries
     ${includeHidden ? "" : "WHERE visible = 1"}
     ORDER BY entryDate DESC, createdAt DESC
     LIMIT ?`,
    [limit],
  );
  return rows.map((row) => ({
    id: getString(row, "id"),
    entryDate: getString(row, "entryDate"),
    title: getString(row, "title"),
    entryType: getString(row, "entryType") as ChangelogEntryRecord["entryType"],
    summary: getString(row, "summary"),
    details: getString(row, "details"),
    visible: getNumber(row, "visible") > 0,
    createdAt: getString(row, "createdAt"),
    updatedAt: getString(row, "updatedAt"),
    updatedBy: getNullableString(row, "updatedBy"),
  }));
}

export async function upsertChangelogEntry(
  input: Pick<ChangelogEntryRecord, "id" | "entryDate" | "title" | "entryType" | "summary" | "details" | "visible">,
  updatedBy: string | null,
) {
  const now = new Date().toISOString();
  const id = slugify(input.id || input.title) || randomUUID();
  await execute(
    `INSERT INTO changelog_entries (
      id, entryDate, title, entryType, summary, details, visible, createdAt, updatedAt, updatedBy
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      entryDate = excluded.entryDate,
      title = excluded.title,
      entryType = excluded.entryType,
      summary = excluded.summary,
      details = excluded.details,
      visible = excluded.visible,
      updatedAt = excluded.updatedAt,
      updatedBy = excluded.updatedBy`,
    [
      id,
      input.entryDate,
      input.title.trim().slice(0, 140),
      input.entryType,
      input.summary.trim().slice(0, 500),
      input.details.trim().slice(0, 4000),
      input.visible ? 1 : 0,
      now,
      now,
      updatedBy,
    ],
  );
}

function mapContactAttachment(row: DbRow): ContactAttachmentRecord {
  return {
    id: getString(row, "id"),
    submissionId: getString(row, "submissionId"),
    fileName: getString(row, "fileName"),
    mimeType: getString(row, "mimeType"),
    sizeBytes: getNumber(row, "sizeBytes"),
    contentBase64: getString(row, "contentBase64"),
    createdAt: getString(row, "createdAt"),
  };
}

function mapContactSubmission(row: DbRow): ContactSubmissionRecord {
  const emailStatus = getString(row, "emailStatus");
  return {
    id: getString(row, "id"),
    title: getString(row, "title"),
    topic: getString(row, "topic"),
    replyEmail: getString(row, "replyEmail"),
    bodyMarkdown: getString(row, "bodyMarkdown"),
    attachmentCount: getNumber(row, "attachmentCount"),
    emailStatus: emailStatus === "sent" || emailStatus === "failed" ? emailStatus : "not-configured",
    emailError: getNullableString(row, "emailError"),
    createdAt: getString(row, "createdAt"),
  };
}

export async function createContactSubmission(input: {
  title: string;
  topic: string;
  replyEmail: string;
  bodyMarkdown: string;
  attachments: Array<Pick<ContactAttachmentRecord, "fileName" | "mimeType" | "sizeBytes" | "contentBase64">>;
  emailStatus: ContactSubmissionRecord["emailStatus"];
  emailError?: string | null;
}) {
  const now = new Date().toISOString();
  const id = randomUUID();
  await batch(
    [
      {
        sql: `INSERT INTO contact_submissions (
          id, title, topic, replyEmail, bodyMarkdown, attachmentCount, emailStatus, emailError, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          input.title.trim().slice(0, 140),
          input.topic.trim().slice(0, 60),
          input.replyEmail.trim().toLowerCase().slice(0, 200),
          input.bodyMarkdown.trim().slice(0, 8000),
          input.attachments.length,
          input.emailStatus,
          input.emailError?.slice(0, 500) ?? null,
          now,
        ],
      },
      ...input.attachments.map((attachment) => ({
        sql: `INSERT INTO contact_attachments (
          id, submissionId, fileName, mimeType, sizeBytes, contentBase64, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          randomUUID(),
          id,
          attachment.fileName.slice(0, 180),
          attachment.mimeType.slice(0, 120),
          attachment.sizeBytes,
          attachment.contentBase64,
          now,
        ],
      })),
    ],
    "write",
  );
  return id;
}

export async function listContactSubmissions(limit = 100): Promise<ContactSubmissionRecord[]> {
  const rows = await loadRows(
    `SELECT id, title, topic, replyEmail, bodyMarkdown, attachmentCount, emailStatus, emailError, createdAt
     FROM contact_submissions ORDER BY createdAt DESC LIMIT ?`,
    [limit],
  );
  return rows.map(mapContactSubmission);
}

export async function getContactSubmission(id: string): Promise<ContactSubmissionRecord | null> {
  const row = await loadOne(
    `SELECT id, title, topic, replyEmail, bodyMarkdown, attachmentCount, emailStatus, emailError, createdAt
     FROM contact_submissions WHERE id = ? LIMIT 1`,
    [id],
  );
  if (!row) return null;
  const attachments = await loadRows(
    "SELECT * FROM contact_attachments WHERE submissionId = ? ORDER BY createdAt ASC",
    [id],
  );
  return { ...mapContactSubmission(row), attachments: attachments.map(mapContactAttachment) };
}

const DEFAULT_NOTIFICATION_SETTINGS: AdminNotificationSettings = {
  recipientEmails: notificationEmails,
  notifyOnSignup: true,
  notifyOnFirstVisit: true,
  notifyOnVerificationRequest: true,
  notifyOnProposal: true,
  notifyOnCategoryProposal: true,
  notifyOnReviewDecision: true,
  dailyDigest: false,
  updatedAt: new Date(0).toISOString(),
};

export async function getAdminNotificationSettings(): Promise<AdminNotificationSettings> {
  const record = await getSiteSetting("admin.notifications");
  if (!record) return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    const parsed = JSON.parse(record.value) as Partial<AdminNotificationSettings>;
    return {
      recipientEmails: Array.isArray(parsed.recipientEmails) && parsed.recipientEmails.length > 0
        ? parsed.recipientEmails
        : DEFAULT_NOTIFICATION_SETTINGS.recipientEmails,
      notifyOnSignup: parsed.notifyOnSignup ?? true,
      notifyOnFirstVisit: parsed.notifyOnFirstVisit ?? true,
      notifyOnVerificationRequest: parsed.notifyOnVerificationRequest ?? true,
      notifyOnProposal: parsed.notifyOnProposal ?? true,
      notifyOnCategoryProposal: parsed.notifyOnCategoryProposal ?? true,
      notifyOnReviewDecision: parsed.notifyOnReviewDecision ?? true,
      dailyDigest: parsed.dailyDigest ?? false,
      updatedAt: record.updatedAt,
    };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export async function setAdminNotificationSettings(settings: AdminNotificationSettings, updatedBy: string | null) {
  await setSiteSetting("admin.notifications", JSON.stringify(settings), updatedBy);
}

type StoredSmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  from: string;
  encryptedPassword: string | null;
  lastTestedAt: string | null;
  lastTestStatus: AdminSmtpSettings["lastTestStatus"];
  lastTestMessage: string | null;
  updatedAt: string;
};

const DEFAULT_SMTP_SETTINGS: AdminSmtpSettings = {
  host: "",
  port: 587,
  secure: false,
  username: "",
  from: env.KENMATCH_SMTP_FROM,
  passwordConfigured: false,
  source: "none",
  lastTestedAt: null,
  lastTestStatus: "untested",
  lastTestMessage: null,
  updatedAt: new Date(0).toISOString(),
};

function sanitizeSmtpMessage(message: string) {
  return message
    .replace(/pass(word)?=[^\s&]+/gi, "password=[redacted]")
    .replace(/AUTH\s+[A-Z0-9+/=._-]+/gi, "AUTH [redacted]")
    .slice(0, 500);
}

async function getStoredSmtpSettings(): Promise<StoredSmtpSettings | null> {
  const record = await getSiteSetting("admin.smtp");
  if (!record) return null;
  try {
    const parsed = JSON.parse(record.value) as Partial<StoredSmtpSettings>;
    return {
      host: typeof parsed.host === "string" ? parsed.host : "",
      port: Number.isInteger(parsed.port) ? Number(parsed.port) : 587,
      secure: parsed.secure === true,
      username: typeof parsed.username === "string" ? parsed.username : "",
      from: typeof parsed.from === "string" && parsed.from.trim() ? parsed.from : env.KENMATCH_SMTP_FROM,
      encryptedPassword: typeof parsed.encryptedPassword === "string" && parsed.encryptedPassword ? parsed.encryptedPassword : null,
      lastTestedAt: typeof parsed.lastTestedAt === "string" ? parsed.lastTestedAt : null,
      lastTestStatus: parsed.lastTestStatus === "success" || parsed.lastTestStatus === "error" ? parsed.lastTestStatus : "untested",
      lastTestMessage: typeof parsed.lastTestMessage === "string" ? sanitizeSmtpMessage(parsed.lastTestMessage) : null,
      updatedAt: record.updatedAt,
    };
  } catch {
    return null;
  }
}

export async function getAdminSmtpSettings(): Promise<AdminSmtpSettings> {
  if (smtpConfigured) {
    return {
      host: env.KENMATCH_SMTP_HOST ?? "",
      port: env.KENMATCH_SMTP_PORT ?? 587,
      secure: env.KENMATCH_SMTP_SECURE,
      username: env.KENMATCH_SMTP_USER ?? "",
      from: env.KENMATCH_SMTP_FROM,
      passwordConfigured: true,
      source: "env",
      lastTestedAt: null,
      lastTestStatus: "untested",
      lastTestMessage: "Environment SMTP is active and takes precedence over database settings.",
      updatedAt: new Date(0).toISOString(),
    };
  }

  const stored = await getStoredSmtpSettings();
  if (!stored) return DEFAULT_SMTP_SETTINGS;
  return {
    host: stored.host,
    port: stored.port,
    secure: stored.secure,
    username: stored.username,
    from: stored.from,
    passwordConfigured: Boolean(stored.encryptedPassword),
    source: stored.host && stored.encryptedPassword ? "database" : "none",
    lastTestedAt: stored.lastTestedAt,
    lastTestStatus: stored.lastTestStatus,
    lastTestMessage: stored.lastTestMessage,
    updatedAt: stored.updatedAt,
  };
}

export async function setAdminSmtpSettings(input: {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  from: string;
  password?: string;
  clearPassword?: boolean;
}, updatedBy: string | null) {
  if (smtpConfigured) {
    throw new Error("Environment SMTP is configured and has priority. Edit KENMATCH_SMTP_* values on the server instead.");
  }
  const existing = await getStoredSmtpSettings();
  let encryptedPassword = existing?.encryptedPassword ?? null;
  const password = input.password?.trim() ?? "";
  if (input.clearPassword) {
    encryptedPassword = null;
  } else if (password) {
    if (!configEncryptionAvailable()) {
      throw new Error("KENMATCH_CONFIG_ENCRYPTION_KEY is required before SMTP passwords can be stored.");
    }
    encryptedPassword = encryptConfigSecret(password);
  }
  const now = new Date().toISOString();
  const payload: StoredSmtpSettings = {
    host: input.host.trim().slice(0, 255),
    port: Math.min(65535, Math.max(1, Math.trunc(input.port))),
    secure: input.secure,
    username: input.username.trim().slice(0, 255),
    from: input.from.trim().slice(0, 255) || env.KENMATCH_SMTP_FROM,
    encryptedPassword,
    lastTestedAt: existing?.lastTestedAt ?? null,
    lastTestStatus: existing?.lastTestStatus ?? "untested",
    lastTestMessage: existing?.lastTestMessage ?? null,
    updatedAt: now,
  };
  await setSiteSetting("admin.smtp", JSON.stringify(payload), updatedBy);
}

export async function recordAdminSmtpTest(status: "success" | "error", message: string, updatedBy: string | null) {
  const existing = await getStoredSmtpSettings();
  const now = new Date().toISOString();
  const payload: StoredSmtpSettings = {
    host: existing?.host ?? "",
    port: existing?.port ?? 587,
    secure: existing?.secure ?? false,
    username: existing?.username ?? "",
    from: existing?.from ?? env.KENMATCH_SMTP_FROM,
    encryptedPassword: existing?.encryptedPassword ?? null,
    lastTestedAt: now,
    lastTestStatus: status,
    lastTestMessage: sanitizeSmtpMessage(message),
    updatedAt: now,
  };
  await setSiteSetting("admin.smtp", JSON.stringify(payload), updatedBy);
}

export async function getEffectiveSmtpConfig(): Promise<{
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from: string;
  source: "env" | "database";
} | null> {
  if (smtpConfigured) {
    return {
      host: env.KENMATCH_SMTP_HOST ?? "",
      port: env.KENMATCH_SMTP_PORT ?? 587,
      secure: env.KENMATCH_SMTP_SECURE,
      username: env.KENMATCH_SMTP_USER ?? "",
      password: env.KENMATCH_SMTP_PASS ?? "",
      from: env.KENMATCH_SMTP_FROM,
      source: "env",
    };
  }

  const stored = await getStoredSmtpSettings();
  if (!stored?.host || !stored.username || !stored.encryptedPassword) {
    return null;
  }
  return {
    host: stored.host,
    port: stored.port,
    secure: stored.secure,
    username: stored.username,
    password: decryptConfigSecret(stored.encryptedPassword),
    from: stored.from,
    source: "database",
  };
}

export async function getAboutPageContent(): Promise<AboutPageContent> {
  const record = await getSiteSetting("about.page");
  if (!record) return DEFAULT_ABOUT_PAGE;
  try {
    const parsed = JSON.parse(record.value) as AboutPageContent;
    return { ...DEFAULT_ABOUT_PAGE, ...parsed, lastUpdated: record.updatedAt };
  } catch {
    return DEFAULT_ABOUT_PAGE;
  }
}

export async function setAboutPageContent(content: AboutPageContent, updatedBy: string | null) {
  const payload = { ...content, lastUpdated: new Date().toISOString() };
  await setSiteSetting("about.page", JSON.stringify(payload), updatedBy);
}

export async function recordAudit(input: {
  accountId: string | null;
  action: string;
  detail: string;
  metadata?: Record<string, unknown> | null;
}) {
  await execute(
    "INSERT INTO audit_log (id, accountId, action, detail, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    [
      randomUUID(),
      input.accountId,
      input.action.slice(0, 80),
      input.detail,
      input.metadata ? JSON.stringify(input.metadata) : null,
      new Date().toISOString(),
    ],
  );
}

export async function listAuditLog(limit = 200): Promise<AuditLogRecord[]> {
  const rows = await loadRows(
    "SELECT id, accountId, action, detail, metadata, createdAt FROM audit_log ORDER BY createdAt DESC LIMIT ?",
    [limit],
  );
  return rows.map(mapAuditLogRecord);
}

function mapAuditLogRecord(row: DbRow): AuditLogRecord {
  return {
    id: getString(row, "id"),
    accountId: getNullableString(row, "accountId"),
    action: getString(row, "action"),
    detail: getString(row, "detail"),
    metadata: getNullableString(row, "metadata"),
    createdAt: getString(row, "createdAt"),
  };
}

export async function listAuditLogPage(input: {
  query?: string;
  action?: string;
  page?: number | string;
  pageSize?: number | string;
} = {}): Promise<AuditLogPage> {
  const requested = normalizeAuditLogFilters(input);
  const clauses: string[] = [];
  const args: Value[] = [];

  if (requested.action !== "all") {
    clauses.push("action = ?");
    args.push(requested.action);
  }
  if (requested.query) {
    const pattern = `%${escapeAuditLikePattern(requested.query.toLowerCase())}%`;
    clauses.push(
      "(LOWER(action) LIKE ? ESCAPE '!' OR LOWER(detail) LIKE ? ESCAPE '!' OR LOWER(COALESCE(metadata, '')) LIKE ? ESCAPE '!')",
    );
    args.push(pattern, pattern, pattern);
  }

  const where = clauses.length > 0 ? ` WHERE ${clauses.join(" AND ")}` : "";
  const [countRows, actionRows] = await Promise.all([
    loadRows(`SELECT COUNT(*) AS count FROM audit_log${where}`, args),
    loadRows("SELECT DISTINCT action FROM audit_log ORDER BY action ASC"),
  ]);
  const totalItems = getCount(countRows);
  const totalPages = Math.max(1, Math.ceil(totalItems / requested.pageSize));
  const page = Math.min(requested.page, totalPages);
  const rows = await loadRows(
    `SELECT id, accountId, action, detail, metadata, createdAt
     FROM audit_log${where} ORDER BY createdAt DESC, id DESC LIMIT ? OFFSET ?`,
    [...args, requested.pageSize, (page - 1) * requested.pageSize],
  );

  return {
    items: rows.map(mapAuditLogRecord),
    actions: actionRows.map((row) => getString(row, "action")).filter(Boolean),
    filters: { ...requested, page },
    page,
    pageSize: requested.pageSize,
    totalItems,
    totalPages,
  };
}

export async function getAdminDashboard() {
  const [
    accounts,
    profiles,
    pendingVerifications,
    visitors,
    visitorStats,
    countryAggregates,
    maintenance,
    changelog,
    smtp,
    illustrations,
    marketplace,
    capacity,
  ] = await Promise.all([
    loadAccounts(),
    loadProfiles(),
    loadRows("SELECT * FROM profiles WHERE verificationStatus = 'pending' ORDER BY verificationRequestedAt ASC").then((rows) => rows.map(mapProfile)),
    listVisitors(500),
    getVisitorStats(),
    aggregateVisitorsByCountry(),
    getMaintenanceState(),
    listChangelogEntries(true, 12),
    getAdminSmtpSettings(),
    listTaskIllustrations(),
    hydrate(null),
    getCapacityState(),
  ]);
  return {
    accounts,
    profiles,
    pendingVerifications,
    visitors,
    visitorStats,
    countryAggregates,
    maintenance,
    changelog,
    smtp,
    illustrations,
    tasks: marketplace.tasks,
    capacity,
    checkpoints: marketplace.tasks.flatMap((task) => marketplace.checkpointMap.get(task.id) ?? []),
    runDecisions: marketplace.tasks.flatMap((task) => marketplace.runDecisionsByTask.get(task.id) ?? [])
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
  };
}

export async function getProfilePageData(profileId: string, viewerProfileId?: string | null) {
  const [profile, snapshot, privateReviews] = await Promise.all([
    findProfileById(profileId),
    hydrate(viewerProfileId),
    viewerProfileId === profileId
      ? listMyReviewSubmissions(profileId)
      : Promise.resolve(null),
  ]);
  if (!profile) return null;
  const summary = snapshot.profiles.find((candidate) => candidate.id === profileId) ?? null;
  const ownTasks = snapshot.tasks.filter((task) => task.proposerId === profileId);
  const account = snapshot.accountByProfile.get(profileId);
  const bookmarkedTasks = await listBookmarks(profileId);
  return {
    profile,
    summary,
    ownTasks,
    bookmarkedTasks,
    accountSystemRole: account?.systemRole ?? "contributor",
    privateReviews,
  };
}

export async function searchIndex(viewerProfileId?: string | null): Promise<SearchResultItem[]> {
  const snapshot = await hydrate(viewerProfileId);
  const items: SearchResultItem[] = [];
  for (const task of snapshot.tasks) {
    items.push({
      id: task.id,
      type: "ken",
      title: task.title,
      subtitle: task.summary,
      url: `/kens/${task.slug}`,
      badge: task.categoryName,
    });
  }
  for (const profile of snapshot.profiles) {
    items.push({
      id: profile.id,
      type: "profile",
      title: publicProfileName(profile),
      subtitle: `@${profile.username} · ${profile.role} · ${profile.specialty}`,
      url: `/people/${profile.id}`,
      badge: profile.attestationLevel,
    });
  }
  for (const category of snapshot.categories) {
    items.push({
      id: category.id,
      type: "category",
      title: category.name,
      subtitle: category.description,
      url: `/kens?category=${category.slug}`,
    });
  }
  for (const lane of Object.values(laneVisuals)) {
    items.push({
      id: `lane-${lane.tier}`,
      type: "page",
      title: `${lane.label} lane`,
      subtitle: lane.description,
      url: `/kens?tier=${lane.tier}`,
      badge: "lane",
    });
  }
  for (const entry of FAQ_ENTRIES) {
    items.push({
      id: `faq-${entry.id}`,
      type: "page",
      title: entry.question,
      subtitle: entry.answer,
      url: `/faq#${entry.id}`,
      badge: "FAQ",
    });
  }
  for (const event of snapshot.governance.slice(0, 20)) {
    items.push({
      id: event.id,
      type: "governance",
      title: event.title,
      subtitle: event.outcome,
      url: event.taskId ? `/kens/${event.taskId}` : "/governance",
      badge: event.house,
    });
  }
  items.push(
    { id: "home", type: "page", title: "Home", subtitle: "Why, how, and today's proposals.", url: "/" },
    { id: "kens", type: "page", title: "Kens board", subtitle: "Browse and filter public Kens.", url: "/kens" },
    { id: "governance", type: "page", title: "Governance", subtitle: "Safety council and allocation chamber decisions.", url: "/governance" },
    { id: "economics", type: "page", title: "Economics", subtitle: "Treasury, revenue engines, sponsorship pools.", url: "/economics" },
    { id: "about", type: "page", title: "About / Contact", subtitle: "Creator, mission, and contact info.", url: "/about" },
    { id: "faq", type: "page", title: "FAQ", subtitle: "What Kens are and how KenMatch works.", url: "/faq" },
    { id: "reviews", type: "page", title: "Public review outcomes", subtitle: "Reason-coded Ken and category intake decisions.", url: "/reviews" },
    { id: "changelog", type: "page", title: "Changelog", subtitle: "Significant product, data, and operations updates.", url: "/about#changelog" },
  );
  return items;
}

async function ensureOwnerSystemRole(client: Client) {
  return client.execute({
    sql: "UPDATE accounts SET systemRole = 'owner' WHERE lower(email) = ? AND systemRole != 'owner'",
    args: [ownerEmail],
  });
}

async function ensureDefaultSiteSettings(client: Client) {
  const existing = await client.execute({
    sql: "SELECT key FROM site_settings WHERE key = ? LIMIT 1",
    args: ["about.page"],
  });
  if (existing.rows.length === 0) {
    await client.execute({
      sql: "INSERT INTO site_settings (key, value, updatedAt, updatedBy) VALUES (?, ?, ?, ?)",
      args: ["about.page", JSON.stringify(DEFAULT_ABOUT_PAGE), new Date().toISOString(), null],
    });
  }
}

export function getCanonicalOrigin() {
  return canonicalOrigin;
}

