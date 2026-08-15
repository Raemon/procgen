import { shareOf } from './meanOf';
import type { TouristTrace } from '../touristWalk';

export interface ConflictedChoices {
  conflictsPer100Steps: number;
  promiseKeptShare: number;
}

const NEAR_EQUIPOISE = 0.5;
const FEWEST_PROMISES_TO_JUDGE = 5;
const UNTESTED_PROMISE_NEUTRAL = 0.35;

export function conflictedChoices(trace: TouristTrace): ConflictedChoices {
  const conflicts = trace.conflictCostPerStep.filter((cost) => cost >= NEAR_EQUIPOISE).length;
  return {
    conflictsPer100Steps: shareOf(conflicts, trace.conflictCostPerStep.length) * 100,
    promiseKeptShare:
      trace.promisesSighted < FEWEST_PROMISES_TO_JUDGE
        ? UNTESTED_PROMISE_NEUTRAL
        : shareOf(trace.promisesKept, trace.promisesSighted),
  };
}
