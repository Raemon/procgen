import type { RandomStream } from '../random/mulberry32';
import { nodeTypeOf } from '../nodeRegistry';
import type { ParamSpec, ParamValue } from '../nodeType';
import type { NodeInstance, PipelineState } from '../pipeline/pipelineState';
import { clonedState } from './clonedState';
import { clamped, rollInt, snappedToStep } from './randomRolls';

export function permutedSliderParams(state: PipelineState, rng: RandomStream): PipelineState {
  const next = clonedState(state);
  for (const node of next.nodes) nudgeNodeSliders(node, rng);
  return next;
}

function nudgeNodeSliders(node: NodeInstance, rng: RandomStream): void {
  const def = nodeTypeOf(node.type);
  if (!def) return;
  for (const [name, spec] of Object.entries(def.params)) {
    node.params[name] = nudgedParam(spec, node.params[name]!, rng);
  }
}

function nudgedParam(spec: ParamSpec, current: ParamValue, rng: RandomStream): ParamValue {
  if (spec.kind === 'number') return nudgedNumber(spec, Number(current), rng);
  if (spec.kind === 'int') return nudgedInt(spec, Number(current), rng);
  return current;
}

function nudgedNumber(
  spec: Extract<ParamSpec, { kind: 'number' }>,
  current: number,
  rng: RandomStream,
): number {
  const drift = (rng() * 2 - 1) * 0.2 * (spec.max - spec.min);
  return snappedToStep(current + drift, spec.min, spec.max, spec.step);
}

function nudgedInt(
  spec: Extract<ParamSpec, { kind: 'int' }>,
  current: number,
  rng: RandomStream,
): number {
  const reach = Math.max(1, Math.round((spec.max - spec.min) * 0.25));
  return clamped(current + rollInt(rng, -reach, reach), spec.min, spec.max);
}
