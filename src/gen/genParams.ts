export interface GenParams {
  seed: number;
  size: number;
  noiseScale: number;
  waterLevel: number;
  rockLevel: number;
  smoothing: number;
  treeDensity: number;
}

export const DEFAULT_PARAMS: GenParams = {
  seed: 1234,
  size: 64,
  noiseScale: 0.06,
  waterLevel: 0.35,
  rockLevel: 0.72,
  smoothing: 1,
  treeDensity: 0.12,
};

const MIN_WORLD_SIZE = 8;
const MAX_WORLD_SIZE = 256;
const MAX_SMOOTHING_ITERATIONS = 5;

export function clampWorldSize(size: number): number {
  return Math.max(MIN_WORLD_SIZE, Math.min(MAX_WORLD_SIZE, Math.round(size)));
}

export function clampSmoothingIterations(smoothing: number): number {
  return Math.max(0, Math.min(MAX_SMOOTHING_ITERATIONS, Math.round(smoothing)));
}
