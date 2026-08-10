import { DEEPEST_PAST, PRESENT } from './worldTime';

export const SCRUB_STEPS = 1000;

export function scrubStepOfTime(time: number): number {
  const yearsBack = Math.max(0, PRESENT - time);
  return Math.round(SCRUB_STEPS * (1 - depthOfYears(yearsBack)));
}

export function timeOfScrubStep(step: number): number {
  const depth = 1 - clampStep(step) / SCRUB_STEPS;
  return Math.round(PRESENT - yearsOfDepth(depth));
}

function depthOfYears(yearsBack: number): number {
  return Math.log1p(yearsBack) / Math.log1p(-DEEPEST_PAST);
}

function yearsOfDepth(depth: number): number {
  return Math.expm1(depth * Math.log1p(-DEEPEST_PAST));
}

function clampStep(step: number): number {
  if (!Number.isFinite(step)) return SCRUB_STEPS;
  return Math.max(0, Math.min(SCRUB_STEPS, Math.round(step)));
}
