import {
  defaultBindingForMode,
  displayModesForKind,
  isBindingValidForKind,
  RANDOM_ROTATION,
  type DisplayBinding,
  type DisplayMode,
} from '../procgen/display/displayBinding';
import { nodeTypeOf } from '../procgen/nodeRegistry';
import { outputKindOf, type NodeTypeDef, type ParamSpec } from '../procgen/nodeType';
import { nodeIndexById, type NodeInstance } from '../procgen/pipeline/pipelineState';
import { isWireValid } from '../procgen/pipeline/wiringRules';
import {
  abilityFailed,
  abilitySucceeded,
  type AbilityContext,
  type AbilityResult,
  type AbilitySpec,
} from './ability';
import { listOf, readInt, readNumber, readOptionalText, readText } from './abilityParams';
import { registerAbility } from './abilityRegistry';

const NODE_ID_HELP = 'id of an existing node — see GET /api/v1/pipeline';

function registerNodeAbility(
  spec: Omit<AbilitySpec, 'mode' | 'group' | 'changesWorld'>,
): AbilitySpec {
  return registerAbility({ ...spec, mode: 'god', group: 'pipeline', changesWorld: true });
}

registerNodeAbility({
  action: 'add_node',
  humanControl: 'procgen panel: + add node',
  description:
    'Create a node of the given type. Its inputs auto-wire to the nearest matching earlier nodes.',
  params: {
    type: { kind: 'text', help: 'a node type id — see GET /api/v1/node-types' },
    before_node_id: {
      kind: 'nodeId',
      help: 'insert before this node; omitted means the end of the list',
      optional: true,
    },
  },
  example: { action: 'add_node', type: 'noiseField' },
  apply: (context, params) => addNode(context, params),
});

registerNodeAbility({
  action: 'duplicate_node',
  humanControl: 'procgen panel: ⧉ on a node card',
  description: 'Copy a node with all its knob values and wiring, inserted right after the original.',
  params: { node_id: { kind: 'nodeId', help: NODE_ID_HELP } },
  example: { action: 'duplicate_node', node_id: 'n1' },
  apply: (context, params) =>
    withNode(context, params, (node) => {
      const copy = context.store.duplicateNode(node.id);
      return copy
        ? abilitySucceeded(`duplicated ${node.id} as ${copy.id}`)
        : abilityFailed('unknown_node', `could not duplicate ${node.id}`);
    }),
});

registerNodeAbility({
  action: 'remove_node',
  humanControl: 'procgen panel: ✕ on a node card',
  description: 'Delete a node. Nodes that consumed it are rewired past it where possible.',
  params: { node_id: { kind: 'nodeId', help: NODE_ID_HELP } },
  example: { action: 'remove_node', node_id: 'n1' },
  apply: (context, params) =>
    withNode(context, params, (node) => {
      context.store.removeNode(node.id);
      return abilitySucceeded(`removed ${node.id}; consumers rewired past it where possible`);
    }),
});

registerNodeAbility({
  action: 'move_node',
  humanControl: 'procgen panel: drag ⠿ to reorder',
  description:
    'Reorder a node. Nodes run top to bottom, and a node may only consume earlier nodes.',
  params: {
    node_id: { kind: 'nodeId', help: NODE_ID_HELP },
    before_node_id: {
      kind: 'nodeId',
      help: 'insert before this node; omitted means the end of the list',
      optional: true,
    },
  },
  example: { action: 'move_node', node_id: 'n2', before_node_id: 'n1' },
  apply: (context, params) => withNode(context, params, (node) => moveNode(context, node, params)),
});

for (const enabled of [true, false]) {
  registerNodeAbility({
    action: enabled ? 'enable_node' : 'disable_node',
    humanControl: 'procgen panel: enable checkbox',
    description: enabled
      ? 'Turn a disabled node back on.'
      : 'Turn a node off without deleting it.',
    params: { node_id: { kind: 'nodeId', help: NODE_ID_HELP } },
    example: { action: enabled ? 'enable_node' : 'disable_node', node_id: 'n1' },
    apply: (context, params) =>
      withNode(context, params, (node) => {
        context.store.setEnabled(node.id, enabled);
        return abilitySucceeded(`${node.id} ${enabled ? 'enabled' : 'disabled'}`);
      }),
  });
}

