import { failure, json, type ApiResponse } from '@/features/agents/api/apiMessages';
import { registerRoute, type RouteContext } from '@/features/agents/api/routeRegistry';
import { examplePipelines } from '../presets/examplePipelines';
import {
  installRunWorlds,
  installableWorldsOf,
  startGradeRun,
  startRollRun,
  startTrainRun,
  worldsAskedFor,
} from '../lab/labOperations';
import type { LabRun } from '../lab/labRun';
import { runDetailJson, runListJson } from './labRunJson';

const WALK_PARAMS = {
  step_budget: { kind: 'int' as const, help: 'how many steps each walk may take, 50-5000', optional: true },
  radius_cap: { kind: 'int' as const, help: 'how far from the spawn a walk may wander, 20-400', optional: true },
};

registerRoute({
  method: 'POST',
  path: '/asset-library/worlds/grade',
  summary:
    'grade the running world: a tourist walks it and scores one fun number plus a reading per metric band. Answers with the run to poll under /asset-library/worlds/lab',
  body: {
    ...WALK_PARAMS,
    walk_seed: { kind: 'int', help: 'seed for the walk; the same seed rewalks the same route', optional: true },
  },
  query: {},
  handle: (context) => startedRun(gradeTheRunningWorld(context)),
});

registerRoute({
  method: 'POST',
  path: '/asset-library/worlds/roll',
  summary:
    'roll fresh worlds and grade every one of them, ranked by fun. Neither touches nor replaces the running world',
  body: {
    ...WALK_PARAMS,
    count: { kind: 'int', help: 'how many worlds to roll, 1-64', optional: true },
    seed: { kind: 'int', help: 'seed for the roll; the same seed rolls the same worlds', optional: true },
  },
  query: {},
  handle: ({ access, req }) => startedRun(startRollRun(access.lab, bodyOf(req.body))),
});

registerRoute({
  method: 'POST',
  path: '/asset-library/worlds/train',
  summary:
    'breed worlds instead of rolling them: every generation rolls, mutates, breeds and treats candidates, grades them, and keeps the fun and distinct ones. Stops early once it saturates',
  body: {
    ...WALK_PARAMS,
    generations: { kind: 'int', help: 'how many generations to live through, 1-200', optional: true },
    batch_size: { kind: 'int', help: 'how many worlds per generation, 2-32', optional: true },
    seed: { kind: 'int', help: 'seed for the run; the same seed breeds the same worlds', optional: true },
    patience: { kind: 'int', help: 'generations without a gain before the run gives up, 1-100', optional: true },
  },
  query: {},
  handle: ({ access, req }) => startedRun(startTrainRun(access.lab, bodyOf(req.body))),
});

registerRoute({
  method: 'GET',
  path: '/asset-library/worlds/lab',
  summary: 'every grading, rolling and training run the lab holds, newest last',
  body: {},
  query: {},
  handle: ({ access }) => json(200, { runs: access.lab.all().map(runListJson) }),
});

registerRoute({
  method: 'GET',
  path: '/asset-library/worlds/lab/{id}',
  summary: "one run in full: its ranked worlds, their readings and measurements, and each generation's batch",
  body: {},
  query: {},
  handle: (context) => withRun(context, (run) => json(200, { run: runDetailJson(run) })),
});

registerRoute({
  method: 'POST',
  path: '/asset-library/worlds/lab/{id}/stop',
  summary: 'stop a run; what it has graded so far stays readable and installable',
  body: {},
  query: {},
  handle: (context) =>
    withRun(context, (run) => {
      context.access.lab.stop(run.id);
      return json(200, { run: runListJson(run) });
    }),
});

registerRoute({
  method: 'POST',
  path: '/asset-library/worlds/lab/{id}/install',
  summary:
    "save a run's best worlds into the library, each with the tiles, pieces and culture its palette needs",
  body: {
    count: { kind: 'int', help: 'how many of the top worlds to save, 1-20', optional: true },
    names: {
      kind: 'json',
      help: 'the exact world names from the run to save, up to 20; overrides count when given',
      optional: true,
    },
  },
  query: {},
  handle: (context) => withRun(context, (run) => install(context, run)),
});

function gradeTheRunningWorld(context: RouteContext): LabRun {
  const world = context.access.current();
  return startGradeRun(
    context.access.lab,
    {
      name: world.runningWorld.name() || 'the running world',
      sampler: world.sampler,
      tileAssets: world.tileAssets,
    },
    bodyOf(context.req.body),
  );
}

function install(context: RouteContext, run: LabRun): ApiResponse {
  if (installableWorldsOf(run).length === 0) {
    return failure(
      409,
      'nothing_to_install',
      `${run.id} has no rolled world to save — grade runs measure the world you are already in`,
    );
  }
  const wanted = worldsAskedFor(run, bodyOf(context.req.body));
  if (wanted.length === 0) {
    return failure(409, 'nothing_to_install', `${run.id} holds no world under the names asked for`);
  }
  const world = context.access.current();
  const installed = installRunWorlds(
    {
      tileAssets: world.tileAssets,
      pieces: world.pieces,
      cultures: world.cultures,
      worldPresets: world.worldPresets,
    },
    run,
    wanted,
    takenWorldNames(world.worldPresets.savedPresets().map((preset) => preset.name)),
  );
  context.access.persistWorld(world);
  return json(200, { installed, run: runListJson(run) });
}

function takenWorldNames(saved: readonly string[]): Set<string> {
  return new Set([...saved, ...examplePipelines().map((preset) => preset.name)]);
}

function withRun(context: RouteContext, use: (run: LabRun) => ApiResponse): ApiResponse {
  const run = context.access.lab.byId(context.params.id!);
  if (!run) return failure(404, 'unknown_lab_run', `no lab run ${context.params.id}`);
  return use(run);
}

function startedRun(run: LabRun): ApiResponse {
  return json(202, { run: runListJson(run) });
}

function bodyOf(body: unknown): Record<string, unknown> {
  return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
}
