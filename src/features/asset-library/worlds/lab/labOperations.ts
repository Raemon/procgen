import type { CommandParams } from '@/features/app-shell/runtime/commands/command';
import { gradeStepper, type GradeTarget } from './gradeStepper';
import { installLabWorldSeed, type LabInstallTargets } from './installLabWorldSeed';
import { freeWorldSeedName } from '../seeds/freeWorldSeedName';
import { gradeLimitsOf, installCountOf, installNamesOf, rollRequestOf, trainingSettingsOf } from './labSettings';
import type { InstalledWorldSeed, LabRun, LabWorldSeed } from './labRun';
import { rollStepper } from './rollStepper';
import { trainStepper } from './trainStepper';
import type { WorldSeedLab } from './worldSeedLab';

export function startGradeRun(
  lab: WorldSeedLab,
  target: GradeTarget,
  params: CommandParams,
): LabRun {
  const limits = gradeLimitsOf(params);
  return lab.start(
    'grade',
    { step_budget: limits.stepBudget, radius_cap: limits.radiusCap, walk_seed: limits.walkSeed },
    gradeStepper(target, limits),
  );
}

export function startRollRun(lab: WorldSeedLab, params: CommandParams): LabRun {
  const request = rollRequestOf(params);
  return lab.start(
    'roll',
    {
      count: request.count,
      seed: request.seed,
      step_budget: request.limits.stepBudget,
      radius_cap: request.limits.radiusCap,
    },
    rollStepper(request.count, request.seed, request.limits),
  );
}

export function startTrainRun(lab: WorldSeedLab, params: CommandParams): LabRun {
  const settings = trainingSettingsOf(params);
  return lab.start(
    'train',
    {
      generations: settings.generations,
      batch_size: settings.batchSize,
      step_budget: settings.stepBudget,
      radius_cap: settings.radiusCap,
      seed: settings.seed,
      patience: settings.patience,
    },
    trainStepper(settings),
  );
}

export function installableWorldSeedsOf(run: LabRun): LabWorldSeed[] {
  return run.worldSeeds.filter((seed) => seed.genome !== null);
}

export function worldSeedsAskedFor(run: LabRun, params: CommandParams): LabWorldSeed[] {
  const installable = installableWorldSeedsOf(run);
  const names = installNamesOf(params);
  if (names.length === 0) return installable.slice(0, installCountOf(params));
  return names
    .map((name) => installable.find((seed) => seed.name === name))
    .filter((seed): seed is LabWorldSeed => seed !== undefined);
}

export function installRunWorldSeeds(
  library: LabInstallTargets,
  run: LabRun,
  wanted: readonly LabWorldSeed[],
  takenNames: ReadonlySet<string>,
): InstalledWorldSeed[] {
  const taken = new Set(takenNames);
  const installed = wanted.map((seed) => {
    const name = freeWorldSeedName(`${seed.name} (${run.kind}ed)`, taken);
    taken.add(name);
    return installLabWorldSeed(library, seed.genome!, name, describeGrade(seed));
  });
  run.installed.push(...installed);
  return installed;
}

function describeGrade(seed: LabWorldSeed): string {
  const strongest = [...seed.grade.readings]
    .sort((one, other) => other.score - one.score)
    .slice(0, 3)
    .map((reading) => reading.name);
  return `Fun ${seed.grade.fun.toFixed(3)}. Strongest: ${strongest.join(', ')}.`;
}