registerNodeAbility({
  action: 'rename_node',
  humanControl: 'procgen panel: node title',
  description: 'Rename a node. Labels are for reading; wiring uses ids.',
  params: {
    node_id: { kind: 'nodeId', help: NODE_ID_HELP },
    label: { kind: 'text', help: 'the new label' },
  },
  example: { action: 'rename_node', node_id: 'n1', label: 'coast shelf' },
  apply: (context, params) =>
    withNode(context, params, (node) => {
      const label = readText(params, 'label');
      if (!label.ok) return label.failure;
      context.store.setLabel(node.id, label.value);
      return abilitySucceeded(`renamed ${node.id} to '${label.value}'`);
    }),
});

registerNodeAbility({
  action: 'comment_node',
  humanControl: 'procgen panel: comment row',
  description: 'Leave a note on a node for whoever edits after you.',
  params: {
    node_id: { kind: 'nodeId', help: NODE_ID_HELP },
    comment: { kind: 'text', help: 'free text; an empty string clears it' },
  },
  example: { action: 'comment_node', node_id: 'n1', comment: 'drives the island mask' },
  apply: (context, params) =>
    withNode(context, params, (node) => {
      context.store.setComment(node.id, readOptionalText(params, 'comment'));
      return abilitySucceeded(`comment set on ${node.id}`);
    }),
});

registerNodeAbility({
  action: 'set_folder',
  humanControl: 'procgen panel: folder band above a run of nodes',
  description:
    'Put a node in a named folder. Neighbouring nodes sharing a folder are grouped in the panel.',
  params: {
    node_id: { kind: 'nodeId', help: NODE_ID_HELP },
    folder: { kind: 'text', help: 'the folder name; an empty string removes the node from any folder' },
  },
  example: { action: 'set_folder', node_id: 'n1', folder: 'terrain' },
  apply: (context, params) =>
    withNode(context, params, (node) => {
      const folder = readOptionalText(params, 'folder');
      context.store.setFolder(node.id, folder);
      return abilitySucceeded(folder === '' ? `${node.id} unfiled` : `${node.id} filed under '${folder}'`);
    }),
});

registerNodeAbility({
  action: 'set_param',
  humanControl: 'procgen panel: knobs',
  description: "Set one knob. Numbers are clamped to the knob's range; ints are rounded.",
  params: {
    node_id: { kind: 'nodeId', help: NODE_ID_HELP },
    param: { kind: 'text', help: "one of the node type's param names" },
    value: {
      kind: 'number',
      help: 'a number for knobs and tile links; a string only for custom-script params',
    },
  },
  example: { action: 'set_param', node_id: 'n1', param: 'scale', value: 0.5 },
  apply: (context, params) =>
    withTypedNode(context, params, (node, def) => setParam(context, node, def, params)),
});

registerNodeAbility({
  action: 'wire_input',
  humanControl: 'procgen panel: input (←) dropdowns',
  description: "Connect a node input to an earlier node's output.",
  params: {
    node_id: { kind: 'nodeId', help: NODE_ID_HELP },
    input: { kind: 'text', help: "one of the node type's input names" },
    source_node_id: {
      kind: 'nodeId',
      help: 'an EARLIER node whose output kind matches, or null to disconnect',
      optional: true,
    },
  },
  example: { action: 'wire_input', node_id: 'n2', input: 'field', source_node_id: 'n1' },
  apply: (context, params) =>
    withTypedNode(context, params, (node, def) => wireInput(context, node, def, params)),
});

