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

export interface LabRunsAnswer {
  runs: LabRunSummary[];
  failure: string | null;
}

export interface LabRunAnswer {
  run: LabRunDetail | null;
  failure: string | null;
}

export interface LabStartAnswer {
  run: LabRunSummary | null;
  failure: string | null;
}

export async function fetchLabRuns(): Promise<LabRunsAnswer> {
  const answer = await askTheLab('/api/v1/asset-library/world-seeds/lab');
  if (answer.failure !== null) return { runs: [], failure: answer.failure };
  return { runs: (answer.body as { runs: LabRunSummary[] }).runs, failure: null };
}

export async function fetchLabRun(id: string): Promise<LabRunAnswer> {
  const answer = await askTheLab(`/api/v1/asset-library/world-seeds/lab/${id}`);
  if (answer.failure !== null) return { run: null, failure: answer.failure };
  return { run: (answer.body as { run: LabRunDetail }).run, failure: null };
}

export async function startTrainingRun(request: TrainRequest): Promise<LabStartAnswer> {
  const answer = await askTheLab('/api/v1/asset-library/world-seeds/train', request);
  if (answer.failure !== null) return { run: null, failure: answer.failure };
  return { run: (answer.body as { run: LabRunSummary }).run, failure: null };
}

export async function stopLabRun(id: string): Promise<string | null> {
  const answer = await askTheLab(`/api/v1/asset-library/world-seeds/lab/${id}/stop`, {});
  return answer.failure;
}

export async function installLabWorldSeeds(
  id: string,
  names: readonly string[],
): Promise<InstalledWorldSeed[]> {
  const answer = await askTheLab(`/api/v1/asset-library/world-seeds/lab/${id}/install`, { names });
  if (answer.failure !== null) return [];
  return (answer.body as { installed: InstalledWorldSeed[] }).installed;
}

async function askTheLab(
  path: string,
  post?: unknown,
): Promise<{ body: unknown; failure: string | null }> {
  try {
    const response = await fetch(path, postOptions(post));
    const text = await response.text();
    if (!response.ok) return { body: null, failure: refusalText(response.status, text) };
    return { body: JSON.parse(text) as unknown, failure: null };
  } catch (thrown) {
    return { body: null, failure: thrown instanceof Error ? thrown.message : String(thrown) };
  }
}

function postOptions(post: unknown): RequestInit | undefined {
  if (post === undefined) return undefined;
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(post),
  };
}

export function refusalText(status: number, text: string): string {
  try {
    const said = JSON.parse(text) as { error?: string; hint?: string };
    if (said.hint) return `${status} ${said.error ?? 'refused'} — ${said.hint}`;
  } catch {
    /* the server answered with something other than our failure json */
  }
  return `${status} — ${text.slice(0, 200) || 'the server said nothing'}`;
}
