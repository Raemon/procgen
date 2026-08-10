import { emptyPipeline, type PipelineState } from '../procgen/pipeline/pipelineState';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import { examplePipelines } from '../procgen/presets/examplePipelines';
import { permutedNodeCombination } from '../procgen/randomize/permuteNodeCombination';
import { permutedSliderParams } from '../procgen/randomize/permuteSliderParams';
import { randomWorldPipeline } from '../procgen/randomize/randomWorldPipeline';
import { copyNameFor } from '../procgen/presets/copyName';
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
    'Set the moment the world is shown at, 0 for the present and negative for years before it. Only nodes that declare they read time answer to it, so a world built from nodes that ignore time looks the same at every moment.',
  params: {
    time: { kind: 'number', help: '0 for the present, negative for years before it' },
  },
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
  humanControl: 'no button of its own — run_world is what the ▶ run button calls',
  description:
    'Replace the whole pipeline with a named preset — one of the built-in examples or one you saved — without changing which world the game panel says is running.',
  params: { name: { kind: 'text', help: 'a preset name — see GET /api/v1/presets' } },
  example: { action: 'load_preset', name: 'islands' },
  apply: (context, params) => loadPreset(context, params),
});

registerWorldAbility({
  action: 'run_world',
  humanControl: 'asset library, worlds folder: ▶ run on a world',
  description:
    'Run a world: its nodes become the pipeline the game panel renders, and the world panel names it as the running world. Editing that world from then on edits what you are looking at.',
  params: { name: { kind: 'text', help: 'a world name — see GET /api/v1/presets' } },
  example: { action: 'run_world', name: 'islands' },
  apply: (context, params) => runWorld(context, params),
});

registerWorldAbility({
  action: 'save_preset',
  humanControl: 'detail panel, world: every edit writes itself back under the world you are editing',
  description:
    'Save the whole current pipeline as a named world. An existing name is overwritten; saving under the name of a built-in example takes that name over, and the example stays behind as what deleting yours falls back to.',
  params: {
    name: { kind: 'text', help: 'the preset name' },
    description: { kind: 'text', help: 'what this world is', optional: true },
  },
  example: { action: 'save_preset', name: 'my archipelago' },
  apply: (context, params) => savePreset(context, params),
});

registerWorldAbility({
  action: 'duplicate_preset',
  humanControl: 'asset library, worlds folder: ⧉ on a world',
  description:
    'Copy a world — a built-in example or one you saved — into your saved worlds under a free name. The world you are editing is untouched.',
  params: { name: { kind: 'text', help: 'the world to copy — see GET /api/v1/presets' } },
  example: { action: 'duplicate_preset', name: 'islands' },
  apply: (context, params) => duplicatePreset(context, params),
});

registerWorldAbility({
  action: 'delete_preset',
  humanControl: 'asset library, worlds folder: ✕ on a world',
  description:
    'Delete a world. Yours is dropped; a built-in example is taken off the library shelf, and load_preset can still name it.',
  params: { name: { kind: 'text', help: 'the world name' } },
  example: { action: 'delete_preset', name: 'my archipelago' },
  apply: (context, params) => deletePreset(context, params),
});

