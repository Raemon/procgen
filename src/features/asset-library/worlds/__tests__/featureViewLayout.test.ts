import { RANK_NOTABLE, type Feature, type FeatureExtent } from '../features/feature';
import { clusterFeatures, clusterLabel } from '@/features/game/render/features/featureClusters';
import {
  boxesOverlap,
  layoutLabels,
  LABELS_ONE_NODE_MAY_NAME,
  type LabelCandidate,
} from '@/features/game/render/features/featureLabelLayout';
import { pickFeatureAt, type PickTarget } from '@/features/game/render/features/featurePicking';
import type { FeaturesCamera } from '@/features/game/render/features/featuresCamera';
import {
  clampedPixelsPerTile,
  FEATURE_SURVEY_SPAN_TILES,
  surveyRectOf,
} from '@/features/game/render/features/featuresSurveyRect';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

export function checkFeatureViewLayout(check: CheckReporter): void {
  checkLabelsNeverOverlap(check);
  checkPickingPrefersContainingRects(check);
  checkMinZoomHoldsTheSurveySpan(check);
  checkClustersReportTheirCount(check);
}

function checkLabelsNeverOverlap(check: CheckReporter): void {
  const placed = layoutLabels(crowdedCandidates(), 4);
  checkOneNodeCannotFloodTheMap(check);
  check('the crowded label fixture keeps some labels, so the overlap claim is not vacuous', placed.length > 1);
  check(
    'no two labels the layout places overlap each other',
    placed.every((a, index) => placed.slice(index + 1).every((b) => !boxesOverlap(a, b))),
  );
}

function checkOneNodeCannotFloodTheMap(check: CheckReporter): void {
  const scenery = spreadOutCandidatesOfOneNode(40);
  check(
    'one scattering node cannot bury the map, however many things it names',
    layoutLabels(scenery, 4).length <= LABELS_ONE_NODE_MAY_NAME && scenery.length > LABELS_ONE_NODE_MAY_NAME,
  );
}

function spreadOutCandidatesOfOneNode(count: number): LabelCandidate[] {
  const spread: LabelCandidate[] = [];
  for (let index = 0; index < count; index++) spread.push({
    key: `s${index}`,
    nodeId: 'groves',
    text: 'island groves',
    anchorX: 40 + index * 200,
    anchorY: 40 + index * 40,
    widthPx: 60,
    heightPx: 12,
    rank: RANK_NOTABLE,
    extentArea: 0,
  });
  return spread;
}

function crowdedCandidates(): LabelCandidate[] {
  return [0, 1, 2, 3, 4, 5, 6, 7].map((index) => ({
    key: `k${index}`,
    nodeId: `n${index}`,
    text: `label ${index}`,
    anchorX: 100 + index * 9,
    anchorY: 100 + (index % 3) * 4,
    widthPx: 60,
    heightPx: 12,
    rank: RANK_NOTABLE,
    extentArea: index,
  }));
}

function checkPickingPrefersContainingRects(check: CheckReporter): void {
  const rect = targetOf('plot', { kind: 'rect', x: 10, y: 10, width: 40, height: 40 });
  const dot = targetOf('tree', { kind: 'dot', x: 52, y: 30, radius: 6 });
  check(
    'picking prefers the rect the cursor is inside over a nearby dot',
    pickFeatureAt([dot, rect], 48, 30)?.feature.key === 'plot',
  );
  check(
    'outside every rect, picking still finds a dot by its radius',
    pickFeatureAt([dot, rect], 55, 31)?.feature.key === 'tree',
  );
}

function targetOf(key: string, shape: PickTarget['shape']): PickTarget {
  return { cluster: { feature: featureAt(key, 0, 0), count: 1, screenX: shape.x, screenY: shape.y }, shape };
}

function checkMinZoomHoldsTheSurveySpan(check: CheckReporter): void {
  const sizes = [
    { widthPx: 800, heightPx: 600 },
    { widthPx: 2400, heightPx: 1200 },
  ];
  check(
    'the minimum zoom refuses any viewport wider or taller than the survey span',
    sizes.every((size) => surveyFitsSpan(size.widthPx, size.heightPx)),
  );
}

function surveyFitsSpan(widthPx: number, heightPx: number): boolean {
  const pixelsPerTile = clampedPixelsPerTile(0.0001, widthPx, heightPx);
  const rect = surveyRectOf(cameraOf(widthPx, heightPx, pixelsPerTile));
  return (
    rect.maxX - rect.minX <= FEATURE_SURVEY_SPAN_TILES + 2 &&
    rect.maxY - rect.minY <= FEATURE_SURVEY_SPAN_TILES + 2
  );
}

function cameraOf(widthPx: number, heightPx: number, pixelsPerTile: number): FeaturesCamera {
  return { centerX: 0, centerY: 0, pixelsPerTile, widthPx, heightPx };
}

function checkClustersReportTheirCount(check: CheckReporter): void {
  const camera = cameraOf(400, 400, 2);
  const features = [0, 1, 2, 3, 4].map((index) => featureAt(`f${index}`, index, 0));
  const clusters = clusterFeatures(features, camera);
  check(
    'five same-node features in one screen cell fold into a single cluster labelled ×5',
    clusters.length === 1 && clusters[0]!.count === 5 && clusterLabel(clusters[0]!).endsWith('×5'),
  );
}

function featureAt(key: string, x: number, y: number, extent: FeatureExtent | null = null): Feature {
  return {
    key,
    nodeId: 'n1',
    nodeLabel: 'things',
    category: 'examples',
    x,
    y,
    extent,
    label: 'thing',
    rank: RANK_NOTABLE,
    parentKey: null,
    linkKeys: [],
  };
}
