import { bandScore, reading, weightedMean, type MetricReading } from './bandScore';
import { READING_BANDS } from './readingBands';
import type { WalkingSimMeasurements } from './walkingSimMeasurements';

export interface WalkingSimScore {
  overall: number;
  readings: MetricReading[];
}

const CELLS_SEEN_FOR_A_REAL_WALK = 900;
const CELLS_SEEN_FOR_A_WHOLE_WORLD = 6000;
const SEALED_POCKET_SCORE_FLOOR = 0.25;
const ROUNDEDNESS_FLOOR = 0.6;

export function walkingSimFunScore(m: WalkingSimMeasurements): WalkingSimScore {
  const readings = READING_BANDS.map((band) =>
    reading(
      band.name,
      Number(m[band.key]),
      band.weight,
      bandScore(Number(m[band.key]), band.lo, band.hi, band.falloff),
    ),
  );
  const rounded = weightedMean(readings) * weakestReadingFactor(readings);
  return { overall: penaltyFor(m) * rounded, readings };
}

function weakestReadingFactor(readings: readonly MetricReading[]): number {
  const weakest = Math.min(...readings.map((each) => each.score));
  return ROUNDEDNESS_FLOOR + (1 - ROUNDEDNESS_FLOOR) * weakest;
}

function penaltyFor(m: WalkingSimMeasurements): number {
  return shortWalkPenalty(m.cellsSeen) * sealedPocketPenalty(m);
}

function shortWalkPenalty(cellsSeen: number): number {
  return Math.min(1, cellsSeen / CELLS_SEEN_FOR_A_REAL_WALK);
}

function sealedPocketPenalty(m: WalkingSimMeasurements): number {
  if (!m.exhaustedRegion) return 1;
  const credit = m.cellsSeen / CELLS_SEEN_FOR_A_WHOLE_WORLD;
  return Math.min(1, Math.max(SEALED_POCKET_SCORE_FLOOR, credit));
}

export function scoreSummaryLine(score: WalkingSimScore): string {
  return score.readings.map((each) => `${each.name} ${each.value.toFixed(2)}`).join('  ');
}
