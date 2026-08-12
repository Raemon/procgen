import type { TrainingSettings } from '@/features/asset-library/worlds/selfPlay/trainingLoop';

const DEFAULT_SETTINGS: TrainingSettings = {
  generations: 40,
  batchSize: 12,
  stepBudget: 400,
  radiusCap: 140,
  seed: 20260812,
  patience: 12,
};

export function trainingSettingsOf(args: readonly string[]): TrainingSettings {
  return {
    generations: numberFlag(args, 'generations', DEFAULT_SETTINGS.generations),
    batchSize: numberFlag(args, 'batch', DEFAULT_SETTINGS.batchSize),
    stepBudget: numberFlag(args, 'steps', DEFAULT_SETTINGS.stepBudget),
    radiusCap: numberFlag(args, 'radius', DEFAULT_SETTINGS.radiusCap),
    seed: numberFlag(args, 'seed', DEFAULT_SETTINGS.seed),
    patience: numberFlag(args, 'patience', DEFAULT_SETTINGS.patience),
  };
}

function numberFlag(args: readonly string[], name: string, fallback: number): number {
  const given = args.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1];
  const parsed = Number(given);
  return given !== undefined && Number.isFinite(parsed) ? parsed : fallback;
}
