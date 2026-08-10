import { RANK_LANDMARK, type ExtractedFeature } from '../../features/feature';
import {
  registerFeatureExtractor,
  type FeatureExtractionRequest,
} from '../../features/featureExtractorRegistry';
import { nodeTypeOf } from '../../nodeRegistry';
import type { WorldPoint } from '../../values/chunkValues';
import { pointsInRect } from '../../values/pointsInRect';

registerFeatureExtractor('landmarkPoint', landmarkPointFeatures);

function landmarkPointFeatures(request: FeatureExtractionRequest): ExtractedFeature[] {
  const label = request.node.label || nodeTypeOf(request.node.type)?.title || request.node.type;
  return pointsInRect(request.evaluator, request.node.id, request.rect).map((point) =>
    landmarkFeature(point, label),
  );
}

function landmarkFeature(point: WorldPoint, label: string): ExtractedFeature {
  return {
    x: point.x,
    y: point.y,
    extent: null,
    label,
    rank: RANK_LANDMARK,
    parentKey: null,
    linkKeys: [],
  };
}