registerNodeAbility({
  action: 'set_display',
  humanControl: 'procgen panel: display section',
  description:
    'Map a node into the world: tile layers stack in list order, ceilings roof the world over, elevation shapes the ground, markers draw glyphs, pieces stamp one piece each, structures reserve points for an assembled building, creatures spawn life, items float loot. Fields you leave out keep their current value when the mode is unchanged.',
  params: {
    node_id: { kind: 'nodeId', help: NODE_ID_HELP },
    display: {
      kind: 'text',
      help: "'hidden', 'tileLayer' or 'ceiling' (tiles output), 'elevation' (field output); a points output takes 'markers', 'pieces', 'structures', 'creatures' or 'items'",
    },
    height_scale: { kind: 'number', help: 'elevation only: world height per field unit', optional: true },
    ceiling_height: {
      kind: 'number',
      help: 'ceiling only: how many tiles above the ground the roof hangs',
      optional: true,
    },
    tile_id: { kind: 'int', help: 'markers only: a tile asset id to draw, or -1 for the glyph', optional: true },
    glyph: { kind: 'text', help: 'markers only: a single character', optional: true },
    color: { kind: 'text', help: 'markers only: a #rrggbb color, or #rrggbbaa with aa=00 for transparent', optional: true },
    piece_id: {
      kind: 'int',
      help: 'pieces only: a piece id to stamp at each point — see GET /api/v1/pieces',
      optional: true,
    },
    rotation: {
      kind: 'int',
      help: 'pieces only: quarter turns 0-3, or -1 for random per point',
      optional: true,
    },
    culture_id: {
      kind: 'int',
      help: 'structures only: which culture assembles the building at each point, or -1 for none',
      optional: true,
    },
    creature_id: {
      kind: 'int',
      help: 'creatures only: a creature id to spawn at each point — see GET /api/v1/creatures',
      optional: true,
    },
    item_id: {
      kind: 'int',
      help: 'items only: an item id to float above each point — see GET /api/v1/items',
      optional: true,
    },
  },
  example: { action: 'set_display', node_id: 'n1', display: 'elevation', height_scale: 4 },
  apply: (context, params) =>
    withTypedNode(context, params, (node, def) => setDisplay(context, node, def, params)),
});

function withNode(
  context: AbilityContext,
  params: Record<string, unknown>,
  use: (node: NodeInstance) => AbilityResult,
): AbilityResult {
  const rawId = params.node_id;
  const node = typeof rawId === 'string' ? context.store.nodeById(rawId) : undefined;
  if (!node) {
    return abilityFailed(
      'unknown_node',
      `node_id must be one of: ${listOf(context.store.nodes().map((each) => each.id))}`,
    );
  }
  return use(node);
}

function withTypedNode(
  context: AbilityContext,
  params: Record<string, unknown>,
  use: (node: NodeInstance, def: NodeTypeDef) => AbilityResult,
): AbilityResult {
  return withNode(context, params, (node) => {
    const def = nodeTypeOf(node.type);
    return def
      ? use(node, def)
      : abilityFailed('unknown_node_type', `node ${node.id} has unregistered type ${node.type}`);
  });
}

function addNode(context: AbilityContext, params: Record<string, unknown>): AbilityResult {
  const type = readText(params, 'type');
  if (!type.ok) return type.failure;
  const node = context.store.addNode(type.value);
  if (!node) {
    return abilityFailed(
      'unknown_node_type',
      `no node type named '${type.value}' — see GET /api/v1/node-types`,
    );
  }
  const placed = placeBeforeIfAsked(context, node, params);
  if (placed) return placed;
  return abilitySucceeded(`added ${node.type} as ${node.id} (${describeWiring(node)})`);
}

function placeBeforeIfAsked(
  context: AbilityContext,
  node: NodeInstance,
  params: Record<string, unknown>,
): AbilityResult | null {
  const before = params.before_node_id;
  if (typeof before !== 'string') return null;
  const beforeIndex = nodeIndexById(context.store.snapshot(), before);
  if (beforeIndex < 0) {
    context.store.removeNode(node.id);
    return abilityFailed('unknown_node', `before_node_id '${before}' does not exist`);
  }
  context.store.moveNodeToIndex(node.id, beforeIndex);
  return null;
}

function describeWiring(node: NodeInstance): string {
  const wired = Object.entries(node.inputs)
    .filter(([, source]) => source !== null)
    .map(([name, source]) => `${name}←${source}`);
  return wired.length > 0 ? `auto-wired ${wired.join(', ')}` : 'no inputs wired';
}

function moveNode(
  context: AbilityContext,
  node: NodeInstance,
  params: Record<string, unknown>,
): AbilityResult {
  const before = params.before_node_id;
  const state = context.store.snapshot();
  const targetIndex = typeof before === 'string' ? nodeIndexById(state, before) : state.nodes.length;
  if (targetIndex < 0) {
    return abilityFailed('unknown_node', `before_node_id '${String(before)}' does not exist`);
  }
  context.store.moveNodeToIndex(node.id, targetIndex);
  return abilitySucceeded(`moved ${node.id}; wires to now-later sources were dropped if any`);
}

