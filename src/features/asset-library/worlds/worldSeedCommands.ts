import { emptyPipeline, type PipelineState } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';
import { examplePipelines } from '@/features/asset-library/worlds/seeds/examplePipelines';
import { clonedState } from '@/features/asset-library/worlds/randomize/clonedState';
import { permutedNodeCombination } from '@/features/asset-library/worlds/randomize/permuteNodeCombination';
import { permutedSliderParams } from '@/features/asset-library/worlds/randomize/permuteSliderParams';
import { rollInt } from '@/features/asset-library/worlds/randomize/randomRolls';
import {
  PLAYABLE_PACES,
  rolledUntilPlayable,
  spawnPacesOf,
  type PlayableRoll,
} from '@/features/asset-library/worlds/randomize/playableRoll';
import { randomWorldPipeline } from '@/features/asset-library/worlds/randomize/randomWorldPipeline';
import { recipeTilesOf, type RecipeTiles } from '@/features/asset-library/worlds/randomize/recipeTiles';
import { copyNameFor } from '@/features/asset-library/worlds/seeds/copyName';
import { stampTemplateInto } from '@/features/asset-library/node-groups/stampTemplate';
import { templateFromNodes } from '@/features/asset-library/node-groups/templateFromNodes';
import { mulberry32, type RandomStream } from '@/features/asset-library/worlds/random/mulberry32';
import {
  commandFailed,
  commandSucceeded,
  type CommandContext,
  type CommandResult,
  type CommandSpec,
  type CommandParams,
} from '@/features/app-shell/runtime/commands/command';
import { listOf, readInt, readNumber, readOptionalText, readText } from '@/features/app-shell/runtime/commands/commandParams';
import { createCommandCollection } from '@/features/app-shell/runtime/commands/commandCollection';
import { runningSeed } from '@/features/asset-library/worlds/running/runningWorld';

const { define: registerCommand, commands: worldSeedCommands } = createCommandCollection();
export { worldSeedCommands };


function registerWorldSeedCommand(
  spec: Omit<CommandSpec, 'mode' | 'group' | 'changesWorld'>,
): CommandSpec {
  return registerCommand({ ...spec, mode: 'god', group: 'world', changesWorld: true });
}

registerWorldSeedCommand({
  action: 'set_seed',
  humanControl: 'detail panel, world seed: seed number row',
  description: 'Reseed the world. The same pipeline and the same seed always regenerate the same world.',
  params: { seed: { kind: 'int', help: 'any integer' } },
  example: { action: 'set_seed', seed: 20260806 },
  apply: (context, params) => {
    const seed = readInt(params, 'seed');
    if (!seed.ok) return seed.failure;
    context.store.setSeed(seed.value);
    return commandSucceeded(`seed = ${seed.value}; the world regenerated`);
  },
});

registerWorldSeedCommand({
  action: 'set_daylight',
  humanControl: 'detail panel, world seed: daylight row',
  description:
    'Set how much light the sky gives this world, 0 to 1. At 0 nothing is lit until a tile, an item or a character carrying a light emits some — the setting for caves and underground worlds.',
  params: { daylight: { kind: 'number', help: '0 for pitch dark, 1 for full daylight' } },
  example: { action: 'set_daylight', daylight: 0 },
  apply: (context, params) => {
    const daylight = readNumber(params, 'daylight');
    if (!daylight.ok) return daylight.failure;
    context.store.setDaylight(daylight.value);
    return commandSucceeded(`daylight = ${context.store.daylight()}`);
  },
});

registerWorldSeedCommand({
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
    return commandSucceeded(`time = ${context.store.time()}`);
  },
});

registerWorldSeedCommand({
  action: 'clear_pipeline',
  humanControl: 'detail panel, world: clear',
  description: 'Remove every node, leaving an empty world to build from zero.',
  params: {},
  example: { action: 'clear_pipeline' },
  apply: (context) => {
    context.store.replaceAll(emptyPipeline());
    return commandSucceeded('pipeline cleared');
  },
});

