import type { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { mulberry32 } from '../random/mulberry32';
import type { WorldSampler } from '../worldSampler';
import {
  characterCountsOverCells,
  sharesOfCounts,
  type ShareTally,
} from './metrics/sceneryShares';
import { opaqueProbeFrom } from './sightBlocking';
import { spawnWithRoomToWalk } from './spawnCell';
import { tileCharacterProbe } from './tileCharacter';
import { walkAsTourist, type TouristLimits, type TouristTrace } from './touristWalk';
import { walkingSimFunScore, type WalkingSimScore } from './walkingSimFunScore';
import {
  walkingSimMeasurements,
  type SceneryProbes,
  type WalkingSimMeasurements,
} from './walkingSimMeasurements';
import { cachedTileIdProbe, walkableProbeFrom } from './worldProbes';

export interface WalkingSimResult {
  trace: TouristTrace;
  measurements: WalkingSimMeasurements;
  score: WalkingSimScore;
  seenCharacterShares: ShareTally;
}

export function measureWalkingSimFun(
  sampler: WorldSampler,
  tileAssets: TileAssets,
  limits: TouristLimits,
  walkSeed: number,
): WalkingSimResult | null {
  const probes = sceneryProbesOf(sampler, tileAssets);
  const spawn = spawnWithRoomToWalk(probes.isWalkableAt);
  if (!spawn) return null;
  const isOpaqueAt = opaqueProbeFrom(probes.tileIdAt, tileAssets);
  const trace = walkAsTourist(probes.isWalkableAt, isOpaqueAt, spawn, limits, mulberry32(walkSeed));
  return resultOfTrace(trace, probes, limits);
}

function sceneryProbesOf(sampler: WorldSampler, tileAssets: TileAssets): SceneryProbes {
  const tileIdAt = cachedTileIdProbe(sampler);
  return {
    tileIdAt,
    isWalkableAt: walkableProbeFrom(tileIdAt, tileAssets),
    characterOf: tileCharacterProbe(tileAssets),
  };
}

function resultOfTrace(
  trace: TouristTrace,
  probes: SceneryProbes,
  limits: TouristLimits,
): WalkingSimResult {
  const measurements = walkingSimMeasurements(trace, probes, limits);
  return {
    trace,
    measurements,
    score: walkingSimFunScore(measurements),
    seenCharacterShares: seenSharesOf(trace, probes),
  };
}

function seenSharesOf(trace: TouristTrace, probes: SceneryProbes): ShareTally {
  return sharesOfCounts(
    characterCountsOverCells(trace.seen, probes.tileIdAt, probes.characterOf),
  );
}
