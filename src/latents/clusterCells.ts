import { hashString } from '../random/hashString';
import { mulberry32, type RandomStream } from '../random/mulberry32';
import type { InferenceProgress } from './latentTypes';

export interface CellClusters {
  assignment: Int32Array;
  centroids: number[][];
}

const SPREAD_CANDIDATES = 2000;

export function* kMeansSteps(
  channels: Float32Array[],
  clusterCount: number,
  iterations: number,
  seedLabel: string,
): Generator<InferenceProgress, CellClusters> {
  const cellCount = channels[0]?.length ?? 0;
  const rng = mulberry32(hashString(`kmeans:${seedLabel}`));
  const centroids = spreadInitialCentroids(channels, clusterCount, cellCount, rng);
  const assignment = new Int32Array(cellCount);
  for (let iteration = 0; iteration < iterations; iteration++) {
    assignCells(channels, centroids, assignment);
    recomputeCentroids(channels, centroids, assignment);
    yield { phase: 'clustering', done: iteration + 1, total: iterations };
  }
  return { assignment, centroids };
}

function spreadInitialCentroids(
  channels: Float32Array[],
  clusterCount: number,
  cellCount: number,
  rng: RandomStream,
): number[][] {
  const centroids: number[][] = [cellVector(channels, Math.floor(rng() * cellCount))];
  while (centroids.length < clusterCount) {
    centroids.push(cellVector(channels, farthestSampledCell(channels, centroids, cellCount, rng)));
  }
  return centroids;
}

function farthestSampledCell(
  channels: Float32Array[],
  centroids: number[][],
  cellCount: number,
  rng: RandomStream,
): number {
  let bestCell = 0;
  let bestDistance = -1;
  for (let s = 0; s < SPREAD_CANDIDATES; s++) {
    const cell = Math.floor(rng() * cellCount);
    const distance = Math.min(...centroids.map((centroid) => distanceSquared(channels, cell, centroid)));
    if (distance > bestDistance) {
      bestDistance = distance;
      bestCell = cell;
    }
  }
  return bestCell;
}

function assignCells(channels: Float32Array[], centroids: number[][], assignment: Int32Array): void {
  for (let cell = 0; cell < assignment.length; cell++) {
    let best = 0;
    let bestDistance = Infinity;
    for (let k = 0; k < centroids.length; k++) {
      const distance = distanceSquared(channels, cell, centroids[k]!);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = k;
      }
    }
    assignment[cell] = best;
  }
}

function recomputeCentroids(channels: Float32Array[], centroids: number[][], assignment: Int32Array): void {
  const sums = centroids.map(() => new Float64Array(channels.length));
  const counts = new Float64Array(centroids.length);
  for (let cell = 0; cell < assignment.length; cell++) {
    const k = assignment[cell]!;
    counts[k] = counts[k]! + 1;
    for (let f = 0; f < channels.length; f++) sums[k]![f] = sums[k]![f]! + channels[f]![cell]!;
  }
  for (let k = 0; k < centroids.length; k++) {
    if (counts[k]! === 0) continue;
    for (let f = 0; f < channels.length; f++) centroids[k]![f] = sums[k]![f]! / counts[k]!;
  }
}

function distanceSquared(channels: Float32Array[], cell: number, centroid: number[]): number {
  let distance = 0;
  for (let f = 0; f < channels.length; f++) {
    const delta = channels[f]![cell]! - centroid[f]!;
    distance += delta * delta;
  }
  return distance;
}

function cellVector(channels: Float32Array[], cell: number): number[] {
  return channels.map((channel) => channel[cell]!);
}
