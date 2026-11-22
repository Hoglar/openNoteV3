#!/usr/bin/env bash
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
compose() { bash "$root/scripts/production.sh" "$@"; }
# Refuse missing config/images before interrupting the running version.
compose config --quiet
while IFS= read -r image; do
  docker image inspect "$image" > /dev/null
done < <(compose config --images)
compose run --rm --no-deps backend python manage.py check --deploy --fail-level WARNING
compose stop web backend
echo 'Appen er stoppet. Ved feil forblir den stoppet; se docs/deployment.md.'
compose up -d --wait db
backup=$(bash "$root/scripts/backup.sh")
printf 'Backup før migrasjoner: %s\n' "$backup"
compose run --rm --no-deps backend python manage.py migrate --noinput
compose up -d --no-build --wait backend web
echo 'Containere startet. Kontroller HTTPS, innlogging og innhold fra nettleseren.'
