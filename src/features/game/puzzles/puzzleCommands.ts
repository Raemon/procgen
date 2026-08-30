import { useHereOrAhead } from '@/features/game/puzzles/interaction/useAtPose';
import type { UseOutcome } from '@/features/game/puzzles/interaction/useFixture';
import {
  commandFailed,
  commandSucceeded,
  type CommandContext,
  type CommandMode,
  type CommandResult,
} from '@/features/app-shell/runtime/commands/command';
import { createCommandCollection } from '@/features/app-shell/runtime/commands/commandCollection';

const { define: registerCommand, commands: puzzleCommands } = createCommandCollection();
export { puzzleCommands };



const USE_DESCRIPTION =
  'Work whatever puzzle fixture you are standing on, or failing that the one directly ahead of you: pull a lever, or try a door. A chamber of levers and pressure plates unlocks its doors the moment every one it lists is satisfied. A keyhole door instead spends one key out of your bag and opens that doorway alone; keys lie on the floor of key chambers and are picked up by walking over them. Crates are the exception — they are pushed by walking into them, not worked.';

const RESET_DESCRIPTION =
  'Put the chamber you are standing in back the way it was generated: crates return to where they started, levers spring back, keys lie on its floor again, and its doors lock again. Keys already in your bag stay there. The only way out of a sokoban chamber whose crate you have shoved into a corner.';

const USE_ACTIONS: readonly { action: string; mode: CommandMode }[] = [
  { action: 'use_fixture', mode: 'god' },
  { action: 'use', mode: 'character' },
];

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

const RESET_ACTIONS: readonly { action: string; mode: CommandMode }[] = [
  { action: 'reset_puzzle_room', mode: 'god' },
  { action: 'reset_room', mode: 'character' },
];

for (const spec of RESET_ACTIONS) {
  registerCommand({
    action: spec.action,
    mode: spec.mode,
    group: 'movement',
    humanControl: 'R',
    description: RESET_DESCRIPTION,
    params: {},
    example: { action: spec.action },
    changesWorld: true,
    apply: (context) => resetRoomUnderActor(context),
  });
}

function useUnderOrAheadOfActor(context: CommandContext): CommandResult {
  const pose = context.actor.pose();
  return asCommandResult(
    useHereOrAhead(context.puzzles, pose.x, pose.y, pose.facing, context.keyPurse),
  );
}

function resetRoomUnderActor(context: CommandContext): CommandResult {
  const pose = context.actor.pose();
  const layout = context.puzzles.resetRoomAt(pose.x, pose.y);
  if (!layout) return commandFailed('no_puzzle_room', `no puzzle chamber covers (${pose.x},${pose.y})`);
  return commandSucceeded(`reset the ${layout.kindName || 'empty'} chamber at ${layout.key}`);
}

function asCommandResult(outcome: UseOutcome): CommandResult {
  return outcome.ok ? commandSucceeded(outcome.summary) : commandFailed(outcome.code, outcome.hint);
}
