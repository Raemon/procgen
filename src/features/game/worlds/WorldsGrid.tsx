import { useEffect, useMemo, useReducer, useState } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { familySeeds, pipelineStructureKey } from './seedFamily';
import { runningPipelineOf } from './seedWorld';
import { WorldSeedCell } from './WorldSeedCell';
import type { WorldsCamera } from './worldsCamera';

export function WorldsGrid({
  columns,
  rows,
  zoom,
  camera,
}: {
  columns: number;
  rows: number;
  zoom: number;
  camera: WorldsCamera;
}) {
  const runtime = useAppRuntime();
  const revision = usePipelineRevision();
  const origin = useFamilyOrigin();
  const pipeline = useMemo(() => runningPipelineOf(runtime.store), [revision, runtime.store]);
  const assets = useMemo(
    () => ({
      tileAssets: runtime.tileAssets,
      pieces: runtime.pieces,
      items: runtime.items,
      cultures: runtime.cultures,
    }),
    [runtime.tileAssets, runtime.pieces, runtime.items, runtime.cultures],
  );
  const seeds = familySeeds(origin, columns * rows);
  return (
    <div
      className="grid h-full min-h-0 gap-1"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {seeds.map((seed) => (
        <WorldSeedCell
          key={seed}
          seed={seed}
          selected={seed === runtime.store.seed()}
          camera={camera}
          zoom={zoom}
          pipeline={pipeline}
          assets={assets}
          onSelect={() => runtime.perform('set_seed', { seed })}
        />
      ))}
    </div>
  );
}

function usePipelineRevision(): number {
  const { subscribeToWorldChange } = useAppRuntime();
  const [revision, bump] = useReducer((count: number) => count + 1, 0);
  useEffect(() => subscribeToWorldChange(bump), [subscribeToWorldChange]);
  return revision;
}

function useFamilyOrigin(): number {
  const { store } = useAppRuntime();
  const structureKey = pipelineStructureKey(store);
  const [origin, setOrigin] = useState(() => store.seed());
  useEffect(() => {
    setOrigin(store.seed());
  }, [structureKey, store]);
  return origin;
}
