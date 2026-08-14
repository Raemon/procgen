import { bandScore, reading, weightedMean, type MetricReading } from './bandScore';
import type { WalkingSimMeasurements } from './walkingSimMeasurements';

export interface WalkingSimScore {
  overall: number;
  readings: MetricReading[];
}

const CELLS_SEEN_FOR_A_REAL_WALK = 900;
const CELLS_SEEN_FOR_A_WHOLE_WORLD = 6000;
const SEALED_POCKET_SCORE_FLOOR = 0.25;
const ROUNDEDNESS_FLOOR = 0.6;

export function walkingSimFunScore(m: WalkingSimMeasurements): WalkingSimScore {
  const readings = [
    ...pacingReadings(m),
    ...sceneryReadings(m),
    ...choiceReadings(m),
    ...learningReadings(m),
    ...discoveryReadings(m),
  ];
  const rounded = weightedMean(readings) * weakestReadingFactor(readings);
  return { overall: penaltyFor(m) * rounded, readings };
}

function weakestReadingFactor(readings: readonly MetricReading[]): number {
  const weakest = Math.min(...readings.map((each) => each.score));
  return ROUNDEDNESS_FLOOR + (1 - ROUNDEDNESS_FLOOR) * weakest;
}

function pacingReadings(m: WalkingSimMeasurements): MetricReading[] {
  return [
    reading('reveal per step', m.meanRevealPerStep, 1, bandScore(m.meanRevealPerStep, 4, 45, 25)),
    reading('longest drought', m.longestDroughtRatio, 1, bandScore(m.longestDroughtRatio, 0, 0.15, 0.25)),
    reading('enclosed share', m.timeShareEnclosed, 1, bandScore(m.timeShareEnclosed, 0.12, 0.6, 0.3)),
    reading('openness swings /100', m.opennessSwingsPer100Steps, 1, bandScore(m.opennessSwingsPer100Steps, 1.5, 12, 3)),
    reading('vista moments /100', m.vistaMomentsPer100Steps, 1, bandScore(m.vistaMomentsPer100Steps, 0.2, 4, 2)),
    reading('retread share', m.retreadShare, 1, bandScore(m.retreadShare, 0, 0.3, 0.35)),
    reading('reveal spread', m.revealSpread, 1, bandScore(m.revealSpread, 0.5, 1, 0.4)),
    reading('elevation gates', m.elevationGateShare, 1, bandScore(m.elevationGateShare, 0.02, 0.2, 0.15)),
    reading('climb reveal ratio', m.climbRevealRatio, 1, bandScore(m.climbRevealRatio, 0.8, 3, 1)),
    reading('mystery edge share', m.mysteryEdgeShare, 0.5, bandScore(m.mysteryEdgeShare, 0.03, 0.25, 0.15)),
  ];
}

function sceneryReadings(m: WalkingSimMeasurements): MetricReading[] {
  return [
    reading('scenery entropy (bits)', m.sceneryEntropyBits, 0.5, bandScore(m.sceneryEntropyBits, 1.4, 2.6, 1)),
    reading('region entropy (bits)', m.regionEntropyBits, 1, bandScore(m.regionEntropyBits, 0.6, 1.6, 0.8)),
    reading('regional differentiation', m.regionalDifferentiation, 1, bandScore(m.regionalDifferentiation, 0.15, 0.6, 0.25)),
    reading('view distinctness', m.viewDistinctness, 1, bandScore(m.viewDistinctness, 0.25, 0.8, 0.3)),
    reading('place grammar (bits/place)', m.placeGrammarBits, 2, bandScore(m.placeGrammarBits, 0.8, 2.4, 0.8)),
  ];
}

function choiceReadings(m: WalkingSimMeasurements): MetricReading[] {
  return [
    reading('decision points /100', m.decisionPointsPer100Steps, 1, bandScore(m.decisionPointsPer100Steps, 8, 70, 20)),
    reading('corridor loops /100 cells', m.corridorLoopsPer100Cells, 1, bandScore(m.corridorLoopsPer100Cells, 0.3, 6, 2)),
    reading('branch divergence', m.meanBranchDivergence, 1, bandScore(m.meanBranchDivergence, 0.2, 0.6, 0.25)),
    reading('conflicted choices /100', m.conflictsPer100Steps, 2, bandScore(m.conflictsPer100Steps, 2, 25, 8)),
    reading('promises kept', m.promiseKeptShare, 1.5, bandScore(m.promiseKeptShare, 0.35, 0.85, 0.3)),
  ];
}

function learningReadings(m: WalkingSimMeasurements): MetricReading[] {
  return [
    reading('lessons /100 steps', m.lessonsPer100Steps, 1, bandScore(m.lessonsPer100Steps, 2, 15, 5)),
    reading('lesson spread', m.lessonSpread, 1, bandScore(m.lessonSpread, 0.2, 0.7, 0.3)),
    reading('graspable lessons', m.graspableLessonShare, 1.5, bandScore(m.graspableLessonShare, 0.6, 1, 0.35)),
    reading('learning curve drop', m.learningCurveDrop, 1, bandScore(m.learningCurveDrop, 0.05, 0.45, 0.25)),
  ];
}

function discoveryReadings(m: WalkingSimMeasurements): MetricReading[] {
  return [
    reading('encounters /100 steps', m.encountersPer100Steps, 1.5, bandScore(m.encountersPer100Steps, 1, 8, 4)),
    reading('discovery kinds', m.discoveryKinds, 1, bandScore(m.discoveryKinds, 2, 8, 3)),
    reading('landmark pull', m.landmarkStepShare, 1, bandScore(m.landmarkStepShare, 0.1, 0.6, 0.3)),
    reading('landmark hold (steps)', m.landmarkHoldSteps, 0.5, bandScore(m.landmarkHoldSteps, 3, 25, 12)),
  ];
}

function penaltyFor(m: WalkingSimMeasurements): number {
  return shortWalkPenalty(m.cellsSeen) * sealedPocketPenalty(m);
}

function shortWalkPenalty(cellsSeen: number): number {
  return Math.min(1, cellsSeen / CELLS_SEEN_FOR_A_REAL_WALK);
}

function sealedPocketPenalty(m: WalkingSimMeasurements): number {
  if (!m.exhaustedRegion) return 1;
  const credit = m.cellsSeen / CELLS_SEEN_FOR_A_WHOLE_WORLD;
  return Math.min(1, Math.max(SEALED_POCKET_SCORE_FLOOR, credit));
}

export function scoreSummaryLine(score: WalkingSimScore): string {
  return score.readings.map((each) => `${each.name} ${each.value.toFixed(2)}`).join('  ');
}
