#!/usr/bin/env bash
set -euo pipefail

SHA="${1:-$(git rev-parse origin/main)}"
URL="${PRODUCTION_URL:-https://procgen.onrender.com}"
DEADLINE=$((SECONDS + ${TIMEOUT_SECONDS:-900}))

while :; do
  LIVE="$(curl -sf "$URL/api/health" | sed -n 's/.*"commit":"\([0-9a-f]*\)".*/\1/p' || true)"
  if [ "$LIVE" = "$SHA" ]; then
    echo "production is serving $SHA"
    exit 0
  fi
  if [ "$SECONDS" -ge "$DEADLINE" ]; then
    echo "production is serving ${LIVE:-unknown}, not $SHA" >&2
    exit 1
  fi
  echo "production is serving ${LIVE:-unknown}; waiting for $SHA"
  sleep 15
done
