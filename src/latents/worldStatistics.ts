import { quantileOf } from './frozenScale';
import type { LatentReport } from './latentTypes';

export interface WorldStatistics {
  axisScores: number[];
  clusterShares: number[];
}

export function statisticLabels(report: LatentReport): string[] {
  return [
    ...report.axes.map((_, i) => `axis ${i + 1}`),
    ...report.clusters.map((cluster) => cluster.name),
  ];
}

export function flattenedStatistics(statistics: WorldStatistics): number[] {
  return [...statistics.axisScores, ...statistics.clusterShares];
}

export function worldStatistics(report: LatentReport, channels: Float32Array[]): WorldStatistics {
  const cellCount = channels[0]?.length ?? 0;
  const axisTotals = new Float64Array(report.axes.length);
  const clusterCounts = new Float64Array(report.clusters.length);
  for (let cell = 0; cell < cellCount; cell++) {
    const quantiles = cellQuantiles(report, channels, cell);
    accumulateAxisScores(report, quantiles, axisTotals);
    clusterCounts[nearestClusterOf(report, quantiles)]!++;
  }
  return {
    axisScores: [...axisTotals].map((total) => (cellCount > 0 ? total / cellCount : 0)),
    clusterShares: [...clusterCounts].map((count) => (cellCount > 0 ? count / cellCount : 0)),
  };
}

function cellQuantiles(report: LatentReport, channels: Float32Array[], cell: number): number[] {
  return channels.map((channel, i) => quantileOf(report.frozenScale, i, channel[cell]!));
}

function accumulateAxisScores(report: LatentReport, quantiles: number[], totals: Float64Array): void {
  report.axes.forEach((axis, a) => {
    let score = 0;
    for (let i = 0; i < quantiles.length; i++) score += (quantiles[i]! - 0.5) * (axis.loadings[i] ?? 0);
    totals[a] = totals[a]! + score;
  });
}

function nearestClusterOf(report: LatentReport, quantiles: number[]): number {
  let best = 0;
  let bestDistance = Infinity;
  report.clusters.forEach((cluster, k) => {
    const distance = squaredDistance(quantiles, cluster.centroid);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = k;
    }
  });
  return best;
}

function squaredDistance(quantiles: number[], centroid: number[]): number {
  let distance = 0;
  for (let i = 0; i < quantiles.length; i++) {
    const delta = quantiles[i]! - (centroid[i] ?? 0);
    distance += delta * delta;
  }
  return distance;
}