registerWorldSeedCommand({
  action: 'load_world_seed',
  humanControl: 'no button of its own — run_world_seed is what the ▶ run button calls',
  description:
    'Replace the whole pipeline with a named world seed — one of the built-in examples or one you saved — without changing which world the game panel says is running.',
  params: { name: { kind: 'text', help: 'a world seed name — see GET /api/v1/asset-library/world-seeds' } },
  example: { action: 'load_world_seed', name: 'islands' },
  apply: (context, params) => loadWorldSeed(context, params),
});

registerWorldSeedCommand({
  action: 'run_world_seed',
  humanControl: 'asset library, world seeds folder: ▶ run on a world',
  description:
    'Run a world: its nodes become the pipeline the game panel renders, and the world panel names it as the running world. Editing that world from then on edits what you are looking at.',
  params: { name: { kind: 'text', help: 'a world seed name — see GET /api/v1/asset-library/world-seeds' } },
  example: { action: 'run_world_seed', name: 'islands' },
  apply: (context, params) => runWorldSeed(context, params),
});

registerWorldSeedCommand({
  action: 'save_world_seed',
  humanControl: 'detail panel, world: every edit writes itself back under the world you are editing',
  description:
    'Save the whole current pipeline as a named world. An existing name is overwritten; saving under the name of a built-in example takes that name over, and the example stays behind as what deleting yours falls back to.',
  params: {
    name: { kind: 'text', help: 'the world seed name' },
    description: { kind: 'text', help: 'what this world seed grows', optional: true },
  },
  example: { action: 'save_world_seed', name: 'my archipelago' },
  apply: (context, params) => saveWorldSeed(context, params),
});

registerWorldSeedCommand({
  action: 'duplicate_world_seed',
  humanControl: 'asset library, world seeds folder: ⧉ on a world',
  description:
    'Copy a world — a built-in example or one you saved — into your saved worlds under a free name. The world you are editing is untouched.',
  params: { name: { kind: 'text', help: 'the world seed to copy — see GET /api/v1/asset-library/world-seeds' } },
  example: { action: 'duplicate_world_seed', name: 'islands' },
  apply: (context, params) => duplicateWorldSeed(context, params),
});

registerWorldSeedCommand({
  action: 'rename_world_seed',
  humanControl: 'asset library, world seeds folder: click the name on a world row',
  description:
    'Rename a world. One of yours is filed under the new name; a built-in example is saved under the new name and taken off the shelf under the old one. A world that is running keeps running under its new name.',
  params: {
    name: { kind: 'text', help: 'the world to rename — see GET /api/v1/asset-library/world-seeds' },
    new_name: { kind: 'text', help: 'the name to file it under; a name already in use is refused' },
  },
  example: { action: 'rename_world_seed', name: 'islands', new_name: 'my archipelago' },
  apply: (context, params) => renameWorldSeed(context, params),
});

registerWorldSeedCommand({
  action: 'delete_world_seed',
  humanControl: 'asset library, world seeds folder: ✕ on a world',
  description:
    'Delete a world. Yours is dropped; a built-in example is taken off the library shelf, and load_world_seed can still name it.',
  params: { name: { kind: 'text', help: 'the world name' } },
  example: { action: 'delete_world_seed', name: 'my archipelago' },
  apply: (context, params) => deleteWorldSeed(context, params),
});

registerWorldSeedCommand({
  action: 'stamp_template',
  humanControl: 'asset library, node groups folder: stamp into the running world',
  description:
    'Insert a saved node group into the pipeline, renamed so its ids do not collide and filed under its own folder. The verb says template for compatibility; the library calls these node groups.',
  params: {
    name: { kind: 'text', help: 'a node group name — see GET /api/v1/asset-library/node-groups' },
    before_node_id: {
      kind: 'nodeId',
      help: 'insert before this node; omitted means the end of the list',
      optional: true,
    },
  },
  example: { action: 'stamp_template', name: 'rivers' },
  apply: (context, params) => stampTemplate(context, params),
});

