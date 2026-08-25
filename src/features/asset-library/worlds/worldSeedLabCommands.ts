import {
  commandFailed,
  commandSucceeded,
  type CommandContext,
  type CommandResult,
  type CommandSpec,
  type CommandParams,
} from '@/features/app-shell/runtime/commands/command';
import { readText } from '@/features/app-shell/runtime/commands/commandParams';
import { createCommandCollection } from '@/features/app-shell/runtime/commands/commandCollection';
import {
  installRunWorlds,
  installableWorldSeedsOf,
  startGradeRun,
  startRollRun,
  startTrainRun,
  worldSeedsAskedFor,
} from './lab/labOperations';
import { runSummaryLine, type LabRun } from './lab/labRun';
import { gradeSummaryLine, weakestReadingsOf } from './lab/worldGrade';
import type { WorldSeedLab } from './lab/worldSeedLab';
import { examplePipelines } from './seeds/examplePipelines';

const { define: registerCommand, commands: worldSeedLabCommands } = createCommandCollection();
export { worldSeedLabCommands };

const LAB_CONTROL = 'no button of its own — the world lab runs on the server, under /api/v1/asset-library/world-seeds';

function registerLabCommand(
  spec: Omit<CommandSpec, 'mode' | 'group' | 'humanControl'>,
): CommandSpec {
  return registerCommand({ ...spec, mode: 'god', group: 'world', humanControl: LAB_CONTROL });
}

registerLabCommand({
  action: 'grade_world_seed',
  changesWorld: false,
  description:
    'Grade the world you are standing in: a tourist walks it and reports one fun score plus a reading per metric band. The walk runs in the background — read_world_seed_lab gives you the result and names the weakest readings, which is where to edit next.',
  params: {
    step_budget: { kind: 'int', help: 'how many steps each walk may take, 50-5000', optional: true },
    radius_cap: { kind: 'int', help: 'how far from the spawn a walk may wander, 20-400', optional: true },
    walk_seed: { kind: 'int', help: 'seed for the walk; the same seed rewalks the same route', optional: true },
  },
  example: { action: 'grade_world_seed', step_budget: 350 },
  apply: (context, params) => startGrade(context, params),
});

registerLabCommand({
  action: 'roll_world_seeds',
  changesWorld: false,
  description:
    'Roll fresh worlds and grade every one of them, ranked by fun. This is the world generator and the grader in one pass: it neither touches nor replaces the world you are in. install_lab_world_seeds saves the winners into the library.',
  params: {
    count: { kind: 'int', help: 'how many worlds to roll, 1-64', optional: true },
    seed: { kind: 'int', help: 'seed for the roll; the same seed rolls the same worlds', optional: true },
    step_budget: { kind: 'int', help: 'how many steps each walk may take, 50-5000', optional: true },
    radius_cap: { kind: 'int', help: 'how far from the spawn a walk may wander, 20-400', optional: true },
  },
  example: { action: 'roll_world_seeds', count: 8 },
  apply: (context, params) => startRoll(context, params),
});

registerLabCommand({
  action: 'train_world_seeds',
  changesWorld: false,
  description:
    'Breed worlds instead of rolling them: each generation rolls, mutates, breeds and treats candidates, grades them, and keeps the fun and distinct ones in an elite archive. Long-running — it reports a generation at a time and stops early once it saturates.',
  params: {
    generations: { kind: 'int', help: 'how many generations to live through, 1-200', optional: true },
    batch_size: { kind: 'int', help: 'how many worlds per generation, 2-32', optional: true },
    step_budget: { kind: 'int', help: 'how many steps each walk may take, 50-5000', optional: true },
    radius_cap: { kind: 'int', help: 'how far from the spawn a walk may wander, 20-400', optional: true },
    seed: { kind: 'int', help: 'seed for the run; the same seed breeds the same worlds', optional: true },
    patience: { kind: 'int', help: 'generations without a gain before the run gives up, 1-100', optional: true },
  },
  example: { action: 'train_world_seeds', generations: 20 },
  apply: (context, params) => startTraining(context, params),
});

registerLabCommand({
  action: 'read_world_seed_lab',
  changesWorld: false,
  description:
    'Read what the lab is doing: every run with its progress, and for one named run its ranked worlds and their weakest readings. Runs keep working while you read them.',
  params: {
    run_id: { kind: 'text', help: 'the run to read in full; omitted lists them all', optional: true },
  },
  example: { action: 'read_world_seed_lab', run_id: 'lab_1' },
  apply: (context, params) => readLab(context, params),
});

registerLabCommand({
  action: 'stop_lab_run',
  changesWorld: false,
  description: 'Stop a lab run. What it has graded so far stays readable and installable.',
  params: { run_id: { kind: 'text', help: 'the run to stop — see read_world_seed_lab' } },
  example: { action: 'stop_lab_run', run_id: 'lab_1' },
  apply: (context, params) => stopRun(context, params),
});

registerLabCommand({
  action: 'install_lab_world_seeds',
  changesWorld: true,
  description:
    "Save a run's best worlds into the library, each with the tiles, pieces and culture its palette needs, so run_world_seed can run them by name.",
  params: {
    run_id: { kind: 'text', help: 'the run whose winners to save — see read_world_seed_lab' },
    count: { kind: 'int', help: 'how many of the top worlds to save, 1-20', optional: true },
    names: {
      kind: 'json',
      help: 'the exact world names from the run to save, up to 20; overrides count when given',
      optional: true,
    },
  },
  example: { action: 'install_lab_world_seeds', run_id: 'lab_1', count: 3 },
  apply: (context, params) => installWorlds(context, params),
});

