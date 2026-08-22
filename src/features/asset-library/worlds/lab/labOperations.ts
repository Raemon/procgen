import type { CommandParams } from '@/features/app-shell/runtime/commands/command';
import { gradeStepper, type GradeTarget } from './gradeStepper';
import { freeWorldName, installLabWorld, type WorldLibrary } from './installLabWorld';
import { gradeLimitsOf, installCountOf, installNamesOf, rollRequestOf, trainingSettingsOf } from './labSettings';
import type { InstalledWorld, LabRun, LabWorld } from './labRun';
import { rollStepper } from './rollStepper';
import { trainStepper } from './trainStepper';
import type { WorldLab } from './worldLab';

export function startGradeRun(
  lab: WorldLab,
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

export function startRollRun(lab: WorldLab, params: CommandParams): LabRun {
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

export function startTrainRun(lab: WorldLab, params: CommandParams): LabRun {
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

export function installableWorldsOf(run: LabRun): LabWorld[] {
  return run.worlds.filter((world) => world.genome !== null);
}

export function worldsAskedFor(run: LabRun, params: CommandParams): LabWorld[] {
  const installable = installableWorldsOf(run);
  const names = installNamesOf(params);
  if (names.length === 0) return installable.slice(0, installCountOf(params));
  return names
    .map((name) => installable.find((world) => world.name === name))
    .filter((world): world is LabWorld => world !== undefined);
}

export function installRunWorlds(
  library: WorldLibrary,
  run: LabRun,
  wanted: readonly LabWorld[],
  takenNames: ReadonlySet<string>,
): InstalledWorld[] {
  const taken = new Set(takenNames);
  const installed = wanted.map((world) => {
    const name = freeWorldName(`${world.name} (${run.kind}ed)`, taken);
    taken.add(name);
    return installLabWorld(library, world.genome!, name, describeGrade(world));
  });
  run.installed.push(...installed);
  return installed;
}

function describeGrade(world: LabWorld): string {
  const strongest = [...world.grade.readings]
    .sort((one, other) => other.score - one.score)
    .slice(0, 3)
    .map((reading) => reading.name);
  return `Fun ${world.grade.fun.toFixed(3)}. Strongest: ${strongest.join(', ')}.`;
}