registerWorldSeedCommand({
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

registerWorldSeedCommand({
  action: 'duplicate_template',
  humanControl: 'asset library, node groups folder: ⧉ on a group',
  description: 'Copy a node group — built-in or saved — into your saved groups under a free name.',
  params: { name: { kind: 'text', help: 'the group to copy — see GET /api/v1/asset-library/node-groups' } },
  example: { action: 'duplicate_template', name: 'rivers' },
  apply: (context, params) => duplicateTemplate(context, params),
});

registerWorldSeedCommand({
  action: 'rename_template',
  humanControl: 'asset library, node groups folder: click the name on a group row',
  description:
    'Rename a node group. One of yours is filed under the new name; a built-in group is saved under the new name and taken off the shelf under the old one.',
  params: {
    name: { kind: 'text', help: 'the group to rename — see GET /api/v1/asset-library/node-groups' },
    new_name: { kind: 'text', help: 'the name to file it under; a name already in use is refused' },
  },
  example: { action: 'rename_template', name: 'rivers', new_name: 'braided rivers' },
  apply: (context, params) => renameTemplate(context, params),
});

registerWorldSeedCommand({
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
  roll(context: CommandContext, rng: RandomStream): PipelineState;
}[] = [
  {
    action: 'randomize_seed',
    humanControl: 'game panel: 🎲 reroll — and detail panel, world: 🎲 on the seed row',
    description: 'Reroll the world seed, keeping every node and knob exactly as they are.',
    roll: (context, rng) => ({ ...clonedState(context.store.snapshot()), seed: rollInt(rng, 1, 999_999) }),
  },
  {
    action: 'randomize_world_seed',
    humanControl: 'game panel: ✨ new world — and detail panel, world: 🎲 world',
    description: 'Replace the pipeline with a freshly rolled node combination.',
    roll: (context, rng) => randomWorldPipeline(rng, recipeTilesFor(context)),
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
    roll: (context, rng) => permutedNodeCombination(context.store.snapshot(), rng, recipeTilesFor(context)),
  },
];

for (const entry of ROLLS) {
  registerWorldSeedCommand({
    action: entry.action,
    humanControl: entry.humanControl,
    description: `${entry.description} Without a seed the roll repeats until the player would land with at least ${PLAYABLE_PACES} paces of walkable ground, keeping the roomiest attempt. Pass a seed to make a single reproducible roll; undo_randomize puts it back.`,
    params: {
      seed: { kind: 'int', help: 'seed for this roll; omitted means an arbitrary one', optional: true },
    },
    example: { action: entry.action },
    apply: (context, params) => applyRoll(context, params, entry.roll),
  });
}

registerWorldSeedCommand({
  action: 'undo_randomize',
  humanControl: 'detail panel, world: undo',
  description: 'Restore the pipeline from before the last roll.',
  params: {},
  example: { action: 'undo_randomize' },
  apply: (context) => {
    const previous = context.randomizeHistory.undo();
    if (!previous) return commandFailed('nothing_to_undo', 'no roll has been made yet');
    context.store.replaceAll(previous);
    return commandSucceeded('pipeline restored to before the last roll');
  },
});

function recipeTilesFor(context: CommandContext): RecipeTiles {
  return recipeTilesOf(context.tileAssets.all());
}

function applyRoll(
  context: CommandContext,
  params: CommandParams,
  roll: (context: CommandContext, rng: RandomStream) => PipelineState,
): CommandResult {
  const seed = readInt(params, 'seed');
  context.randomizeHistory.remember(context.store.snapshot());
  if (seed.ok) {
    context.store.replaceAll(sanitizePipeline(roll(context, mulberry32(seed.value >>> 0))));
    return commandSucceeded(`rolled with seed ${seed.value >>> 0}`);
  }
  const pose = context.actor.pose();
  const rolled = rolledUntilPlayable(
    (rollSeed) => sanitizePipeline(roll(context, mulberry32(rollSeed))),
    (state) => spawnPacesOf(state, context, pose),
    arbitrarySeed,
  );
  context.store.replaceAll(rolled.state);
  return commandSucceeded(rollSummaryOf(rolled));
}

function rollSummaryOf(rolled: PlayableRoll): string {
  const attempts = rolled.rolls === 1 ? '' : ` after ${rolled.rolls} rolls`;
  const spawn =
    rolled.paces >= PLAYABLE_PACES
      ? `the player lands with at least ${PLAYABLE_PACES} paces to walk`
      : `even the roomiest spawn found offers only ${rolled.paces} paces`;
  return `rolled with seed ${rolled.seed}${attempts}; ${spawn}`;
}

function arbitrarySeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

function loadWorldSeed(context: CommandContext, params: CommandParams): CommandResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  const state = worldSeedStateOf(context, name.value);
  if (!state) {
    return commandFailed('unknown_world_seed', `name must be one of: ${listOf(worldSeedNames(context))}`);
  }
  context.store.replaceAll(sanitizePipeline(state));
  return commandSucceeded(`loaded world seed '${name.value}'`);
}

function runWorldSeed(context: CommandContext, params: CommandParams): CommandResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  if (context.runningWorld.seedName() === name.value) {
    return commandSucceeded(`'${name.value}' is already the world running`);
  }
  const loaded = loadWorldSeed(context, params);
  if (!loaded.ok) return loaded;
  context.runningWorld.run(runningSeed(name.value));
  return commandSucceeded(`'${name.value}' is the world now running`);
}

function worldSeedStateOf(context: CommandContext, name: string): unknown {
  return worldSeedNamed(context, name)?.state;
}

function worldSeedNames(context: CommandContext): string[] {
  return [
    ...new Set([
      ...context.worldSeeds.savedWorldSeeds().map((preset) => preset.name),
      ...examplePipelines().map((preset) => preset.name),
    ]),
  ];
}

function saveWorldSeed(context: CommandContext, params: CommandParams): CommandResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  if (context.store.nodes().length === 0) {
    return commandFailed('empty_pipeline', 'there is nothing to save — the pipeline has no nodes');
  }
  context.worldSeeds.save({
    name: name.value,
    description: readOptionalText(params, 'description') || describedElsewhere(context, name.value),
    state: sanitizePipeline(context.store.snapshot()),
  });
  return commandSucceeded(`saved preset '${name.value}'`);
}

