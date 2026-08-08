import { checkIfWorldObviouslyBroken, type BrokenWorldVerdict } from './checkIfWorldObviouslyBroken';
import { rateHowWellItRewardsExploring, weightedMean } from './rateHowWellItRewardsExploring';
import type { MetricReading, WorldMeasurements } from './worldMeasurements';

export interface WorldScore {
  overall: number;
  readings: MetricReading[];
  broken: BrokenWorldVerdict;
}

export function scoreWorld(m: WorldMeasurements): WorldScore {
  const broken = checkIfWorldObviouslyBroken(m);
  const readings = rateHowWellItRewardsExploring(m);
  return { overall: broken.habitability * weightedMean(readings), readings, broken };
}
