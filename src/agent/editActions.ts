import {
  defaultBindingForMode,
  displayModesForKind,
  isBindingValidForKind,
  type DisplayBinding,
  type DisplayMode,
} from '../procgen/display/displayBinding';
import { nodeTypeOf } from '../procgen/nodeRegistry';
import { outputKindOf, type NodeTypeDef, type ParamSpec } from '../procgen/nodeType';
import { nodeIndexById, type NodeInstance } from '../procgen/pipeline/pipelineState';
import type { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { isWireValid } from '../procgen/pipeline/wiringRules';
import type { Tileset } from '../world/tiles/tileset';

export type EditResult = { ok: true; summary: string } | { ok: false; code: string; hint: string };

export function applyEditAction(
  store: PipelineStore,
  tileset: Tileset,
  action: string,
  params: Record<string, unknown>,
): EditResult {
  if (action === 'add_node') return addNode(store, params);
  if (action === 'set_seed') return setSeed(store, params);
  const target = requireNode(store, params.node_id);
  if (!target.ok) return target;
  const { node, def } = target;
  if (action === 'duplicate_node') return duplicateNode(store, node);
  if (action === 'remove_node') return removeNode(store, node);
  if (action === 'move_node') return moveNode(store, node, params);
  if (action === 'enable_node' || action === 'disable_node') {
    store.setEnabled(node.id, action === 'enable_node');
    return { ok: true, summary: `${node.id} ${action === 'enable_node' ? 'enabled' : 'disabled'}` };
  }
  if (action === 'rename_node') return renameNode(store, node, params);
  if (action === 'comment_node') return commentNode(store, node, params);
  if (action === 'set_param') return setParam(store, tileset, node, def, params);
  if (action === 'wire_input') return wireInput(store, node, def, params);
  if (action === 'set_display') return setDisplay(store, node, def, params);
  return fail('unknown_action', `no editing verb named ${action}`);
}

function fail(code: string, hint: string): { ok: false; code: string; hint: string } {
  return { ok: false, code, hint };
}

function requireNode(
  store: PipelineStore,
  rawId: unknown,
): { ok: true; node: NodeInstance; def: NodeTypeDef } | { ok: false; code: string; hint: string } {
  const node = typeof rawId === 'string' ? store.nodeById(rawId) : undefined;
  if (!node) {
    return fail('unknown_node', `node_id must be one of: ${store.nodes().map((n) => n.id).join(', ') || '(pipeline is empty)'}`);
  }
  const def = nodeTypeOf(node.type);
  if (!def) return fail('unknown_node_type', `node ${node.id} has unregistered type ${node.type}`);
  return { ok: true, node, def };
}

function addNode(store: PipelineStore, params: Record<string, unknown>): EditResult {
  const type = typeof params.type === 'string' ? params.type : '';
  const node = store.addNode(type);
  if (!node) return fail('unknown_node_type', `no node type named '${type}' — see GET /api/v1/node-types`);
  const before = params.before_node_id;
  if (typeof before === 'string') {
    const beforeIndex = nodeIndexById(store.snapshot(), before);
    if (beforeIndex < 0) {
      store.removeNode(node.id);
      return fail('unknown_node', `before_node_id '${before}' does not exist`);
    }
    store.moveNodeToIndex(node.id, beforeIndex);
  }
  return { ok: true, summary: `added ${node.type} as ${node.id} (${describeWiring(node)})` };
}

function describeWiring(node: NodeInstance): string {
  const wired = Object.entries(node.inputs)
    .filter(([, source]) => source !== null)
    .map(([name, source]) => `${name}←${source}`);
  return wired.length > 0 ? `auto-wired ${wired.join(', ')}` : 'no inputs wired';
}

function duplicateNode(store: PipelineStore, node: NodeInstance): EditResult {
  const copy = store.duplicateNode(node.id);
  return copy
    ? { ok: true, summary: `duplicated ${node.id} as ${copy.id}` }
    : fail('unknown_node', `could not duplicate ${node.id}`);
}

function removeNode(store: PipelineStore, node: NodeInstance): EditResult {
  store.removeNode(node.id);
  return { ok: true, summary: `removed ${node.id}; consumers rewired past it where possible` };
}

function moveNode(store: PipelineStore, node: NodeInstance, params: Record<string, unknown>): EditResult {
  const before = params.before_node_id;
  const state = store.snapshot();
  const targetIndex =
    typeof before === 'string' ? nodeIndexById(state, before) : state.nodes.length;
  if (targetIndex < 0) return fail('unknown_node', `before_node_id '${String(before)}' does not exist`);
  store.moveNodeToIndex(node.id, targetIndex);
  return { ok: true, summary: `moved ${node.id}; wires to now-later sources were dropped if any` };
}

function renameNode(store: PipelineStore, node: NodeInstance, params: Record<string, unknown>): EditResult {
  if (typeof params.label !== 'string' || params.label.trim() === '') {
    return fail('invalid_value', 'label must be a non-empty string');
  }
  store.setLabel(node.id, params.label.trim());
  return { ok: true, summary: `renamed ${node.id} to '${params.label.trim()}'` };
}

function commentNode(store: PipelineStore, node: NodeInstance, params: Record<string, unknown>): EditResult {
  if (typeof params.comment !== 'string') return fail('invalid_value', 'comment must be a string');
  store.setComment(node.id, params.comment);
  return { ok: true, summary: `comment set on ${node.id}` };
}

function setParam(
  store: PipelineStore,
  tileset: Tileset,
  node: NodeInstance,
  def: NodeTypeDef,
  params: Record<string, unknown>,
): EditResult {
  const name = typeof params.param === 'string' ? params.param : '';
  const spec = def.params[name];
  if (!spec) return fail('unknown_param', `params of ${node.id} (${def.type}): ${Object.keys(def.params).join(', ')}`);
  const accepted = acceptParamValue(spec, params.value, tileset);
  if (!accepted.ok) return accepted;
  store.setParam(node.id, name, accepted.value);
  return { ok: true, summary: `${node.id}.${name} = ${JSON.stringify(accepted.value)}` };
}

function acceptParamValue(
  spec: ParamSpec,
  raw: unknown,
  tileset: Tileset,
): { ok: true; value: number | string } | { ok: false; code: string; hint: string } {
  if (spec.kind === 'code' || spec.kind === 'select') return acceptScriptValue(spec, raw);
  const value = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
  if (!Number.isFinite(value)) return fail('invalid_value', `'${spec.label}' takes a number`);
  if (spec.kind === 'number') return { ok: true, value: clamp(value, spec.min, spec.max) };
  if (spec.kind === 'int') return { ok: true, value: clamp(Math.round(value), spec.min, spec.max) };
  if (spec.kind === 'toggle') {
    return value === 0 || value === 1
      ? { ok: true, value }
      : (fail('invalid_value', `'${spec.label}' is a toggle: 0 or 1`));
  }
  if (spec.kind === 'choice') {
    return spec.options.some((option) => option.value === value)
      ? { ok: true, value }
      : (fail(
          'invalid_value',
          `'${spec.label}' choices: ${spec.options.map((o) => `${o.value}=${o.label}`).join(', ')}`,
        ));
  }
  return value === -1 || tileset.byId(value)
    ? { ok: true, value }
    : (fail(
        'invalid_value',
        `'${spec.label}' is a tile link: -1 or a tileset id (${tileset.all().map((t) => t.id).join(', ')})`,
      ));
}

function acceptScriptValue(
  spec: ParamSpec & { kind: 'code' | 'select' },
  raw: unknown,
): { ok: true; value: string } | { ok: false; code: string; hint: string } {
  if (typeof raw !== 'string') return fail('invalid_value', `'${spec.label}' takes a string`);
  if (spec.kind === 'select' && !spec.options.includes(raw)) {
    return fail('invalid_value', `'${spec.label}' options: ${spec.options.join(', ')}`);
  }
  return { ok: true, value: raw };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function wireInput(
  store: PipelineStore,
  node: NodeInstance,
  def: NodeTypeDef,
  params: Record<string, unknown>,
): EditResult {
  const name = typeof params.input === 'string' ? params.input : '';
  const spec = def.inputs[name];
  if (!spec) return fail('unknown_param', `inputs of ${node.id} (${def.type}): ${Object.keys(def.inputs).join(', ') || '(none)'}`);
  const source = params.source_node_id ?? null;
  if (source !== null && typeof source !== 'string') {
    return fail('invalid_value', 'source_node_id must be a node id string or null');
  }
  if (source !== null) {
    if (!store.nodeById(source)) return fail('unknown_node', `source_node_id '${source}' does not exist`);
    const state = store.snapshot();
    if (!isWireValid(state, nodeIndexById(state, node.id), spec, source)) {
      return fail('invalid_wire', `${source} must come before ${node.id} and output '${spec.kind}'`);
    }
  }
  store.wireInput(node.id, name, source);
  return { ok: true, summary: `${node.id}.${name} ← ${source ?? 'disconnected'}` };
}

function setDisplay(
  store: PipelineStore,
  node: NodeInstance,
  def: NodeTypeDef,
  params: Record<string, unknown>,
): EditResult {
  const mode = params.display;
  if (!isDisplayMode(mode)) {
    return fail('invalid_value', "display must be 'hidden', 'tileLayer', 'elevation' or 'markers'");
  }
  const kind = outputKindOf(def, node.params);
  const binding = bindingFrom(mode, params);
  if (!isBindingValidForKind(binding, kind)) {
    return fail(
      'invalid_display',
      `${node.id} outputs '${kind}' — its display modes: ${displayModesForKind(kind).join(', ')}`,
    );
  }
  store.setDisplay(node.id, binding);
  return { ok: true, summary: `${node.id} display = ${mode}` };
}

function isDisplayMode(value: unknown): value is DisplayMode {
  return value === 'hidden' || value === 'tileLayer' || value === 'elevation' || value === 'markers';
}

function bindingFrom(mode: DisplayMode, params: Record<string, unknown>): DisplayBinding {
  const base = defaultBindingForMode(mode);
  if (base.mode === 'elevation' && typeof params.height_scale === 'number') {
    return { ...base, heightScale: params.height_scale };
  }
  if (base.mode === 'markers') {
    return {
      ...base,
      tileId: typeof params.tile_id === 'number' ? params.tile_id : base.tileId,
      glyph: typeof params.glyph === 'string' && params.glyph !== '' ? [...params.glyph][0]! : base.glyph,
      color: typeof params.color === 'string' ? params.color : base.color,
    };
  }
  return base;
}

function setSeed(store: PipelineStore, params: Record<string, unknown>): EditResult {
  const seed = typeof params.seed === 'number' ? params.seed : Number(params.seed);
  if (!Number.isFinite(seed)) return fail('invalid_value', 'seed must be an integer');
  store.setSeed(seed);
  return { ok: true, summary: `seed = ${Math.round(seed)}; the world regenerated` };
}
