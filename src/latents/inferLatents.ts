import type { PipelineEvaluator } from '../procgen/eval/evaluator';
import { kMeansSteps } from './clusterCells';
import { clusterShapes } from './clusterShapes';
import { freezeScale } from './frozenScale';
import { nameClusters } from './latentNames';
import type { InferenceProgress, LatentReport } from './latentTypes';
import { principalAxes } from './principalAxes';
import { rankNormalized } from './rankNormalize';
import { sampleChannelSteps, type LatentSource } from './sampleChannels';

export interface LatentOptions {
  chunkSpan: number;
  clusterCount: number;
  axisCount: number;
  iterations: number;
}

export const DEFAULT_LATENT_OPTIONS: LatentOptions = {
  chunkSpan: 6,
  clusterCount: 7,
  axisCount: 3,
  iterations: 20,
};

export function* inferLatentSteps(
  source: LatentSource,
  evaluator: PipelineEvaluator,
  options: LatentOptions = DEFAULT_LATENT_OPTIONS,
): Generator<InferenceProgress, LatentReport> {
  const sampled = yield* sampleChannelSteps(source, evaluator, options.chunkSpan);
  if (sampled.channels.length === 0) return emptyReport(sampled.cellsPerSide);
  const ranked = yield* rankingSteps(sampled.channels);
  yield { phase: 'axes', done: 0, total: 1 };
  const axes = principalAxes(ranked, options.axisCount);
  const clusterCount = supportableClusterCount(options.clusterCount, ranked.length);
  const clusters = yield* kMeansSteps(ranked, clusterCount, options.iterations, `${source.seed()}`);
  yield { phase: 'shaping', done: 0, total: 1 };
  const shapes = clusterShapes(clusters.assignment, sampled.cellsPerSide, clusterCount);
  return {
    cellsPerSide: sampled.cellsPerSide,
    assignment: clusters.assignment,
    clusters: nameClusters(shapes, clusters.centroids, axes),
    axes,
    sealedChannelLabels: sampled.sealedChannelLabels,
    channelNodeIds: sampled.channelNodeIds,
    frozenScale: freezeScale(sampled.channels),
  };
}

export function runLatentInference(
  source: LatentSource,
  evaluator: PipelineEvaluator,
  options: LatentOptions = DEFAULT_LATENT_OPTIONS,
): LatentReport {
  const steps = inferLatentSteps(source, evaluator, options);
  let next = steps.next();
  while (!next.done) next = steps.next();
  return next.value;
}

function supportableClusterCount(requested: number, channelCount: number): number {
  return Math.max(2, Math.min(requested, 2 + 2 * channelCount));
}

function* rankingSteps(channels: Float32Array[]): Generator<InferenceProgress, Float32Array[]> {
  const ranked: Float32Array[] = [];
  for (let i = 0; i < channels.length; i++) {
    ranked.push(rankNormalized(channels[i]!));
    yield { phase: 'ranking', done: i + 1, total: channels.length };
  }
  return ranked;
}

function emptyReport(cellsPerSide: number): LatentReport {
  return {
    cellsPerSide,
    assignment: new Int32Array(0),
    clusters: [],
    axes: [],
    sealedChannelLabels: [],
    channelNodeIds: [],
    frozenScale: { sortedSamples: [] },
  };
}
