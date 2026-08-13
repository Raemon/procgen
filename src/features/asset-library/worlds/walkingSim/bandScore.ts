export interface MetricReading {
  name: string;
  value: number;
  score: number;
  weight: number;
}

const PLATEAU_TILT = 0.15;

export function bandScore(value: number, lo: number, hi: number, falloff: number): number {
  const below = Math.max(0, lo - value);
  const above = Math.max(0, value - hi);
  if (below + above === 0) return 1 - PLATEAU_TILT * tiltFromSweetSpot(value, lo, hi);
  return (1 - PLATEAU_TILT) * Math.max(0, 1 - (below + above) / falloff);
}

function tiltFromSweetSpot(value: number, lo: number, hi: number): number {
  const halfWidth = (hi - lo) / 2;
  if (halfWidth === 0) return 0;
  return Math.abs(value - (lo + hi) / 2) / halfWidth;
}

export function reading(
  name: string,
  value: number,
  weight: number,
  score: number,
): MetricReading {
  return { name, value, score, weight };
}

export function weightedMean(readings: readonly MetricReading[]): number {
  const totalWeight = readings.reduce((sum, each) => sum + each.weight, 0);
  if (totalWeight === 0) return 0;
  return readings.reduce((sum, each) => sum + each.score * each.weight, 0) / totalWeight;
}
