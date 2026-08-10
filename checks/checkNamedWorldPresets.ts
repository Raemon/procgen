import '../procgen/nodes';
import { defaultTiles } from '../assets/tiles/defaultTiles';
import type { TileDef } from '../assets/tiles/tileDef';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import { pointsInRect } from '../procgen/values/pointsInRect';
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
  checkShippedWorldTiles(check);
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
  const home = groundAround(islands, 48, 4);
  const region = groundAround(islands, 384, 12);
  check(
    'volcanic islands puts dry land, not just shallower seabed, under the spot you wake on',
    home.landShare > 0.2,
  );
  check(
    'a volcano stands proud of its own shoreline rather than reading as a flat coloured disc',
    region.reliefAboveWater > 4,
  );
  check(
    'the archipelago around the spawn is islands rather than one drowned reef or one continent',
    region.landShare > 0.04 && region.landShare < 0.6,
  );
  const houses = pointsInRect(islands.evaluator, 'houses', HOUSE_SURVEY);
  check('the shipped world raises houses near the spawn to stand on something', houses.length > 0);
  check(
    'every house the shipped world raises stands on dry land rather than out over the water',
    houses.every((house) => aboveTheWaterline(islands, house.x, house.y)),
  );
}

const HOUSE_SURVEY = { minX: -400, minY: -400, maxX: 400, maxY: 400 };

function aboveTheWaterline(
  world: ReturnType<typeof worldFromState>,
  x: number,
  y: number,
): boolean {
  const waterline = SEA_LEVEL * elevationHeightScaleOf(presetStateNamed('volcanic islands'));
  return world.sampler.elevationAt(x, y) > waterline;
}

interface GroundSweep {
  landShare: number;
  reliefAboveWater: number;
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

function groundAround(
  world: ReturnType<typeof worldFromState>,
  span: number,
  step: number,
): GroundSweep {
  const waterline = SEA_LEVEL * elevationHeightScaleOf(presetStateNamed('volcanic islands'));
  let land = 0;
  let seen = 0;
  let highest = waterline;
  for (let y = -span; y < span; y += step) {
    for (let x = -span; x < span; x += step) {
      const ground = world.sampler.elevationAt(x, y);
      seen++;
      if (ground > waterline) land++;
      highest = Math.max(highest, ground);
    }
  }
  return { landShare: land / seen, reliefAboveWater: highest - waterline };
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

function tileNamedIn(state: PipelineState, nodeId: string, param: string): TileDef | undefined {
  const node = state.nodes.find((candidate) => candidate.id === nodeId);
  return defaultTiles()[node?.params[param] as number];
}

function checkShippedWorldTiles(check: CheckReporter): void {
  const delve = presetStateNamed('infinite labyrinth');
  const floor = tileNamedIn(delve, 'n1', 'floorTile');
  const wall = tileNamedIn(delve, 'n1', 'wallTile');
  check(
    'the labyrinth floor is a tile you can stand on and its wall is one you cannot walk through',
    floor?.walkable === true && wall?.walkable === false,
  );
}
