#!/usr/bin/env bash
set -euo pipefail
# Runs once on an empty PostgreSQL volume. Values go through psql quoting.
psql --username "$POSTGRES_USER" --dbname opennote --set ON_ERROR_STOP=1 <<'SQL'
\getenv app_password APP_DB_PASSWORD
CREATE ROLE opennote LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD :'app_password';
ALTER DATABASE opennote OWNER TO opennote;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO opennote;
SQL
