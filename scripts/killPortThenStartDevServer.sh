#!/usr/bin/env bash
set -euo pipefail

PORT=1111

STALE_PIDS=$(lsof -ti tcp:"$PORT" || true)
if [ -n "$STALE_PIDS" ]; then
  echo "Killing existing process on port $PORT: $STALE_PIDS"
  kill $STALE_PIDS 2>/dev/null || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    sleep 0.2
    [ -z "$(lsof -ti tcp:"$PORT" || true)" ] && break
  done
  REMAINING=$(lsof -ti tcp:"$PORT" || true)
  [ -n "$REMAINING" ] && kill -9 $REMAINING 2>/dev/null || true
fi

exec npx vite --port "$PORT" --strictPort "$@"
