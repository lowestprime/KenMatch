#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
. "$SCRIPT_DIR/audit-common.sh"

require_command docker
require_command git
require_command node

RUN_ID=${1:-}
[ -n "$RUN_ID" ] || fail "usage: finalize-archive.sh <run-id>"
assert_run_id "$RUN_ID"
REPO_ROOT=$(resolve_repo_root)
RUN_ROOT="$REPO_ROOT/visual-audits/$RUN_ID"
MANIFEST_FILE="$RUN_ROOT/manifest.json"
[ -f "$MANIFEST_FILE" ] || fail "run manifest is missing: $MANIFEST_FILE"
TARGET_SHA=$(node -e "const m=require(process.argv[1]); process.stdout.write(m.expectedCommit || '')" "$MANIFEST_FILE")
TIER=$(node -e "const m=require(process.argv[1]); process.stdout.write(m.evidenceTier || '')" "$MANIFEST_FILE")
PROVENANCE=$(node -e "const m=require(process.argv[1]); process.stdout.write(m.dataProvenance || '')" "$MANIFEST_FILE")
STATE_DIR=$(absolute_directory "${AUDIT_STATE_DIR:-$REPO_ROOT/visual-audit/.state/$RUN_ID}")
TMP_DIR=$(absolute_directory "$STATE_DIR/tmp")
APPROVAL_FILE="$STATE_DIR/shareable-approval.json"
[ -s "$APPROVAL_FILE" ] || fail "review approval is missing: $APPROVAL_FILE"

export AUDIT_EVIDENCE_TIER="$TIER"
export AUDIT_DATA_PROVENANCE="$PROVENANCE"
export AUDIT_SHAREABLE_APPROVAL_FILE="$APPROVAL_FILE"
set_identity_environment "$REPO_ROOT" "$RUN_ID" "$STATE_DIR" "$TMP_DIR" "$TARGET_SHA"

case "$TIER" in
  tier-1-synthetic|tier-2-production-clone)
    COMPOSE_FILE="$REPO_ROOT/docker-compose.visual-audit-lab.yml"
    export AUDIT_LAB_DATA_DIR="$STATE_DIR/lab/data"
    export AUDIT_SNAPSHOT_EVIDENCE_FILE="$STATE_DIR/snapshot-evidence.json"
    ;;
  tier-3-live-production)
    COMPOSE_FILE="$REPO_ROOT/docker-compose.visual-audit-live.yml"
    export AUDIT_LIVE_BASE_URL=$(node -e "const m=require(process.argv[1]); process.stdout.write(m.baseUrl || '')" "$MANIFEST_FILE")
    [ -n "${KENMATCH_ADMIN_EMAIL:-}" ] || fail "KENMATCH_ADMIN_EMAIL is required to load the live audit configuration"
    ;;
  *) fail "unsupported evidence tier in manifest: $TIER" ;;
esac

compose_quiet_check "$COMPOSE_FILE"
docker compose -f "$COMPOSE_FILE" build audit-runner
runner_step "$COMPOSE_FILE" dist/report.js
runner_step "$COMPOSE_FILE" dist/validate.js
echo "Validated archive: $RUN_ROOT"
