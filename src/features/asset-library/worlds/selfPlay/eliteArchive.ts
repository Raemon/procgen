import type { WalkingSimMeasurements } from '../walkingSim/walkingSimMeasurements';
import { funOf, type ScoredWorld } from './scoreGenome';

const OPENNESS_EDGES = [0.05, 0.25, 0.6];
const SCENERY_EDGES = [1, 1.6, 2.2];
const DECISION_EDGES = [1, 8, 20];

export const ARCHIVE_CELLS = (OPENNESS_EDGES.length + 1) ** 3;

export class EliteArchive {
  private readonly elites = new Map<string, ScoredWorld>();

  admit(world: ScoredWorld): boolean {
    const cell = cellOf(world.measurements);
    const sitting = this.elites.get(cell);
    if (sitting && funOf(sitting) >= funOf(world)) return false;
    this.elites.set(cell, world);
    return true;
  }

  coverage(): number {
    return this.elites.size / ARCHIVE_CELLS;
  }

  bestFun(): number {
    return Math.max(0, ...this.all().map(funOf));
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
    bandOf(measurements.sceneryEntropyBits, SCENERY_EDGES),
    bandOf(measurements.decisionPointsPer100Steps, DECISION_EDGES),
  ].join('/');
}

function bandOf(value: number, edges: readonly number[]): number {
  return edges.filter((edge) => value >= edge).length;
}
