import type { CellCharacterProbe } from './cellCharacter';
import { choiceStructure } from './metrics/choiceStructure';
import { discoveriesAlongPath } from './metrics/discoveries';
import { enclosureRhythm } from './metrics/enclosureRhythm';
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
import type { NearbySpawnsProbe } from './nearbySpawnsProbe';
import type { OpaqueProbe } from './sightBlocking';
import { stepsWalked, type TouristLimits, type TouristTrace } from './touristWalk';
import type { WalkableProbe } from './worldProbes';

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
  placeGrammarBits: number;
  decisionPointsPer100Steps: number;
  meanBranchDivergence: number;
  lessonsPer100Steps: number;
  lessonSpread: number;
  graspableLessonShare: number;
  encountersPer100Steps: number;
  discoveryKinds: number;
  landmarkStepShare: number;
  landmarkHoldSteps: number;
}

export interface WalkProbes {
  isWalkableAt: WalkableProbe;
  isOpaqueAt: OpaqueProbe;
  characterAt: CellCharacterProbe;
  spawnsNear: NearbySpawnsProbe;
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
    ...pacingAndRhythm(trace, limits),
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

function pacingAndRhythm(trace: TouristTrace, limits: TouristLimits) {
  return {
    ...revealPacing(trace.revealPerStep),
    ...enclosureRhythm(trace.isovistAreaPerStep, limits.sightRadius),
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
    ...learningProgress(trace.path, probes.characterAt),
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
