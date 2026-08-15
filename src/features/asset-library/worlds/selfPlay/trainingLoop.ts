import { mulberry32, type RandomStream } from '../random/mulberry32';
import { chance, pick } from '../randomize/randomRolls';
import { touristLimits, type TouristLimits } from '../walkingSim/touristWalk';
import { batchScore, type BatchScore } from './batchScore';
import { bredGenome } from './breedGenomes';
import { EliteArchive } from './eliteArchive';
import { diagnosisOf, treatedGenome, worthTreating } from './worldDoctor';
import { mutatedGenome } from './mutateGenome';
import { funOf, scoredGenome, walkSeedOf, type ScoredWorld } from './scoreGenome';
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
  patientsTreated: number;
  worldsWithNowhereToWalk: number;
  generationsSinceGain: number;
}

export interface TrainingRun {
  archive: EliteArchive;
  trajectory: GenerationRecord[];
  saturated: boolean;
}

const FRESH_ROLL_SHARE = 0.3;
const BRED_SHARE = 0.35;
const TREATED_SHARE = 0.25;
const CLINIC_BEDS = 12;
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
  clinic: ScoredWorld[];
  treatedThisGeneration: number;
}

function freshRun(settings: TrainingSettings): RunState {
  return {
    archive: new EliteArchive(),
    trajectory: [],
    rng: mulberry32(settings.seed),
    watch: new SaturationWatch(settings.patience),
    limits: { ...touristLimits(settings.stepBudget, settings.radiusCap), patienceMs: CANDIDATE_PATIENCE_MS },
    clinic: [],
    treatedThisGeneration: 0,
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
  const treated = treatedCandidate(state);
  if (treated) return treated;
  const elites = state.archive.all();
  if (elites.length === 0 || chance(state.rng, FRESH_ROLL_SHARE)) return rolledGenome(state.rng);
  if (elites.length >= 2 && chance(state.rng, BRED_SHARE)) return bredCandidate(state, elites);
  return mutatedGenome(pick(state.rng, elites).genome, state.rng);
}

function treatedCandidate(state: RunState): WorldGenome | null {
  if (state.clinic.length === 0 || !chance(state.rng, TREATED_SHARE)) return null;
  const patient = state.clinic.shift()!;
  const diagnosis = diagnosisOf(patient);
  if (!diagnosis) return null;
  state.treatedThisGeneration++;
  return treatedGenome(patient, diagnosis, state.rng);
}

function admitToClinic(state: RunState, world: ScoredWorld): void {
  if (!worthTreating(world)) return;
  state.clinic.push(world);
  state.clinic.sort((one, other) => funOf(other) - funOf(one));
  if (state.clinic.length > CLINIC_BEDS) state.clinic.length = CLINIC_BEDS;
}

function bredCandidate(state: RunState, elites: readonly ScoredWorld[]): WorldGenome {
  const one = pick(state.rng, elites);
  const other = pick(
    state.rng,
    elites.filter((elite) => elite !== one),
  );
  const child = bredGenome(one.genome, other.genome, state.rng);
  return chance(state.rng, 0.5) ? mutatedGenome(child, state.rng) : child;
}

function recordOf(
  generation: number,
  batch: readonly ScoredWorld[],
  candidateCount: number,
  state: RunState,
): GenerationRecord {
  let admissions = 0;
  for (const world of batch) {
    if (state.archive.admit(world)) admissions++;
    admitToClinic(state, world);
  }
  const archiveBestFun = state.archive.bestFun();
  const coverage = state.archive.coverage();
  state.watch.notice(archiveBestFun, state.archive.meanFun());
  const patientsTreated = state.treatedThisGeneration;
  state.treatedThisGeneration = 0;
  return {
    generation,
    batch: batchScore(batch),
    archiveBestFun,
    coverage,
    admissions,
    patientsTreated,
    worldsWithNowhereToWalk: candidateCount - batch.length,
    generationsSinceGain: state.watch.generationsSinceGain(),
  };
}
