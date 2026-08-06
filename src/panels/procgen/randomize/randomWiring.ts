import type { RandomStream } from '../../../random/mulberry32';
import { nodeTypeOf } from '../../../procgen/nodeRegistry';
import { outputKindOf, type InputSpec, type NodeTypeDef } from '../../../procgen/nodeType';
import type { NodeInstance, PipelineState } from '../../../procgen/pipeline/pipelineState';
import { chance, pick } from './randomRolls';

export function inputCandidatesBeforeIndex(
  state: PipelineState,
  index: number,
  spec: InputSpec,
): NodeInstance[] {
  return state.nodes.slice(0, index).filter((source) => sourceKindMatches(source, spec));
}

export function requiredInputsSatisfiable(
  state: PipelineState,
  index: number,
  def: NodeTypeDef,
): boolean {
  return Object.values(def.inputs).every(
    (spec) => spec.optional || inputCandidatesBeforeIndex(state, index, spec).length > 0,
  );
}

export function wireRandomInputs(
  state: PipelineState,
  index: number,
  node: NodeInstance,
  def: NodeTypeDef,
  rng: RandomStream,
): void {
  for (const [name, spec] of Object.entries(def.inputs)) {
    node.inputs[name] = randomWireFor(state, index, spec, rng);
  }
}

export function randomWireFor(
  state: PipelineState,
  index: number,
  spec: InputSpec,
  rng: RandomStream,
): string | null {
  const candidates = inputCandidatesBeforeIndex(state, index, spec);
  if (candidates.length === 0) return null;
  if (spec.optional && chance(rng, 0.25)) return null;
  return pick(rng, candidates).id;
}

function sourceKindMatches(source: NodeInstance, spec: InputSpec): boolean {
  const def = nodeTypeOf(source.type);
  if (!def) return false;
  return spec.kind === 'any' || outputKindOf(def, source.params) === spec.kind;
}