function setParam(
  context: AbilityContext,
  node: NodeInstance,
  def: NodeTypeDef,
  params: Record<string, unknown>,
): AbilityResult {
  const name = readText(params, 'param');
  if (!name.ok) return name.failure;
  const spec = def.params[name.value];
  if (!spec) {
    return abilityFailed(
      'unknown_param',
      `params of ${node.id} (${def.type}): ${listOf(Object.keys(def.params))}`,
    );
  }
  const accepted = acceptParamValue(context, spec, params.value);
  if (!accepted.ok) return accepted.failure;
  context.store.setParam(node.id, name.value, accepted.value);
  return abilitySucceeded(`${node.id}.${name.value} = ${JSON.stringify(accepted.value)}`);
}

type AcceptedParam = { ok: true; value: number | string } | { ok: false; failure: AbilityResult };

function acceptParamValue(
  context: AbilityContext,
  spec: ParamSpec,
  raw: unknown,
): AcceptedParam {
  if (spec.kind === 'code' || spec.kind === 'select') return acceptScriptValue(spec, raw);
  const read = readNumber({ value: raw }, 'value');
  if (!read.ok) return { ok: false, failure: abilityFailed('invalid_value', `'${spec.label}' takes a number`) };
  return acceptKnobValue(context, spec, read.value);
}

function acceptKnobValue(
  context: AbilityContext,
  spec: Exclude<ParamSpec, { kind: 'code' } | { kind: 'select' }>,
  value: number,
): AcceptedParam {
  if (spec.kind === 'number') return { ok: true, value: clamp(value, spec.min, spec.max) };
  if (spec.kind === 'int') return { ok: true, value: clamp(Math.round(value), spec.min, spec.max) };
  if (spec.kind === 'toggle') {
    return value === 0 || value === 1
      ? { ok: true, value }
      : { ok: false, failure: abilityFailed('invalid_value', `'${spec.label}' is a toggle: 0 or 1`) };
  }
  if (spec.kind === 'choice') {
    return spec.options.some((option) => option.value === value)
      ? { ok: true, value }
      : {
          ok: false,
          failure: abilityFailed(
            'invalid_value',
            `'${spec.label}' choices: ${spec.options.map((option) => `${option.value}=${option.label}`).join(', ')}`,
          ),
        };
  }
  return value === -1 || context.tileAssets.byId(value)
    ? { ok: true, value }
    : {
        ok: false,
        failure: abilityFailed(
          'invalid_value',
          `'${spec.label}' is a tile link: -1 or a tile asset id (${listOf(context.tileAssets.all().map((tile) => tile.id))})`,
        ),
      };
}