function describedElsewhere(context: CommandContext, name: string): string {
  return worldSeedNamed(context, name)?.description ?? '';
}

function duplicateWorldSeed(context: CommandContext, params: CommandParams): CommandResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  const original = worldSeedNamed(context, name.value);
  if (!original) {
    return commandFailed('unknown_world_seed', `name must be one of: ${listOf(worldSeedNames(context))}`);
  }
  const copy = copyNameFor(original.name, worldSeedNames(context));
  context.worldSeeds.save({
    name: copy,
    description: original.description,
    state: sanitizePipeline(original.state),
  });
  return commandSucceeded(`copied world '${original.name}' as '${copy}'`);
}

function worldSeedNamed(context: CommandContext, name: string) {
  return (
    context.worldSeeds.byName(name) ?? examplePipelines().find((preset) => preset.name === name)
  );
}

function duplicateTemplate(context: CommandContext, params: CommandParams): CommandResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  const original = context.templates.byName(name.value);
  if (!original) {
    return commandFailed(
      'unknown_template',
      `name must be one of: ${listOf(context.templates.all().map((each) => each.name))}`,
    );
  }
  const copy = copyNameFor(original.name, context.templates.all().map((each) => each.name));
  context.templates.save({ ...original, name: copy });
  return commandSucceeded(`copied group '${original.name}' as '${copy}'`);
}

function deleteWorldSeed(context: CommandContext, params: CommandParams): CommandResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  if (!worldSeedNamed(context, name.value)) {
    return commandFailed(
      'unknown_world_seed',
      `no world '${name.value}' — the library holds: ${listOf(worldSeedNames(context))}`,
    );
  }
  takeWorldSeedOffTheShelf(context, name.value);
  return commandSucceeded(`deleted world '${name.value}'`);
}

function takeWorldSeedOffTheShelf(context: CommandContext, name: string): void {
  context.worldSeeds.remove(name);
  if (examplePipelines().some((example) => example.name === name)) {
    context.worldSeeds.hideExample(name);
  }
}

function renameWorldSeed(context: CommandContext, params: CommandParams): CommandResult {
  const named = renaming(params);
  if (!named.ok) return named.failure;
  const { from, to } = named.value;
  const world = worldSeedNamed(context, from);
  if (!world) {
    return commandFailed('unknown_world_seed', `name must be one of: ${listOf(worldSeedNames(context))}`);
  }
  if (from === to) return commandSucceeded(`world '${from}' keeps the name it had`);
  if (worldSeedNames(context).includes(to)) {
    return commandFailed('name_taken', `the library already holds a world called '${to}'`);
  }
  context.worldSeeds.save({ ...world, name: to, state: sanitizePipeline(world.state) });
  takeWorldSeedOffTheShelf(context, from);
  if (context.runningWorld.seedName() === from) context.runningWorld.renameTo(to);
  context.assetFolders.renameKey('worldSeeds', from, to);
  return commandSucceeded(`world '${from}' is now '${to}'`);
}

