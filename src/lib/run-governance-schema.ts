export const RUN_DECISION_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS run_decision_events (
    id TEXT PRIMARY KEY,
    taskId TEXT NOT NULL,
    checkpointId TEXT,
    eventType TEXT NOT NULL,
    decisionCode TEXT NOT NULL,
    publicReason TEXT NOT NULL,
    artifactLabel TEXT,
    artifactUrl TEXT,
    artifactDigest TEXT,
    actorAccountId TEXT,
    actorRole TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (taskId) REFERENCES tasks(id),
    FOREIGN KEY (checkpointId) REFERENCES checkpoints(id),
    FOREIGN KEY (actorAccountId) REFERENCES accounts(id)
  )`,
  "CREATE INDEX IF NOT EXISTS idx_run_decision_events_task_activity ON run_decision_events(taskId, createdAt)",
  "CREATE INDEX IF NOT EXISTS idx_run_decision_events_checkpoint ON run_decision_events(checkpointId, createdAt)",
] as const;

export const INSERT_RUN_DECISION_SQL = `INSERT INTO run_decision_events (
  id, taskId, checkpointId, eventType, decisionCode, publicReason,
  artifactLabel, artifactUrl, artifactDigest, actorAccountId, actorRole, createdAt
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
