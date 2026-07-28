export const REVIEW_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS ken_submissions (
    id TEXT PRIMARY KEY,
    taskId TEXT NOT NULL UNIQUE,
    proposerProfileId TEXT NOT NULL,
    requestedTier TEXT NOT NULL,
    estimatedTier TEXT NOT NULL,
    intakeStatus TEXT NOT NULL DEFAULT 'pending',
    intakeResultJson TEXT NOT NULL DEFAULT '{}',
    reviewNote TEXT,
    internalReviewNote TEXT,
    assigneeAccountId TEXT,
    mergedTaskId TEXT,
    firstApprovalBy TEXT,
    submittedAt TEXT NOT NULL,
    assignedAt TEXT,
    reviewedAt TEXT,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (taskId) REFERENCES tasks(id),
    FOREIGN KEY (proposerProfileId) REFERENCES profiles(id)
  )`,
  `CREATE TABLE IF NOT EXISTS review_events (
    id TEXT PRIMARY KEY,
    dedupeKey TEXT NOT NULL UNIQUE,
    entityType TEXT NOT NULL,
    entityId TEXT NOT NULL,
    action TEXT NOT NULL,
    fromStatus TEXT,
    toStatus TEXT,
    actorAccountId TEXT,
    publicNote TEXT,
    internalNote TEXT,
    metadataJson TEXT,
    isPublic INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS idx_ken_submissions_status ON ken_submissions(intakeStatus, updatedAt)",
  "CREATE INDEX IF NOT EXISTS idx_ken_submissions_proposer ON ken_submissions(proposerProfileId, updatedAt)",
  "CREATE INDEX IF NOT EXISTS idx_ken_submissions_assignee ON ken_submissions(assigneeAccountId, intakeStatus, updatedAt)",
  "CREATE INDEX IF NOT EXISTS idx_review_events_entity ON review_events(entityType, entityId, createdAt)",
  "CREATE INDEX IF NOT EXISTS idx_review_events_public ON review_events(isPublic, createdAt)",
] as const;

export const INSERT_REVIEW_EVENT_SQL = `INSERT INTO review_events (
  id, dedupeKey, entityType, entityId, action, fromStatus, toStatus, actorAccountId,
  publicNote, internalNote, metadataJson, isPublic, createdAt
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(dedupeKey) DO NOTHING`;

export const INSERT_APPROVED_CATEGORY_SQL = `INSERT INTO categories (
  id, slug, name, description, thesis, symbolKey
) VALUES (?, ?, ?, ?, ?, ?)`;