function acceptScriptValue(
  spec: ParamSpec & { kind: 'code' | 'select' },
  raw: unknown,
): AcceptedParam {
  if (typeof raw !== 'string') {
    return { ok: false, failure: abilityFailed('invalid_value', `'${spec.label}' takes a string`) };
  }
  if (spec.kind === 'select' && !spec.options.includes(raw)) {
    return {
      ok: false,
      failure: abilityFailed('invalid_value', `'${spec.label}' options: ${listOf(spec.options)}`),
    };
  }
  return { ok: true, value: raw };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function wireInput(
  context: AbilityContext,
  node: NodeInstance,
  def: NodeTypeDef,
  params: Record<string, unknown>,
): AbilityResult {
  const name = readText(params, 'input');
  if (!name.ok) return name.failure;
  const spec = def.inputs[name.value];
  if (!spec) {
    return abilityFailed(
      'unknown_param',
      `inputs of ${node.id} (${def.type}): ${listOf(Object.keys(def.inputs))}`,
    );
  }
  const source = params.source_node_id ?? null;
  if (source !== null && typeof source !== 'string') {
    return abilityFailed('invalid_value', 'source_node_id must be a node id string or null');
  }
  if (source !== null) {
    const rejection = rejectInvalidWire(context, node, spec, source);
    if (rejection) return rejection;
  }
  context.store.wireInput(node.id, name.value, source);
  return abilitySucceeded(`${node.id}.${name.value} ← ${source ?? 'disconnected'}`);
}

function rejectInvalidWire(
  context: AbilityContext,
  node: NodeInstance,
  spec: NodeTypeDef['inputs'][string],
  source: string,
): AbilityResult | null {
  if (!context.store.nodeById(source)) {
    return abilityFailed('unknown_node', `source_node_id '${source}' does not exist`);
  }
  const state = context.store.snapshot();
  if (!isWireValid(state, nodeIndexById(state, node.id), spec, source)) {
    return abilityFailed(
      'invalid_wire',
      `${source} must come before ${node.id} and output '${spec.kind}'`,
    );
  }
  return null;
}

function setDisplay(
  context: AbilityContext,
  node: NodeInstance,
  def: NodeTypeDef,
  params: Record<string, unknown>,
): AbilityResult {
  const mode = params.display;
  if (!isDisplayMode(mode)) {
    return abilityFailed(
      'invalid_value',
      "display must be 'hidden', 'tileLayer', 'ceiling', 'elevation', 'markers', 'pieces', 'structures', 'creatures' or 'items'",
    );
  }
  const kind = outputKindOf(def, node.params);
  const binding = bindingFrom(mode, node.display, params);
  if (!isBindingValidForKind(binding, kind)) {
    return abilityFailed(
      'invalid_display',
      `${node.id} outputs '${kind}' — its display modes: ${listOf(displayModesForKind(kind))}`,
    );
  }
  const rejection = rejectMissingBindingTarget(context, binding);
  if (rejection) return rejection;
  context.store.setDisplay(node.id, binding);
  return abilitySucceeded(`${node.id} display = ${mode}`);
}

function isDisplayMode(value: unknown): value is DisplayMode {
  return (
    value === 'hidden' ||
    value === 'tileLayer' ||
    value === 'ceiling' ||
    value === 'elevation' ||
    value === 'markers' ||
    value === 'pieces' ||
    value === 'structures' ||
    value === 'creatures' ||
    value === 'items'
  );
}

function bindingFrom(
  mode: DisplayMode,
  current: DisplayBinding,
  params: Record<string, unknown>,
): DisplayBinding {
  const base = current.mode === mode ? current : defaultBindingForMode(mode);
  if (base.mode === 'ceiling') {
    const height = readNumber(params, 'ceiling_height');
    return height.ok ? { ...base, height: height.value } : base;
  }
  if (base.mode === 'elevation') {
    const height = readNumber(params, 'height_scale');
    return height.ok ? { ...base, heightScale: height.value } : base;
  }
  if (base.mode === 'markers') return markerBindingFrom(base, params);
  if (base.mode === 'pieces') {
    return {
      ...base,
      pieceId: readOptionalId(params, 'piece_id', base.pieceId),
      rotation: readOptionalId(params, 'rotation', RANDOM_ROTATION),
    };
  }
  if (base.mode === 'structures') {
    return { ...base, cultureId: readOptionalId(params, 'culture_id', base.cultureId) };
  }
  if (base.mode === 'creatures') {
    return { ...base, creatureId: readOptionalId(params, 'creature_id', base.creatureId) };
  }
  if (base.mode === 'items') {
    return { ...base, itemId: readOptionalId(params, 'item_id', base.itemId) };
  }
  return base;
}

function markerBindingFrom(
  base: DisplayBinding & { mode: 'markers' },
  params: Record<string, unknown>,
): DisplayBinding {
  const glyph = readOptionalText(params, 'glyph');
  const color = readOptionalText(params, 'color');
  return {
    ...base,
    tileId: readOptionalId(params, 'tile_id', base.tileId),
    glyph: glyph === '' ? base.glyph : [...glyph][0]!,
    color: color === '' ? base.color : color,
  };
}

function readOptionalId(
  params: Record<string, unknown>,
  name: string,
  fallback: number,
): number {
  const read = readInt(params, name);
  return read.ok ? read.value : fallback;
}

function rejectMissingBindingTarget(
  context: AbilityContext,
  binding: DisplayBinding,
): AbilityResult | null {
  if (binding.mode === 'pieces' && binding.pieceId !== -1 && !context.pieces.byId(binding.pieceId)) {
    return abilityFailed(
      'invalid_value',
      `piece_id must be -1 or one of: ${listOf(context.pieces.all().map((piece) => piece.id))} — see GET /api/v1/pieces`,
    );
  }
  if (
    binding.mode === 'creatures' &&
    binding.creatureId !== -1 &&
    !context.creatures.byId(binding.creatureId)
  ) {
    return abilityFailed(
      'invalid_value',
      `creature_id must be -1 or one of: ${listOf(context.creatures.all().map((creature) => creature.id))} — see GET /api/v1/creatures`,
    );
  }
  if (binding.mode === 'items' && binding.itemId !== -1 && !context.items.byId(binding.itemId)) {
    return abilityFailed(
      'invalid_value',
      `item_id must be -1 or one of: ${listOf(context.items.all().map((item) => item.id))} — see GET /api/v1/items`,
    );
  }
  return null;
}
