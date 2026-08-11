import { slideAlongEachAxis, type Step } from '@/features/game/input/cameraRelativeStep';
import { facingRelativeStep } from '@/features/game/input/facingRelativeStep';
import { FACING_NAMES, facingVector, type FacingIndex } from '@/features/game/facing';
import {
  commandFailed,
  commandSucceeded,
  type CommandContext,
  type CommandResult,
} from '@/features/app-shell/runtime/commands/command';
import { createCommandCollection } from '@/features/app-shell/runtime/commands/commandCollection';

const { define: registerCommand, commands: movementCommands } = createCommandCollection();
export { movementCommands };


FACING_NAMES.forEach((name, compass) => {
  registerCommand({
    action: `step_${name}`,
    mode: 'god',
    group: 'movement',
    humanControl: 'W/S/Q/E or ↑/↓, camera-relative',
    description: `Step one tile ${name}.`,
    params: {},
    example: { action: `step_${name}` },
    changesWorld: false,
    apply: (context) => stepBy(context, vectorStep(compass as FacingIndex)),
  });
});


const CHARACTER_STEPS: readonly {
  action: string;
  humanControl: string;
  description: string;
  forward: number;
  strafe: number;
}[] = [
  {
    action: 'step_forward',
    humanControl: 'W / ↑',
    description: 'Step one tile in the direction you face.',
    forward: 1,
    strafe: 0,
  },
  {
    action: 'step_back',
    humanControl: 'S / ↓',
    description: 'Step one tile away from the direction you face.',
    forward: -1,
    strafe: 0,
  },
  {
    action: 'strafe_left',
    humanControl: 'Q',
    description: 'Step one tile to your left without turning.',
    forward: 0,
    strafe: -1,
  },
  {
    action: 'strafe_right',
    humanControl: 'E',
    description: 'Step one tile to your right without turning.',
    forward: 0,
    strafe: 1,
  },
];

for (const step of CHARACTER_STEPS) {
  registerCommand({
    action: step.action,
    mode: 'character',
    group: 'movement',
    humanControl: step.humanControl,
    description: step.description,
    params: {},
    example: { action: step.action },
    changesWorld: false,
    apply: (context) =>
      stepBy(context, facingRelativeStep(context.actor.pose().facing, step.forward, step.strafe)),
  });
}

const TURNS: readonly { action: string; humanControl: string; eighths: -1 | 1 }[] = [
  { action: 'turn_left', humanControl: 'A / ←', eighths: -1 },
  { action: 'turn_right', humanControl: 'D / →', eighths: 1 },
];

for (const turn of TURNS) {
  registerCommand({
    action: turn.action,
    mode: 'character',
    group: 'movement',
    humanControl: turn.humanControl,
    description: `Turn 45° ${turn.eighths === -1 ? 'left' : 'right'}. Turning always succeeds.`,
    params: {},
    example: { action: turn.action },
    changesWorld: false,
    apply: (context) => turnBy(context, turn.eighths),
  });
}

function vectorStep(facing: FacingIndex): Step {
  const vector = facingVector(facing);
  return [vector.dx, vector.dy];
}

function stepBy(context: CommandContext, step: Step): CommandResult {
  const mayPush = step[0] === 0 || step[1] === 0;
  let moved = false;
  slideAlongEachAxis(step, (dx, dy) => {
    if (context.actor.tryStep(dx, dy, mayPush)) moved = true;
  });
  const pose = context.actor.pose();
  if (!moved) return commandFailed('blocked', `nothing gave way from (${pose.x},${pose.y})`);
  return commandSucceeded(`moved to (${pose.x},${pose.y})${keysPickedUp(context, pose)}`);
}

function keysPickedUp(context: CommandContext, pose: { x: number; y: number }): string {
  const taken = context.puzzles.takeKeysAt(pose.x, pose.y);
  return taken.length === 0 ? '' : `, taking ${taken.length} key(s) lying here`;
}

function turnBy(context: CommandContext, eighths: -1 | 1): CommandResult {
  context.actor.turn(eighths);
  return commandSucceeded(`now facing ${FACING_NAMES[context.actor.pose().facing]}`);
}
