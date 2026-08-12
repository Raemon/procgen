import { measureWalkingSimFun } from '../walkingSim/measureWalkingSimFun';
import type { TouristLimits } from '../walkingSim/touristWalk';
import type { WalkingSimScore } from '../walkingSim/walkingSimFunScore';
import type { WalkingSimMeasurements } from '../walkingSim/walkingSimMeasurements';
import { worldOfGenome } from './genomeWorld';
import { fingerprintOf, type WorldFingerprint } from './worldFingerprint';
import type { WorldGenome } from './worldGenome';

export interface ScoredWorld {
  genome: WorldGenome;
  paletteName: string;
  measurements: WalkingSimMeasurements;
  score: WalkingSimScore;
  fingerprint: WorldFingerprint;
}

export function scoredGenome(
  genome: WorldGenome,
  limits: TouristLimits,
  walkSeed: number,
): ScoredWorld | null {
  const world = worldOfGenome(genome);
  const walked = measureWalkingSimFun(world.sampler, world.tileAssets, limits, walkSeed);
  if (!walked) return null;
  return {
    genome,
    paletteName: world.palette.name,
    measurements: walked.measurements,
    score: walked.score,
    fingerprint: fingerprintOf(walked.measurements, walked.seenCharacterShares),
  };
}

export function funOf(world: ScoredWorld): number {
  return world.score.overall;
}
