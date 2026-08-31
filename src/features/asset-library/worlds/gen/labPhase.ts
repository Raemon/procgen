import type { CandidateRecord } from '../selfPlay/candidateRecord';
import type { GenerationRecord } from '../selfPlay/trainingRunner';
import { clockText, msPerStepOf } from './labProgress';

export interface LabPhaseRun {
  status: string;
  progress: { done: number; total: number };
  settings: Record<string, number>;
  generations: GenerationRecord[];
  error: string | null;
}

export function phaseLine(run: LabPhaseRun): string {
  if (run.status === 'failed') return `the run failed${run.error === null ? '' : `: ${run.error}`}`;
  if (run.status === 'stopped') return `stopped after ${run.progress.done} candidates`;
  if (run.status === 'done') return `finished all ${run.progress.done} candidates it graded`;
  return `walking ${candidatePlace(run)} — one candidate at a time, each a whole world`;
}

export function candidatePlace(run: LabPhaseRun): string {
  const batchSize = Math.max(1, run.settings.batch_size ?? 1);
  const generations = run.settings.generations ?? 0;
  const generation = Math.max(1, run.generations.length);
  const inBatch = Math.min(batchSize, (run.generations[generation - 1]?.candidates.length ?? 0) + 1);
  return `candidate ${inBatch} of ${batchSize} in generation ${generation} of ${generations}`;
}

export function lastCandidateLine(generations: GenerationRecord[]): string | null {
  const candidate = lastCandidateOf(generations);
  if (!candidate) return null;
  return `last graded: ${candidate.name} (${candidate.origin}) ${scoreWord(candidate)}`;
}

export function paceLine(done: number, elapsedMs: number): string | null {
  const pace = msPerStepOf(done, elapsedMs);
  if (pace === null) return null;
  return `about ${clockText(pace / 1000)} per candidate`;
}

export function stalenessLine(
  answeredAt: number | null,
  waitingSince: number | null,
  now: number,
): string | null {
  if (waitingSince === null) return null;
  const waited = Math.max(0, now - waitingSince);
  if (waited < STALE_AFTER_MS) return null;
  const known = answeredAt === null ? 'nothing back yet' : `last answer ${clockText((now - answeredAt) / 1000)} ago`;
  return `the server has been busy for ${clockText(waited / 1000)} — ${known}`;
}

const STALE_AFTER_MS = 2500;

function lastCandidateOf(generations: GenerationRecord[]): CandidateRecord | null {
  for (let at = generations.length - 1; at >= 0; at--) {
    const last = generations[at]!.candidates[generations[at]!.candidates.length - 1];
    if (last) return last;
  }
  return null;
}

function scoreWord(candidate: CandidateRecord): string {
  if (!candidate.walkable) return 'had nowhere to walk';
  const fun = candidate.fun === null ? '' : `fun ${candidate.fun.toFixed(3)}, `;
  return `${fun}${candidate.admitted ? 'admitted' : 'not admitted'}`;
}
