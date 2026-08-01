#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
. "$SCRIPT_DIR/audit-common.sh"

require_command docker
require_command git
require_command node

REPO_ROOT=$(resolve_repo_root)
TARGET_SHA=$(assert_immutable_checkout "$REPO_ROOT")
TIER=${AUDIT_EVIDENCE_TIER:-tier-1-synthetic}
case "$TIER" in
  tier-1-synthetic) AUDIT_DATA_PROVENANCE=synthetic-fixture ;;
  tier-2-production-clone) AUDIT_DATA_PROVENANCE=production-clone ;;
  *) fail "snapshot lab supports only tier-1-synthetic or tier-2-production-clone" ;;
esac
export AUDIT_EVIDENCE_TIER="$TIER" AUDIT_DATA_PROVENANCE

DEFAULT_RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)-${TIER#tier-}-${TARGET_SHA%${TARGET_SHA#????????????}}"
RUN_ID=${AUDIT_RUN_ID:-$DEFAULT_RUN_ID}
assert_run_id "$RUN_ID"
STATE_DIR=$(absolute_directory "${AUDIT_STATE_DIR:-$REPO_ROOT/visual-audit/.state/$RUN_ID}")
TMP_DIR=$(absolute_directory "$STATE_DIR/tmp")
LAB_ROOT="$STATE_DIR/lab"
COMPOSE_FILE="$REPO_ROOT/docker-compose.visual-audit-lab.yml"

"$SCRIPT_DIR/prepare-secrets.sh" "$STATE_DIR"
set_identity_environment "$REPO_ROOT" "$RUN_ID" "$STATE_DIR" "$TMP_DIR" "$TARGET_SHA"
export AUDIT_LAB_ROOT="$LAB_ROOT"
export AUDIT_LAB_DATA_DIR="$LAB_ROOT/data"
export AUDIT_SHAREABLE_APPROVAL_FILE="$STATE_DIR/shareable-approval.json"
export AUDIT_SNAPSHOT_EVIDENCE_FILE="$STATE_DIR/snapshot-evidence.json"

if [ "$AUDIT_DATA_PROVENANCE" = "production-clone" ]; then
  [ -n "${AUDIT_SOURCE_DATABASE:-}" ] || fail "tier-2 requires AUDIT_SOURCE_DATABASE"
  case "$AUDIT_SOURCE_DATABASE" in
    /*) ;;
    *) fail "AUDIT_SOURCE_DATABASE must be absolute" ;;
  esac
  export AUDIT_SOURCE_DATABASE
else
  unset AUDIT_SOURCE_DATABASE 2>/dev/null || true
fi

REPO_ROOT="$REPO_ROOT" AUDIT_LAB_ROOT="$LAB_ROOT" AUDIT_STATE_DIR="$STATE_DIR" \
  AUDIT_DATA_PROVENANCE="$AUDIT_DATA_PROVENANCE" AUDIT_SOURCE_DATABASE="${AUDIT_SOURCE_DATABASE:-}" \
  node "$SCRIPT_DIR/prepare-snapshot.mjs"

app_started=false
snapshot_finalized=false
cleanup() {
  if [ "$app_started" = "true" ]; then
    docker compose -f "$COMPOSE_FILE" down --remove-orphans >/dev/null 2>&1 || true
  fi
  if [ "$snapshot_finalized" != "true" ] && [ -f "$AUDIT_SNAPSHOT_EVIDENCE_FILE" ]; then
    AUDIT_SNAPSHOT_EVIDENCE_FILE="$AUDIT_SNAPSHOT_EVIDENCE_FILE" \
      AUDIT_RUN_MANIFEST_FILE="$REPO_ROOT/visual-audits/$RUN_ID/manifest.json" \
      node "$SCRIPT_DIR/finalize-snapshot.mjs" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT HUP INT TERM

compose_quiet_check "$COMPOSE_FILE"
docker compose -f "$COMPOSE_FILE" build kenmatch-audit-app audit-runner
docker compose -f "$COMPOSE_FILE" up -d --wait kenmatch-audit-app
app_started=true
runner_step "$COMPOSE_FILE" dist/run.js
docker compose -f "$COMPOSE_FILE" down --remove-orphans
app_started=false

AUDIT_SNAPSHOT_EVIDENCE_FILE="$AUDIT_SNAPSHOT_EVIDENCE_FILE" \
  AUDIT_RUN_MANIFEST_FILE="$REPO_ROOT/visual-audits/$RUN_ID/manifest.json" \
  node "$SCRIPT_DIR/finalize-snapshot.mjs"
snapshot_finalized=true

runner_step "$COMPOSE_FILE" dist/compare.js
runner_step "$COMPOSE_FILE" dist/report.js
if [ -s "$AUDIT_SHAREABLE_APPROVAL_FILE" ]; then
  runner_step "$COMPOSE_FILE" dist/validate.js
  echo "Validated snapshot archive: $REPO_ROOT/visual-audits/$RUN_ID"
else
  print_review_next_step "$REPO_ROOT" "$RUN_ID" "$STATE_DIR"
  exit 3
fi
