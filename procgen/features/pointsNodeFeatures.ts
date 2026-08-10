import { nodeTypeOf } from '../nodeRegistry';
import type { NodeTypeDef } from '../nodeType';
import type { NodeInstance } from '../pipeline/pipelineState';
import type { WorldPoint } from '../values/chunkValues';
import { PROGRAM, hasPointNumber } from '../values/pointData';
import { pointsInRect } from '../values/pointsInRect';
import { RANK_DETAIL, RANK_NOTABLE, type ExtractedFeature } from './feature';
import type { FeatureExtractor } from './featureExtractorRegistry';
import { featureLabelOfTag } from './featureLabelOfTag';

export const pointsNodeFeatures: FeatureExtractor = (request) => {
  const def = nodeTypeOf(request.node.type);
  if (!def) return [];
  return pointsInRect(request.evaluator, request.node.id, request.rect).map((point) =>
    featureOfPoint(point, request.node, def),
  );
};

function featureOfPoint(
  point: WorldPoint,
  node: NodeInstance,
  def: NodeTypeDef,
): ExtractedFeature {
  return {
    x: point.x,
    y: point.y,
    extent: null,
    label: featureLabelOfTag(point, node, def),
    rank: hasPointNumber(point, PROGRAM) ? RANK_DETAIL : RANK_NOTABLE,
    parentKey: null,
    linkKeys: [],
  };
}
