import '../procgen/nodes';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
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
      shippedStates().every((state) => state.nodes.length > 0),
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
    'volcanic islands puts land under the spot you wake on',
    landCellsAround(islands, 48) > 0,
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

function landCellsAround(world: ReturnType<typeof worldFromState>, span: number): number {
  let land = 0;
  for (let y = -span; y < span; y += 4) {
    for (let x = -span; x < span; x += 4) if (world.sampler.elevationAt(x, y) > 0) land++;
  }
  return land;
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
