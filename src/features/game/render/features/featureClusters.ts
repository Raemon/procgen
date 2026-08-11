import type { Feature } from '@/features/asset-library/worlds/features/feature';
import { screenOfWorld, type FeaturesCamera } from './featuresCamera';

export const CLUSTER_CELL_PX = 24;

export interface FeatureCluster {
  feature: Feature;
  count: number;
  screenX: number;
  screenY: number;
}

export function clusterFeatures(
  features: readonly Feature[],
  camera: FeaturesCamera,
): FeatureCluster[] {
  const buckets = new Map<string, Feature[]>();
  for (const feature of sortedByKey(features)) {
    const bucketKey = bucketKeyOf(feature, camera);
    buckets.set(bucketKey, [...(buckets.get(bucketKey) ?? []), feature]);
  }
  return [...buckets.values()].map((bucket) => clusterOf(bucket, camera));
}

export function clusterLabel(cluster: FeatureCluster): string {
  return cluster.count > 1 ? `${cluster.feature.label} ×${cluster.count}` : cluster.feature.label;
}

function bucketKeyOf(feature: Feature, camera: FeaturesCamera): string {
  const screen = screenOfWorld(camera, feature.x, feature.y);
  const cellX = Math.floor(screen.x / CLUSTER_CELL_PX);
  const cellY = Math.floor(screen.y / CLUSTER_CELL_PX);
  return `${feature.nodeId}|${cellX},${cellY}`;
}

function clusterOf(bucket: Feature[], camera: FeaturesCamera): FeatureCluster {
  const screens = bucket.map((feature) => screenOfWorld(camera, feature.x, feature.y));
  return {
    feature: bucket[0]!,
    count: bucket.length,
    screenX: averageOf(screens.map((point) => point.x)),
    screenY: averageOf(screens.map((point) => point.y)),
  };
}

function averageOf(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sortedByKey(features: readonly Feature[]): Feature[] {
  return [...features].sort((a, b) => (a.key < b.key ? -1 : 1));
}
