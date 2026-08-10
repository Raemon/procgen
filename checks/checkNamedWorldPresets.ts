import '../procgen/nodes';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import { SEA_LEVEL } from '../procgen/volcanic/seaLevel';
import { examplePipelines } from '../procgen/presets/examplePipelines';
import { sanitizeWorldPresets } from '../procgen/presets/worldPreset';
import { nodeTypeOf } from '../procgen/nodeRegistry';
import type { CheckReporter } from './checkReporter';
import { earthlikeState, fieldBytes, tileBytes, worldFromState } from './pipelineWorldFixtures';

const SHIPPED_WORLDS = ['volcanic islands', 'infinite labyrinth'];

function presetStateNamed(name: string): PipelineState {
  return sanitizePipeline(examplePipelines().find((preset) => preset.name === name)!.state);
}

function shippedStates(): PipelineState[] {
  return examplePipelines().map((preset) => sanitizePipeline(preset.state));
}

export function checkNamedWorldPresets(check: CheckReporter): void {
  check(
    'the editor ships exactly the two worlds it means to, named as the library lists them',
    examplePipelines().map((preset) => preset.name).join() === SHIPPED_WORLDS.join(),
  );
  check(
    'every shipped world describes itself and survives sanitize with all of its nodes',
    examplePipelines().every((preset) => preset.description.length > 0) &&
      examplePipelines().every(
        (preset) => sanitizePipeline(preset.state).nodes.length === nodeCountOf(preset.state),
      ),
  );
  check(
    'every node a shipped world names is a node type the registry still knows',
    shippedStates().every((state) => state.nodes.every((node) => nodeTypeOf(node.type))),
  );
  check(
    'every shipped world tells its story in named folders rather than a flat run of nodes',
    shippedStates().every((state) => foldersOf(state).length >= 2),
  );
  checkVolcanicIslandsRegenerates(check);
  checkInfiniteLabyrinthRegenerates(check);
  checkSavedPresetsRoundTrip(check);
}

function nodeCountOf(state: unknown): number {
  return (state as PipelineState).nodes.length;
}

function foldersOf(state: PipelineState): string[] {
  return [...new Set(state.nodes.map((node) => node.folder).filter((folder) => folder.length > 0))];
}

function checkVolcanicIslandsRegenerates(check: CheckReporter): void {
  const islands = worldFromState(presetStateNamed('volcanic islands'));
  const again = worldFromState(presetStateNamed('volcanic islands'));
  check(
    'volcanic islands regenerates identically from the same seed',
    fieldBytes(islands.evaluator, 'terrain', 0, 0) === fieldBytes(again.evaluator, 'terrain', 0, 0) &&
      tileBytes(islands.evaluator, 'sea', 0, 0) === tileBytes(again.evaluator, 'sea', 0, 0),
  );
  check(
    'volcanic islands puts dry land, not just shallower seabed, under the spot you wake on',
    landShareAround(islands, 48) > 0.2,
  );
  check(
    'the archipelago around the spawn is islands rather than one drowned reef or one continent',
    landShareAround(islands, 512) > 0.04 && landShareAround(islands, 512) < 0.6,
  );
}

function checkInfiniteLabyrinthRegenerates(check: CheckReporter): void {
  const delve = worldFromState(presetStateNamed('infinite labyrinth'));
  const again = worldFromState(presetStateNamed('infinite labyrinth'));
  check(
    'the infinite labyrinth regenerates identically from the same seed',
    tileBytes(delve.evaluator, 'n1', 0, 0) === tileBytes(again.evaluator, 'n1', 0, 0) &&
      tileBytes(delve.evaluator, 'n1', 3, -2) === tileBytes(again.evaluator, 'n1', 3, -2),
  );
  check('the infinite labyrinth is unlit, so its own torches are what you see by', delve.store.daylight() === 0);
}

function landShareAround(world: ReturnType<typeof worldFromState>, span: number): number {
  const waterline = SEA_LEVEL * elevationHeightScaleOf(presetStateNamed('volcanic islands'));
  let land = 0;
  let seen = 0;
  for (let y = -span; y < span; y += 8) {
    for (let x = -span; x < span; x += 8) {
      seen++;
      if (world.sampler.elevationAt(x, y) > waterline) land++;
    }
  }
  return land / seen;
}

function elevationHeightScaleOf(state: PipelineState): number {
  const elevation = state.nodes.map((node) => node.display).find((it) => it.mode === 'elevation');
  return elevation ? elevation.heightScale : 1;
}

function checkSavedPresetsRoundTrip(check: CheckReporter): void {
  const saved = [{ name: 'kept', description: 'a saved world', state: earthlikeState() }];
  const restored = sanitizeWorldPresets(JSON.parse(JSON.stringify(saved)));
  check(
    'a saved world survives the round trip through storage with its nodes intact',
    restored.length === 1 && restored[0]!.state.nodes.length === saved[0]!.state.nodes.length,
  );
  check(
    'junk in stored presets is dropped rather than trusted',
    sanitizeWorldPresets([{ name: '', state: {} }, 'nope', { name: 'x' }]).length === 0,
  );
}
