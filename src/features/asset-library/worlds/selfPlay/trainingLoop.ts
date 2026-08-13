import { mulberry32, type RandomStream } from '../random/mulberry32';
import { chance, pick } from '../randomize/randomRolls';
import { touristLimits, type TouristLimits } from '../walkingSim/touristWalk';
import { batchScore, type BatchScore } from './batchScore';
import { EliteArchive } from './eliteArchive';
import { mutatedGenome } from './mutateGenome';
import { scoredGenome, walkSeedOf, type ScoredWorld } from './scoreGenome';
import { SaturationWatch } from './saturationWatch';
import { rolledGenome, type WorldGenome } from './worldGenome';

export interface TrainingSettings {
  generations: number;
  batchSize: number;
  stepBudget: number;
  radiusCap: number;
  seed: number;
  patience: number;
}

export interface GenerationRecord {
  generation: number;
  batch: BatchScore;
  archiveBestFun: number;
  coverage: number;
  admissions: number;
  worldsWithNowhereToWalk: number;
  generationsSinceGain: number;
}

export interface TrainingRun {
  archive: EliteArchive;
  trajectory: GenerationRecord[];
  saturated: boolean;
}

const FRESH_ROLL_SHARE = 0.3;
const CANDIDATE_PATIENCE_MS = 8000;

export function runTraining(
  settings: TrainingSettings,
  onGeneration: (record: GenerationRecord, archive: EliteArchive) => void,
): TrainingRun {
  const state = freshRun(settings);
  for (let generation = 1; generation <= settings.generations; generation++) {
    const record = liveOneGeneration(generation, state, settings);
    onGeneration(record, state.archive);
    if (state.watch.hasSaturated()) return finishedRun(state, true);
  }
  return finishedRun(state, false);
}

interface RunState {
  archive: EliteArchive;
  trajectory: GenerationRecord[];
  rng: RandomStream;
  watch: SaturationWatch;
  limits: TouristLimits;
}

function freshRun(settings: TrainingSettings): RunState {
  return {
    archive: new EliteArchive(),
    trajectory: [],
    rng: mulberry32(settings.seed),
    watch: new SaturationWatch(settings.patience),
    limits: { ...touristLimits(settings.stepBudget, settings.radiusCap), patienceMs: CANDIDATE_PATIENCE_MS },
  };
}

function finishedRun(state: RunState, saturated: boolean): TrainingRun {
  return { archive: state.archive, trajectory: state.trajectory, saturated };
}

function liveOneGeneration(
  generation: number,
  state: RunState,
  settings: TrainingSettings,
): GenerationRecord {
  const candidates = candidateGenomesOf(state, settings);
  const walked = candidates.map((genome) => scoredGenome(genome, state.limits, walkSeedOf(genome)));
  const batch = walked.filter((world): world is ScoredWorld => world !== null);
  const record = recordOf(generation, batch, candidates.length, state);
  state.trajectory.push(record);
  return record;
}

function candidateGenomesOf(state: RunState, settings: TrainingSettings): WorldGenome[] {
  return Array.from({ length: settings.batchSize }, () => nextCandidate(state));
}

function nextCandidate(state: RunState): WorldGenome {
  const elites = state.archive.all();
  if (elites.length === 0 || chance(state.rng, FRESH_ROLL_SHARE)) return rolledGenome(state.rng);
  return mutatedGenome(lonelierParentOf(state, elites).genome, state.rng);
}

function lonelierParentOf(state: RunState, elites: readonly ScoredWorld[]): ScoredWorld {
  const one = pick(state.rng, elites);
  const other = pick(state.rng, elites);
  return state.archive.lonelinessOf(one) >= state.archive.lonelinessOf(other) ? one : other;
}

function recordOf(
  generation: number,
  batch: readonly ScoredWorld[],
  candidateCount: number,
  state: RunState,
): GenerationRecord {
  const admissions = batch.filter((world) => state.archive.admit(world)).length;
  const archiveBestFun = state.archive.bestFun();
  const coverage = state.archive.coverage();
  state.watch.notice(archiveBestFun, state.archive.meanFun());
  return {
    generation,
    batch: batchScore(batch),
    archiveBestFun,
    coverage,
    admissions,
    worldsWithNowhereToWalk: candidateCount - batch.length,
    generationsSinceGain: state.watch.generationsSinceGain(),
  };
}
