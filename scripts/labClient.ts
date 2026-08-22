import type { WalkingSimMeasurements } from '@/features/asset-library/worlds/walkingSim/walkingSimMeasurements';
import type { MetricReading } from '@/features/asset-library/worlds/walkingSim/bandScore';
import type { BatchScore } from '@/features/asset-library/worlds/selfPlay/batchScore';
import type { GenerationRecord } from '@/features/asset-library/worlds/selfPlay/trainingRunner';
import { genomeFromJson, type WorldGenome } from '@/features/asset-library/worlds/selfPlay/worldGenome';
import type { ReportWorld } from './selfPlay/writeTrainingReport';

const DEFAULT_SERVER = `http://localhost:${process.env.PORT ?? 1111}`;

export interface LabRunJson {
  id: string;
  kind: string;
  status: 'running' | 'done' | 'stopped' | 'failed';
  settings: Record<string, number>;
  progress: { done: number; total: number };
  worlds_graded: number;
  worlds_with_nowhere_to_walk: number;
  best_fun: number | null;
  error: string | null;
  batch: BatchScore | null;
  generations: GenerationRecord[];
  worlds: {
    name: string;
    fun: number;
    readings: MetricReading[];
    measurements: WalkingSimMeasurements;
    genome: WorldGenome | null;
  }[];
}

export function labServerUrl(): string {
  return process.env.PROCGEN_URL ?? DEFAULT_SERVER;
}

export async function startLabRun(path: string, body: Record<string, number>): Promise<string> {
  const answer = await askServer(path, { method: 'POST', body: JSON.stringify(body) });
  return (answer as { run: { id: string } }).run.id;
}

export async function readLabRun(id: string): Promise<LabRunJson> {
  const answer = await askServer(`/asset-library/worlds/lab/${id}`, { method: 'GET' });
  return (answer as { run: LabRunJson }).run;
}

export async function stopLabRun(id: string): Promise<void> {
  await askServer(`/asset-library/worlds/lab/${id}/stop`, { method: 'POST' });
}

export async function followLabRun(
  id: string,
  onProgress: (run: LabRunJson) => void,
  pollMs = 1000,
): Promise<LabRunJson> {
  let lastSeen = -1;
  for (;;) {
    const run = await readLabRun(id);
    if (run.progress.done !== lastSeen) {
      lastSeen = run.progress.done;
      onProgress(run);
    }
    if (run.status !== 'running') return run;
    await new Promise((wake) => setTimeout(wake, pollMs));
  }
}

export function reportWorldsOf(run: LabRunJson): ReportWorld[] {
  return run.worlds
    .filter((world) => world.genome !== null)
    .map((world) => ({
      genome: genomeFromJson(world.genome),
      paletteName: world.name,
      measurements: world.measurements,
      score: { overall: world.fun, readings: world.readings },
    }));
}

async function askServer(path: string, init: RequestInit): Promise<unknown> {
  const url = `${labServerUrl()}/api/v1${path}`;
  const answer = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json' },
  }).catch((reason: unknown) => {
    throw new Error(
      `${url} did not answer (${String(reason)}). The world lab runs inside the server — start it with \`npm run dev\`, or point PROCGEN_URL at one that is running.`,
    );
  });
  if (!answer.ok) throw new Error(`${init.method} ${url} answered ${answer.status}: ${await answer.text()}`);
  return answer.json();
}

export function stopOnInterrupt(id: () => string | null): void {
  process.on('SIGINT', () => {
    const running = id();
    if (!running) process.exit(130);
    void stopLabRun(running).finally(() => process.exit(130));
  });
}
