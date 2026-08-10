import { emptyPipeline, type PipelineState } from '../procgen/pipeline/pipelineState';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import { examplePipelines } from '../procgen/presets/examplePipelines';
import { permutedNodeCombination } from '../procgen/randomize/permuteNodeCombination';
import { permutedSliderParams } from '../procgen/randomize/permuteSliderParams';
import { randomWorldPipeline } from '../procgen/randomize/randomWorldPipeline';
import { stampTemplateInto } from '../procgen/templates/stampTemplate';
import { templateFromNodes } from '../procgen/templates/templateFromNodes';
import { mulberry32, type RandomStream } from '../procgen/random/mulberry32';
import {
  abilityFailed,
  abilitySucceeded,
  type AbilityContext,
  type AbilityResult,
  type AbilitySpec,
} from './ability';
import { listOf, readInt, readNumber, readOptionalText, readText } from './abilityParams';
import { registerAbility } from './abilityRegistry';

function registerWorldAbility(
  spec: Omit<AbilitySpec, 'mode' | 'group' | 'changesWorld'>,
): AbilitySpec {
  return registerAbility({ ...spec, mode: 'god', group: 'world', changesWorld: true });
}

registerWorldAbility({
  action: 'set_seed',
  humanControl: 'detail panel, world: world seed row',
  description: 'Reseed the world. The same pipeline and the same seed always regenerate the same world.',
  params: { seed: { kind: 'int', help: 'any integer' } },
  example: { action: 'set_seed', seed: 20260806 },
  apply: (context, params) => {
    const seed = readInt(params, 'seed');
    if (!seed.ok) return seed.failure;
    context.store.setSeed(seed.value);
    return abilitySucceeded(`seed = ${seed.value}; the world regenerated`);
  },
});

registerWorldAbility({
  action: 'set_daylight',
  humanControl: 'detail panel, world: daylight row',
  description:
    'Set how much light the sky gives this world, 0 to 1. At 0 nothing is lit until a tile, an item or a character carrying a light emits some — the setting for caves and underground worlds.',
  params: { daylight: { kind: 'number', help: '0 for pitch dark, 1 for full daylight' } },
  example: { action: 'set_daylight', daylight: 0 },
  apply: (context, params) => {
    const daylight = readNumber(params, 'daylight');
    if (!daylight.ok) return daylight.failure;
    context.store.setDaylight(daylight.value);
    return abilitySucceeded(`daylight = ${context.store.daylight()}`);
  },
});

registerWorldAbility({
  action: 'set_time',
  humanControl: 'detail panel, world: time row',
  description:
    'Set the moment the world is shown at, 0 for the present and negative values for the past. Scrubbing back removes young buildings and settlements first, then in deep time un-erodes and sinks the volcanic islands.',
  params: { time: { kind: 'number', help: '0 for the present, negative for years before it' } },
  example: { action: 'set_time', time: -200 },
  apply: (context, params) => {
    const time = readNumber(params, 'time');
    if (!time.ok) return time.failure;
    context.store.setTime(time.value);
    return abilitySucceeded(`time = ${context.store.time()}`);
  },
});

registerWorldAbility({
  action: 'clear_pipeline',
  humanControl: 'detail panel, world: clear',
  description: 'Remove every node, leaving an empty world to build from zero.',
  params: {},
  example: { action: 'clear_pipeline' },
  apply: (context) => {
    context.store.replaceAll(emptyPipeline());
    return abilitySucceeded('pipeline cleared');
  },
});

registerWorldAbility({
  action: 'load_preset',
  humanControl: 'asset library, worlds folder: load into this world — or the presets dropdown on a world',
  description:
    'Replace the whole pipeline with a named preset — one of the built-in examples or one you saved.',
  params: { name: { kind: 'text', help: 'a preset name — see GET /api/v1/presets' } },
  example: { action: 'load_preset', name: 'islands' },
  apply: (context, params) => loadPreset(context, params),
});

registerWorldAbility({
  action: 'save_preset',
  humanControl: 'detail panel, world: presets save button',
  description: 'Save the whole current pipeline as a named preset. An existing name is overwritten.',
  params: {
    name: { kind: 'text', help: 'the preset name' },
    description: { kind: 'text', help: 'what this world is', optional: true },
  },
  example: { action: 'save_preset', name: 'my archipelago' },
  apply: (context, params) => savePreset(context, params),
});

registerWorldAbility({
  action: 'delete_preset',
  humanControl: 'asset library, worlds folder: ✕ on a saved world',
  description: 'Delete one of your saved presets. Built-in examples cannot be deleted.',
  params: { name: { kind: 'text', help: 'the saved preset name' } },
  example: { action: 'delete_preset', name: 'my archipelago' },
  apply: (context, params) => deletePreset(context, params),
});

