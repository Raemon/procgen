import type { CellCharacterProbe } from './cellCharacter';
import { choiceStructure } from './metrics/choiceStructure';
import { learningCurveDrop } from './metrics/compressionProgress';
import { conflictedChoices } from './metrics/conflictedChoices';
import { discoveriesAlongPath } from './metrics/discoveries';
import { elevationExperience } from './metrics/elevationExperience';
import { enclosureRhythm } from './metrics/enclosureRhythm';
import { journeyArc } from './metrics/journeyArc';
import { corridorLoopsPer100Cells } from './metrics/loopTopology';
import { landmarkPull } from './metrics/landmarkPull';
import { learningProgress } from './metrics/learningProgress';
import { mysteryEdgeShare } from './metrics/mysteryPromise';
import { placeGrammarBitsPerPlace } from './metrics/placeGrammar';
import { meanRegionEntropyBits } from './metrics/regionCoherence';
import { revealPacing } from './metrics/revealPacing';
import {
  characterCountsOverCells,
  entropyBitsOfShares,
  sharesOfCounts,
  type ShareTally,
} from './metrics/sceneryShares';
import { viewDistinctness } from './metrics/viewDistinctness';
import { stepsWalked, type TouristLimits, type TouristProbes, type TouristTrace } from './touristWalk';

export interface WalkingSimMeasurements {
  stepsWalked: number;
  cellsSeen: number;
  exhaustedRegion: boolean;
  meanRevealPerStep: number;
  longestDroughtRatio: number;
  timeShareOpen: number;
  timeShareEnclosed: number;
  opennessSwingsPer100Steps: number;
  vistaMomentsPer100Steps: number;
  retreadShare: number;
  revealSpread: number;
  elevationGateShare: number;
  climbRevealRatio: number;
  learningCurveDrop: number;
  corridorLoopsPer100Cells: number;
  mysteryEdgeShare: number;
  sceneryEntropyBits: number;
  regionEntropyBits: number;
  regionalDifferentiation: number;
  viewDistinctness: number;
  placeGrammarBits: number;
  decisionPointsPer100Steps: number;
  meanBranchDivergence: number;
  conflictsPer100Steps: number;
  promiseKeptShare: number;
  lessonsPer100Steps: number;
  lessonSpread: number;
  graspableLessonShare: number;
  encountersPer100Steps: number;
  discoveryKinds: number;
  eventGapCv: number;
  landmarkStepShare: number;
  landmarkHoldSteps: number;
}

export interface WalkProbes extends TouristProbes {
  characterAt: CellCharacterProbe;
}

export interface MeasuredWalk {
  measurements: WalkingSimMeasurements;
  seenCharacterShares: ShareTally;
}

export function measuredWalk(
  trace: TouristTrace,
  probes: WalkProbes,
  limits: TouristLimits,
): MeasuredWalk {
  const seenShares = sharesOfCounts(characterCountsOverCells(trace.seen, probes.characterAt));
  return { measurements: measurementsOf(trace, probes, limits, seenShares), seenCharacterShares: seenShares };
}

function measurementsOf(
  trace: TouristTrace,
  probes: WalkProbes,
  limits: TouristLimits,
  seenShares: ShareTally,
): WalkingSimMeasurements {
  return {
    ...walkShape(trace),
    ...pacingAndRhythm(trace, limits, probes),
    ...sceneryReadings(trace, probes, seenShares),
    ...choiceAndLearningReadings(trace, probes),
    ...discoveryAndLandmarkReadings(trace, probes, seenShares),
  };
}

function walkShape(trace: TouristTrace) {
  return {
    stepsWalked: stepsWalked(trace),
    cellsSeen: trace.seen.size,
    exhaustedRegion: trace.exhaustedRegion,
  };
}

function pacingAndRhythm(trace: TouristTrace, limits: TouristLimits, probes: WalkProbes) {
  return {
    ...revealPacing(trace.revealPerStep),
    ...enclosureRhythm(trace.isovistAreaPerStep, limits.sightRadius),
    ...journeyArc(trace),
    ...elevationExperience(trace, probes),
    corridorLoopsPer100Cells: corridorLoopsPer100Cells(trace.visited, probes.canStep),
    mysteryEdgeShare: mysteryEdgeShare(trace.mysteryEdgesPerStep, trace.isovistAreaPerStep),
  };
}

function sceneryReadings(trace: TouristTrace, probes: WalkProbes, seenShares: ShareTally) {
  const whole = entropyBitsOfShares(seenShares);
  const regional = meanRegionEntropyBits(trace.seen, probes.characterAt);
  return {
    sceneryEntropyBits: whole,
    regionEntropyBits: regional,
    regionalDifferentiation: whole === 0 ? 0 : Math.max(0, 1 - regional / whole),
    viewDistinctness: viewDistinctness(trace.path, probes.characterAt),
    placeGrammarBits: placeGrammarBitsPerPlace(trace.seen, probes.characterAt),
  };
}

function choiceAndLearningReadings(trace: TouristTrace, probes: WalkProbes) {
  return {
    ...choiceStructure(trace.path, { ...probes, seen: trace.seen }),
    ...conflictedChoices(trace),
    ...learningProgress(trace.path, probes.characterAt),
    learningCurveDrop: learningCurveDrop(trace.path, probes.characterAt),
  };
}

function discoveryAndLandmarkReadings(
  trace: TouristTrace,
  probes: WalkProbes,
  seenShares: ShareTally,
) {
  return {
    ...discoveriesAlongPath(trace.path, probes.spawnsNear),
    ...landmarkPull(trace.farSeenPerStep, { ...probes, seenShares }),
  };
}
