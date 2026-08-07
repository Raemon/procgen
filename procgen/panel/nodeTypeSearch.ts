import { nodeTypesByCategory } from '../nodeRegistry';
import type { NodeTypeDef } from '../nodeType';

export function nodeTypesMatching(query: string): Map<string, NodeTypeDef[]> {
  const needle = query.trim().toLowerCase();
  if (needle === '') return nodeTypesByCategory();
  const matches = new Map<string, NodeTypeDef[]>();
  for (const [category, defs] of nodeTypesByCategory()) {
    const kept = defs.filter((def) => describesNodeType(def, category).includes(needle));
    if (kept.length > 0) matches.set(category, kept);
  }
  return matches;
}

export function firstNodeTypeIn(byCategory: Map<string, NodeTypeDef[]>): NodeTypeDef | undefined {
  for (const defs of byCategory.values()) if (defs[0]) return defs[0];
  return undefined;
}

function describesNodeType(def: NodeTypeDef, category: string): string {
  return `${def.title} ${def.type} ${category}`.toLowerCase();
}
