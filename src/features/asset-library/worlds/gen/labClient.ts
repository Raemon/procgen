import type { InstalledWorldSeed, LabRunKind, LabRunStatus } from '../lab/labRun';
import type { BatchScore } from '../selfPlay/batchScore';
import type { GenerationRecord } from '../selfPlay/trainingRunner';
import type { WorldSeedGenome } from '../selfPlay/worldSeedGenome';
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
  world_seeds_graded: number;
  world_seeds_with_nowhere_to_walk: number;
  best_fun: number | null;
  error: string | null;
}

export interface LabRunWorldSeed {
  rank: number;
  name: string;
  fun: number;
  walks_taken: number;
  weakest_readings: MetricReading[];
  readings: MetricReading[];
  genome: WorldSeedGenome | null;
}

export interface LabRunDetail extends LabRunSummary {
  batch: BatchScore | null;
  world_seeds: LabRunWorldSeed[];
  generations: GenerationRecord[];
  installed: InstalledWorldSeed[];
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
  const response = await fetch('/api/v1/asset-library/world-seeds/lab');
  if (!response.ok) return [];
  return ((await response.json()) as { runs: LabRunSummary[] }).runs;
}

export async function fetchLabRun(id: string): Promise<LabRunDetail | null> {
  const response = await fetch(`/api/v1/asset-library/world-seeds/lab/${id}`);
  if (!response.ok) return null;
  return ((await response.json()) as { run: LabRunDetail }).run;
}

export async function startTrainingRun(request: TrainRequest): Promise<LabRunSummary | null> {
  const response = await fetch('/api/v1/asset-library/world-seeds/train', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) return null;
  return ((await response.json()) as { run: LabRunSummary }).run;
}

export async function stopLabRun(id: string): Promise<void> {
  await fetch(`/api/v1/asset-library/world-seeds/lab/${id}/stop`, { method: 'POST' });
}

export async function installLabWorldSeeds(
  id: string,
  names: readonly string[],
): Promise<InstalledWorldSeed[]> {
  const response = await fetch(`/api/v1/asset-library/world-seeds/lab/${id}/install`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ names }),
  });
  if (!response.ok) return [];
  return ((await response.json()) as { installed: InstalledWorldSeed[] }).installed;
}
