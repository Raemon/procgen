import { FACING_NAMES } from '../world/facing';
import type { AgentMode } from './agentMode';

export type VerbGroup = 'movement' | 'editing';

export interface VerbSpec {
  action: string;
  mode: AgentMode;
  group: VerbGroup;
  humanControl: string;
  params: Record<string, string>;
  example: Record<string, unknown>;
  description: string;
}

const GOD_STEP_VERBS: readonly VerbSpec[] = FACING_NAMES.map((name) => ({
  action: `step_${name}`,
  mode: 'god' as AgentMode,
  group: 'movement' as VerbGroup,
  humanControl: 'WASD/arrows, camera-relative',
  params: {},
  example: { action: `step_${name}` },
  description: `Step one tile ${name}.`,
}));

const CHARACTER_VERBS: readonly VerbSpec[] = [
  {
    action: 'step_forward',
    mode: 'character',
    group: 'movement',
    humanControl: 'W / ↑',
    params: {},
    example: { action: 'step_forward' },
    description: 'Step one tile in the direction you face.',
  },
  {
    action: 'step_back',
    mode: 'character',
    group: 'movement',
    humanControl: 'S / ↓',
    params: {},
    example: { action: 'step_back' },
    description: 'Step one tile away from the direction you face.',
  },
  {
    action: 'strafe_left',
    mode: 'character',
    group: 'movement',
    humanControl: 'A / ←',
    params: {},
    example: { action: 'strafe_left' },
    description: 'Step one tile to your left without turning.',
  },
  {
    action: 'strafe_right',
    mode: 'character',
    group: 'movement',
    humanControl: 'D / →',
    params: {},
    example: { action: 'strafe_right' },
    description: 'Step one tile to your right without turning.',
  },
  {
    action: 'turn_left',
    mode: 'character',
    group: 'movement',
    humanControl: 'Q',
    params: {},
    example: { action: 'turn_left' },
    description: 'Turn 45° left. Turning always succeeds.',
  },
  {
    action: 'turn_right',
    mode: 'character',
    group: 'movement',
    humanControl: 'E',
    params: {},
    example: { action: 'turn_right' },
    description: 'Turn 45° right. Turning always succeeds.',
  },
];

const NODE_ID_PARAM = 'id of an existing node — see GET /api/v1/pipeline';

