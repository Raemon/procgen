import { slideAlongEachAxis, type Step } from '../input/cameraRelativeStep';
import { facingRelativeStep } from '../input/facingRelativeStep';
import { FACING_NAMES, facingVector, type FacingIndex } from '../world/facing';
import type { AgentMode, AgentPose } from './agentMode';
import { verbByAction } from './controls';

export interface ActorWorld {
  pose(): AgentPose;
  tryStep(dx: number, dy: number): boolean;
  turn(eighthTurns: number): void;
}

export type ActionOutcome = 'moved' | 'blocked' | 'turned' | 'unknown_action';

export function applyAction(actor: ActorWorld, mode: AgentMode, action: string): ActionOutcome {
  if (!verbByAction(mode, action)) return 'unknown_action';
  const turn = turnEighths(action);
  if (turn !== 0) {
    actor.turn(turn);
    return 'turned';
  }
  return stepWithAxisSlide(actor, stepVector(actor.pose().facing, action)) ? 'moved' : 'blocked';
}

function turnEighths(action: string): number {
  if (action === 'turn_left') return -1;
  if (action === 'turn_right') return 1;
  return 0;
}

function stepVector(facing: FacingIndex, action: string): Step {
  const compass = FACING_NAMES.findIndex((name) => action === `step_${name}`);
  if (compass >= 0) {
    const vector = facingVector(compass as FacingIndex);
    return [vector.dx, vector.dy];
  }
  return facingRelativeStep(facing, forwardInput(action), strafeInput(action));
}

function forwardInput(action: string): number {
  if (action === 'step_forward') return 1;
  if (action === 'step_back') return -1;
  return 0;
}

function strafeInput(action: string): number {
  if (action === 'strafe_right') return 1;
  if (action === 'strafe_left') return -1;
  return 0;
}

function stepWithAxisSlide(actor: ActorWorld, step: Step): boolean {
  let moved = false;
  slideAlongEachAxis(step, (dx, dy) => {
    if (actor.tryStep(dx, dy)) moved = true;
  });
  return moved;
}
