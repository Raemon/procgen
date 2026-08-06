import { defaultBindingForKind } from '../display/displayBinding';
import { defaultParams, outputKindOf, type NodeTypeDef } from '../nodeType';
import type { NodeInstance, PipelineState } from './pipelineState';

export function createNodeInstance(def: NodeTypeDef, id: string): NodeInstance {
  const params = defaultParams(def);
  return {
    id,
    type: def.type,
    label: def.title,
    enabled: true,
    params,
    inputs: unwiredInputs(def),
    display: defaultBindingForKind(outputKindOf(def, params)),
  };
}

export function nextNodeId(state: PipelineState): string {
  const highest = state.nodes.reduce((max, node) => Math.max(max, numericIdOf(node.id)), 0);
  return `n${highest + 1}`;
}

function unwiredInputs(def: NodeTypeDef): Record<string, string | null> {
  const inputs: Record<string, string | null> = {};
  for (const name of Object.keys(def.inputs)) inputs[name] = null;
  return inputs;
}

function numericIdOf(id: string): number {
  const digits = Number(id.replace(/\D/g, ''));
  return Number.isFinite(digits) ? digits : 0;
}