function renameTemplate(context: CommandContext, params: CommandParams): CommandResult {
  const named = renaming(params);
  if (!named.ok) return named.failure;
  const { from, to } = named.value;
  const group = context.templates.byName(from);
  if (!group) {
    return commandFailed(
      'unknown_template',
      `name must be one of: ${listOf(context.templates.all().map((each) => each.name))}`,
    );
  }
  if (from === to) return commandSucceeded(`group '${from}' keeps the name it had`);
  if (context.templates.byName(to)) {
    return commandFailed('name_taken', `the library already holds a node group called '${to}'`);
  }
  context.templates.save({ ...group, name: to });
  context.templates.remove(from);
  if (context.templates.builtIn().some((shipped) => shipped.name === from)) {
    context.templates.hideBuiltIn(from);
  }
  context.assetFolders.renameKey('groups', from, to);
  return commandSucceeded(`group '${from}' is now '${to}'`);
}

type Renaming =
  | { ok: true; value: { from: string; to: string } }
  | { ok: false; failure: CommandResult };

function renaming(params: CommandParams): Renaming {
  const from = readText(params, 'name');
  if (!from.ok) return from;
  const to = readText(params, 'new_name');
  if (!to.ok) return to;
  return { ok: true, value: { from: from.value, to: to.value } };
}

function stampTemplate(context: CommandContext, params: CommandParams): CommandResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  const template = context.templates.byName(name.value);
  if (!template) {
    return commandFailed(
      'unknown_template',
      `name must be one of: ${listOf(context.templates.all().map((each) => each.name))}`,
    );
  }
  const state = context.store.snapshot();
  const before = params.before_node_id;
  const index = typeof before === 'string' ? indexOfNode(context, before) : state.nodes.length;
  if (index < 0) return commandFailed('unknown_node', `before_node_id '${String(before)}' does not exist`);
  const stamped = stampTemplateInto(state, template, index);
  context.store.replaceAll(state);
  return commandSucceeded(`stamped '${template.name}' as ${listOf(stamped.map((node) => node.id))}`);
}

function indexOfNode(context: CommandContext, nodeId: string): number {
  return context.store.nodes().findIndex((node) => node.id === nodeId);
}

function saveTemplate(context: CommandContext, params: CommandParams): CommandResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  const ids = nodeIdsFrom(params);
  if (!ids.ok) return ids.failure;
  const nodes = context.store.nodes().filter((node) => ids.value.includes(node.id));
  if (nodes.length !== ids.value.length) {
    return commandFailed(
      'unknown_node',
      `node_ids must all exist — the pipeline has: ${listOf(context.store.nodes().map((node) => node.id))}`,
    );
  }
  const description =
    readOptionalText(params, 'description') || (context.templates.byName(name.value)?.description ?? '');
  context.templates.save(templateFromNodes(nodes, name.value, description));
  return commandSucceeded(`saved template '${name.value}' from ${listOf(ids.value)}`);
}

type NodeIdsRead = { ok: true; value: string[] } | { ok: false; failure: CommandResult };

function nodeIdsFrom(params: CommandParams): NodeIdsRead {
  const raw = params.node_ids;
  if (!Array.isArray(raw) || raw.some((id) => typeof id !== 'string') || raw.length === 0) {
    return {
      ok: false,
      failure: commandFailed('invalid_value', "'node_ids' must be a non-empty array of node id strings"),
    };
  }
  return { ok: true, value: raw as string[] };
}

function deleteTemplate(context: CommandContext, params: CommandParams): CommandResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  if (!context.templates.savedTemplates().some((template) => template.name === name.value)) {
    return commandFailed(
      'unknown_template',
      `no saved template '${name.value}' — saved templates: ${listOf(context.templates.savedTemplates().map((template) => template.name))}`,
    );
  }
  context.templates.remove(name.value);
  return commandSucceeded(`deleted saved template '${name.value}'`);
}
