import '../nodes';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { inProcessRunner } from '@/infrastructure/server/worldBuilds/buildRunners';
import { WorldBuildQueue } from '@/infrastructure/server/worldBuilds/worldBuildQueue';
import { CHUNK_SIZE } from '../chunk';
import {
  NO_BUILT_VALUES,
  buildKeyOf,
  synchronousBuilds,
  wholeWorldNodesOf,
  type BuildProgress,
  type BuildRequest,
  type BuiltValueSource,
} from '../eval/builtValues';
import { PipelineEvaluator } from '../eval/evaluator';
import { registerNodeType } from '../nodeRegistry';
import type { WholeWorldSpec } from '../nodeType';
import { PipelineStore } from '../pipeline/pipelineStore';
import { fieldValue } from '../values/chunkValues';
import { asField } from '../values/valueAccess';
import { stateOfNodes } from './pipelineWorldFixtures';

const COUNTED_TYPE = 'testCountedBuild';
let builds = 0;

const countedBuild: WholeWorldSpec<{ seed: number; level: number }> = {
  build: ({ seed, params, report }) => {
    builds += 1;
    report(0.5, 'halfway');
    report(1, 'done');
    return { seed, level: params.level as number };
  },
  serialize: (value) => ({ seed: value.seed, level: value.level }),
  parse: (data) => data as { seed: number; level: number },
  estimateMs: () => 1,
};

registerNodeType({
  type: COUNTED_TYPE,
  title: 'counted build',
  category: 'examples',
  description: 'A whole-world node for tests that counts its builds.',
  whenToUse: 'Never outside a test.',
  inputs: {},
  params: {
    level: { kind: 'number', label: 'level', help: 'the value every cell gets', min: 0, max: 1, step: 0.1, default: 0.5 },
  },
  output: 'field',
  wholeWorld: countedBuild,
  generateChunk: (ctx) => {
    const built = ctx.built() as { level: number } | null;
    return fieldValue(ctx.newField().fill(built ? built.level : 0));
  },
});

export async function checkWholeWorldNodes(check: CheckReporter): Promise<void> {
  checkBuildKeys(check);
  checkSynchronousBuildsOnce(check);
  checkAnUnbuiltNodeIsEmptyUntilItsValueArrives(check);
  checkTheExampleNodeBuildsDeterministically(check);
  await checkTheQueueBuildsInOrderAndReportsProgress(check);
}

function checkBuildKeys(check: CheckReporter): void {
  const same = buildKeyOf({ nodeType: COUNTED_TYPE, seed: 7, params: { level: 0.5, extra: 1 } });
  const reordered = buildKeyOf({ nodeType: COUNTED_TYPE, seed: 7, params: { extra: 1, level: 0.5 } });
  const other = buildKeyOf({ nodeType: COUNTED_TYPE, seed: 7, params: { level: 0.6, extra: 1 } });
  check('a build key names the node type, seed and params in any order', same === reordered);
  check('a build key changes when a param does, so no world reuses a build it did not ask for', same !== other);
}

function checkSynchronousBuildsOnce(check: CheckReporter): void {
  builds = 0;
  const store = new PipelineStore(stateOfNodes([countedNode('n1', 0.3)]));
  const evaluator = new PipelineEvaluator(store, synchronousBuilds());
  const first = asField(evaluator.valueFor('n1', 0, 0))![0];
  const far = asField(evaluator.valueFor('n1', 9, -4))![CHUNK_SIZE * CHUNK_SIZE - 1];
  check('a synchronous source builds a whole-world node once and slices every chunk from it', builds === 1 && first === far && Math.abs(first! - 0.3) < 1e-6);
  check('the evaluator reports a synchronously built world as ready', evaluator.ready() && evaluator.missingBuilds().length === 0);
}

function checkAnUnbuiltNodeIsEmptyUntilItsValueArrives(check: CheckReporter): void {
  const store = new PipelineStore(stateOfNodes([countedNode('n1', 0.8)]));
  const source = manualSource();
  const evaluator = new PipelineEvaluator(store, source);
  const before = asField(evaluator.valueFor('n1', 0, 0))![5];
  const missing = evaluator.missingBuilds().map((node) => node.id);
  check('a whole-world node whose build has not arrived generates empty chunks and is named as missing', before === 0 && missing.join() === 'n1' && !evaluator.ready());
  check('an evaluator with nothing to build reports itself ready', new PipelineEvaluator(new PipelineStore(stateOfNodes([])), NO_BUILT_VALUES).ready());
  let told = 0;
  evaluator.onBuilt(() => (told += 1));
  source.finish({ nodeType: COUNTED_TYPE, seed: 5, params: { level: 0.8 } }, { seed: 5, level: 0.8 });
  const after = asField(evaluator.valueFor('n1', 0, 0))![5];
  check('once the value arrives the same chunk regenerates from it and the evaluator says so', told === 1 && Math.abs(after! - 0.8) < 1e-6 && evaluator.ready());
  check('wholeWorldNodesOf lists enabled whole-world nodes only', wholeWorldNodesOf(store.nodes()).length === 1 && wholeWorldNodesOf(stateOfNodes([{ ...countedNode('n2', 0.1), enabled: false }]).nodes).length === 0);
}

