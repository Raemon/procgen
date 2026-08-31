import type { ItemSource } from '@/features/asset-library/items/itemAssets';
import { TakenItemSpawns } from '@/features/asset-library/items/pickups/takenItemSpawns';
import type { CultureSource } from '@/features/asset-library/worlds/assembly/cultureSource';
import type { PieceSource } from '@/features/asset-library/worlds/assembly/pieceSource';
import { PipelineEvaluator } from '@/features/asset-library/worlds/eval/evaluator';
import { clonedState } from '@/features/asset-library/worlds/randomize/clonedState';
import type { NodeInstance, PipelineState } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import { climbGateFrom } from '../climbing';
import { isWalkableTile } from '../tileWalkability';
import { World } from '../world';

export interface SeedWorldAssets {
  tileAssets: ReadOnlyTileAssets;
  pieces: PieceSource;
  items: ItemSource;
  cultures: CultureSource;
}

export interface SeedWorld {
  seed: number;
  store: PipelineStore;
  evaluator: PipelineEvaluator;
  sampler: WorldSampler;
  spawnX: number;
  spawnY: number;
  syncPipeline(pipeline: PipelineState): void;
}

export function growSeedWorld(
  pipeline: PipelineState,
  seed: number,
  assets: SeedWorldAssets,
): SeedWorld {
  const store = new PipelineStore(clonedState({ ...pipeline, seed }));
  const evaluator = new PipelineEvaluator(store);
  const sampler = new WorldSampler(
    store,
    evaluator,
    assets.tileAssets,
    assets.pieces,
    assets.items,
    new TakenItemSpawns(),
    assets.cultures,
  );
  const landing = landingOf(sampler, assets.tileAssets);
  const grown: SeedWorld = {
    seed,
    store,
    evaluator,
    sampler,
    spawnX: landing.x,
    spawnY: landing.y,
    syncPipeline(next) {
      store.replaceAll(clonedState({ ...next, seed: store.seed() }));
      const settled = landingOf(sampler, assets.tileAssets);
      grown.spawnX = settled.x;
      grown.spawnY = settled.y;
    },
  };
  return grown;
}

export function runningPipelineOf(store: {
  seed(): number;
  daylight(): number;
  time(): number;
  nodes(): readonly NodeInstance[];
}): PipelineState {
  return clonedState({
    seed: store.seed(),
    daylight: store.daylight(),
    time: store.time(),
    nodes: [...store.nodes()],
  });
}

function landingOf(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
): { x: number; y: number } {
  const world = new World(
    (x, y) => isWalkableTile(tileAssets, sampler.tileAt(x, y)),
    undefined,
    climbGateFrom((x, y) => sampler.elevationAt(x, y)),
  );
  world.ensurePlayerOnWalkableGround();
  return { x: world.playerX, y: world.playerY };
}
