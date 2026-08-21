import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

interface FormalRun {
  run_id: string;
  tier: string;
  scope: string;
  candidate_sha: string;
  capture_count: number;
  expected_capture_count: number;
  unexpected_serious_diagnostic_count: number;
  successful_unsafe_request_count: number;
  reports_pdf_validation: string;
  shareable_review: string;
  status: string;
  plan_digest: string;
  checksums_file_sha256: string;
}

interface ReleaseEvidence {
  schema_version: number;
  release_candidate_sha: string;
  immutable_failed_evidence: {
    run_id: string;
    candidate_sha: string;
    status: string;
    completed_at: null;
    manifest_capture_count: number;
    converged_capture_count: number;
    missing_capture_keys: string[];
  };
  capture_benchmark: {
    status: string;
    selected_workers: number;
  };
  gpu_evaluation: {
    status: string;
  };
  formal_runs: FormalRun[];
  deployment: {
    deployed_sha: string;
    app_health: string;
    app_restart_count: number;
    app_oom_killed: boolean;
    audit_token_present: boolean;
    test_auth_token_present: boolean;
  };
  ephemeral_live_audit_cleanup: {
    residual_rows: number;
    database_quick_check: string;
  };
}

interface LedgerEntry {
  id: string;
  status: string;
  source_backlinks: unknown[];
  current_code_evidence: string[];
  current_test_evidence: string[];
  current_live_evidence: string[];
  commits: string[];
  disposition: {
    rationale: string;
    evidence: string[];
  };
}

interface CompletionLedger {
  release_evidence: ReleaseEvidence;
  summary: {
    unresolved_applicable_requirements: number;
    status_counts: Record<string, number>;
  };
  requirements: LedgerEntry[];
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf8")) as T;
}

const releaseEvidence = readJson<ReleaseEvidence>("../docs/release-evidence.json");
const ledger = readJson<CompletionLedger>("../docs/kenmatch-completion-ledger.json");

test("release evidence binds the exact deployed candidate to every formal archive", () => {
  assert.equal(releaseEvidence.schema_version, 1);
  assert.match(releaseEvidence.release_candidate_sha, /^[a-f0-9]{40}$/);
  assert.equal(releaseEvidence.deployment.deployed_sha, releaseEvidence.release_candidate_sha);
  assert.equal(releaseEvidence.capture_benchmark.status, "PASS");
  assert.equal(releaseEvidence.capture_benchmark.selected_workers, 4);
  assert.equal(releaseEvidence.gpu_evaluation.status, "SOFTWARE_RETAINED");

  const expectedRuns = new Map([
    ["tier-1-synthetic:smoke", 78],
    ["tier-1-synthetic:full", 1225],
    ["tier-2-production-clone:full", 1245],
    ["tier-3-live-production:smoke", 78],
    ["tier-3-live-production:full", 1191],
  ]);
  assert.equal(releaseEvidence.formal_runs.length, expectedRuns.size);
  for (const run of releaseEvidence.formal_runs) {
    const key = `${run.tier}:${run.scope}`;
    assert.equal(run.candidate_sha, releaseEvidence.release_candidate_sha, run.run_id);
    assert.equal(run.capture_count, expectedRuns.get(key), run.run_id);
    assert.equal(run.capture_count, run.expected_capture_count, run.run_id);
    assert.equal(run.unexpected_serious_diagnostic_count, 0, run.run_id);
    assert.equal(run.successful_unsafe_request_count, 0, run.run_id);
    assert.equal(run.reports_pdf_validation, "PASS", run.run_id);
    assert.equal(run.shareable_review, "PASS", run.run_id);
    assert.equal(run.status, "PASS", run.run_id);
    assert.match(run.plan_digest, /^[a-f0-9]{64}$/, run.run_id);
    assert.match(run.checksums_file_sha256, /^[a-f0-9]{64}$/, run.run_id);
    expectedRuns.delete(key);
  }
  assert.equal(expectedRuns.size, 0);

  assert.equal(releaseEvidence.deployment.app_health, "healthy");
  assert.equal(releaseEvidence.deployment.app_restart_count, 0);
  assert.equal(releaseEvidence.deployment.app_oom_killed, false);
  assert.equal(releaseEvidence.deployment.audit_token_present, false);
  assert.equal(releaseEvidence.deployment.test_auth_token_present, false);
  assert.equal(releaseEvidence.ephemeral_live_audit_cleanup.residual_rows, 0);
  assert.equal(releaseEvidence.ephemeral_live_audit_cleanup.database_quick_check, "ok");
});

test("completion ledger has no unresolved applicable requirements", () => {
  const allowedStatuses = new Set(["DONE", "NOT_APPLICABLE", "SUPERSEDED"]);
  assert.equal(ledger.requirements.length, 495);
  assert.equal(ledger.summary.status_counts.BLOCKED ?? 0, 0);
  assert.deepEqual(ledger.summary.status_counts, {
    DONE: 445,
    SUPERSEDED: 29,
    NOT_APPLICABLE: 21,
  });
  assert.equal(ledger.summary.unresolved_applicable_requirements, 0);
  assert.equal(ledger.release_evidence.release_candidate_sha, releaseEvidence.release_candidate_sha);

  for (const entry of ledger.requirements) {
    assert.ok(allowedStatuses.has(entry.status), `${entry.id}: ${entry.status}`);
    assert.ok(entry.source_backlinks.length > 0, `${entry.id}: source backlinks`);
    assert.ok(entry.disposition.rationale.length > 20, `${entry.id}: disposition rationale`);
    assert.ok(entry.disposition.evidence.length > 0, `${entry.id}: disposition evidence`);

    if (entry.status !== "DONE") continue;
    assert.ok(entry.commits.includes(releaseEvidence.release_candidate_sha), `${entry.id}: candidate commit`);
    assert.ok(entry.current_code_evidence.length > 0, `${entry.id}: code evidence`);
    assert.ok(entry.current_test_evidence.length > 0, `${entry.id}: test evidence`);
    assert.ok(entry.current_live_evidence.length > 0, `${entry.id}: live evidence`);
  }
});

test("the incomplete historical archive remains immutable failed evidence", () => {
  const failed = releaseEvidence.immutable_failed_evidence;
  assert.equal(failed.run_id, "20260801T080604Z-tier1-full-bfece455a0f0");
  assert.equal(failed.candidate_sha, "bfece455a0f02122f7cd665332de125874a0b6d8");
  assert.equal(failed.status, "PRESERVED_FAILED");
  assert.equal(failed.completed_at, null);
  assert.equal(failed.manifest_capture_count, 1259);
  assert.equal(failed.converged_capture_count, 1261);
  assert.deepEqual(failed.missing_capture_keys, [
    "user--submit-category-proposal-validation-oled-desktop-1440",
    "user--submit-ken-proposal-validation-oled-desktop-1440",
  ]);
});
