import { slideAlongEachAxis, type Step } from '../input/cameraRelativeStep';
import { facingRelativeStep } from '../input/facingRelativeStep';
import { FACING_NAMES, facingVector, type FacingIndex } from '../world/facing';
import {
  abilityFailed,
  abilitySucceeded,
  type AbilityActor,
  type AbilityContext,
  type AbilityResult,
} from './ability';
import { registerAbility } from './abilityRegistry';

FACING_NAMES.forEach((name, compass) => {
  registerAbility({
    action: `step_${name}`,
    mode: 'god',
    group: 'movement',
    humanControl: 'W/S/Q/C or ↑/↓, camera-relative',
    description: `Step one tile ${name}.`,
    params: {},
    example: { action: `step_${name}` },
    changesWorld: false,
    apply: (context) => stepBy(context.actor, vectorStep(compass as FacingIndex)),
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
    humanControl: 'C',
    description: 'Step one tile to your right without turning.',
    forward: 0,
    strafe: 1,
  },
];

for (const step of CHARACTER_STEPS) {
  registerAbility({
    action: step.action,
    mode: 'character',
    group: 'movement',
    humanControl: step.humanControl,
    description: step.description,
    params: {},
    example: { action: step.action },
    changesWorld: false,
    apply: (context) =>
      stepBy(context.actor, facingRelativeStep(context.actor.pose().facing, step.forward, step.strafe)),
  });
}

const TURNS: readonly { action: string; humanControl: string; eighths: -1 | 1 }[] = [
  { action: 'turn_left', humanControl: 'A / ←', eighths: -1 },
  { action: 'turn_right', humanControl: 'D / →', eighths: 1 },
];

for (const turn of TURNS) {
  registerAbility({
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

function stepBy(actor: AbilityActor, step: Step): AbilityResult {
  let moved = false;
  slideAlongEachAxis(step, (dx, dy) => {
    if (actor.tryStep(dx, dy)) moved = true;
  });
  const pose = actor.pose();
  return moved
    ? abilitySucceeded(`moved to (${pose.x},${pose.y})`)
    : abilityFailed('blocked', `nothing gave way from (${pose.x},${pose.y})`);
}

function turnBy(context: AbilityContext, eighths: -1 | 1): AbilityResult {
  context.actor.turn(eighths);
  return abilitySucceeded(`now facing ${FACING_NAMES[context.actor.pose().facing]}`);
}
