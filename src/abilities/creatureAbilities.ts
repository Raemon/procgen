import { BEHAVIOR_CHOICES } from '../creatures/behaviorKinds';
import type { CreaturePatch } from '../creatures/creatureLibrary';
import {
  abilityFailed,
  abilitySucceeded,
  type AbilityContext,
  type AbilityResult,
  type AbilitySpec,
} from './ability';
import { listOf, readInt, readNumber, readText } from './abilityParams';
import { registerAbility } from './abilityRegistry';
import { faceArtFrom } from './tileAbilities';

const CREATURE_ID_HELP = 'id of an existing creature — see GET /api/v1/creatures';

function registerCreatureAbility(
  spec: Omit<AbilitySpec, 'mode' | 'group' | 'changesWorld'>,
): AbilitySpec {
  return registerAbility({ ...spec, mode: 'god', group: 'library', changesWorld: true });
}

registerCreatureAbility({
  action: 'add_creature',
  humanControl: 'library panel, creatures tab: + add creature',
  description:
    'Create a creature definition. Bind it to a points node with set_display to put it in the world.',
  params: {},
  example: { action: 'add_creature' },
  apply: (context) => {
    const creature = context.creatures.add();
    return abilitySucceeded(`added creature ${creature.id} ('${creature.symbol}')`);
  },
});

registerCreatureAbility({
  action: 'duplicate_creature',
  humanControl: 'library panel, creatures tab: ⧉ on a creature row',
  description: 'Copy a creature definition with all its knobs.',
  params: { creature_id: { kind: 'int', help: CREATURE_ID_HELP } },
  example: { action: 'duplicate_creature', creature_id: 0 },
  apply: (context, params) =>
    withCreature(context, params, (creatureId) => {
      const copy = context.creatures.duplicate(creatureId);
      return copy
        ? abilitySucceeded(`duplicated creature ${creatureId} as ${copy.id}`)
        : abilityFailed('unknown_creature', `could not duplicate creature ${creatureId}`);
    }),
});

registerCreatureAbility({
  action: 'update_creature',
  humanControl: 'library panel, creatures tab: the fields and knobs on a creature row',
  description:
    "Change a creature's look or how it moves. Only the fields you pass change.",
  params: {
    creature_id: { kind: 'int', help: CREATURE_ID_HELP },
    name: { kind: 'text', help: 'the creature name', optional: true },
    symbol: { kind: 'text', help: 'the single character it draws as', optional: true },
    color: { kind: 'text', help: 'a #rrggbb color', optional: true },
    behavior: { kind: 'int', help: behaviorHelp(), optional: true },
    speed: { kind: 'number', help: 'tiles per second', optional: true },
    sight: { kind: 'number', help: 'how many tiles away it notices the player', optional: true },
    roam: { kind: 'number', help: 'how far from its spawn cell it will range', optional: true },
    size: { kind: 'number', help: 'how large it is drawn, in tiles', optional: true },
    phasing: { kind: 'int', help: '1 if it walks through blocking tiles, 0 if it must go around', optional: true },
    face_art: { kind: 'json', help: 'cube face art, or null to clear it', optional: true },
  },
  example: { action: 'update_creature', creature_id: 0, behavior: 3, speed: 2.5 },
  apply: (context, params) => updateCreature(context, params),
});

registerCreatureAbility({
  action: 'remove_creature',
  humanControl: 'library panel, creatures tab: ✕ on a creature row',
  description: 'Delete a creature definition. Nodes bound to it stop spawning anything.',
  params: { creature_id: { kind: 'int', help: CREATURE_ID_HELP } },
  example: { action: 'remove_creature', creature_id: 3 },
  apply: (context, params) =>
    withCreature(context, params, (creatureId) => {
      context.creatures.remove(creatureId);
      return abilitySucceeded(`removed creature ${creatureId}`);
    }),
});

function behaviorHelp(): string {
  return `how it moves — ${BEHAVIOR_CHOICES.map((choice) => `${choice.value}=${choice.label}`).join(', ')}`;
}

function withCreature(
  context: AbilityContext,
  params: Record<string, unknown>,
  use: (creatureId: number) => AbilityResult,
): AbilityResult {
  const read = readInt(params, 'creature_id');
  if (!read.ok) return read.failure;
  if (!context.creatures.byId(read.value)) {
    return abilityFailed(
      'unknown_creature',
      `creature_id must be one of: ${listOf(context.creatures.all().map((creature) => creature.id))}`,
    );
  }
  return use(read.value);
}

function updateCreature(context: AbilityContext, params: Record<string, unknown>): AbilityResult {
  return withCreature(context, params, (creatureId) => {
    const patch = creaturePatchFrom(params);
    if (!patch.ok) return patch.failure;
    context.creatures.update(creatureId, patch.value);
    return abilitySucceeded(`creature ${creatureId} updated: ${listOf(Object.keys(patch.value))}`);
  });
}

type CreaturePatchRead =
  | { ok: true; value: CreaturePatch }
  | { ok: false; failure: AbilityResult };

function creaturePatchFrom(params: Record<string, unknown>): CreaturePatchRead {
  const patch: CreaturePatch = {};
  const name = readText(params, 'name');
  if (name.ok) patch.name = name.value;
  const color = readText(params, 'color');
  if (color.ok) patch.color = color.value;
  const symbol = readText(params, 'symbol');
  if (symbol.ok) patch.symbol = [...symbol.value][0]!;
  for (const knob of ['speed', 'sight', 'roam', 'size'] as const) {
    const read = readNumber(params, knob);
    if (read.ok) patch[knob] = read.value;
  }
  const phasing = readInt(params, 'phasing');
  if (phasing.ok) patch.phasing = phasing.value === 0 ? 0 : 1;
  const behavior = behaviorFrom(params);
  if (!behavior.ok) return behavior;
  if (behavior.value !== undefined) patch.behavior = behavior.value;
  const art = faceArtFrom(params);
  if (!art.ok) return art;
  if (art.value !== undefined) patch.faceArt = art.value;
  return { ok: true, value: patch };
}

function behaviorFrom(
  params: Record<string, unknown>,
): { ok: true; value: number | undefined } | { ok: false; failure: AbilityResult } {
  const read = readInt(params, 'behavior');
  if (!read.ok) return { ok: true, value: undefined };
  if (!BEHAVIOR_CHOICES.some((choice) => choice.value === read.value)) {
    return { ok: false, failure: abilityFailed('invalid_value', `'behavior' — ${behaviorHelp()}`) };
  }
  return { ok: true, value: read.value };
}
