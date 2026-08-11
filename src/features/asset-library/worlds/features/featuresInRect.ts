import type { PipelineEvaluator } from '../eval/evaluator';
import { nodeTypeOf } from '../nodeRegistry';
import { outputKindOf, type NodeTypeDef } from '../nodeType';
import type { NodeInstance } from '../pipeline/pipelineState';
import type { WorldRect } from '../values/pointsInRect';
import { BORN_FILTER_TYPE } from '../nodes/time/bornFilterNode';
import { featureKey, type ExtractedFeature, type Feature } from './feature';
import { featureExtractorOf, type FeatureExtractor } from './featureExtractorRegistry';
import { pointsNodeFeatures } from './pointsNodeFeatures';
import { withoutUnresolvedEdgeKeys } from './withoutUnresolvedEdgeKeys';

export interface FeaturePipeline {
  nodes(): readonly NodeInstance[];
  seed(): number;
  time(): number;
}

export function featuresInRect(
  store: FeaturePipeline,
  evaluator: PipelineEvaluator,
  rect: WorldRect,
): Feature[] {
  return withoutUnresolvedEdgeKeys(featuresBeforeEdgesAreScrubbed(store, evaluator, rect));
}

export function featuresBeforeEdgesAreScrubbed(
  store: FeaturePipeline,
  evaluator: PipelineEvaluator,
  rect: WorldRect,
): Feature[] {
  const byKey = new Map<string, Feature>();
  const nodes = store.nodes();
  for (const node of nodes) {
    if (node.enabled && !aTimeFilterSpeaksForIt(nodes, node)) {
      collectNodeFeatures(store, evaluator, rect, node, byKey);
    }
  }
  return [...byKey.values()];
}

function collectNodeFeatures(
  store: FeaturePipeline,
  evaluator: PipelineEvaluator,
  rect: WorldRect,
  node: NodeInstance,
  into: Map<string, Feature>,
): void {
  const def = nodeTypeOf(node.type);
  const extract = def && extractorFor(node, def);
  if (!def || !extract) return;
  const request = { node, nodes: store.nodes(), seed: store.seed(), time: store.time(), evaluator, rect };
  for (const extracted of extract(request)) {
    const key = featureKey(node.id, extracted.x, extracted.y);
    into.set(key, stampedFeature(extracted, key, node, def));
  }
}

function aTimeFilterSpeaksForIt(nodes: readonly NodeInstance[], node: NodeInstance): boolean {
  return nodes.some(
    (other) => other.enabled && other.type === BORN_FILTER_TYPE && other.inputs.source === node.id,
  );
}

function stampedFeature(
  extracted: ExtractedFeature,
  key: string,
  node: NodeInstance,
  def: NodeTypeDef,
): Feature {
  return { ...extracted, key, nodeId: node.id, nodeLabel: node.label || def.title, category: def.category };
}

function extractorFor(node: NodeInstance, def: NodeTypeDef): FeatureExtractor | null {
  const registered = featureExtractorOf(node.type);
  if (registered) return registered;
  return outputKindOf(def, node.params) === 'points' ? pointsNodeFeatures : null;
}