registerWorldAbility({
  action: 'stamp_template',
  humanControl: 'asset library, node groups folder: stamp into this world',
  description:
    'Insert a saved group of wired nodes into the pipeline, renamed so its ids do not collide and filed under its own folder.',
  params: {
    name: { kind: 'text', help: 'a template name — see GET /api/v1/templates' },
    before_node_id: {
      kind: 'nodeId',
      help: 'insert before this node; omitted means the end of the list',
      optional: true,
    },
  },
  example: { action: 'stamp_template', name: 'rivers' },
  apply: (context, params) => stampTemplate(context, params),
});

registerWorldAbility({
  action: 'save_template',
  humanControl: 'detail panel, world: ⤓ library on a folder band',
  description:
    'Save a run of nodes as a reusable template. Wires that point outside the group are dropped.',
  params: {
    name: { kind: 'text', help: 'the template name' },
    node_ids: { kind: 'json', help: 'the ids of the nodes to save, as an array of strings' },
    description: { kind: 'text', help: 'what this group does', optional: true },
  },
  example: { action: 'save_template', name: 'coastline', node_ids: ['n1', 'n2'] },
  apply: (context, params) => saveTemplate(context, params),
});

registerWorldAbility({
  action: 'delete_template',
  humanControl: 'detail panel, node group: ✕',
  description: 'Delete one of your saved templates. Built-in templates cannot be deleted.',
  params: { name: { kind: 'text', help: 'the saved template name' } },
  example: { action: 'delete_template', name: 'coastline' },
  apply: (context, params) => deleteTemplate(context, params),
});

const ROLLS: readonly {
  action: string;
  humanControl: string;
  description: string;
  roll(context: AbilityContext, rng: RandomStream): PipelineState;
}[] = [
  {
    action: 'randomize_world',
    humanControl: 'detail panel, world: 🎲 world',
    description: 'Replace the pipeline with a freshly rolled node combination.',
    roll: (context, rng) => randomWorldPipeline(rng, tileIdsOf(context)),
  },
  {
    action: 'randomize_sliders',
    humanControl: 'detail panel, world: ~ sliders',
    description: 'Nudge every numeric parameter of the current nodes.',
    roll: (context, rng) => permutedSliderParams(context.store.snapshot(), rng),
  },
  {
    action: 'randomize_nodes',
    humanControl: 'detail panel, world: ⇄ nodes',
    description: 'Mutate the node combination: swap, add, remove or rewire a node or two.',
    roll: (context, rng) => permutedNodeCombination(context.store.snapshot(), rng, tileIdsOf(context)),
  },
];

for (const entry of ROLLS) {
  registerWorldAbility({
    action: entry.action,
    humanControl: entry.humanControl,
    description: `${entry.description} Pass a seed to make the roll reproducible; undo_randomize puts it back.`,
    params: {
      seed: { kind: 'int', help: 'seed for this roll; omitted means an arbitrary one', optional: true },
    },
    example: { action: entry.action },
    apply: (context, params) => applyRoll(context, params, entry.roll),
  });
}

registerWorldAbility({
  action: 'undo_randomize',
  humanControl: 'detail panel, world: undo',
  description: 'Restore the pipeline from before the last roll.',
  params: {},
  example: { action: 'undo_randomize' },
  apply: (context) => {
    const previous = context.randomizeHistory.undo();
    if (!previous) return abilityFailed('nothing_to_undo', 'no roll has been made yet');
    context.store.replaceAll(previous);
    return abilitySucceeded('pipeline restored to before the last roll');
  },
});

function tileIdsOf(context: AbilityContext): number[] {
  return context.tileAssets.all().map((tile) => tile.id);
}

function applyRoll(
  context: AbilityContext,
  params: Record<string, unknown>,
  roll: (context: AbilityContext, rng: RandomStream) => PipelineState,
): AbilityResult {
  const seed = readInt(params, 'seed');
  const used = seed.ok ? seed.value : arbitrarySeed();
  context.randomizeHistory.remember(context.store.snapshot());
  context.store.replaceAll(sanitizePipeline(roll(context, mulberry32(used >>> 0))));
  return abilitySucceeded(`rolled a new pipeline with seed ${used >>> 0}`);
}

function arbitrarySeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

function loadPreset(context: AbilityContext, params: Record<string, unknown>): AbilityResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  const state = presetStateOf(context, name.value);
  if (!state) {
    return abilityFailed('unknown_preset', `name must be one of: ${listOf(presetNames(context))}`);
  }
  context.store.replaceAll(sanitizePipeline(state));
  return abilitySucceeded(`loaded preset '${name.value}'`);
}

