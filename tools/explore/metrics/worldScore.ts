export interface WorldMeasurements {
  uniqueCells: number;
  regionExhausted: boolean;
  mobility: number;
  deadEndRatio: number;
  encountersPer100Cells: number;
  tileEntropyBits: number;
  noveltyCount: number;
  noveltySpread: number;
}

interface MetricReading {
  name: string;
  value: number;
  score: number;
  weight: number;
}

export interface WorldScore {
  overall: number;
  readings: MetricReading[];
}

const MIN_INTERESTING_REGION_CELLS = 300;
const EXPLORABLE_CELLS_FOR_FULL_CREDIT = 2000;
const SEALED_POCKET_SCORE_FLOOR = 0.2;

export function scoreWorld(m: WorldMeasurements): WorldScore {
  const readings = [
    reading('mobility', m.mobility, 1, bandScore(m.mobility, 0.45, 0.85, 0.35)),
    reading('dead-end ratio', m.deadEndRatio, 1, bandScore(m.deadEndRatio, 0.04, 0.3, 0.2)),
    reading('encounters /100 cells', m.encountersPer100Cells, 1.5, bandScore(m.encountersPer100Cells, 0.8, 6, 6)),
    reading('tile entropy (bits)', m.tileEntropyBits, 1, bandScore(m.tileEntropyBits, 0.9, 2.2, 0.9)),
    reading('novelty events', m.noveltyCount, 1, bandScore(m.noveltyCount, 4, 14, 8)),
    reading('novelty spread', m.noveltySpread, 0.5, bandScore(m.noveltySpread, 0.35, 1, 0.35)),
  ];
  const penalty = smallRegionPenalty(m.uniqueCells) * sealedPocketPenalty(m);
  return { overall: penalty * weightedMean(readings), readings };
}

function reading(name: string, value: number, weight: number, score: number): MetricReading {
  return { name, value, score, weight };
}

function bandScore(value: number, lo: number, hi: number, falloff: number): number {
  const below = Math.max(0, lo - value);
  const above = Math.max(0, value - hi);
  return Math.max(0, 1 - (below + above) / falloff);
}

function weightedMean(readings: MetricReading[]): number {
  const totalWeight = readings.reduce((sum, r) => sum + r.weight, 0);
  return readings.reduce((sum, r) => sum + r.score * r.weight, 0) / totalWeight;
}

function smallRegionPenalty(uniqueCells: number): number {
  return Math.min(1, uniqueCells / MIN_INTERESTING_REGION_CELLS);
}

function sealedPocketPenalty(m: WorldMeasurements): number {
  if (!m.regionExhausted) return 1;
  const credit = m.uniqueCells / EXPLORABLE_CELLS_FOR_FULL_CREDIT;
  return Math.min(1, Math.max(SEALED_POCKET_SCORE_FLOOR, credit));
}
