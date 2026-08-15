import type { WalkingSimMeasurements } from './walkingSimMeasurements';

export interface ReadingBand {
  name: string;
  key: keyof WalkingSimMeasurements;
  weight: number;
  lo: number;
  hi: number;
  falloff: number;
}

export const READING_BANDS: readonly ReadingBand[] = [
  { name: 'reveal per step', key: 'meanRevealPerStep', weight: 1, lo: 4, hi: 45, falloff: 25 },
  { name: 'longest drought', key: 'longestDroughtRatio', weight: 1, lo: 0, hi: 0.15, falloff: 0.25 },
  { name: 'enclosed share', key: 'timeShareEnclosed', weight: 1, lo: 0.12, hi: 0.6, falloff: 0.3 },
  { name: 'openness swings /100', key: 'opennessSwingsPer100Steps', weight: 1, lo: 1.5, hi: 12, falloff: 3 },
  { name: 'vista moments /100', key: 'vistaMomentsPer100Steps', weight: 1, lo: 0.2, hi: 4, falloff: 2 },
  { name: 'retread share', key: 'retreadShare', weight: 1, lo: 0, hi: 0.3, falloff: 0.35 },
  { name: 'reveal spread', key: 'revealSpread', weight: 1, lo: 0.5, hi: 1, falloff: 0.4 },
  { name: 'elevation gates', key: 'elevationGateShare', weight: 1, lo: 0.02, hi: 0.2, falloff: 0.15 },
  { name: 'climb reveal ratio', key: 'climbRevealRatio', weight: 1, lo: 0.8, hi: 3, falloff: 1 },
  { name: 'mystery edge share', key: 'mysteryEdgeShare', weight: 0.5, lo: 0.03, hi: 0.25, falloff: 0.15 },
  { name: 'scenery entropy (bits)', key: 'sceneryEntropyBits', weight: 0.5, lo: 1.4, hi: 2.6, falloff: 1 },
  { name: 'region entropy (bits)', key: 'regionEntropyBits', weight: 1, lo: 0.6, hi: 1.6, falloff: 0.8 },
  { name: 'regional differentiation', key: 'regionalDifferentiation', weight: 1, lo: 0.15, hi: 0.6, falloff: 0.25 },
  { name: 'view distinctness', key: 'viewDistinctness', weight: 1, lo: 0.25, hi: 0.8, falloff: 0.3 },
  { name: 'place grammar (bits/place)', key: 'placeGrammarBits', weight: 2, lo: 0.8, hi: 2.4, falloff: 0.8 },
  { name: 'decision points /100', key: 'decisionPointsPer100Steps', weight: 1, lo: 8, hi: 70, falloff: 20 },
  { name: 'corridor loops /100 cells', key: 'corridorLoopsPer100Cells', weight: 1, lo: 0.3, hi: 6, falloff: 2 },
  { name: 'branch divergence', key: 'meanBranchDivergence', weight: 1, lo: 0.2, hi: 0.6, falloff: 0.25 },
  { name: 'conflicted choices /100', key: 'conflictsPer100Steps', weight: 2, lo: 2, hi: 25, falloff: 8 },
  { name: 'promises kept', key: 'promiseKeptShare', weight: 1.5, lo: 0.35, hi: 0.85, falloff: 0.3 },
  { name: 'lessons /100 steps', key: 'lessonsPer100Steps', weight: 1, lo: 2, hi: 15, falloff: 5 },
  { name: 'lesson spread', key: 'lessonSpread', weight: 1, lo: 0.2, hi: 0.7, falloff: 0.3 },
  { name: 'graspable lessons', key: 'graspableLessonShare', weight: 1.5, lo: 0.6, hi: 1, falloff: 0.35 },
  { name: 'learning curve drop', key: 'learningCurveDrop', weight: 1, lo: 0.05, hi: 0.45, falloff: 0.25 },
  { name: 'encounters /100 steps', key: 'encountersPer100Steps', weight: 1.5, lo: 1, hi: 8, falloff: 4 },
  { name: 'discovery kinds', key: 'discoveryKinds', weight: 1, lo: 2, hi: 8, falloff: 3 },
  { name: 'landmark pull', key: 'landmarkStepShare', weight: 1, lo: 0.1, hi: 0.6, falloff: 0.3 },
  { name: 'landmark hold (steps)', key: 'landmarkHoldSteps', weight: 0.5, lo: 3, hi: 25, falloff: 12 },
];

export function readingBandOf(name: string): ReadingBand | undefined {
  return READING_BANDS.find((band) => band.name === name);
}
