import {
  NO_CREATURE,
  NO_CULTURE,
  NO_ITEM,
  NO_PIECE,
  NO_TILE,
  roundedAssetId,
} from '@/features/asset-library/asset';
import '../nodes';
import {
  DEFAULT_CEILING_HEIGHT,
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
import {
  clampDaylight,
  DEFAULT_SEED,
  emptyPipeline,
  type NodeInstance,
  type PipelineState,
} from './pipelineState';
import { clampTime } from '../time/worldTime';
import { dropInvalidWires } from './wiringRules';

export function sanitizePipeline(raw: unknown): PipelineState {
  if (typeof raw !== 'object' || raw === null) return emptyPipeline();
  const candidate = raw as { seed?: unknown; daylight?: unknown; time?: unknown; nodes?: unknown };
  const state: PipelineState = {
    seed: sanitizeSeed(candidate.seed),
    daylight: clampDaylight(candidate.daylight),
    time: clampTime(candidate.time),
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
  if (typeof raw.folder === 'string') node.folder = raw.folder;
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
  if (binding.mode === 'ceiling') {
    return { mode: 'ceiling', height: numberOr(binding.height, DEFAULT_CEILING_HEIGHT) };
  }
  if (binding.mode === 'elevation') {
    return { mode: 'elevation', heightScale: numberOr(binding.heightScale, 3) };
  }
  if (binding.mode === 'markers') {
    return {
      mode: 'markers',
      tileId: roundedAssetId<'tiles'>(numberOr(binding.tileId, NO_TILE), NO_TILE),
      glyph: typeof binding.glyph === 'string' && binding.glyph ? binding.glyph : '*',
      color: typeof binding.color === 'string' ? binding.color : '#ff5577',
    };
  }
  if (binding.mode === 'pieces') {
    return {
      mode: 'pieces',
      pieceId: roundedAssetId<'pieces'>(numberOr(binding.pieceId, NO_PIECE), NO_PIECE),
      rotation: Math.round(numberOr(binding.rotation, RANDOM_ROTATION)),
    };
  }
  if (binding.mode === 'structures') {
    return { mode: 'structures', cultureId: roundedAssetId<'cultures'>(numberOr(binding.cultureId, NO_CULTURE), NO_CULTURE) };
  }
  if (binding.mode === 'creatures') {
    return { mode: 'creatures', creatureId: roundedAssetId<'creatures'>(numberOr(binding.creatureId, NO_CREATURE), NO_CREATURE) };
  }
  if (binding.mode === 'items') {
    return { mode: 'items', itemId: roundedAssetId<'items'>(numberOr(binding.itemId, NO_ITEM), NO_ITEM) };
  }
  return { mode: binding.mode };
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
