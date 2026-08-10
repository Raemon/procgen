import type { ExtractedFeature } from '../../features/feature';
import {
  featureExtractorOf,
  registerFeatureExtractor,
  type FeatureExtractionRequest,
} from '../../features/featureExtractorRegistry';
import { pointsNodeFeatures } from '../../features/pointsNodeFeatures';
import type { NodeInstance } from '../../pipeline/pipelineState';
import { BORN_FILTER_TYPE } from './bornFilterNode';

registerFeatureExtractor(BORN_FILTER_TYPE, bornFilterFeatures);

function bornFilterFeatures(request: FeatureExtractionRequest): ExtractedFeature[] {
  const source = sourceNodeOf(request);
  if (!source) return pointsNodeFeatures(request);
  return extractorFor(source)({ ...request, node: { ...source, id: request.node.id } });
}

function sourceNodeOf(request: FeatureExtractionRequest): NodeInstance | null {
  const sourceId = request.node.inputs.source;
  if (!sourceId) return null;
  return request.nodes.find((candidate) => candidate.id === sourceId) ?? null;
}

function extractorFor(source: NodeInstance) {
  return featureExtractorOf(source.type) ?? pointsNodeFeatures;
}