function labOf(context: CommandContext): WorldSeedLab | null {
  return context.lab;
}

function noLab(): CommandResult {
  return commandFailed(
    'no_world_lab',
    'this client has no world lab — the lab runs on the server, so call it from an agent or POST /api/v1/asset-library/world-seeds/grade, /roll or /train',
  );
}

function startGrade(context: CommandContext, params: CommandParams): CommandResult {
  const lab = labOf(context);
  if (!lab) return noLab();
  const run = startGradeRun(
    lab,
    {
      name: context.runningWorld.seedName() || 'the running world',
      sampler: context.worldSampler,
      tileAssets: context.tileAssets,
    },
    params,
  );
  return commandSucceeded(`${run.id} is walking this world; read_world_seed_lab run_id=${run.id}`);
}

function startRoll(context: CommandContext, params: CommandParams): CommandResult {
  const lab = labOf(context);
  if (!lab) return noLab();
  const run = startRollRun(lab, params);
  return commandSucceeded(
    `${run.id} is rolling and grading ${run.total} worlds from seed ${run.settings.seed}; read_world_seed_lab run_id=${run.id}`,
  );
}

function startTraining(context: CommandContext, params: CommandParams): CommandResult {
  const lab = labOf(context);
  if (!lab) return noLab();
  const run = startTrainRun(lab, params);
  return commandSucceeded(
    `${run.id} is breeding ${run.settings.batch_size} worlds a generation for up to ${run.settings.generations} generations; read_world_seed_lab run_id=${run.id}`,
  );
}

function readLab(context: CommandContext, params: CommandParams): CommandResult {
  const lab = labOf(context);
  if (!lab) return noLab();
  const wanted = params.run_id;
  if (wanted === undefined) {
    const runs = lab.all();
    if (runs.length === 0) return commandSucceeded('the lab has run nothing yet');
    return commandSucceeded(runs.map(runSummaryLine).join('\n'));
  }
  const id = readText(params, 'run_id');
  if (!id.ok) return id.failure;
  const run = lab.byId(id.value);
  if (!run) return unknownRun(lab, id.value);
  return commandSucceeded(runReport(run));
}

function stopRun(context: CommandContext, params: CommandParams): CommandResult {
  const lab = labOf(context);
  if (!lab) return noLab();
  const id = readText(params, 'run_id');
  if (!id.ok) return id.failure;
  const run = lab.stop(id.value);
  if (!run) return unknownRun(lab, id.value);
  return commandSucceeded(`${run.id} is ${run.status === 'running' ? 'stopping' : run.status}`);
}

function installWorlds(context: CommandContext, params: CommandParams): CommandResult {
  const lab = labOf(context);
  if (!lab) return noLab();
  const id = readText(params, 'run_id');
  if (!id.ok) return id.failure;
  const run = lab.byId(id.value);
  if (!run) return unknownRun(lab, id.value);
  if (installableWorldSeedsOf(run).length === 0) {
    return commandFailed(
      'nothing_to_install',
      `${run.id} has no rolled world to save — grade runs measure the world you are already in`,
    );
  }
  const installed = installRunWorlds(
    {
      tileAssets: context.tileAssets,
      pieces: context.pieces,
      cultures: context.cultures,
      worldSeeds: context.worldSeeds,
    },
    run,
    worldSeedsAskedFor(run, params),
    takenWorldSeedNames(context),
  );
  return commandSucceeded(
    `saved ${installed.map((each) => `'${each.name}'`).join(', ')} into the library; run_world_seed runs them by name`,
  );
}

function takenWorldSeedNames(context: CommandContext): Set<string> {
  return new Set([
    ...context.worldSeeds.savedWorldSeeds().map((seed) => seed.name),
    ...examplePipelines().map((seed) => seed.name),
  ]);
}

function unknownRun(lab: WorldSeedLab, id: string): CommandResult {
  const known = lab.all().map((run) => run.id);
  return commandFailed(
    'unknown_lab_run',
    known.length === 0
      ? 'the lab has run nothing yet'
      : `no run '${id}' — the lab holds: ${known.join(', ')}`,
  );
}

function runReport(run: LabRun): string {
  const lines = [runSummaryLine(run)];
  if (run.unwalkable > 0) lines.push(`${run.unwalkable} had nowhere to walk`);
  if (run.batch) {
    lines.push(
      `batch: mean fun ${run.batch.meanFun.toFixed(3)}, diversity ${run.batch.diversity.toFixed(3)}, near duplicates ${run.batch.nearDuplicatePairs}`,
    );
  }
  for (const [at, world] of run.worlds.slice(0, 10).entries()) {
    lines.push(`${at + 1}. ${world.name} — ${gradeSummaryLine(world.grade)}`);
  }
  const best = run.worlds[0];
  if (best) {
    lines.push(
      `weakest readings of the leader: ${weakestReadingsOf(best.grade, 5)
        .map((reading) => `${reading.name} ${reading.score.toFixed(2)}`)
        .join(', ')}`,
    );
  }
  if (run.error) lines.push(`failed: ${run.error}`);
  return lines.join('\n');
}
