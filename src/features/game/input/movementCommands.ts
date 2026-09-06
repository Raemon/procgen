import { slideAlongEachAxis, type Step } from '@/features/game/input/cameraRelativeStep';
import { facingRelativeStep } from '@/features/game/input/facingRelativeStep';
import { FACING_NAMES, facingVector, type FacingIndex } from '@/features/game/facing';
import { JUMP_CLIMB_LIMIT, WALK_CLIMB_LIMIT } from '@/features/game/climbing';
import { JUMP_REACH_TILES, LANDING_DISTANCES } from '@/features/game/sim/jumpLanding';
import { obstacleRefusal } from '@/features/game/worldRules';
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

const CHARACTER_JUMPS: readonly {
  action: string;
  humanControl: string;
  forward: number;
  strafe: number;
}[] = [
  { action: 'jump_forward', humanControl: 'Space while holding W / ↑', forward: 1, strafe: 0 },
  { action: 'jump_back', humanControl: 'Space while holding S / ↓', forward: -1, strafe: 0 },
  { action: 'jump_left', humanControl: 'Space while holding Q', forward: 0, strafe: -1 },
  { action: 'jump_right', humanControl: 'Space while holding E', forward: 0, strafe: 1 },
];

registerCommand({
  action: 'jump',
  mode: 'character',
  group: 'movement',
  humanControl: 'Space',
  description: `Jump straight up and land where you stood. A jump climbs ${JUMP_CLIMB_LIMIT} level where a step climbs ${WALK_CLIMB_LIMIT}, so jump in a direction to reach higher ground.`,
  params: {},
  example: { action: 'jump' },
  changesWorld: false,
  apply: (context) => {
    context.actor.tryJump(0, 0);
    return commandSucceeded('jumped straight up and landed where you stood');
  },
});

for (const jump of CHARACTER_JUMPS) {
  registerCommand({
    action: jump.action,
    mode: 'character',
    group: 'movement',
    humanControl: jump.humanControl,
    description: `Jump ${JUMP_REACH_TILES} tiles ${jump.action.slice('jump_'.length)}, clearing whatever lies between, and land ${JUMP_REACH_TILES} tiles out or on the tile next to you if the far one is no good. A jump climbs ${JUMP_CLIMB_LIMIT} level.`,
    params: {},
    example: { action: jump.action },
    changesWorld: false,
    apply: (context) =>
      jumpBy(context, facingRelativeStep(context.actor.pose().facing, jump.forward, jump.strafe)),
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
  const refusals: string[] = [];
  slideAlongEachAxis(step, (dx, dy) => {
    if (context.actor.tryStep(dx, dy, mayPush)) moved = true;
    else refusals.push(refusalAhead(context, dx, dy, mayPush));
  });
  const pose = context.actor.pose();
  if (!moved) return commandFailed('blocked', refusals.join('; '));
  return commandSucceeded(`moved to (${pose.x},${pose.y})`);
}

function refusalAhead(context: CommandContext, dx: number, dy: number, mayPush: boolean): string {
  const pose = context.actor.pose();
  return (
    context.actor.explainStep(dx, dy, mayPush) ??
    obstacleRefusal({ x: pose.x + dx, y: pose.y + dy })
  );
}

function jumpBy(context: CommandContext, step: Step): CommandResult {
  const [dx, dy] = step;
  if (context.actor.tryJump(dx, dy)) {
    const pose = context.actor.pose();
    return commandSucceeded(`jumped to (${pose.x},${pose.y})`);
  }
  return commandFailed('blocked', jumpRefusal(context, dx, dy));
}

function jumpRefusal(context: CommandContext, dx: number, dy: number): string {
  const pose = context.actor.pose();
  const landings = LANDING_DISTANCES.map(
    (distance) => `(${pose.x + dx * distance},${pose.y + dy * distance})`,
  );
  return `nowhere to land: neither ${landings.join(' nor ')} takes a jump of at most ${JUMP_CLIMB_LIMIT} level up onto open ground`;
}

function turnBy(context: CommandContext, eighths: -1 | 1): CommandResult {
  context.actor.turn(eighths);
  return commandSucceeded(`now facing ${FACING_NAMES[context.actor.pose().facing]}`);
}
