#!/usr/bin/env bash
set -euo pipefail

DEV_SERVER_PORT=1111

kill_port() {
  local port=$1
  local stale_pids
  stale_pids=$(lsof -ti tcp:"$port" || true)
  [ -z "$stale_pids" ] && return 0
  echo "Killing existing process on port $port: $stale_pids"
  kill $stale_pids 2>/dev/null || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    sleep 0.2
    [ -z "$(lsof -ti tcp:"$port" || true)" ] && break
  done
  local remaining
  remaining=$(lsof -ti tcp:"$port" || true)
  [ -n "$remaining" ] && kill -9 $remaining 2>/dev/null || true
}

kill_port "$DEV_SERVER_PORT"
PORT="$DEV_SERVER_PORT" NODE_ENV=development exec npx tsx watch --env-file-if-exists=.env server.ts "$@"
