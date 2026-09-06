import {
  commandFailed,
  commandSucceeded,
  type CommandContext,
  type CommandMode,
  type CommandResult,
} from '@/features/app-shell/runtime/commands/command';
import { createCommandCollection } from '@/features/app-shell/runtime/commands/commandCollection';
import { carriedKeysOf } from './carriedKeys';
import { useHereOrAhead } from './useAtPose';
import type { UseOutcome } from './useOutcome';

const { define: registerCommand, commands: fixtureCommands } = createCommandCollection();
export { fixtureCommands };

const USE_DESCRIPTION =
  'Work whatever fixture you are standing on, or failing that the one directly ahead of you: pull a lever, or try a door. A chamber of levers and pressure plates unlocks its doors the moment every one it lists is satisfied. A keyhole door instead spends one key out of your bag and opens that doorway alone; keys lie on the floor of key chambers and are picked up by walking over them. Crates are the exception: they are pushed by walking into them, not worked, and where a crate stands taller than the ground you jump onto it.';

const RESET_DESCRIPTION =
  'Put the puzzle room you are standing in back the way it was generated: crates return to where they started, levers spring back, keys lie on its floor again, and doors that only this room opens lock again. Keys already in your bag stay there. The only way out of a room whose crate you have shoved into a corner.';

const USE_ACTIONS: readonly { action: string; mode: CommandMode }[] = [
  { action: 'use_fixture', mode: 'god' },
  { action: 'use', mode: 'character' },
];

const RESET_ACTIONS: readonly { action: string; mode: CommandMode }[] = [
  { action: 'reset_puzzle_room', mode: 'god' },
  { action: 'reset_room', mode: 'character' },
];

export const WORLD_VERB_ACTIONS: ReadonlySet<string> = new Set(
  [...USE_ACTIONS, ...RESET_ACTIONS].map((spec) => spec.action),
);

export function isWorldVerb(action: string): boolean {
  return WORLD_VERB_ACTIONS.has(action);
}

for (const spec of USE_ACTIONS) {
  registerCommand({
    action: spec.action,
    mode: spec.mode,
    group: 'movement',
    humanControl: 'F',
    description: USE_DESCRIPTION,
    params: {},
    example: { action: spec.action },
    changesWorld: true,
    apply: (context) => useUnderOrAheadOfActor(context),
  });
}

for (const spec of RESET_ACTIONS) {
  registerCommand({
    action: spec.action,
    mode: spec.mode,
    group: 'movement',
    humanControl: 'R, in a world whose rules put a room back rather than grow a fresh one',
    description: RESET_DESCRIPTION,
    params: {},
    example: { action: spec.action },
    changesWorld: true,
    apply: (context) => resetRoomUnderActor(context),
  });
}

function useUnderOrAheadOfActor(context: CommandContext): CommandResult {
  const pose = context.actor.pose();
  const purse = carriedKeysOf(context.creatures, context.items);
  return asCommandResult(
    useHereOrAhead(context.rules, pose.x, pose.y, pose.facing, context.actor.mine, purse),
  );
}

function resetRoomUnderActor(context: CommandContext): CommandResult {
  const pose = context.actor.pose();
  const described = context.rules.resetRoomAt(pose.x, pose.y);
  if (!described) return commandFailed('no_puzzle_room', `no puzzle room covers (${pose.x},${pose.y})`);
  return commandSucceeded(`reset ${described}`);
}

function asCommandResult(outcome: UseOutcome): CommandResult {
  return outcome.ok ? commandSucceeded(outcome.summary) : commandFailed(outcome.code, outcome.hint);
}
