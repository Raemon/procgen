import { CHARACTER_DOWNWARD_PITCH_DEG } from './firstPersonSightline';

export const LOOK_STEP_DEG = 30;
export const MOST_LOOK_STEPS = 3;
export const STEEPEST_LOOK_DEG = 85;

export function clampLookSteps(steps: number): number {
  return Math.max(-MOST_LOOK_STEPS, Math.min(MOST_LOOK_STEPS, steps));
}

export function downwardPitchDeg(lookSteps: number): number {
  const stooped = CHARACTER_DOWNWARD_PITCH_DEG - clampLookSteps(lookSteps) * LOOK_STEP_DEG;
  return Math.max(-STEEPEST_LOOK_DEG, Math.min(STEEPEST_LOOK_DEG, stooped));
}
