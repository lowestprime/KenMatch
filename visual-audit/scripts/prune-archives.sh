#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "run this command from the KenMatch repository" >&2
  exit 2
}
export VISUAL_AUDIT_ROOT=${VISUAL_AUDIT_ROOT:-"$REPO_ROOT/visual-audits"}
export VISUAL_AUDIT_RETENTION_DAYS=${VISUAL_AUDIT_RETENTION_DAYS:-90}
node "$SCRIPT_DIR/prune-archives.mjs"
