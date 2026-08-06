import type { NodeInstance } from '../pipeline/pipelineState';
import type { NodeTemplate } from './nodeTemplate';

export function templateFromNodes(
  nodes: readonly NodeInstance[],
  name: string,
  description: string,
): NodeTemplate {
  const ownIds = new Set(nodes.map((node) => node.id));
  return {
    name,
    description,
    nodes: nodes.map((node) => withOnlyInternalWiring(node, ownIds)),
  };
}

function withOnlyInternalWiring(node: NodeInstance, ownIds: ReadonlySet<string>): NodeInstance {
  const copy = structuredClone(node) as NodeInstance;
  copy.folder = '';
  for (const [name, sourceId] of Object.entries(copy.inputs)) {
    if (sourceId !== null && !ownIds.has(sourceId)) copy.inputs[name] = null;
  }
  return copy;
}
