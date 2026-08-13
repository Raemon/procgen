import { shareOf } from './meanOf';
import type { TouristTrace } from '../touristWalk';

export interface ConflictedChoices {
  conflictsPer100Steps: number;
  promiseKeptShare: number;
}

const NEAR_EQUIPOISE = 0.5;

export function conflictedChoices(trace: TouristTrace): ConflictedChoices {
  const conflicts = trace.conflictCostPerStep.filter((cost) => cost >= NEAR_EQUIPOISE).length;
  return {
    conflictsPer100Steps: shareOf(conflicts, trace.conflictCostPerStep.length) * 100,
    promiseKeptShare: shareOf(trace.promisesKept, trace.promisesSighted),
  };
}
