import type { WalkingSimMeasurements } from '../walkingSim/walkingSimMeasurements';
import { NEAR_DUPLICATE_DISTANCE } from './batchScore';
import { fingerprintDistance } from './worldFingerprint';
import { funOf, type ScoredWorldSeed } from './scoreGenome';

const OPENNESS_EDGES = [0.05, 0.25, 0.6];
const GRAMMAR_EDGES = [0.5, 1.2, 2];
const DECISION_EDGES = [1, 8, 20];
const GATE_EDGES = [0.01, 0.08];

export const ARCHIVE_CELLS = (OPENNESS_EDGES.length + 1) ** 3 * (GATE_EDGES.length + 1);

export class EliteArchive {
  private readonly elites = new Map<string, ScoredWorldSeed>();

  admit(seed: ScoredWorldSeed): boolean {
    const cell = cellOf(seed.measurements);
    const sitting = this.elites.get(cell);
    if (sitting && funOf(sitting) >= funOf(seed)) return false;
    if (this.isAWeakerTwinOfAnElite(seed, cell)) return false;
    this.elites.set(cell, seed);
    return true;
  }

  private isAWeakerTwinOfAnElite(seed: ScoredWorldSeed, cell: string): boolean {
    for (const [sittingCell, sitting] of this.elites) {
      if (sittingCell === cell) continue;
      if (fingerprintDistance(seed.fingerprint, sitting.fingerprint) >= NEAR_DUPLICATE_DISTANCE) continue;
      if (funOf(sitting) >= funOf(seed)) return true;
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

  all(): ScoredWorldSeed[] {
    return [...this.elites.values()];
  }

  rankedByFun(): ScoredWorldSeed[] {
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
