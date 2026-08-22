import type { InstalledWorld, LabRunKind, LabRunStatus } from '../lab/labRun';
import type { BatchScore } from '../selfPlay/batchScore';
import type { GenerationRecord } from '../selfPlay/trainingRunner';
import type { WorldGenome } from '../selfPlay/worldGenome';
import type { MetricReading } from '../walkingSim/bandScore';

export interface LabRunSummary {
  id: string;
  kind: LabRunKind;
  status: LabRunStatus;
  started_at: string;
  finished_at: string | null;
  settings: Record<string, number>;
  progress: { done: number; total: number };
  generations_done: number;
  candidates_done: number;
  elites: number;
  coverage: number;
  worlds_graded: number;
  worlds_with_nowhere_to_walk: number;
  best_fun: number | null;
  error: string | null;
}

export interface LabRunWorld {
  rank: number;
  name: string;
  fun: number;
  walks_taken: number;
  weakest_readings: MetricReading[];
  readings: MetricReading[];
  genome: WorldGenome | null;
}

export interface LabRunDetail extends LabRunSummary {
  batch: BatchScore | null;
  worlds: LabRunWorld[];
  generations: GenerationRecord[];
  installed: InstalledWorld[];
}

export interface TrainRequest {
  generations: number;
  batch_size: number;
  step_budget: number;
  radius_cap: number;
  patience: number;
  seed?: number;
}

export async function fetchLabRuns(): Promise<LabRunSummary[]> {
  const response = await fetch('/api/v1/asset-library/worlds/lab');
  if (!response.ok) return [];
  return ((await response.json()) as { runs: LabRunSummary[] }).runs;
}

export async function fetchLabRun(id: string): Promise<LabRunDetail | null> {
  const response = await fetch(`/api/v1/asset-library/worlds/lab/${id}`);
  if (!response.ok) return null;
  return ((await response.json()) as { run: LabRunDetail }).run;
}

export async function startTrainingRun(request: TrainRequest): Promise<LabRunSummary | null> {
  const response = await fetch('/api/v1/asset-library/worlds/train', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) return null;
  return ((await response.json()) as { run: LabRunSummary }).run;
}

export async function stopLabRun(id: string): Promise<void> {
  await fetch(`/api/v1/asset-library/worlds/lab/${id}/stop`, { method: 'POST' });
}

export async function installLabWorlds(
  id: string,
  names: readonly string[],
): Promise<InstalledWorld[]> {
  const response = await fetch(`/api/v1/asset-library/worlds/lab/${id}/install`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ names }),
  });
  if (!response.ok) return [];
  return ((await response.json()) as { installed: InstalledWorld[] }).installed;
}
