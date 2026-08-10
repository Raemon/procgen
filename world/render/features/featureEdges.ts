import type { FeatureCluster } from './featureClusters';
import type { ScreenPoint } from './featuresCamera';

export interface FeatureEdge {
  kind: 'parent' | 'link';
  from: ScreenPoint;
  to: ScreenPoint;
  control: ScreenPoint | null;
}

export interface ViewPixels {
  widthPx: number;
  heightPx: number;
}

const ARC_BOW_OF_CHORD = 0.15;

export function featureEdgesOf(
  singletons: readonly FeatureCluster[],
  positions: ReadonlyMap<string, ScreenPoint>,
  view: ViewPixels,
): FeatureEdge[] {
  const edges: FeatureEdge[] = [];
  for (const cluster of singletons) {
    const from = { x: cluster.screenX, y: cluster.screenY };
    collectParentEdge(cluster, from, positions, edges);
    collectLinkEdges(cluster, from, positions, edges);
  }
  return edges.filter((edge) => isOnScreen(edge.from, view) || isOnScreen(edge.to, view));
}

function collectParentEdge(
  cluster: FeatureCluster,
  from: ScreenPoint,
  positions: ReadonlyMap<string, ScreenPoint>,
  into: FeatureEdge[],
): void {
  const to = cluster.feature.parentKey ? positions.get(cluster.feature.parentKey) : undefined;
  if (to) into.push({ kind: 'parent', from, to, control: arcControlOf(from, to) });
}

function collectLinkEdges(
  cluster: FeatureCluster,
  from: ScreenPoint,
  positions: ReadonlyMap<string, ScreenPoint>,
  into: FeatureEdge[],
): void {
  for (const key of cluster.feature.linkKeys) {
    const to = positions.get(key);
    if (to) into.push({ kind: 'link', from, to, control: null });
  }
}

export function arcControlOf(from: ScreenPoint, to: ScreenPoint): ScreenPoint {
  return {
    x: (from.x + to.x) / 2 - (to.y - from.y) * ARC_BOW_OF_CHORD,
    y: (from.y + to.y) / 2 + (to.x - from.x) * ARC_BOW_OF_CHORD,
  };
}

function isOnScreen(point: ScreenPoint, view: ViewPixels): boolean {
  return point.x >= 0 && point.y >= 0 && point.x <= view.widthPx && point.y <= view.heightPx;
}
