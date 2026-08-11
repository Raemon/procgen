import { BEHAVIOR_CHOICES } from '@/features/asset-library/creatures/behaviorKinds';
import { CHARACTER, ENTITY_KIND_CHOICES, isEntityKind } from '@/features/asset-library/creatures/entityKinds';
import type { CreaturePatch } from '@/features/asset-library/creatures/creatureAssets';
import { blankInventory } from '@/features/asset-library/items/inventory/inventoryDef';
import {
  commandFailed,
  commandSucceeded,
  type CommandContext,
  type CommandResult,
  type CommandSpec,
} from '@/features/app-shell/runtime/commands/command';
import { listOf, readInt, readNumber, readText } from '@/features/app-shell/runtime/commands/commandParams';
import { createCommandCollection } from '@/features/app-shell/runtime/commands/commandCollection';
import { faceArtFrom } from '@/features/asset-library/tiles/tileCommands';

const { define: registerCommand, commands: creatureCommands } = createCommandCollection();
export { creatureCommands };



const CREATURE_ID_HELP = 'id of an existing creature — see GET /api/v1/asset-library/creatures';

function registerCreatureCommand(
  spec: Omit<CommandSpec, 'mode' | 'group' | 'changesWorld'>,
): CommandSpec {
  return registerCommand({ ...spec, mode: 'god', group: 'assets', changesWorld: true });
}

registerCreatureCommand({
  action: 'add_creature',
  humanControl: 'asset library, creatures folder: + add creature',
  description:
    'Create a creature definition. Bind it to a points node with set_display to put it in the world.',
  params: {},
  example: { action: 'add_creature' },
  apply: (context) => {
    const creature = context.creatures.add();
    return commandSucceeded(`added creature ${creature.id} ('${creature.symbol}')`);
  },
});

registerCreatureCommand({
  action: 'add_character',
  humanControl: 'asset library, characters folder: + add character',
  description:
    'Create a character: a creature in every respect — same look, movement and spawning — that starts with an empty inventory grid. Reshape the grid with set_inventory.',
  params: {},
  example: { action: 'add_character' },
  apply: (context) => {
    const character = context.creatures.addCharacter();
    return commandSucceeded(
      `added character ${character.id} with a ${character.inventory!.width}x${character.inventory!.height} inventory`,
    );
  },
});

registerCreatureCommand({
  action: 'duplicate_creature',
  humanControl: 'detail panel, creatures: ⧉ on a creature row',
  description: 'Copy a creature definition with all its knobs.',
  params: { creature_id: { kind: 'int', help: CREATURE_ID_HELP } },
  example: { action: 'duplicate_creature', creature_id: 0 },
  apply: (context, params) =>
    withCreature(context, params, (creatureId) => {
      const copy = context.creatures.duplicate(creatureId);
      return copy
        ? commandSucceeded(`duplicated creature ${creatureId} as ${copy.id}`)
        : commandFailed('unknown_creature', `could not duplicate creature ${creatureId}`);
    }),
});

registerCreatureCommand({
  action: 'update_creature',
  humanControl: 'detail panel, creatures: the fields and knobs on a creature row',
  description:
    "Change a creature's look or how it moves. Only the fields you pass change.",
  params: {
    creature_id: { kind: 'int', help: CREATURE_ID_HELP },
    name: { kind: 'text', help: 'the creature name', optional: true },
    symbol: { kind: 'text', help: 'the single character it draws as', optional: true },
    color: { kind: 'text', help: 'a #rrggbb color, or #rrggbbaa with aa=00 for transparent', optional: true },
    behavior: { kind: 'int', help: behaviorHelp(), optional: true },
    speed: { kind: 'number', help: 'tiles per second', optional: true },
    sight: { kind: 'number', help: 'how many tiles away it notices the player', optional: true },
    roam: { kind: 'number', help: 'how far from its spawn cell it will range', optional: true },
    body_width: { kind: 'number', help: 'how wide its body is, in tiles', optional: true },
    body_height: { kind: 'number', help: 'how tall its body is, in tiles — characters default to 2', optional: true },
    phasing: { kind: 'int', help: '1 if it walks through blocking tiles, 0 if it must go around', optional: true },
    kind: { kind: 'int', help: entityKindHelp(), optional: true },
    face_art: { kind: 'json', help: 'cube face art, or null to clear it', optional: true },
  },
  example: { action: 'update_creature', creature_id: 0, behavior: 3, speed: 2.5 },
  apply: (context, params) => updateCreature(context, params),
});

