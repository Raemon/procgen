import { isKnobParamSpec, type NodeTypeDef, type StandardNodeTypeDef } from './nodeType';

const registry = new Map<string, NodeTypeDef>();

export function registerNodeType(def: StandardNodeTypeDef): NodeTypeDef {
  rejectNonKnobParams(def);
  registry.set(def.type, def);
  return def;
}

export function registerScriptNodeType(def: NodeTypeDef): NodeTypeDef {
  registry.set(def.type, def);
  return def;
}

function rejectNonKnobParams(def: StandardNodeTypeDef): void {
  for (const [name, spec] of Object.entries(def.params)) {
    if (!isKnobParamSpec(spec)) {
      throw new Error(
        `node type '${def.type}' param '${name}' has kind '${(spec as { kind: string }).kind}' — ` +
          `node knobs must be numbers (number/int/choice/toggle) or tile links (tile); see docs/authoring-nodes.md`,
      );
    }
  }
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
