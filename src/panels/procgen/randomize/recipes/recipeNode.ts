import type { DisplayBinding } from '../../../../procgen/display/displayBinding';
import { nodeTypeOf } from '../../../../procgen/nodeRegistry';
import type { ParamValue } from '../../../../procgen/nodeType';
import { createNodeInstance } from '../../../../procgen/pipeline/createNodeInstance';
import type { NodeInstance } from '../../../../procgen/pipeline/pipelineState';

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
