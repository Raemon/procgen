import type { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { climbGateFrom } from '@/features/game/climbing';
import type { CellPoint } from '@/features/game/nearestWalkable';
import { walkableLandingSpot } from '@/features/game/world';
import { PipelineEvaluator } from '../eval/evaluator';
import type { PipelineState } from '../pipeline/pipelineState';
import { PipelineStore } from '../pipeline/pipelineStore';
import type { CultureSource, PieceSource } from '../structureOverlay/structureOverlay';
import { walkableCellsFrom } from '../walkingSim/spawnCell';
import {
  cachedElevationProbe,
  cachedTileIdProbe,
  stepProbeFrom,
  walkableProbeFrom,
} from '../walkingSim/worldProbes';
import { WorldSampler } from '../worldSampler';

export const PLAYABLE_PACES = 100;
const MOST_ROLLS = 16;
const ROLL_PATIENCE_MS = 2500;

export interface WorldAssetSources {
  tileAssets: TileAssets;
  pieces: PieceSource;
  cultures: CultureSource;
}

export function spawnPacesOf(
  state: PipelineState,
  assets: WorldAssetSources,
  pose: CellPoint,
): number {
  const store = new PipelineStore(state);
  const sampler = new WorldSampler(
    store,
    new PipelineEvaluator(store),
    assets.tileAssets,
    assets.pieces,
    undefined,
    undefined,
    assets.cultures,
  );
  const isWalkableAt = walkableProbeFrom(cachedTileIdProbe(sampler), assets.tileAssets);
  const elevationAt = cachedElevationProbe(sampler);
  const spot = walkableLandingSpot(pose.x, pose.y, isWalkableAt, climbGateFrom(elevationAt));
  if (!spot) return 0;
  return walkableCellsFrom(spot, stepProbeFrom(isWalkableAt, elevationAt), PLAYABLE_PACES);
}

export interface PlayableRoll {
  state: PipelineState;
  seed: number;
  paces: number;
  rolls: number;
}

export function rolledUntilPlayable(
  rollWithSeed: (seed: number) => PipelineState,
  pacesOf: (state: PipelineState) => number,
  nextSeed: () => number,
): PlayableRoll {
  const patienceEndsAt = Date.now() + ROLL_PATIENCE_MS;
  let best: Omit<PlayableRoll, 'rolls'> | null = null;
  let rolls = 0;
  for (let attempt = 1; attempt <= MOST_ROLLS; attempt++) {
    rolls = attempt;
    const seed = nextSeed() >>> 0;
    const state = rollWithSeed(seed);
    const paces = pacesOf(state);
    if (!best || paces > best.paces) best = { state, seed, paces };
    if (best.paces >= PLAYABLE_PACES || Date.now() > patienceEndsAt) break;
  }
  return { ...best!, rolls };
}
