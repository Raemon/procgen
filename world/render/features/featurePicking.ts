import type { FeatureCluster } from './featureClusters';
import type { FeatureShape } from './featureShapes';

export interface PickTarget {
  cluster: FeatureCluster;
  shape: FeatureShape;
}

const DOT_PICK_SLACK_PX = 3;

export function pickFeatureAt(
  targets: readonly PickTarget[],
  x: number,
  y: number,
): FeatureCluster | null {
  return containingRectAt(targets, x, y) ?? dotWithinRadiusAt(targets, x, y);
}

function containingRectAt(targets: readonly PickTarget[], x: number, y: number): FeatureCluster | null {
  for (const target of topmostFirst(targets)) {
    const shape = target.shape;
    if (shape.kind !== 'rect') continue;
    if (x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height) {
      return target.cluster;
    }
  }
  return null;
}

function dotWithinRadiusAt(targets: readonly PickTarget[], x: number, y: number): FeatureCluster | null {
  for (const target of topmostFirst(targets)) {
    const shape = target.shape;
    if (shape.kind !== 'dot') continue;
    if (Math.hypot(x - shape.x, y - shape.y) <= shape.radius + DOT_PICK_SLACK_PX) return target.cluster;
  }
  return null;
}

function topmostFirst(targets: readonly PickTarget[]): PickTarget[] {
  return [...targets].reverse();
}
