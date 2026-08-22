import { mulberry32, type RandomStream } from '../random/mulberry32';
import { chance, pick } from '../randomize/randomRolls';
import { touristLimits, type TouristLimits } from '../walkingSim/touristWalk';
import { batchScore, type BatchScore } from './batchScore';
import { bredGenome } from './breedGenomes';
import {
  unwalkableCandidateRecord,
  walkedCandidateRecord,
  type Candidate,
  type CandidateRecord,
} from './candidateRecord';
import { EliteArchive } from './eliteArchive';
import { diagnosisOf, treatedGenome, worthTreating } from './worldDoctor';
import { mutatedGenome } from './mutateGenome';
import { funOf, scoredGenome, walkSeedOf, type ScoredWorld } from './scoreGenome';
import { SaturationWatch } from './saturationWatch';
import { rolledGenome } from './worldGenome';

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
  candidates: CandidateRecord[];
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
  private waiting: Candidate[] = [];
  private walked: ScoredWorld[] = [];
  private inProgress: GenerationRecord | null = null;

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
    this.beginGeneration();
    while (this.candidatesLeft() > 0) this.scoreNextCandidate();
    return this.endGeneration();
  }

  beginGeneration(): GenerationRecord {
    this.waiting = Array.from({ length: this.settings.batchSize }, () => this.nextCandidate());
    this.walked = [];
    this.inProgress = this.openingRecord();
    return this.inProgress;
  }

  candidatesLeft(): number {
    return this.waiting.length;
  }

  scoreNextCandidate(): CandidateRecord {
    const generation = this.inProgress;
    const candidate = this.waiting.shift();
    if (!generation || !candidate) {
      throw new Error('scoring a candidate needs a generation begun and a candidate still waiting');
    }
    const world = scoredGenome(candidate.genome, this.limits, walkSeedOf(candidate.genome));
    const record = world
      ? this.keptOrRejected(candidate, world, generation)
      : unwalkableCandidateRecord(candidate);
    generation.candidates.push(record);
    return record;
  }

  endGeneration(): GenerationRecord {
    const opened = this.inProgress ?? this.openingRecord();
    const archiveBestFun = this.archive.bestFun();
    this.watch.notice(archiveBestFun, this.archive.meanFun());
    const record: GenerationRecord = {
      ...opened,
      batch: batchScore(this.walked),
      archiveBestFun,
      coverage: this.archive.coverage(),
      patientsTreated: this.treatedThisGeneration,
      worldsWithNowhereToWalk: opened.candidates.filter((each) => !each.walkable).length,
      generationsSinceGain: this.watch.generationsSinceGain(),
    };
    this.treatedThisGeneration = 0;
    this.inProgress = null;
    this.trajectory.push(record);
    return record;
  }

  private openingRecord(): GenerationRecord {
    return {
      generation: this.trajectory.length + 1,
      batch: batchScore([]),
      archiveBestFun: this.archive.bestFun(),
      coverage: this.archive.coverage(),
      admissions: 0,
      patientsTreated: this.treatedThisGeneration,
      worldsWithNowhereToWalk: 0,
      generationsSinceGain: this.watch.generationsSinceGain(),
      candidates: [],
    };
  }

  private keptOrRejected(
    candidate: Candidate,
    world: ScoredWorld,
    generation: GenerationRecord,
  ): CandidateRecord {
    const admitted = this.archive.admit(world);
    if (admitted) generation.admissions++;
    this.admitToClinic(world);
    this.walked.push(world);
    return walkedCandidateRecord(candidate, world, admitted);
  }

  private nextCandidate(): Candidate {
    const treated = this.treatedCandidate();
    if (treated) return treated;
    const elites = this.archive.all();
    if (elites.length === 0 || chance(this.rng, FRESH_ROLL_SHARE)) {
      return { genome: rolledGenome(this.rng), origin: 'rolled', parents: [] };
    }
    if (elites.length >= 2 && chance(this.rng, BRED_SHARE)) return this.bredCandidate(elites);
    const parent = pick(this.rng, elites);
    return {
      genome: mutatedGenome(parent.genome, this.rng),
      origin: 'mutated',
      parents: [parent.paletteName],
    };
  }

  private treatedCandidate(): Candidate | null {
    if (this.clinic.length === 0 || !chance(this.rng, TREATED_SHARE)) return null;
    const patient = this.clinic.shift()!;
    const diagnosis = diagnosisOf(patient);
    if (!diagnosis) return null;
    this.treatedThisGeneration++;
    return {
      genome: treatedGenome(patient, diagnosis, this.rng),
      origin: 'treated',
      parents: [patient.paletteName],
    };
  }

  private bredCandidate(elites: readonly ScoredWorld[]): Candidate {
    const one = pick(this.rng, elites);
    const other = pick(
      this.rng,
      elites.filter((elite) => elite !== one),
    );
    const child = bredGenome(one.genome, other.genome, this.rng);
    return {
      genome: chance(this.rng, 0.5) ? mutatedGenome(child, this.rng) : child,
      origin: 'bred',
      parents: [one.paletteName, other.paletteName],
    };
  }

  private admitToClinic(world: ScoredWorld): void {
    if (!worthTreating(world)) return;
    this.clinic.push(world);
    this.clinic.sort((one, other) => funOf(other) - funOf(one));
    if (this.clinic.length > CLINIC_BEDS) this.clinic.length = CLINIC_BEDS;
  }
}
