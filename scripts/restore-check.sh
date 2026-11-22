#!/usr/bin/env bash
set -euo pipefail
if [[ $# != 1 || ! -f "$1" ]]; then
  echo 'Bruk: bash scripts/restore-check.sh /sti/til/backup.dump' >&2
  exit 1
fi
container_id=''
cleanup() {
  if [[ -n "$container_id" ]]; then
    docker rm --force --volumes "$container_id" > /dev/null
  fi
}
trap cleanup EXIT
# Fresh anonymous volume; no network or published ports. Never restores over the app DB.
container_id=$(docker run --detach --rm --network none \
  --env POSTGRES_HOST_AUTH_METHOD=trust --env POSTGRES_DB=restore \
  postgres:17.11-bookworm)
ready=false
for ((attempt=0; attempt<60; attempt++)); do
  if docker exec "$container_id" pg_isready -h 127.0.0.1 -U postgres -d restore > /dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 1
done
if [[ "$ready" != true ]]; then
  echo 'Testdatabasen ble ikke klar.' >&2
  exit 1
fi
docker exec -i "$container_id" pg_restore --username postgres --dbname restore \
  --exit-on-error --single-transaction --no-owner --no-privileges < "$1"
docker exec "$container_id" psql -U postgres -d restore --set ON_ERROR_STOP=1 \
  --command 'SELECT count(*) AS migrations FROM django_migrations; SELECT count(*) AS notes FROM notes_note; SELECT count(*) AS stars FROM easywork_star;'
echo 'Gjenoppretting bestod i en separat, midlertidig database.'
