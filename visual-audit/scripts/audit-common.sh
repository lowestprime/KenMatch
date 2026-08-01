#!/bin/sh
set -eu

fail() {
  echo "visual-audit: $*" >&2
  exit 2
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "required command is unavailable: $1"
}

resolve_repo_root() {
  git rev-parse --show-toplevel 2>/dev/null || fail "run this command from the KenMatch repository"
}

assert_immutable_checkout() {
  repo_root=$1
  requested=${TARGET_COMMIT_SHA:-HEAD}
  resolved=$(git -C "$repo_root" rev-parse "${requested}^{commit}") || fail "TARGET_COMMIT_SHA is not a commit"
  head=$(git -C "$repo_root" rev-parse HEAD)
  [ "$resolved" = "$head" ] || fail "TARGET_COMMIT_SHA must equal the checked-out commit"
  git -C "$repo_root" diff --quiet || fail "tracked working-tree changes must be committed before a formal archive"
  git -C "$repo_root" diff --cached --quiet || fail "staged changes must be committed before a formal archive"
  [ -z "$(git -C "$repo_root" status --porcelain=v1 --untracked-files=all)" ] \
    || fail "formal archive requires a clean exact candidate commit"
  printf '%s\n' "$resolved"
}

assert_run_id() {
  printf '%s' "$1" | grep -Eq '^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$' \
    || fail "AUDIT_RUN_ID contains unsupported characters"
}

absolute_directory() {
  directory=$1
  mkdir -p "$directory"
  (cd "$directory" && pwd -P)
}

read_secret() {
  file=$1
  [ -f "$file" ] && [ -s "$file" ] || fail "secret file is missing or empty: $file"
  tr -d '\r\n' < "$file"
}

set_identity_environment() {
  repo_root=$1
  run_id=$2
  state_dir=$3
  tmp_dir=$4
  target_sha=$5

  export AUDIT_RUN_ID="$run_id"
  export AUDIT_STATE_DIR="$state_dir"
  export AUDIT_TMP_DIR="$tmp_dir"
  export TARGET_COMMIT_SHA="$target_sha"
  export KENMATCH_AUDIT_TOKEN
  export KENMATCH_TEST_AUTH_BYPASS_TOKEN
  export KENMATCH_VISITOR_HASH_SALT
  KENMATCH_AUDIT_TOKEN=$(read_secret "$state_dir/audit-token")
  KENMATCH_TEST_AUTH_BYPASS_TOKEN=$(read_secret "$state_dir/test-auth-token")
  KENMATCH_VISITOR_HASH_SALT=$(read_secret "$state_dir/visitor-salt")
  export AUDIT_UID=${AUDIT_UID:-$(id -u 2>/dev/null || printf '1000')}
  export AUDIT_GID=${AUDIT_GID:-$(id -g 2>/dev/null || printf '1000')}
  export AUDIT_SCOPE=${AUDIT_SCOPE:-full}
  export AUDIT_RESUME=${AUDIT_RESUME:-true}
  export VISUAL_AUDIT_CAPTURE_WORKERS=${VISUAL_AUDIT_CAPTURE_WORKERS:-1}
  export AUDIT_OUTPUT_DIR=${AUDIT_OUTPUT_DIR:-$repo_root/visual-audits}
  export RUN_OUTPUT_ROOT="$AUDIT_OUTPUT_DIR"
  export APPROVED_BASELINE_ROOT=${APPROVED_BASELINE_ROOT:-}
  export COMPOSE_PROJECT_NAME="kenmatch-audit-$(printf '%s' "$run_id" | tr '[:upper:]_' '[:lower:]-' | cut -c1-42)"

  case "${APPROVED_BASELINE_RUN_ID:-}" in
    "") ;;
    *[!A-Za-z0-9._-]*) fail "APPROVED_BASELINE_RUN_ID contains unsupported characters" ;;
    *) export APPROVED_BASELINE_ROOT="/audit-output/$APPROVED_BASELINE_RUN_ID" ;;
  esac
}

compose_quiet_check() {
  compose_file=$1
  docker compose -f "$compose_file" config --quiet
}

runner_step() {
  compose_file=$1
  script=$2
  docker compose -f "$compose_file" run --rm --no-deps audit-runner "$script"
}

print_review_next_step() {
  repo_root=$1
  run_id=$2
  state_dir=$3
  echo "Private report ready: $repo_root/visual-audits/$run_id/report/index.html"
  echo "Review anonymous captures, then record an explicit selection:"
  echo "node visual-audit/scripts/review-shareable.mjs --run-root \"$repo_root/visual-audits/$run_id\" --state-file \"$state_dir/shareable-approval.json\" --list"
  echo "After approval, run visual-audit/scripts/finalize-archive.sh $run_id"
}
