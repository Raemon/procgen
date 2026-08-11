#!/usr/bin/env bash
set -euo pipefail

toolName=${1-}
if [ -z "$toolName" ]; then
  echo "runTool.sh needs a script name, as in: bash scripts/runTool.sh probeChunkDrawLoad" >&2
  exit 64
fi

scriptDirectory=$(cd "$(dirname "$0")" && pwd)
scriptPath="$scriptDirectory/$toolName.ts"
if [ ! -f "$scriptPath" ]; then
  echo "runTool.sh found no script named $toolName: there is no file at $scriptPath" >&2
  exit 66
fi

repoRoot=$(cd "$scriptDirectory/.." && pwd)
esbuildPath="$repoRoot/node_modules/.bin/esbuild"
if [ ! -x "$esbuildPath" ]; then
  echo "runTool.sh found no esbuild at $esbuildPath: run npm install first" >&2
  exit 69
fi

cd "$repoRoot"
"$esbuildPath" "$scriptPath" --bundle --format=esm --platform=node --log-level=error | node --input-type=module
