import type { PipelineEvaluator } from '../eval/evaluator';
import type { NodeInstance } from '../pipeline/pipelineState';
import type { WorldRect } from '../values/pointsInRect';
import type { ExtractedFeature } from './feature';

export interface FeatureExtractionRequest {
  node: NodeInstance;
  nodes: readonly NodeInstance[];
  seed: number;
  time: number;
  evaluator: PipelineEvaluator;
  rect: WorldRect;
}

export type FeatureExtractor = (request: FeatureExtractionRequest) => ExtractedFeature[];

const extractors = new Map<string, FeatureExtractor>();

export function registerFeatureExtractor(nodeType: string, extractor: FeatureExtractor): void {
  extractors.set(nodeType, extractor);
}

export function featureExtractorOf(nodeType: string): FeatureExtractor | undefined {
  return extractors.get(nodeType);
}

export function registeredFeatureExtractorTypes(): string[] {
  return [...extractors.keys()];
}
