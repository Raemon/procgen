import type { NodeTypeDef } from './nodeType';

const registry = new Map<string, NodeTypeDef>();

export function registerNodeType(def: NodeTypeDef): NodeTypeDef {
  registry.set(def.type, def);
  return def;
}

export function nodeTypeOf(type: string): NodeTypeDef | undefined {
  return registry.get(type);
}

export function allNodeTypes(): NodeTypeDef[] {
  return [...registry.values()];
}

export function nodeTypesByCategory(): Map<string, NodeTypeDef[]> {
  const byCategory = new Map<string, NodeTypeDef[]>();
  for (const def of registry.values()) {
    const group = byCategory.get(def.category) ?? [];
    group.push(def);
    byCategory.set(def.category, group);
  }
  return byCategory;
}
