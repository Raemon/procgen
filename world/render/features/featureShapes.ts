import type { FeatureCluster } from './featureClusters';

export type FeatureShape =
  | { kind: 'rect'; x: number; y: number; width: number; height: number }
  | { kind: 'dot'; x: number; y: number; radius: number };

const MIN_RECT_SCREEN_PX = 4;
const MAX_DOT_RADIUS_PX = 14;

export function shapeOfCluster(cluster: FeatureCluster, pixelsPerTile: number): FeatureShape {
  const extent = cluster.count === 1 ? cluster.feature.extent : null;
  if (extent && Math.min(extent.width, extent.height) * pixelsPerTile >= MIN_RECT_SCREEN_PX) {
    return rectShape(cluster, extent.width * pixelsPerTile, extent.height * pixelsPerTile);
  }
  return { kind: 'dot', x: cluster.screenX, y: cluster.screenY, radius: dotRadius(cluster.count) };
}

function rectShape(cluster: FeatureCluster, width: number, height: number): FeatureShape {
  return { kind: 'rect', x: cluster.screenX, y: cluster.screenY, width, height };
}

export function dotRadius(count: number): number {
  return Math.min(MAX_DOT_RADIUS_PX, 3 * Math.sqrt(count));
}
