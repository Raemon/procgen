import type { BuildProgress } from '@/features/asset-library/worlds/eval/builtValues';

export interface BuildingWorld {
  buildProgress(): BuildProgress[];
}

export function worldBuildingHint(world: BuildingWorld): string {
  const pending = world.buildProgress();
  if (pending.length === 0) return 'the world is being built';
  return pending.map(describeBuild).join('; ');
}

function describeBuild(progress: BuildProgress): string {
  if (progress.state === 'failed') return `${progress.nodeType} failed to build: ${progress.error ?? 'unknown error'}`;
  const percent = Math.round(progress.fraction * 100);
  return `${progress.nodeType} is ${progress.stage} (${percent}%, ${Math.round(progress.elapsedMs / 100) / 10}s so far)`;
}

export function worldBuildSummary(world: BuildingWorld): { fraction: number; stage: string; elapsedMs: number } {
  const pending = world.buildProgress();
  return {
    fraction: pending.reduce((least, progress) => Math.min(least, progress.fraction), pending.length === 0 ? 1 : Infinity),
    stage: pending[0]?.stage ?? 'built',
    elapsedMs: pending.reduce((most, progress) => Math.max(most, progress.elapsedMs), 0),
  };
}
