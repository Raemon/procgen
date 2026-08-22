import type { BatchScore } from '../selfPlay/batchScore';
import type { GenerationRecord } from '../selfPlay/trainingRunner';
import type { WorldGenome } from '../selfPlay/worldGenome';
import type { WorldGrade } from './worldGrade';

export type LabRunKind = 'grade' | 'roll' | 'train';
export type LabRunStatus = 'running' | 'done' | 'stopped' | 'failed';

export interface LabWorld {
  name: string;
  grade: WorldGrade;
  genome: WorldGenome | null;
}

export interface InstalledWorld {
  name: string;
  tilesAdded: number;
  piecesAdded: number;
}

export interface LabRun {
  id: string;
  kind: LabRunKind;
  status: LabRunStatus;
  startedAt: string;
  finishedAt: string | null;
  settings: Record<string, number>;
  done: number;
  total: number;
  worlds: LabWorld[];
  batch: BatchScore | null;
  trajectory: GenerationRecord[];
  installed: InstalledWorld[];
  unwalkable: number;
  error: string | null;
  stopRequested: boolean;
}

export interface LabStepper {
  total: number;
  step(run: LabRun): void;
  finish(run: LabRun): void;
}

export function newLabRun(
  id: string,
  kind: LabRunKind,
  settings: Record<string, number>,
  total: number,
  startedAt: string,
): LabRun {
  return {
    id,
    kind,
    status: 'running',
    startedAt,
    finishedAt: null,
    settings,
    done: 0,
    total,
    worlds: [],
    batch: null,
    trajectory: [],
    installed: [],
    unwalkable: 0,
    error: null,
    stopRequested: false,
  };
}

export function rankWorlds(run: LabRun): void {
  run.worlds.sort((one, other) => other.grade.fun - one.grade.fun);
}

export function runSummaryLine(run: LabRun): string {
  const progress = `${run.done}/${run.total}`;
  const best = run.worlds[0];
  const found = best ? `best ${best.name} at fun ${best.grade.fun.toFixed(3)}` : 'nothing walkable yet';
  return `${run.id} (${run.kind}) ${run.status}, ${progress} done, ${found}`;
}
