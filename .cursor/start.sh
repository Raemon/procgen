#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PG_CTL="$(ls -1 /usr/lib/postgresql/*/bin/pg_ctl | sort -V | tail -n1)"
PGBIN="$(dirname "$PG_CTL")"
export PGDATA="$HOME/.local/pgdata"
DB_NAME="procgen"
export DATABASE_URL="postgresql://postgres@127.0.0.1:5432/${DB_NAME}"

mkdir -p "$HOME/.local"
if [ ! -f "$PGDATA/PG_VERSION" ]; then
  "$PGBIN/initdb" -D "$PGDATA" -U postgres --auth=trust --encoding=UTF8 >/dev/null
fi

if ! "$PGBIN/pg_isready" -h 127.0.0.1 -p 5432 -q; then
  rm -f "$PGDATA/postmaster.pid"
  "$PGBIN/pg_ctl" -D "$PGDATA" -w -l "$HOME/.local/pg.log" \
    -o "-p 5432 -c listen_addresses=127.0.0.1 -c unix_socket_directories=/tmp" start
fi

for _ in $(seq 1 60); do
  "$PGBIN/pg_isready" -h 127.0.0.1 -p 5432 -q && break
  sleep 0.5
done

"$PGBIN/psql" -h 127.0.0.1 -p 5432 -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
  || "$PGBIN/psql" -h 127.0.0.1 -p 5432 -U postgres -c "CREATE DATABASE ${DB_NAME}"

npx prisma db push --skip-generate