registerCreatureCommand({
  action: 'remove_creature',
  humanControl: 'detail panel, creatures: ✕ on a creature row',
  description: 'Delete a creature definition. Nodes bound to it stop spawning anything.',
  params: { creature_id: { kind: 'int', help: CREATURE_ID_HELP } },
  example: { action: 'remove_creature', creature_id: 3 },
  apply: (context, params) =>
    withCreature(context, params, (creatureId) => {
      context.creatures.remove(creatureId);
      return commandSucceeded(`removed creature ${creatureId}`);
    }),
});

function behaviorHelp(): string {
  return `how it moves — ${BEHAVIOR_CHOICES.map((choice) => `${choice.value}=${choice.label}`).join(', ')}`;
}

function entityKindHelp(): string {
  return `what it is — ${ENTITY_KIND_CHOICES.map((choice) => `${choice.value}=${choice.label}`).join(', ')}; a character keeps an inventory`;
}

export function withCreature(
  context: CommandContext,
  params: Record<string, unknown>,
  use: (creatureId: number) => CommandResult,
): CommandResult {
  const read = readInt(params, 'creature_id');
  if (!read.ok) return read.failure;
  if (!context.creatures.byId(read.value)) {
    return commandFailed(
      'unknown_creature',
      `creature_id must be one of: ${listOf(context.creatures.all().map((creature) => creature.id))}`,
    );
  }
  return use(read.value);
}

function updateCreature(context: CommandContext, params: Record<string, unknown>): CommandResult {
  return withCreature(context, params, (creatureId) => {
    const patch = creaturePatchFrom(params);
    if (!patch.ok) return patch.failure;
    const applied = inventoryForKind(context, creatureId, patch.value);
    context.creatures.update(creatureId, applied);
    return commandSucceeded(`creature ${creatureId} updated: ${listOf(Object.keys(applied))}`);
  });
}

type CreaturePatchRead =
  | { ok: true; value: CreaturePatch }
  | { ok: false; failure: CommandResult };

function creaturePatchFrom(params: Record<string, unknown>): CreaturePatchRead {
  const patch: CreaturePatch = {};
  const name = readText(params, 'name');
  if (name.ok) patch.name = name.value;
  const color = readText(params, 'color');
  if (color.ok) patch.color = color.value;
  const symbol = readText(params, 'symbol');
  if (symbol.ok) patch.symbol = [...symbol.value][0]!;
  for (const knob of ['speed', 'sight', 'roam'] as const) {
    const read = readNumber(params, knob);
    if (read.ok) patch[knob] = read.value;
  }
  addBodySizeToPatch(params, patch);
  const phasing = readInt(params, 'phasing');
  if (phasing.ok) patch.phasing = phasing.value === 0 ? 0 : 1;
  const behavior = behaviorFrom(params);
  if (!behavior.ok) return behavior;
  if (behavior.value !== undefined) patch.behavior = behavior.value;
  const kind = entityKindFrom(params);
  if (!kind.ok) return kind;
  if (kind.value !== undefined) patch.kind = kind.value;
  const art = faceArtFrom(params);
  if (!art.ok) return art;
  if (art.value !== undefined) patch.faceArt = art.value;
  return { ok: true, value: patch };
}

const BODY_SIZE_PARAMS = [
  ['body_width', 'bodyWidth'],
  ['body_height', 'bodyHeight'],
] as const;

function addBodySizeToPatch(params: Record<string, unknown>, patch: CreaturePatch): void {
  for (const [param, field] of BODY_SIZE_PARAMS) {
    const read = readNumber(params, param);
    if (read.ok && read.value > 0) patch[field] = read.value;
  }
}

function behaviorFrom(
  params: Record<string, unknown>,
): { ok: true; value: number | undefined } | { ok: false; failure: CommandResult } {
  const read = readInt(params, 'behavior');
  if (!read.ok) return { ok: true, value: undefined };
  if (!BEHAVIOR_CHOICES.some((choice) => choice.value === read.value)) {
    return { ok: false, failure: commandFailed('invalid_value', `'behavior' — ${behaviorHelp()}`) };
  }
  return { ok: true, value: read.value };
}

function entityKindFrom(
  params: Record<string, unknown>,
): { ok: true; value: number | undefined } | { ok: false; failure: CommandResult } {
  const read = readInt(params, 'kind');
  if (!read.ok) return { ok: true, value: undefined };
  if (!isEntityKind(read.value)) {
    return { ok: false, failure: commandFailed('invalid_value', `'kind' — ${entityKindHelp()}`) };
  }
  return { ok: true, value: read.value };
}

function inventoryForKind(
  context: CommandContext,
  creatureId: number,
  patch: CreaturePatch,
): CreaturePatch {
  const alreadyHasOne = context.creatures.byId(creatureId)?.inventory !== null;
  if (patch.kind !== CHARACTER || alreadyHasOne) return patch;
  return { ...patch, inventory: blankInventory() };
}