function checkTheExampleNodeBuildsDeterministically(check: CheckReporter): void {
  const one = new PipelineEvaluator(new PipelineStore(stateOfNodes([builtFieldNode()])), synchronousBuilds());
  const two = new PipelineEvaluator(new PipelineStore(stateOfNodes([builtFieldNode()])), synchronousBuilds());
  const here = Array.from(asField(one.valueFor('n1', 0, 0))!);
  const again = Array.from(asField(two.valueFor('n1', 0, 0))!);
  const beyond = Array.from(asField(one.valueFor('n1', 40, 40))!);
  check('the built field example builds the same square from the same seed on two fresh sources', here.join() === again.join() && here.some((value) => value > 0));
  check('the built field example is zero beyond the square it built', beyond.every((value) => value === 0));
}

async function checkTheQueueBuildsInOrderAndReportsProgress(check: CheckReporter): Promise<void> {
  builds = 0;
  const queue = new WorldBuildQueue(inProcessRunner());
  const changes: string[] = [];
  queue.onChange(() => changes.push(queue.summary().ready + ':' + queue.summary().queued));
  const first: BuildRequest = { nodeType: COUNTED_TYPE, seed: 1, params: { level: 0.1 } };
  const second: BuildRequest = { nodeType: COUNTED_TYPE, seed: 2, params: { level: 0.2 } };
  const unbuilt = queue.valueOf(first) === null && queue.valueOf(second) === null && queue.valueOf(first) === null;
  const queuedState = queue.request(first).state;
  check('a queued build answers null while the builder works and asking twice queues it once', unbuilt && (queuedState === 'queued' || queuedState === 'building') && queue.summary().queued + queue.summary().building === 2);
  await settled(queue, first);
  await settled(queue, second);
  const firstProgress = queue.progressOf(first)!;
  const value = queue.valueOf(second) as { level: number } | null;
  check('the queue builds each request once, in the order asked, and hands back the parsed value', builds === 2 && firstProgress.state === 'ready' && firstProgress.fraction === 1 && value?.level === 0.2);
  check('every finished build tells its listeners so evaluators can drop what they generated without it', changes.length === 2 && changes[0] === '1:1' && changes[1] === '2:0');
  check('a build status names its key so a client can poll it', queue.statusOf(buildKeyOf(first))?.state === 'ready' && (queue.serializedOf(buildKeyOf(first)) as { level: number }).level === 0.1);
}

function settled(queue: WorldBuildQueue, request: BuildRequest): Promise<void> {
  return new Promise((resolve) => {
    const look = () => {
      const state = queue.progressOf(request)?.state;
      if (state === 'ready' || state === 'failed') resolve();
      else setTimeout(look, 5);
    };
    look();
  });
}

function manualSource(): BuiltValueSource & { finish(request: BuildRequest, value: unknown): void } {
  const values = new Map<string, unknown>();
  const listeners = new Set<() => void>();
  return {
    valueOf: (request) => values.get(buildKeyOf(request)) ?? null,
    progressOf: (request): BuildProgress | null => ({
      key: buildKeyOf(request),
      nodeType: request.nodeType,
      state: values.has(buildKeyOf(request)) ? 'ready' : 'building',
      fraction: 0.5,
      stage: 'testing',
      elapsedMs: 0,
      estimatedMs: 0,
      error: null,
    }),
    onChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    finish: (request, value) => {
      values.set(buildKeyOf(request), value);
      for (const listener of listeners) listener();
    },
  };
}

function countedNode(id: string, level: number): Record<string, unknown> {
  return { id, type: COUNTED_TYPE, params: { level }, inputs: {}, display: { mode: 'elevation', heightScale: 1 } };
}

function builtFieldNode(): Record<string, unknown> {
  return { id: 'n1', type: 'builtField', params: { size: 64, passes: 4 }, inputs: {}, display: { mode: 'elevation', heightScale: 1 } };
}