const GOD_EDIT_VERBS: readonly VerbSpec[] = [
  {
    action: 'add_node',
    mode: 'god',
    group: 'editing',
    humanControl: 'procgen panel: + add node',
    params: {
      type: 'a node type id — see GET /api/v1/node-types',
      before_node_id: 'optional: insert before this node; omitted = end of the list',
    },
    example: { action: 'add_node', type: 'noiseField' },
    description: 'Create a node of the given type. Its inputs auto-wire to the nearest matching earlier nodes.',
  },
  {
    action: 'duplicate_node',
    mode: 'god',
    group: 'editing',
    humanControl: 'procgen panel: ⧉ on a node card',
    params: { node_id: NODE_ID_PARAM },
    example: { action: 'duplicate_node', node_id: 'n1' },
    description: 'Copy a node with all its knob values and wiring, inserted right after the original.',
  },
  {
    action: 'remove_node',
    mode: 'god',
    group: 'editing',
    humanControl: 'procgen panel: ✕ on a node card',
    params: { node_id: NODE_ID_PARAM },
    example: { action: 'remove_node', node_id: 'n1' },
    description: 'Delete a node. Nodes that consumed it are rewired past it where possible.',
  },
  {
    action: 'move_node',
    mode: 'god',
    group: 'editing',
    humanControl: 'procgen panel: drag ⠿ to reorder',
    params: {
      node_id: NODE_ID_PARAM,
      before_node_id: 'insert before this node; omitted = move to the end',
    },
    example: { action: 'move_node', node_id: 'n2', before_node_id: 'n1' },
    description: 'Reorder a node. Nodes run top to bottom, and a node may only consume earlier nodes.',
  },
  {
    action: 'enable_node',
    mode: 'god',
    group: 'editing',
    humanControl: 'procgen panel: enable checkbox',
    params: { node_id: NODE_ID_PARAM },
    example: { action: 'enable_node', node_id: 'n1' },
    description: 'Turn a disabled node back on.',
  },
  {
    action: 'disable_node',
    mode: 'god',
    group: 'editing',
    humanControl: 'procgen panel: enable checkbox',
    params: { node_id: NODE_ID_PARAM },
    example: { action: 'disable_node', node_id: 'n1' },
    description: 'Turn a node off without deleting it.',
  },
  {
    action: 'rename_node',
    mode: 'god',
    group: 'editing',
    humanControl: 'procgen panel: node title',
    params: { node_id: NODE_ID_PARAM, label: 'the new label' },
    example: { action: 'rename_node', node_id: 'n1', label: 'coast shelf' },
    description: 'Rename a node. Labels are for reading; wiring uses ids.',
  },
  {
    action: 'comment_node',
    mode: 'god',
    group: 'editing',
    humanControl: 'procgen panel: comment row',
    params: { node_id: NODE_ID_PARAM, comment: 'free text; empty clears it' },
    example: { action: 'comment_node', node_id: 'n1', comment: 'drives the island mask' },
    description: 'Leave a note on a node for whoever edits after you.',
  },
  {
    action: 'set_param',
    mode: 'god',
    group: 'editing',
    humanControl: 'procgen panel: knobs',
    params: {
      node_id: NODE_ID_PARAM,
      param: "one of the node type's param names",
      value: 'a number for knobs and tile links; a string only for custom-script params',
    },
    example: { action: 'set_param', node_id: 'n1', param: 'scale', value: 0.5 },
    description: 'Set one knob. Numbers are clamped to the knob\'s range; ints are rounded.',
  },
  {
    action: 'wire_input',
    mode: 'god',
    group: 'editing',
    humanControl: 'procgen panel: input (←) dropdowns',
    params: {
      node_id: NODE_ID_PARAM,
      input: "one of the node type's input names",
      source_node_id: 'an EARLIER node whose output kind matches, or null to disconnect',
    },
    example: { action: 'wire_input', node_id: 'n2', input: 'field', source_node_id: 'n1' },
    description: 'Connect a node input to an earlier node\'s output.',
  },
  {
    action: 'set_display',
    mode: 'god',
    group: 'editing',
    humanControl: 'procgen panel: display section',
    params: {
      node_id: NODE_ID_PARAM,
      display: "'hidden', 'tileLayer' (tiles output), 'elevation' (field output); points output takes 'markers', 'prefabs' or 'creatures'",
      height_scale: 'elevation only: world height per field unit (default 3)',
      tile_id: "markers only: a tileset id to draw, or -1 for the glyph",
      glyph: 'markers only: a single character (default *)',
      color: 'markers only: a #rrggbb color',
      prefab_id: 'prefabs only: a prefab id to stamp at each point — see GET /api/v1/prefabs',
      rotation: 'prefabs only: quarter turns 0-3, or -1 for random per point (default)',
      creature_id: 'creatures only: a creature id to spawn at each point — see GET /api/v1/creatures',
    },
    example: { action: 'set_display', node_id: 'n1', display: 'elevation', height_scale: 4 },
    description: 'Map a node into the world: tile layers stack in list order, elevation shapes the ground, markers draw tagged points.',
  },
  {
    action: 'set_seed',
    mode: 'god',
    group: 'editing',
    humanControl: 'procgen panel: world seed row',
    params: { seed: 'any integer; the whole world regenerates from it' },
    example: { action: 'set_seed', seed: 20260806 },
    description: 'Reseed the world. Same pipeline + same seed always regenerates the same world.',
  },
];

export const ALL_VERBS: readonly VerbSpec[] = [
  ...GOD_STEP_VERBS,
  ...GOD_EDIT_VERBS,
  ...CHARACTER_VERBS,
];

export function verbsForMode(mode: AgentMode): readonly VerbSpec[] {
  return ALL_VERBS.filter((verb) => verb.mode === mode);
}

export function verbByAction(mode: AgentMode, action: string): VerbSpec | undefined {
  return verbsForMode(mode).find((verb) => verb.action === action);
}
