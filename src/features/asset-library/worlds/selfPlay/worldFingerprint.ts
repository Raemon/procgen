import { clamped } from '../randomize/randomRolls';
import type { ShareTally } from '../walkingSim/metrics/sceneryShares';
import type { WalkingSimMeasurements } from '../walkingSim/walkingSimMeasurements';

export interface WorldFingerprint {
  readings: number[];
  sceneryShares: ShareTally;
}

const READING_SCALES: Array<[keyof WalkingSimMeasurements, number]> = [
  ['meanRevealPerStep', 40],
  ['longestDroughtRatio', 1],
  ['timeShareOpen', 1],
  ['timeShareEnclosed', 1],
  ['opennessSwingsPer100Steps', 12],
  ['mysteryEdgeShare', 0.3],
  ['sceneryEntropyBits', 3],
  ['regionEntropyBits', 2.5],
  ['regionalDifferentiation', 1],
  ['viewDistinctness', 1],
  ['placeGrammarBits', 3],
  ['decisionPointsPer100Steps', 40],
  ['meanBranchDivergence', 0.6],
  ['conflictsPer100Steps', 25],
  ['promiseKeptShare', 1],
  ['lessonsPer100Steps', 30],
  ['lessonSpread', 1],
  ['graspableLessonShare', 1],
  ['encountersPer100Steps', 10],
  ['discoveryKinds', 8],
  ['landmarkStepShare', 1],
  ['landmarkHoldSteps', 25],
];

const READING_WEIGHT = 0.5;

export function fingerprintOf(
  measurements: WalkingSimMeasurements,
  sceneryShares: ShareTally,
): WorldFingerprint {
  return { readings: scaledReadingsOf(measurements), sceneryShares };
}

export function fingerprintDistance(one: WorldFingerprint, other: WorldFingerprint): number {
  const readings = meanAbsoluteGap(one.readings, other.readings);
  const scenery = shareDistance(one.sceneryShares, other.sceneryShares);
  return READING_WEIGHT * readings + (1 - READING_WEIGHT) * scenery;
}

function scaledReadingsOf(measurements: WalkingSimMeasurements): number[] {
  return READING_SCALES.map(([name, scale]) =>
    clamped(Number(measurements[name]) / scale, 0, 1),
  );
}

function meanAbsoluteGap(one: readonly number[], other: readonly number[]): number {
  if (one.length === 0) return 0;
  return one.reduce((sum, value, at) => sum + Math.abs(value - (other[at] ?? 0)), 0) / one.length;
}

function shareDistance(one: ShareTally, other: ShareTally): number {
  let total = 0;
  for (const character of new Set([...one.keys(), ...other.keys()])) {
    total += Math.abs((one.get(character) ?? 0) - (other.get(character) ?? 0));
  }
  return total / 2;
}
