#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${1:-/Users/komatubarayukino/Documents/Codex/backups/nurse-shift-manager/latest}"

mkdir -p "$BACKUP_DIR"

# Keep the backup focused on recoverable source files. Generated dependencies,
# build output, deployment metadata, and local secrets are recreated or must
# never be copied to a backup destination.
rsync -a \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude '.next/' \
  --exclude '.wrangler/' \
  --exclude '.supabase/' \
  --exclude '.vercel/' \
  --exclude '.env' \
  --include '.env.example' \
  --exclude '.env.*' \
  --exclude '*.log' \
  "$PROJECT_DIR/" "$BACKUP_DIR/"

COMMIT="$(git -C "$PROJECT_DIR" rev-parse --short HEAD 2>/dev/null || printf '%s' 'no-git-commit')"
BRANCH="$(git -C "$PROJECT_DIR" branch --show-current 2>/dev/null || printf '%s' 'unknown')"

{
  printf 'backup_time=%s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  printf 'source=%s\n' "$PROJECT_DIR"
  printf 'branch=%s\n' "$BRANCH"
  printf 'commit=%s\n' "$COMMIT"
} > "$BACKUP_DIR/BACKUP-METADATA.txt"

test -f "$BACKUP_DIR/package.json"
test -d "$BACKUP_DIR/src"

printf 'Backup completed: %s (commit %s)\n' "$BACKUP_DIR" "$COMMIT"
