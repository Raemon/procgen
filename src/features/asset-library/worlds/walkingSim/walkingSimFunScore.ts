import { bandScore, reading, weightedMean, type MetricReading } from './bandScore';
import type { WalkingSimMeasurements } from './walkingSimMeasurements';

export interface WalkingSimScore {
  overall: number;
  readings: MetricReading[];
}

const CELLS_SEEN_FOR_A_REAL_WALK = 900;
const CELLS_SEEN_FOR_A_WHOLE_WORLD = 6000;
const SEALED_POCKET_SCORE_FLOOR = 0.25;

export function walkingSimFunScore(m: WalkingSimMeasurements): WalkingSimScore {
  const readings = [...pacingReadings(m), ...sceneryReadings(m), ...choiceReadings(m), ...learningReadings(m)];
  return { overall: penaltyFor(m) * weightedMean(readings), readings };
}

function pacingReadings(m: WalkingSimMeasurements): MetricReading[] {
  return [
    reading('reveal per step', m.meanRevealPerStep, 1, bandScore(m.meanRevealPerStep, 4, 45, 25)),
    reading('longest drought', m.longestDroughtRatio, 1, bandScore(m.longestDroughtRatio, 0, 0.15, 0.25)),
    reading('enclosed share', m.timeShareEnclosed, 1, bandScore(m.timeShareEnclosed, 0.12, 0.6, 0.3)),
    reading('openness swings /100', m.opennessSwingsPer100Steps, 1, bandScore(m.opennessSwingsPer100Steps, 1.5, 12, 3)),
    reading('mystery edge share', m.mysteryEdgeShare, 1, bandScore(m.mysteryEdgeShare, 0.03, 0.25, 0.15)),
  ];
}

function sceneryReadings(m: WalkingSimMeasurements): MetricReading[] {
  return [
    reading('scenery entropy (bits)', m.sceneryEntropyBits, 1, bandScore(m.sceneryEntropyBits, 1.4, 2.6, 1)),
    reading('region entropy (bits)', m.regionEntropyBits, 1, bandScore(m.regionEntropyBits, 0.6, 1.6, 0.8)),
    reading('regional differentiation', m.regionalDifferentiation, 2, bandScore(m.regionalDifferentiation, 0.15, 0.6, 0.25)),
    reading('view distinctness', m.viewDistinctness, 1, bandScore(m.viewDistinctness, 0.35, 0.95, 0.35)),
  ];
}

function choiceReadings(m: WalkingSimMeasurements): MetricReading[] {
  return [
    reading('decision points /100', m.decisionPointsPer100Steps, 2, bandScore(m.decisionPointsPer100Steps, 8, 45, 12)),
    reading('branch divergence', m.meanBranchDivergence, 1, bandScore(m.meanBranchDivergence, 0.2, 0.6, 0.25)),
  ];
}

function learningReadings(m: WalkingSimMeasurements): MetricReading[] {
  return [
    reading('lessons /100 steps', m.lessonsPer100Steps, 1, bandScore(m.lessonsPer100Steps, 4, 30, 5)),
    reading('lesson spread', m.lessonSpread, 1, bandScore(m.lessonSpread, 0.6, 1, 0.4)),
    reading('late lesson share', m.lateLessonShare, 1.5, bandScore(m.lateLessonShare, 0.3, 0.75, 0.3)),
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
