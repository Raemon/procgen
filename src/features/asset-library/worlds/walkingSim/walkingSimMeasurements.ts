import { choiceStructure } from './metrics/choiceStructure';
import { enclosureRhythm } from './metrics/enclosureRhythm';
import { learningProgress } from './metrics/learningProgress';
import { mysteryEdgeShare } from './metrics/mysteryPromise';
import { meanRegionEntropyBits } from './metrics/regionCoherence';
import { revealPacing } from './metrics/revealPacing';
import { entropyBitsOverCells } from './metrics/sceneryShares';
import { viewDistinctness } from './metrics/viewDistinctness';
import type { TileCharacterOf } from './tileCharacter';
import { stepsWalked, type TouristLimits, type TouristTrace } from './touristWalk';
import type { TileIdProbe, WalkableProbe } from './worldProbes';

export interface WalkingSimMeasurements {
  stepsWalked: number;
  cellsSeen: number;
  exhaustedRegion: boolean;
  meanRevealPerStep: number;
  longestDroughtRatio: number;
  timeShareOpen: number;
  timeShareEnclosed: number;
  opennessSwingsPer100Steps: number;
  mysteryEdgeShare: number;
  sceneryEntropyBits: number;
  regionEntropyBits: number;
  regionalDifferentiation: number;
  viewDistinctness: number;
  decisionPointsPer100Steps: number;
  meanBranchDivergence: number;
  lessonsPer100Steps: number;
  lessonSpread: number;
  lateLessonShare: number;
}

export interface SceneryProbes {
  tileIdAt: TileIdProbe;
  isWalkableAt: WalkableProbe;
  characterOf: TileCharacterOf;
}

export function walkingSimMeasurements(
  trace: TouristTrace,
  probes: SceneryProbes,
  limits: TouristLimits,
): WalkingSimMeasurements {
  return {
    ...walkShape(trace),
    ...pacingAndRhythm(trace, limits),
    ...sceneryReadings(trace, probes),
    ...choiceAndLearningReadings(trace, probes),
  };
}

function walkShape(trace: TouristTrace) {
  return {
    stepsWalked: stepsWalked(trace),
    cellsSeen: trace.seen.size,
    exhaustedRegion: trace.exhaustedRegion,
  };
}

function pacingAndRhythm(trace: TouristTrace, limits: TouristLimits) {
  return {
    ...revealPacing(trace.revealPerStep),
    ...enclosureRhythm(trace.isovistAreaPerStep, limits.sightRadius),
    mysteryEdgeShare: mysteryEdgeShare(trace.mysteryEdgesPerStep, trace.isovistAreaPerStep),
  };
}

function sceneryReadings(trace: TouristTrace, probes: SceneryProbes) {
  const whole = entropyBitsOverCells(trace.seen, probes.tileIdAt, probes.characterOf);
  const regional = meanRegionEntropyBits(trace.seen, probes.tileIdAt, probes.characterOf);
  return {
    sceneryEntropyBits: whole,
    regionEntropyBits: regional,
    regionalDifferentiation: whole === 0 ? 0 : Math.max(0, 1 - regional / whole),
    viewDistinctness: viewDistinctness(trace.path, probes.tileIdAt, probes.characterOf),
  };
}

function choiceAndLearningReadings(trace: TouristTrace, probes: SceneryProbes) {
  return {
    ...choiceStructure(trace.path, { ...probes, seen: trace.seen }),
    ...learningProgress(trace.path, probes.tileIdAt, probes.characterOf),
  };
}
