#!/usr/bin/env bash
set -euo pipefail

toolName=${1-}
if [ -z "$toolName" ]; then
  echo "runTool.sh needs a tool name, as in: bash tools/runTool.sh probeChunkDrawLoad" >&2
  exit 64
fi

toolDirectory=$(dirname "$0")
toolPath="$toolDirectory/$toolName.ts"
if [ ! -f "$toolPath" ]; then
  echo "runTool.sh found no tool named $toolName: there is no file at $toolPath" >&2
  exit 66
fi

esbuild "$toolPath" --bundle --format=esm --platform=node --log-level=error | node --input-type=module
