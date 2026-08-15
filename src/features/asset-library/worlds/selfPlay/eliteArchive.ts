import type { WalkingSimMeasurements } from '../walkingSim/walkingSimMeasurements';
import { NEAR_DUPLICATE_DISTANCE } from './batchScore';
import { fingerprintDistance } from './worldFingerprint';
import { funOf, type ScoredWorld } from './scoreGenome';

const OPENNESS_EDGES = [0.05, 0.25, 0.6];
const GRAMMAR_EDGES = [0.5, 1.2, 2];
const DECISION_EDGES = [1, 8, 20];
const GATE_EDGES = [0.01, 0.08];

export const ARCHIVE_CELLS = (OPENNESS_EDGES.length + 1) ** 3 * (GATE_EDGES.length + 1);

export const FRONTIER_BEDS = 8;
export const FRONTIER_FUN_FLOOR = 0.3;
export const FRONTIER_NOVELTY_DISTANCE = 0.15;

export class EliteArchive {
  private readonly elites = new Map<string, ScoredWorld>();
  private readonly frontierWing: ScoredWorld[] = [];

  admit(world: ScoredWorld): boolean {
    if (this.admitElite(world)) return true;
    this.admitToFrontier(world);
    return false;
  }

  private admitElite(world: ScoredWorld): boolean {
    const cell = cellOf(world.measurements);
    const sitting = this.elites.get(cell);
    if (sitting && funOf(sitting) >= funOf(world)) return false;
    if (this.isAWeakerTwinOfAnElite(world, cell)) return false;
    this.elites.set(cell, world);
    return true;
  }

  private admitToFrontier(world: ScoredWorld): void {
    if (funOf(world) < FRONTIER_FUN_FLOOR) return;
    const neighbours = [...this.all(), ...this.frontierWing];
    const tooFamiliar = neighbours.some(
      (known) => fingerprintDistance(world.fingerprint, known.fingerprint) < FRONTIER_NOVELTY_DISTANCE,
    );
    if (tooFamiliar) return;
    this.frontierWing.push(world);
    if (this.frontierWing.length > FRONTIER_BEDS) {
      this.frontierWing.sort((one, other) => funOf(other) - funOf(one));
      this.frontierWing.length = FRONTIER_BEDS;
    }
  }

  frontier(): ScoredWorld[] {
    return [...this.frontierWing];
  }

  breedingPool(): ScoredWorld[] {
    return [...this.all(), ...this.frontierWing];
  }

  private isAWeakerTwinOfAnElite(world: ScoredWorld, cell: string): boolean {
    for (const [sittingCell, sitting] of this.elites) {
      if (sittingCell === cell) continue;
      if (fingerprintDistance(world.fingerprint, sitting.fingerprint) >= NEAR_DUPLICATE_DISTANCE) continue;
      if (funOf(sitting) >= funOf(world)) return true;
    }
    return false;
  }

  coverage(): number {
    return this.elites.size / ARCHIVE_CELLS;
  }

  bestFun(): number {
    return Math.max(0, ...this.all().map(funOf));
  }

  meanFun(): number {
    const elites = this.all();
    if (elites.length === 0) return 0;
    return elites.reduce((sum, elite) => sum + funOf(elite), 0) / elites.length;
  }

  all(): ScoredWorld[] {
    return [...this.elites.values()];
  }

  rankedByFun(): ScoredWorld[] {
    return this.all().sort((one, other) => funOf(other) - funOf(one));
  }
}

export function cellOf(measurements: WalkingSimMeasurements): string {
  return [
    bandOf(measurements.timeShareOpen, OPENNESS_EDGES),
    bandOf(measurements.placeGrammarBits, GRAMMAR_EDGES),
    bandOf(measurements.decisionPointsPer100Steps, DECISION_EDGES),
    bandOf(measurements.elevationGateShare, GATE_EDGES),
  ].join('/');
}

function bandOf(value: number, edges: readonly number[]): number {
  return edges.filter((edge) => value >= edge).length;
}
