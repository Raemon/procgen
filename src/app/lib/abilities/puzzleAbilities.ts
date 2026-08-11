import { facingVector } from '../world/facing';
import type { UseOutcome } from '../world/puzzles/interaction/useFixture';
import {
  abilityFailed,
  abilitySucceeded,
  type AbilityContext,
  type AbilityMode,
  type AbilityResult,
} from './ability';
import { registerAbility } from './abilityRegistry';

const USE_DESCRIPTION =
  'Work whatever puzzle fixture you are standing on, or failing that the one directly ahead of you: pull a lever, take a key, or read whether a door is still locked. Levers and keys latch once worked, and a chamber unlocks both of its doors the moment every lever, key and pressure plate it lists is satisfied. Crates are the exception — they are pushed by walking into them, not worked.';

const RESET_DESCRIPTION =
  'Put the chamber you are standing in back the way it was generated: crates return to where they started, levers spring back, keys reappear, and its doors lock again. The only way out of a sokoban chamber whose crate you have shoved into a corner.';

const USE_ACTIONS: readonly { action: string; mode: AbilityMode }[] = [
  { action: 'use_fixture', mode: 'god' },
  { action: 'use', mode: 'character' },
];

for (const spec of USE_ACTIONS) {
  registerAbility({
    action: spec.action,
    mode: spec.mode,
    group: 'movement',
    humanControl: 'F',
    description: USE_DESCRIPTION,
    params: {},
    example: { action: spec.action },
    changesWorld: true,
    apply: (context) => useHereOrAhead(context),
  });
}

const RESET_ACTIONS: readonly { action: string; mode: AbilityMode }[] = [
  { action: 'reset_puzzle_room', mode: 'god' },
  { action: 'reset_room', mode: 'character' },
];

for (const spec of RESET_ACTIONS) {
  registerAbility({
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

function useHereOrAhead(context: AbilityContext): AbilityResult {
  const pose = context.actor.pose();
  const underfoot = context.puzzles.use(pose.x, pose.y);
  if (underfoot.ok || underfoot.code !== 'nothing_to_use') return asAbilityResult(underfoot);
  const ahead = facingVector(pose.facing);
  return asAbilityResult(context.puzzles.use(pose.x + ahead.dx, pose.y + ahead.dy));
}

function resetRoomUnderActor(context: AbilityContext): AbilityResult {
  const pose = context.actor.pose();
  const layout = context.puzzles.resetRoomAt(pose.x, pose.y);
  if (!layout) return abilityFailed('no_puzzle_room', `no puzzle chamber covers (${pose.x},${pose.y})`);
  return abilitySucceeded(`reset the ${layout.kindName || 'empty'} chamber at ${layout.key}`);
}

function asAbilityResult(outcome: UseOutcome): AbilityResult {
  return outcome.ok ? abilitySucceeded(outcome.summary) : abilityFailed(outcome.code, outcome.hint);
}
