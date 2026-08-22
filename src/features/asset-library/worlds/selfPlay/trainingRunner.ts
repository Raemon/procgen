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

const FRESH_ROLL_SHARE = 0.3;
const BRED_SHARE = 0.35;
const TREATED_SHARE = 0.25;
const CLINIC_BEDS = 12;
const CANDIDATE_PATIENCE_MS = 8000;

export class TrainingRunner {
  readonly archive = new EliteArchive();
  readonly trajectory: GenerationRecord[] = [];
  private readonly rng: RandomStream;
  private readonly watch: SaturationWatch;
  private readonly limits: TouristLimits;
  private readonly clinic: ScoredWorld[] = [];
  private treatedThisGeneration = 0;

  constructor(readonly settings: TrainingSettings) {
    this.rng = mulberry32(settings.seed);
    this.watch = new SaturationWatch(settings.patience);
    this.limits = {
      ...touristLimits(settings.stepBudget, settings.radiusCap),
      patienceMs: CANDIDATE_PATIENCE_MS,
    };
  }

  hasFinished(): boolean {
    return this.trajectory.length >= this.settings.generations || this.hasSaturated();
  }

  hasSaturated(): boolean {
    return this.watch.hasSaturated();
  }

  nextGeneration(): GenerationRecord {
    const candidates = Array.from({ length: this.settings.batchSize }, () => this.nextCandidate());
    const walked = candidates.map((genome) =>
      scoredGenome(genome, this.limits, walkSeedOf(genome)),
    );
    const batch = walked.filter((world): world is ScoredWorld => world !== null);
    const record = this.recordOf(this.trajectory.length + 1, batch, candidates.length);
    this.trajectory.push(record);
    return record;
  }

  private nextCandidate(): WorldGenome {
    const treated = this.treatedCandidate();
    if (treated) return treated;
    const elites = this.archive.all();
    if (elites.length === 0 || chance(this.rng, FRESH_ROLL_SHARE)) return rolledGenome(this.rng);
    if (elites.length >= 2 && chance(this.rng, BRED_SHARE)) return this.bredCandidate(elites);
    return mutatedGenome(pick(this.rng, elites).genome, this.rng);
  }

  private treatedCandidate(): WorldGenome | null {
    if (this.clinic.length === 0 || !chance(this.rng, TREATED_SHARE)) return null;
    const patient = this.clinic.shift()!;
    const diagnosis = diagnosisOf(patient);
    if (!diagnosis) return null;
    this.treatedThisGeneration++;
    return treatedGenome(patient, diagnosis, this.rng);
  }

  private bredCandidate(elites: readonly ScoredWorld[]): WorldGenome {
    const one = pick(this.rng, elites);
    const other = pick(
      this.rng,
      elites.filter((elite) => elite !== one),
    );
    const child = bredGenome(one.genome, other.genome, this.rng);
    return chance(this.rng, 0.5) ? mutatedGenome(child, this.rng) : child;
  }

  private admitToClinic(world: ScoredWorld): void {
    if (!worthTreating(world)) return;
    this.clinic.push(world);
    this.clinic.sort((one, other) => funOf(other) - funOf(one));
    if (this.clinic.length > CLINIC_BEDS) this.clinic.length = CLINIC_BEDS;
  }

  private recordOf(
    generation: number,
    batch: readonly ScoredWorld[],
    candidateCount: number,
  ): GenerationRecord {
    let admissions = 0;
    for (const world of batch) {
      if (this.archive.admit(world)) admissions++;
      this.admitToClinic(world);
    }
    const archiveBestFun = this.archive.bestFun();
    const coverage = this.archive.coverage();
    this.watch.notice(archiveBestFun, this.archive.meanFun());
    const patientsTreated = this.treatedThisGeneration;
    this.treatedThisGeneration = 0;
    return {
      generation,
      batch: batchScore(batch),
      archiveBestFun,
      coverage,
      admissions,
      patientsTreated,
      worldsWithNowhereToWalk: candidateCount - batch.length,
      generationsSinceGain: this.watch.generationsSinceGain(),
    };
  }
}
