export interface MetricReading {
  name: string;
  value: number;
  score: number;
  weight: number;
}

export function bandScore(value: number, lo: number, hi: number, falloff: number): number {
  const below = Math.max(0, lo - value);
  const above = Math.max(0, value - hi);
  return Math.max(0, 1 - (below + above) / falloff);
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
