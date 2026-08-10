import type { Feature } from '../../../procgen/features/feature';
import { clusterFeatures, clusterLabel, type FeatureCluster } from './featureClusters';
import { featureEdgesOf, type FeatureEdge } from './featureEdges';
import type { FeaturesCamera, ScreenPoint } from './featuresCamera';
import { layoutLabels, type LabelCandidate, type PlacedLabel } from './featureLabelLayout';
import type { PickTarget } from './featurePicking';
import { shapeOfCluster } from './featureShapes';

export interface FeatureScene {
  targets: PickTarget[];
  edges: FeatureEdge[];
  labels: PlacedLabel[];
}

export type TextMeasurer = (text: string) => number;

const LABEL_HEIGHT_PX = 12;
const LABEL_ANCHOR_GAP_PX = 5;

export function buildFeatureScene(
  features: readonly Feature[],
  camera: FeaturesCamera,
  measure: TextMeasurer,
): FeatureScene {
  const clusters = clusterFeatures(features, camera);
  const view = { widthPx: camera.widthPx, heightPx: camera.heightPx };
  return {
    targets: clusters.map((cluster) => ({ cluster, shape: shapeOfCluster(cluster, camera.pixelsPerTile) })),
    edges: featureEdgesOf(singletonsOf(clusters), singletonPositionsOf(clusters), view),
    labels: layoutLabels(clusters.map((cluster) => labelCandidateOf(cluster, measure)), camera.pixelsPerTile),
  };
}

function singletonsOf(clusters: FeatureCluster[]): FeatureCluster[] {
  return clusters.filter((cluster) => cluster.count === 1);
}

function singletonPositionsOf(clusters: FeatureCluster[]): Map<string, ScreenPoint> {
  const positions = new Map<string, ScreenPoint>();
  for (const cluster of singletonsOf(clusters)) {
    positions.set(cluster.feature.key, { x: cluster.screenX, y: cluster.screenY });
  }
  return positions;
}

function labelCandidateOf(cluster: FeatureCluster, measure: TextMeasurer): LabelCandidate {
  const text = clusterLabel(cluster);
  return {
    key: cluster.feature.key,
    text,
    anchorX: cluster.screenX + LABEL_ANCHOR_GAP_PX,
    anchorY: cluster.screenY,
    widthPx: measure(text),
    heightPx: LABEL_HEIGHT_PX,
    rank: cluster.feature.rank,
    extentArea: extentAreaOf(cluster),
  };
}

function extentAreaOf(cluster: FeatureCluster): number {
  const extent = cluster.feature.extent;
  return extent ? extent.width * extent.height : 0;
}
