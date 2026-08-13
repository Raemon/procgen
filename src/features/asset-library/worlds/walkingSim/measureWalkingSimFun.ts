import type { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import type { CellPoint } from '@/features/game/nearestWalkable';
import { mulberry32 } from '../random/mulberry32';
import type { WorldSampler } from '../worldSampler';
import { cellCharacterProbe } from './cellCharacter';
import type { ShareTally } from './metrics/sceneryShares';
import { nearbySpawnsProbe } from './nearbySpawnsProbe';
import { opaqueProbeFrom } from './sightBlocking';
import { spawnsWithRoomToWalk } from './spawnCell';
import { walkAsTourist, type TouristLimits, type TouristTrace } from './touristWalk';
import { walkingSimFunScore, type WalkingSimScore } from './walkingSimFunScore';
import {
  measuredWalk,
  type MeasuredWalk,
  type WalkingSimMeasurements,
  type WalkProbes,
} from './walkingSimMeasurements';
import { cachedTileIdProbe, walkableProbeFrom } from './worldProbes';

export const WALKS_PER_WORLD = 2;

export interface WalkingSimResult {
  trace: TouristTrace;
  measurements: WalkingSimMeasurements;
  score: WalkingSimScore;
  seenCharacterShares: ShareTally;
  walksTaken: number;
}

export function measureWalkingSimFun(
  sampler: WorldSampler,
  tileAssets: TileAssets,
  limits: TouristLimits,
  walkSeed: number,
): WalkingSimResult | null {
  const probes = walkProbesOf(sampler, tileAssets);
  const spawnSearchEndsAt = Date.now() + limits.patienceMs;
  const spawns = spawnsWithRoomToWalk(probes.isWalkableAt, WALKS_PER_WORLD, spawnSearchEndsAt);
  if (spawns.length === 0) return null;
  const walks = spawns.map((spawn, leg) => oneWalk(spawn, probes, limits, walkSeed + leg));
  return pooledResult(walks);
}

function walkProbesOf(sampler: WorldSampler, tileAssets: TileAssets): WalkProbes {
  const tileIdAt = cachedTileIdProbe(sampler);
  return {
    isWalkableAt: walkableProbeFrom(tileIdAt, tileAssets),
    isOpaqueAt: opaqueProbeFrom(tileIdAt, tileAssets),
    characterAt: cellCharacterProbe(sampler, tileIdAt, tileAssets),
    spawnsNear: nearbySpawnsProbe(sampler),
  };
}

interface Walk extends MeasuredWalk {
  trace: TouristTrace;
}

function oneWalk(
  spawn: CellPoint,
  probes: WalkProbes,
  limits: TouristLimits,
  walkSeed: number,
): Walk {
  const trace = walkAsTourist(
    probes.isWalkableAt,
    probes.isOpaqueAt,
    probes.spawnsNear,
    spawn,
    limits,
    mulberry32(walkSeed),
  );
  return { trace, ...measuredWalk(trace, probes, limits) };
}

function pooledResult(walks: readonly Walk[]): WalkingSimResult {
  const measurements = meanMeasurementsOf(walks.map((walk) => walk.measurements));
  return {
    trace: walks[0]!.trace,
    measurements,
    score: walkingSimFunScore(measurements),
    seenCharacterShares: pooledShares(walks),
    walksTaken: walks.length,
  };
}

function meanMeasurementsOf(all: readonly WalkingSimMeasurements[]): WalkingSimMeasurements {
  const pooled = { ...all[0]! };
  for (const name of Object.keys(pooled) as Array<keyof WalkingSimMeasurements>) {
    poolField(pooled, all, name);
  }
  return pooled;
}

function poolField(
  pooled: WalkingSimMeasurements,
  all: readonly WalkingSimMeasurements[],
  name: keyof WalkingSimMeasurements,
): void {
  const values = all.map((each) => each[name]);
  if (typeof values[0] === 'boolean') {
    (pooled[name] as boolean) = values.every((value) => value === true);
    return;
  }
  (pooled[name] as number) = values.reduce<number>((sum, value) => sum + Number(value), 0) / values.length;
}

function pooledShares(walks: readonly Walk[]): ShareTally {
  const seenTotal = walks.reduce((sum, walk) => sum + walk.trace.seen.size, 0);
  const pooled: ShareTally = new Map();
  for (const walk of walks) {
    absorbShares(pooled, walk, seenTotal);
  }
  return pooled;
}

function absorbShares(pooled: ShareTally, walk: Walk, seenTotal: number): void {
  const weight = seenTotal === 0 ? 0 : walk.trace.seen.size / seenTotal;
  for (const [character, share] of walk.seenCharacterShares) {
    pooled.set(character, (pooled.get(character) ?? 0) + share * weight);
  }
}
