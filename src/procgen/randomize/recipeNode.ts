import type { DisplayBinding } from '../display/displayBinding';
import { nodeTypeOf } from '../nodeRegistry';
import type { ParamValue } from '../nodeType';
import { createNodeInstance } from '../pipeline/createNodeInstance';
import type { NodeInstance } from '../pipeline/pipelineState';

export interface RecipeNodeSpec {
  id: string;
  type: string;
  label: string;
  params?: Record<string, ParamValue>;
  inputs?: Record<string, string | null>;
  display?: DisplayBinding;
}

export function recipeNode(spec: RecipeNodeSpec): NodeInstance {
  const def = nodeTypeOf(spec.type);
  if (!def) throw new Error(`unknown node type: ${spec.type}`);
  const node = createNodeInstance(def, spec.id);
  node.label = spec.label;
  Object.assign(node.params, spec.params);
  Object.assign(node.inputs, spec.inputs);
  if (spec.display) node.display = spec.display;
  return node;
}

export function nextRecipeId(nodes: readonly NodeInstance[]): string {
  return `n${nodes.length + 1}`;
}
