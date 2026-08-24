import { meanOf } from '../walkingSim/metrics/meanOf';
import { fingerprintDistance } from './worldFingerprint';
import { funOf, type ScoredWorldSeed } from './scoreGenome';

export interface BatchScore {
  meanFun: number;
  bestFun: number;
  diversity: number;
  nearDuplicatePairs: number;
  overall: number;
}

export const DIVERSITY_THAT_IS_PLENTY = 0.25;
export const NEAR_DUPLICATE_DISTANCE = 0.05;

export function batchScore(batch: readonly ScoredWorldSeed[]): BatchScore {
  const funs = batch.map(funOf);
  const diversity = meanOf(nearestNeighbourDistancesOf(batch));
  return {
    meanFun: meanOf(funs),
    bestFun: Math.max(0, ...funs),
    diversity,
    nearDuplicatePairs: nearDuplicatePairsOf(batch),
    overall: meanOf(funs) * diversityFactorOf(diversity),
  };
}

export function nearestNeighbourDistancesOf(batch: readonly ScoredWorldSeed[]): number[] {
  if (batch.length < 2) return [];
  return batch.map((world, at) => nearestDistanceTo(world, batch, at));
}

function nearestDistanceTo(
  world: ScoredWorldSeed,
  batch: readonly ScoredWorldSeed[],
  at: number,
): number {
  const others = batch.filter((_other, index) => index !== at);
  return Math.min(
    ...others.map((other) => fingerprintDistance(world.fingerprint, other.fingerprint)),
  );
}

function nearDuplicatePairsOf(batch: readonly ScoredWorldSeed[]): number {
  let pairs = 0;
  for (let first = 0; first < batch.length; first++) {
    for (let second = first + 1; second < batch.length; second++) {
      const gap = fingerprintDistance(batch[first]!.fingerprint, batch[second]!.fingerprint);
      if (gap < NEAR_DUPLICATE_DISTANCE) pairs++;
    }
  }
  return pairs;
}

function diversityFactorOf(diversity: number): number {
  return 0.5 + 0.5 * Math.min(1, diversity / DIVERSITY_THAT_IS_PLENTY);
}
