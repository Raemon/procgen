import { dropInvalidWires } from '@/features/asset-library/worlds/pipeline/wiringRules';
import type { NodeInstance, PipelineState } from '@/features/asset-library/worlds/pipeline/pipelineState';
import type { NodeTemplate } from './nodeTemplate';

export function stampTemplateInto(
  state: PipelineState,
  template: NodeTemplate,
  insertAtIndex: number,
): NodeInstance[] {
  const renamed = renamedNodes(template, freeIdNumber(state));
  const index = Math.max(0, Math.min(insertAtIndex, state.nodes.length));
  state.nodes.splice(index, 0, ...renamed);
  dropInvalidWires(state);
  return renamed;
}

function renamedNodes(template: NodeTemplate, firstFreeId: number): NodeInstance[] {
  const newIdOf = new Map(template.nodes.map((node, offset) => [node.id, `n${firstFreeId + offset}`]));
  return template.nodes.map((node) => stampedNode(node, template.name, newIdOf));
}

function stampedNode(
  node: NodeInstance,
  folder: string,
  newIdOf: ReadonlyMap<string, string>,
): NodeInstance {
  const copy = structuredClone(node) as NodeInstance;
  copy.id = newIdOf.get(node.id)!;
  copy.folder = folder;
  for (const [name, sourceId] of Object.entries(copy.inputs)) {
    copy.inputs[name] = sourceId === null ? null : (newIdOf.get(sourceId) ?? null);
  }
  return copy;
}

function freeIdNumber(state: PipelineState): number {
  return state.nodes.reduce((highest, node) => Math.max(highest, numericIdOf(node.id)), 0) + 1;
}

function numericIdOf(id: string): number {
  const digits = Number(id.replace(/\D/g, ''));
  return Number.isFinite(digits) ? digits : 0;
}
