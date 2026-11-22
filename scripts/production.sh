#!/usr/bin/env bash
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
env_file=${OPENNOTE_ENV_FILE:-"$root/.env.production"}
if [[ ! -f "$env_file" ]]; then
  echo 'Mangler produksjonsfil. Se deploy/production.env.example og docs/deployment.md.' >&2
  exit 1
fi
# Compose parses this file as data; never source secrets as shell code.
exec docker compose --project-name "${OPENNOTE_PROJECT:-opennote}" \
  --env-file "$env_file" -f "$root/compose.production.yaml" "$@"
