import {
  commandFailed,
  commandSucceeded,
  type CommandContext,
  type CommandParams,
  type CommandResult,
  type CommandSpec,
} from '@/features/app-shell/runtime/commands/command';
import { createCommandCollection } from '@/features/app-shell/runtime/commands/commandCollection';
import { listOf, readOptionalText, readText } from '@/features/app-shell/runtime/commands/commandParams';
import { runningSavedWorld } from '../running/runningWorld';
import { freeWorldSeedName } from '../seeds/freeWorldSeedName';
import { capturedWorld, restoreSavedWorld } from './capturedWorld';
import type { SavedWorld } from './savedWorld';

const { define: registerCommand, commands: savedWorldCommands } = createCommandCollection();
export { savedWorldCommands };

function registerSavedWorldCommand(
  spec: Omit<CommandSpec, 'mode' | 'group' | 'changesWorld'>,
): CommandSpec {
  return registerCommand({ ...spec, mode: 'god', group: 'world', changesWorld: true });
}

registerSavedWorldCommand({
  action: 'save_world',
  humanControl: 'game panel: 💾 save — and every action in a saved world writes itself back',
  description:
    'Keep the running world: the seed exactly as it stands, plus where the player is, which items have been picked up off the ground, and which puzzle fixtures have been worked. An existing name is overwritten. Omit the name and the running world is saved back under its own name, or a free name derived from its seed.',
  params: {
    name: { kind: 'text', help: 'what to call this save', optional: true },
    description: { kind: 'text', help: 'what happened here', optional: true },
  },
  example: { action: 'save_world', name: 'halfway down the labyrinth' },
  apply: (context, params) => saveRunningWorld(context, params),
});

registerSavedWorldCommand({
  action: 'run_saved_world',
  humanControl: 'asset library, saved worlds folder: ▶ run on a save',
  description:
    'Put a saved world back in the game panel: its frozen seed becomes the pipeline, everything the player had done is applied, and the player stands where the save left them.',
  params: { name: { kind: 'text', help: 'a saved world name — see GET /api/v1/asset-library/saved-worlds' } },
  example: { action: 'run_saved_world', name: 'halfway down the labyrinth' },
  apply: (context, params) => runSavedWorld(context, params),
});

registerSavedWorldCommand({
  action: 'duplicate_saved_world',
  humanControl: 'asset library, saved worlds folder: ⧉ on a save',
  description:
    'Copy a saved world under a free name, so you can carry on from the same point twice without losing either run.',
  params: { name: { kind: 'text', help: 'the saved world to copy' } },
  example: { action: 'duplicate_saved_world', name: 'halfway down the labyrinth' },
  apply: (context, params) => duplicateSavedWorld(context, params),
});

registerSavedWorldCommand({
  action: 'rename_saved_world',
  humanControl: 'asset library, saved worlds folder: click the name on a save row',
  description: 'Rename a saved world. A name already in use is refused.',
  params: {
    name: { kind: 'text', help: 'the saved world to rename' },
    new_name: { kind: 'text', help: 'the name to file it under' },
  },
  example: { action: 'rename_saved_world', name: 'halfway down', new_name: 'the long descent' },
  apply: (context, params) => renameSavedWorld(context, params),
});

registerSavedWorldCommand({
  action: 'delete_saved_world',
  humanControl: 'asset library, saved worlds folder: ✕ on a save',
  description:
    'Delete a saved world. The world seed it grew from is untouched, so the same world can always be grown again from the start.',
  params: { name: { kind: 'text', help: 'the saved world to delete' } },
  example: { action: 'delete_saved_world', name: 'halfway down the labyrinth' },
  apply: (context, params) => deleteSavedWorld(context, params),
});

