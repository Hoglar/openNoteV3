#!/usr/bin/env bash
set -euo pipefail
umask 077
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
backup_dir=${1:-"$root/.local/backups"}
mkdir -p -- "$backup_dir"
chmod 700 -- "$backup_dir"
backup_dir=$(cd -- "$backup_dir" && pwd)
temporary=$(mktemp "$backup_dir/opennote-$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX.partial")
trap 'rm -f -- "$temporary"' EXIT
bash "$root/scripts/production.sh" exec -T db sh -c \
  'PGPASSWORD="$APP_DB_PASSWORD" pg_dump -h 127.0.0.1 -U opennote -d opennote --format=custom --no-owner --no-privileges' > "$temporary"
# This verifies the archive format. restore-check.sh verifies actual restoration.
bash "$root/scripts/production.sh" exec -T db pg_restore --list < "$temporary" > /dev/null
final=${temporary%.partial}.dump
mv -- "$temporary" "$final"
printf '%s\n' "$final"
