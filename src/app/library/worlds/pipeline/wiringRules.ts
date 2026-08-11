import { nodeTypeOf } from '../nodeRegistry';
import { outputKindOf, type InputSpec } from '../nodeType';
import { nodeIndexById, type NodeInstance, type PipelineState } from './pipelineState';

export function wiringCandidates(
  nodes: readonly NodeInstance[],
  nodeId: string,
  spec: InputSpec,
): NodeInstance[] {
  const nodeIndex = nodes.findIndex((node) => node.id === nodeId);
  if (nodeIndex < 0) return [];
  return nodes.slice(0, nodeIndex).filter((source) => sourceMatchesSpec(source, spec));
}

export function isWireValid(
  state: PipelineState,
  nodeIndex: number,
  spec: InputSpec,
  sourceId: string,
): boolean {
  const sourceIndex = nodeIndexById(state, sourceId);
  if (sourceIndex < 0 || sourceIndex >= nodeIndex) return false;
  return sourceMatchesSpec(state.nodes[sourceIndex]!, spec);
}

export function dropInvalidWires(state: PipelineState): void {
  state.nodes.forEach((node, nodeIndex) => {
    const def = nodeTypeOf(node.type);
    if (!def) return;
    for (const [name, spec] of Object.entries(def.inputs)) {
      const sourceId = node.inputs[name];
      if (sourceId && !isWireValid(state, nodeIndex, spec, sourceId)) node.inputs[name] = null;
    }
  });
}

function sourceMatchesSpec(source: NodeInstance, spec: InputSpec): boolean {
  const def = nodeTypeOf(source.type);
  if (!def) return false;
  return spec.kind === 'any' || outputKindOf(def, source.params) === spec.kind;
}
