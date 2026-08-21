#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
. "$SCRIPT_DIR/audit-common.sh"

require_command docker
require_command git

REPO_ROOT=$(resolve_repo_root)
TARGET_SHA=$(assert_immutable_checkout "$REPO_ROOT")
RUN_ID=${AUDIT_RUN_ID:-"$(date -u +%Y%m%dT%H%M%SZ)-live-${TARGET_SHA%${TARGET_SHA#????????????}}"}
assert_run_id "$RUN_ID"
STATE_DIR=$(absolute_directory "${AUDIT_STATE_DIR:-$REPO_ROOT/visual-audit/.state/$RUN_ID}")
TMP_DIR=$(absolute_directory "$STATE_DIR/tmp")
COMPOSE_FILE="$REPO_ROOT/docker-compose.visual-audit-live.yml"

[ -s "$STATE_DIR/audit-token" ] || fail "live audit requires the deployed audit token in $STATE_DIR/audit-token"
[ -s "$STATE_DIR/admin-password" ] || fail "live audit requires $STATE_DIR/admin-password"
[ -n "${KENMATCH_ADMIN_EMAIL:-}" ] || fail "KENMATCH_ADMIN_EMAIL is required"
if [ ! -s "$STATE_DIR/test-auth-token" ]; then
  umask 077
  printf 'live-unused\n' > "$STATE_DIR/test-auth-token"
fi
if [ ! -s "$STATE_DIR/visitor-salt" ]; then
  umask 077
  printf 'live-unused\n' > "$STATE_DIR/visitor-salt"
fi

export AUDIT_EVIDENCE_TIER=tier-3-live-production
export AUDIT_DATA_PROVENANCE=production-live
export AUDIT_LIVE_BASE_URL=${AUDIT_LIVE_BASE_URL:-https://kmat.ch}
export AUDIT_SHAREABLE_APPROVAL_FILE="$STATE_DIR/shareable-approval.json"
set_identity_environment "$REPO_ROOT" "$RUN_ID" "$STATE_DIR" "$TMP_DIR" "$TARGET_SHA"

compose_quiet_check "$COMPOSE_FILE"
docker compose -f "$COMPOSE_FILE" build audit-runner
runner_step "$COMPOSE_FILE" dist/run.js
runner_step "$COMPOSE_FILE" dist/compare.js
runner_step "$COMPOSE_FILE" dist/report.js
if [ -s "$AUDIT_SHAREABLE_APPROVAL_FILE" ]; then
  runner_step "$COMPOSE_FILE" dist/validate.js
  echo "Validated live read-only archive: $REPO_ROOT/visual-audits/$RUN_ID"
else
  print_review_next_step "$REPO_ROOT" "$RUN_ID" "$STATE_DIR"
  exit 3
fi
