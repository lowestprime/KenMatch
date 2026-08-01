#!/bin/sh
set -eu

STATE_DIR=${1:-}
if [ -z "$STATE_DIR" ]; then
  echo "usage: prepare-secrets.sh <absolute-state-directory>" >&2
  exit 2
fi
case "$STATE_DIR" in
  /*) ;;
  *) echo "state directory must be absolute" >&2; exit 2 ;;
esac

umask 077
mkdir -p "$STATE_DIR"
chmod 700 "$STATE_DIR"

random_hex() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
  fi
}

if [ ! -s "$STATE_DIR/audit-token" ]; then
  random_hex > "$STATE_DIR/audit-token"
fi
if [ ! -s "$STATE_DIR/test-auth-token" ]; then
  random_hex > "$STATE_DIR/test-auth-token"
fi
if [ ! -s "$STATE_DIR/visitor-salt" ]; then
  random_hex > "$STATE_DIR/visitor-salt"
fi
if [ -n "${KENMATCH_AUDIT_ADMIN_PASSWORD:-}" ]; then
  printf '%s' "$KENMATCH_AUDIT_ADMIN_PASSWORD" > "$STATE_DIR/admin-password"
fi

chmod 600 "$STATE_DIR"/*
echo "Prepared restricted audit secret files in $STATE_DIR (values not printed)."
