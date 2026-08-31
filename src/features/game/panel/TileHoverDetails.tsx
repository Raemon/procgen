import { useCallback, useSyncExternalStore } from 'react';
import type { AppRuntime } from '@/features/app-shell/runtime/appRuntime';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { hoveredTileLines } from '../hover/hoveredTileLines';
import { hoveredTileReport, type AgentEyes } from '../hover/hoveredTileReport';

export function TileHoverDetails() {
  const runtime = useAppRuntime();
  const lines = useSyncExternalStore(
    useCallback((onChange) => subscribeToTheHoveredTile(runtime, onChange), [runtime]),
    useCallback(() => linesForTheHoveredTile(runtime), [runtime]),
  );
  if (lines === '') return null;
  return (
    <div className="max-w-[26rem] rounded bg-black/70 px-2 py-1 font-mono text-[11px] text-ink">
      {lines.split('\n').map((line, index) => (
        <div key={index}>{line}</div>
      ))}
    </div>
  );
}

function linesForTheHoveredTile(runtime: AppRuntime): string {
  const cell = runtime.hoveredTile.current();
  if (!cell) return '';
  return hoveredTileLines(hoveredTileReport(whatTheAgentWouldSee(runtime), cell)).join('\n');
}

function whatTheAgentWouldSee(runtime: AppRuntime): AgentEyes {
  const { world } = runtime;
  return {
    sampler: runtime.sampler,
    tileAssets: runtime.tileAssets,
    overlay: runtime.agentOverlay,
    pose: { x: world.playerX, y: world.playerY, facing: world.facing },
    mode: runtime.playerMode(),
    vision: {
      sightRadiusTiles: world.sightRadiusTiles,
      godViewSizeTiles: world.godViewSizeTiles,
    },
  };
}

function subscribeToTheHoveredTile(runtime: AppRuntime, onChange: () => void): () => void {
  const stopFollowingTheWorld = runtime.renderers.add({
    redraw: onChange,
    recenterOnPlayer: onChange,
  });
  const stopFollowingThePointer = runtime.hoveredTile.subscribe(onChange);
  return () => {
    stopFollowingTheWorld();
    stopFollowingThePointer();
  };
}