function saveRunningWorld(context: CommandContext, params: CommandParams): CommandResult {
  const asked = readOptionalText(params, 'name').trim();
  const name = asked === '' ? nameForTheRunningWorld(context) : asked;
  if (name === '') {
    return commandFailed('bad_request', 'a saved world needs a name with something in it');
  }
  const told = readOptionalText(params, 'description');
  const held = context.savedWorlds.byName(name);
  const saved = capturedWorld(
    context,
    name,
    told === '' ? (held?.description ?? '') : told,
    seedBehind(context, name),
  );
  context.savedWorlds.save(saved);
  context.runningWorld.run(runningSavedWorld(name));
  return commandSucceeded(`saved '${name}': ${whatHappenedIn(saved)}`);
}

function runSavedWorld(context: CommandContext, params: CommandParams): CommandResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  const saved = context.savedWorlds.byName(name.value);
  if (!saved) return noSuchSavedWorld(context, name.value);
  restoreSavedWorld(context, saved);
  context.runningWorld.run(runningSavedWorld(saved.name));
  return commandSucceeded(`'${saved.name}' is the world now running: ${whatHappenedIn(saved)}`);
}

function duplicateSavedWorld(context: CommandContext, params: CommandParams): CommandResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  const saved = context.savedWorlds.byName(name.value);
  if (!saved) return noSuchSavedWorld(context, name.value);
  const copy = freeWorldSeedName(`${saved.name} copy`, savedWorldNames(context));
  context.savedWorlds.save({ ...structuredClone(saved), name: copy });
  return commandSucceeded(`copied saved world '${saved.name}' as '${copy}'`);
}

function renameSavedWorld(context: CommandContext, params: CommandParams): CommandResult {
  const from = readText(params, 'name');
  if (!from.ok) return from.failure;
  const to = readText(params, 'new_name');
  if (!to.ok) return to.failure;
  const saved = context.savedWorlds.byName(from.value);
  if (!saved) return noSuchSavedWorld(context, from.value);
  if (from.value === to.value) {
    return commandSucceeded(`saved world '${from.value}' keeps the name it had`);
  }
  if (context.savedWorlds.byName(to.value)) {
    return commandFailed('name_taken', `the library already holds a saved world called '${to.value}'`);
  }
  context.savedWorlds.save({ ...saved, name: to.value });
  context.savedWorlds.remove(from.value);
  if (context.runningWorld.savedWorldName() === from.value) context.runningWorld.renameTo(to.value);
  context.assetFolders.renameKey('savedWorlds', from.value, to.value);
  return commandSucceeded(`saved world '${from.value}' is now '${to.value}'`);
}

function deleteSavedWorld(context: CommandContext, params: CommandParams): CommandResult {
  const name = readText(params, 'name');
  if (!name.ok) return name.failure;
  if (!context.savedWorlds.byName(name.value)) return noSuchSavedWorld(context, name.value);
  context.savedWorlds.remove(name.value);
  if (context.runningWorld.savedWorldName() === name.value) context.runningWorld.run(null);
  return commandSucceeded(`deleted saved world '${name.value}'`);
}

function nameForTheRunningWorld(context: CommandContext): string {
  const running = context.runningWorld.ref();
  if (running?.kind === 'saved') return running.name;
  const from = running?.name ?? 'my world';
  return freeWorldSeedName(from, savedWorldNames(context));
}

function seedBehind(context: CommandContext, name: string): string {
  const running = context.runningWorld.ref();
  if (running?.kind === 'seed') return running.name;
  return context.savedWorlds.byName(name)?.seededBy ?? '';
}

function savedWorldNames(context: CommandContext): string[] {
  return context.savedWorlds.all().map((saved) => saved.name);
}

function noSuchSavedWorld(context: CommandContext, name: string): CommandResult {
  return commandFailed(
    'unknown_saved_world',
    `no saved world '${name}' — the library holds: ${listOf(savedWorldNames(context))}`,
  );
}

function whatHappenedIn(saved: SavedWorld): string {
  const fixtures = saved.puzzles.on.length;
  const crates = saved.puzzles.crates.length;
  return `${saved.takenItems.length} items taken, ${fixtures} fixtures worked, ${crates} crates moved, player at (${saved.player.x},${saved.player.y})`;
}
