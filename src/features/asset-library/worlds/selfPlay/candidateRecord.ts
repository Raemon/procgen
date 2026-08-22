import { funOf, type ScoredWorld } from './scoreGenome';
import type { WorldGenome } from './worldGenome';

export type CandidateOrigin = 'rolled' | 'mutated' | 'bred' | 'treated';

export interface Candidate {
  genome: WorldGenome;
  origin: CandidateOrigin;
  parents: string[];
}

export interface CandidateRecord {
  name: string;
  origin: CandidateOrigin;
  parents: string[];
  fun: number | null;
  admitted: boolean;
  walkable: boolean;
  weakest: string[];
}

export const NOWHERE_TO_WALK = 'nowhere to walk';
export const WEAKEST_READINGS_NAMED = 3;

export function walkedCandidateRecord(
  candidate: Candidate,
  world: ScoredWorld,
  admitted: boolean,
): CandidateRecord {
  return {
    name: world.paletteName,
    origin: candidate.origin,
    parents: candidate.parents,
    fun: funOf(world),
    admitted,
    walkable: true,
    weakest: weakestReadingNamesOf(world),
  };
}

export function unwalkableCandidateRecord(candidate: Candidate): CandidateRecord {
  return {
    name: NOWHERE_TO_WALK,
    origin: candidate.origin,
    parents: candidate.parents,
    fun: null,
    admitted: false,
    walkable: false,
    weakest: [],
  };
}

function weakestReadingNamesOf(world: ScoredWorld): string[] {
  return [...world.score.readings]
    .sort((one, other) => one.score - other.score)
    .slice(0, WEAKEST_READINGS_NAMED)
    .map((reading) => reading.name);
}
