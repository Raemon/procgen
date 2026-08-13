#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if ! ls /usr/lib/postgresql/*/bin/pg_ctl >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql postgresql-client
fi

npm ci
npx prisma generate

if [ ! -f "$REPO_ROOT/.env" ]; then
  cat > "$REPO_ROOT/.env" <<'ENV'
DATABASE_URL="postgresql://postgres@127.0.0.1:5432/procgen"
SERVER_SECRET="procgen-local-dev-secret"
PORT=1111
ENV
fi

bash "$REPO_ROOT/.cursor/start.sh"

PG_CTL="$(ls -1 /usr/lib/postgresql/*/bin/pg_ctl | sort -V | tail -n1)"
PGBIN="$(dirname "$PG_CTL")"

npm run docs:seed

"$PGBIN/psql" -h 127.0.0.1 -p 5432 -U postgres -d procgen -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO "ProcgenDoc" (name, json, "updatedAt")
VALUES ('uiState', '{}'::jsonb, now()), ('worldThumbnails', '{}'::jsonb, now())
ON CONFLICT (name) DO NOTHING;
SQL
