import {
  isBindingValidForKind,
  RANDOM_ROTATION,
  type DisplayBinding,
} from '../display/displayBinding';
import {
  defaultParamValue,
  outputKindOf,
  type NodeTypeDef,
  type ParamSpec,
  type ParamValue,
} from '../nodeType';
import { nodeTypeOf } from '../nodeRegistry';
import { createNodeInstance } from './createNodeInstance';
import { DEFAULT_SEED, emptyPipeline, type NodeInstance, type PipelineState } from './pipelineState';
import { dropInvalidWires } from './wiringRules';

export function sanitizePipeline(raw: unknown): PipelineState {
  if (typeof raw !== 'object' || raw === null) return emptyPipeline();
  const candidate = raw as { seed?: unknown; nodes?: unknown };
  const state: PipelineState = {
    seed: sanitizeSeed(candidate.seed),
    nodes: sanitizeNodes(candidate.nodes),
  };
  dropInvalidWires(state);
  return state;
}

function sanitizeSeed(seed: unknown): number {
  return typeof seed === 'number' && Number.isFinite(seed) ? Math.round(seed) : DEFAULT_SEED;
}

function sanitizeNodes(rawNodes: unknown): NodeInstance[] {
  if (!Array.isArray(rawNodes)) return [];
  const nodes: NodeInstance[] = [];
  const usedIds = new Set<string>();
  for (const rawNode of rawNodes) {
    const node = sanitizeNode(rawNode, usedIds);
    if (node) {
      usedIds.add(node.id);
      nodes.push(node);
    }
  }
  return nodes;
}

function sanitizeNode(rawNode: unknown, usedIds: Set<string>): NodeInstance | null {
  if (typeof rawNode !== 'object' || rawNode === null) return null;
  const raw = rawNode as Partial<NodeInstance> & { type?: unknown; id?: unknown };
  if (typeof raw.type !== 'string' || typeof raw.id !== 'string' || usedIds.has(raw.id)) return null;
  const def = nodeTypeOf(raw.type);
  if (!def) return null;
  const node = createNodeInstance(def, raw.id);
  if (typeof raw.label === 'string' && raw.label.length > 0) node.label = raw.label;
  if (typeof raw.comment === 'string') node.comment = raw.comment;
  if (typeof raw.enabled === 'boolean') node.enabled = raw.enabled;
  applyStoredParams(node, def, raw.params);
  applyStoredInputs(node, raw.inputs);
  applyStoredDisplay(node, def, raw.display);
  return node;
}

function applyStoredParams(node: NodeInstance, def: NodeTypeDef, rawParams: unknown): void {
  if (typeof rawParams !== 'object' || rawParams === null) return;
  const stored = rawParams as Record<string, unknown>;
  for (const [name, spec] of Object.entries(def.params)) {
    node.params[name] = sanitizeParamValue(spec, stored[name]);
  }
}

function sanitizeParamValue(spec: ParamSpec, stored: unknown): ParamValue {
  if (spec.kind === 'number' || spec.kind === 'int' || spec.kind === 'tile') {
    return typeof stored === 'number' && Number.isFinite(stored) ? stored : defaultParamValue(spec);
  }
  if (spec.kind === 'choice') {
    return spec.options.some((option) => option.value === stored) ? (stored as number) : spec.default;
  }
  if (spec.kind === 'toggle') {
    return stored === 0 || stored === 1 ? stored : spec.default;
  }
  if (spec.kind === 'select') {
    return typeof stored === 'string' && spec.options.includes(stored) ? stored : spec.default;
  }
  return typeof stored === 'string' ? stored : spec.default;
}

function applyStoredInputs(node: NodeInstance, rawInputs: unknown): void {
  if (typeof rawInputs !== 'object' || rawInputs === null) return;
  const stored = rawInputs as Record<string, unknown>;
  for (const name of Object.keys(node.inputs)) {
    if (typeof stored[name] === 'string') node.inputs[name] = stored[name] as string;
  }
}

function applyStoredDisplay(node: NodeInstance, def: NodeTypeDef, rawDisplay: unknown): void {
  if (typeof rawDisplay !== 'object' || rawDisplay === null) return;
  const binding = rawDisplay as DisplayBinding;
  if (typeof binding.mode !== 'string') return;
  if (!isBindingValidForKind(binding, outputKindOf(def, node.params))) return;
  node.display = normalizedBinding(binding);
}

function normalizedBinding(binding: DisplayBinding): DisplayBinding {
  if (binding.mode === 'elevation') {
    return { mode: 'elevation', heightScale: finiteOr(binding.heightScale, 3) };
  }
  if (binding.mode === 'markers') {
    return {
      mode: 'markers',
      tileId: Math.round(finiteOr(binding.tileId, -1)),
      glyph: typeof binding.glyph === 'string' && binding.glyph ? binding.glyph : '*',
      color: typeof binding.color === 'string' ? binding.color : '#ff5577',
    };
  }
  if (binding.mode === 'prefabs') {
    return {
      mode: 'prefabs',
      prefabId: Math.round(finiteOr(binding.prefabId, -1)),
      rotation: Math.round(finiteOr(binding.rotation, RANDOM_ROTATION)),
    };
  }
  if (binding.mode === 'creatures') {
    return { mode: 'creatures', creatureId: Math.round(finiteOr(binding.creatureId, -1)) };
  }
  return { mode: binding.mode };
}

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