function presetStateOf(context: AbilityContext, name: string): unknown {
  const example = examplePipelines().find((preset) => preset.name === name);
  return example ? example.state : context.worldPresets.byName(name)?.state;
}

function presetNames(context: AbilityContext): string[] {
  return [
    ...examplePipelines().map((preset) => preset.name),
    ...context.worldPresets.savedPresets().map((preset) => preset.name),
  ];
}

function savePreset(context: AbilityContext, params: Record<string, unknown>): AbilityResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  if (examplePipelines().some((example) => example.name === name.value)) {
    return abilityFailed(
      'name_taken',
      `'${name.value}' is a built-in example — saving under that name would make it unloadable, so pick another`,
    );
  }
  if (context.store.nodes().length === 0) {
    return abilityFailed('empty_pipeline', 'there is nothing to save — the pipeline has no nodes');
  }
  context.worldPresets.save({
    name: name.value,
    description: readOptionalText(params, 'description'),
    state: sanitizePipeline(context.store.snapshot()),
  });
  return abilitySucceeded(`saved preset '${name.value}'`);
}

function deletePreset(context: AbilityContext, params: Record<string, unknown>): AbilityResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  if (!context.worldPresets.byName(name.value)) {
    return abilityFailed(
      'unknown_preset',
      `no saved preset '${name.value}' — saved presets: ${listOf(context.worldPresets.savedPresets().map((preset) => preset.name))}`,
    );
  }
  context.worldPresets.remove(name.value);
  return abilitySucceeded(`deleted saved preset '${name.value}'`);
}

function stampTemplate(context: AbilityContext, params: Record<string, unknown>): AbilityResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  const template = context.templates.byName(name.value);
  if (!template) {
    return abilityFailed(
      'unknown_template',
      `name must be one of: ${listOf(context.templates.all().map((each) => each.name))}`,
    );
  }
  const state = context.store.snapshot();
  const before = params.before_node_id;
  const index = typeof before === 'string' ? indexOfNode(context, before) : state.nodes.length;
  if (index < 0) return abilityFailed('unknown_node', `before_node_id '${String(before)}' does not exist`);
  const stamped = stampTemplateInto(state, template, index);
  context.store.replaceAll(state);
  return abilitySucceeded(`stamped '${template.name}' as ${listOf(stamped.map((node) => node.id))}`);
}

function indexOfNode(context: AbilityContext, nodeId: string): number {
  return context.store.nodes().findIndex((node) => node.id === nodeId);
}

function saveTemplate(context: AbilityContext, params: Record<string, unknown>): AbilityResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  const ids = nodeIdsFrom(params);
  if (!ids.ok) return ids.failure;
  if (context.templates.builtIn().some((builtIn) => builtIn.name === name.value)) {
    return abilityFailed(
      'name_taken',
      `'${name.value}' is a built-in group — saving under that name would make it unreachable, so rename the folder first`,
    );
  }
  const nodes = context.store.nodes().filter((node) => ids.value.includes(node.id));
  if (nodes.length !== ids.value.length) {
    return abilityFailed(
      'unknown_node',
      `node_ids must all exist — the pipeline has: ${listOf(context.store.nodes().map((node) => node.id))}`,
    );
  }
  context.templates.save(templateFromNodes(nodes, name.value, readOptionalText(params, 'description')));
  return abilitySucceeded(`saved template '${name.value}' from ${listOf(ids.value)}`);
}

type NodeIdsRead = { ok: true; value: string[] } | { ok: false; failure: AbilityResult };

function nodeIdsFrom(params: Record<string, unknown>): NodeIdsRead {
  const raw = params.node_ids;
  if (!Array.isArray(raw) || raw.some((id) => typeof id !== 'string') || raw.length === 0) {
    return {
      ok: false,
      failure: abilityFailed('invalid_value', "'node_ids' must be a non-empty array of node id strings"),
    };
  }
  return { ok: true, value: raw as string[] };
}

function deleteTemplate(context: AbilityContext, params: Record<string, unknown>): AbilityResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  if (!context.templates.savedTemplates().some((template) => template.name === name.value)) {
    return abilityFailed(
      'unknown_template',
      `no saved template '${name.value}' — saved templates: ${listOf(context.templates.savedTemplates().map((template) => template.name))}`,
    );
  }
  context.templates.remove(name.value);
  return abilitySucceeded(`deleted saved template '${name.value}'`);
}