registerWorldAbility({
  action: 'stamp_template',
  humanControl: 'asset library, node groups folder: stamp into the running world',
  description:
    'Insert a saved node group into the pipeline, renamed so its ids do not collide and filed under its own folder. The verb says template for compatibility; the library calls these node groups.',
  params: {
    name: { kind: 'text', help: 'a node group name — see GET /api/v1/templates' },
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
  humanControl:
    'detail panel, world: ⤓ library on a folder band — and every edit to a node group writes itself back this way',
  description:
    'Save a run of nodes as a reusable node group. Wires that point outside the group are dropped; saving under the name of a built-in group takes that name over.',
  params: {
    name: { kind: 'text', help: 'the node group name' },
    node_ids: { kind: 'json', help: 'the ids of the nodes to save, as an array of strings' },
    description: { kind: 'text', help: 'what this group does', optional: true },
  },
  example: { action: 'save_template', name: 'coastline', node_ids: ['n1', 'n2'] },
  apply: (context, params) => saveTemplate(context, params),
});

registerWorldAbility({
  action: 'duplicate_template',
  humanControl: 'asset library, node groups folder: ⧉ on a group',
  description: 'Copy a node group — built-in or saved — into your saved groups under a free name.',
  params: { name: { kind: 'text', help: 'the group to copy — see GET /api/v1/templates' } },
  example: { action: 'duplicate_template', name: 'rivers' },
  apply: (context, params) => duplicateTemplate(context, params),
});

registerWorldAbility({
  action: 'delete_template',
  humanControl: 'detail panel, node group: ✕',
  description:
    'Delete one of your saved node groups. A built-in group edited into a saved one goes back to how it ships.',
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

function runWorld(context: AbilityContext, params: Record<string, unknown>): AbilityResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  if (context.runningWorld.name() === name.value) {
    return abilitySucceeded(`'${name.value}' is already the world running`);
  }
  const loaded = loadPreset(context, params);
  if (!loaded.ok) return loaded;
  context.runningWorld.setName(name.value);
  return abilitySucceeded(`'${name.value}' is the world now running`);
}

function presetStateOf(context: AbilityContext, name: string): unknown {
  return worldPresetNamed(context, name)?.state;
}

function presetNames(context: AbilityContext): string[] {
  return [
    ...new Set([
      ...context.worldPresets.savedPresets().map((preset) => preset.name),
      ...examplePipelines().map((preset) => preset.name),
    ]),
  ];
}

function savePreset(context: AbilityContext, params: Record<string, unknown>): AbilityResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  if (context.store.nodes().length === 0) {
    return abilityFailed('empty_pipeline', 'there is nothing to save — the pipeline has no nodes');
  }
  context.worldPresets.save({
    name: name.value,
    description: readOptionalText(params, 'description') || describedElsewhere(context, name.value),
    state: sanitizePipeline(context.store.snapshot()),
  });
  return abilitySucceeded(`saved preset '${name.value}'`);
}

function describedElsewhere(context: AbilityContext, name: string): string {
  return worldPresetNamed(context, name)?.description ?? '';
}

function duplicatePreset(context: AbilityContext, params: Record<string, unknown>): AbilityResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  const original = worldPresetNamed(context, name.value);
  if (!original) {
    return abilityFailed('unknown_preset', `name must be one of: ${listOf(presetNames(context))}`);
  }
  const copy = copyNameFor(original.name, presetNames(context));
  context.worldPresets.save({
    name: copy,
    description: original.description,
    state: sanitizePipeline(original.state),
  });
  return abilitySucceeded(`copied world '${original.name}' as '${copy}'`);
}

function worldPresetNamed(context: AbilityContext, name: string) {
  return (
    context.worldPresets.byName(name) ?? examplePipelines().find((preset) => preset.name === name)
  );
}

function duplicateTemplate(context: AbilityContext, params: Record<string, unknown>): AbilityResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  const original = context.templates.byName(name.value);
  if (!original) {
    return abilityFailed(
      'unknown_template',
      `name must be one of: ${listOf(context.templates.all().map((each) => each.name))}`,
    );
  }
  const copy = copyNameFor(original.name, context.templates.all().map((each) => each.name));
  context.templates.save({ ...original, name: copy });
  return abilitySucceeded(`copied group '${original.name}' as '${copy}'`);
}

function deletePreset(context: AbilityContext, params: Record<string, unknown>): AbilityResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  if (!worldPresetNamed(context, name.value)) {
    return abilityFailed(
      'unknown_preset',
      `no world '${name.value}' — the library holds: ${listOf(presetNames(context))}`,
    );
  }
  context.worldPresets.remove(name.value);
  if (examplePipelines().some((example) => example.name === name.value)) {
    context.worldPresets.hideExample(name.value);
  }
  return abilitySucceeded(`deleted world '${name.value}'`);
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
  const nodes = context.store.nodes().filter((node) => ids.value.includes(node.id));
  if (nodes.length !== ids.value.length) {
    return abilityFailed(
      'unknown_node',
      `node_ids must all exist — the pipeline has: ${listOf(context.store.nodes().map((node) => node.id))}`,
    );
  }
  const description =
    readOptionalText(params, 'description') || (context.templates.byName(name.value)?.description ?? '');
  context.templates.save(templateFromNodes(nodes, name.value, description));
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
