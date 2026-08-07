import { performAbility } from '../src/abilities/performAbility';
import { CreatureLibrary } from '../src/creatures/creatureLibrary';
import { playerCharacterDef } from '../src/creatures/playerCharacter';
import { brightestCarriedLight } from '../src/items/inventory/carriedLight';
import { ItemLibrary } from '../src/items/itemLibrary';
import { TORCH_ITEM_ID } from '../src/items/defaultItems';
import { groundItemsOf } from '../src/items/pickups/groundItems';
import { TakenItemSpawns } from '../src/items/pickups/takenItemSpawns';
import { PrefabLibrary } from '../src/prefabs/prefabLibrary';
import { CHUNK_SIZE } from '../src/procgen/chunk';
import { PipelineEvaluator } from '../src/procgen/eval/evaluator';
import { PipelineStore } from '../src/procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../src/procgen/pipeline/sanitizePipeline';
import type { PipelineState } from '../src/procgen/pipeline/pipelineState';
import { examplePipelines } from '../src/procgen/presets/examplePipelines';
import { RandomizeHistory } from '../src/procgen/randomize/randomizeHistory';
import { TemplateLibrary } from '../src/procgen/templates/templateLibrary';
import { WorldPresetLibrary } from '../src/procgen/presets/worldPresetLibrary';
import { EMPTY_TILE } from '../src/procgen/values/chunkValues';
import { WorldSampler } from '../src/procgen/worldSampler';
import { ceilingPlacementsForRect } from '../src/views/view3d/ceilingPlacements';
import { itemLightSourcesInRect } from '../src/world/light/itemLightSources';
import { clampLightRadius, emitsLight, MAX_LIGHT_RADIUS } from '../src/world/light/lightEmission';
import { tileLightSourcesInRect } from '../src/world/light/tileLightSources';
import { defaultTiles } from '../src/world/tiles/defaultTiles';
import { tilesFromStoredJson } from '../src/world/tiles/tilesetStorage';
import { itemsFromStoredJson } from '../src/items/itemStorage';
import { isWalkableTile } from '../src/world/tileWalkability';
import { Tileset } from '../src/world/tiles/tileset';
import type { CheckReporter } from './checkCharacterBillboardInvariants';

const PRESET_NAME = 'underground labyrinth';
const LAVA_TILE = 21;
const REACH_SPAN = 64;
const INNER_SPAN = 32;
const LIGHT_SCAN_SPAN = 96;

export function checkUndergroundLightInvariants(check: CheckReporter): void {
  checkLightIsAKnobOnBlocksAndItems(check);
  checkTheUndergroundWorldIsRoofedAndConnected(check);
  checkNothingIsLitButWhatEmits(check);
  checkTheTorchCanBePickedUpAndCarried(check);
}

function checkLightIsAKnobOnBlocksAndItems(check: CheckReporter): void {
  check(
    'a light radius is clamped into range and junk reads as dark',
    clampLightRadius(-4) === 0 &&
      clampLightRadius(1000) === MAX_LIGHT_RADIUS &&
      clampLightRadius('bright') === 0,
  );
  check(
    'blocks and items are dark until something sets a radius on them',
    defaultTiles().filter(emitsLight).every((tile) => tile.name === 'lava') &&
      new ItemLibrary(undefined).all().filter(emitsLight).every((item) => item.id === TORCH_ITEM_ID),
  );
  check(
    'the torch emits warm light and is carried in a hand slot',
    (() => {
      const torch = new ItemLibrary().byId(TORCH_ITEM_ID);
      return torch !== undefined && torch.light > 0 && torch.tags.includes('light');
    })(),
  );
  check(
    'stored tiles and items without a light field load as dark rather than broken',
    (() => {
      const tile = tilesFromStoredJson([
        { id: 0, name: 't', symbol: '#', color: '#ffffff', walkable: true, role: null, faceArt: null },
      ])![0]!;
      const item = itemsFromStoredJson([{ id: 0, name: 'i' }])![0]!;
      return tile.light === 0 && item.light === 0 && typeof item.lightInk === 'string';
    })(),
  );
}

function checkTheUndergroundWorldIsRoofedAndConnected(check: CheckReporter): void {
  const { state, sampler, tileset } = undergroundWorld();
  check('the underground world turns the sky off entirely', state.daylight === 0);
  check(
    'every cell of the underground world has a ceiling over it',
    everyCellInSpan(CHUNK_SIZE, (x, y) => sampler.ceilingTileAt(x, y) !== EMPTY_TILE),
  );
  check(
    'the roof hangs above head height, not on the floor',
    sampler.ceilingHeightAt(0, 0) >= 3 &&
      ceilingPlacementsForRect(sampler, tileset, 0, 0, 4, 4).every(
        (placement) => placement.elevation >= 3,
      ),
  );
  check(
    'the labyrinth mixes passages with chambers wider than any corridor',
    largestOpenSquare(sampler, tileset) >= 6,
  );
  check(
    'the player wakes in a floored seed chamber',
    isWalkableTile(tileset, sampler.tileAt(0, 0)) &&
      everyCellInSpan(5, (x, y) => isWalkableTile(tileset, sampler.tileAt(x, y))),
  );
  check(
    'every open cell of the delve is reachable on foot from the seed chamber',
    reachableFloorCount(sampler, tileset) === walkableCount(sampler, tileset),
  );
  check(
    'the delve is mostly open ground rather than solid rock',
    walkableCount(sampler, tileset) > (INNER_SPAN * 2 + 1) ** 2 * 0.3,
  );
}

function checkNothingIsLitButWhatEmits(check: CheckReporter): void {
  const { sampler, tileset, items } = undergroundWorld();
  const rect = { minX: -CHUNK_SIZE, minY: -CHUNK_SIZE, maxX: CHUNK_SIZE, maxY: CHUNK_SIZE };
  const wide = {
    minX: -LIGHT_SCAN_SPAN,
    minY: -LIGHT_SCAN_SPAN,
    maxX: LIGHT_SCAN_SPAN,
    maxY: LIGHT_SCAN_SPAN,
  };
  const tileLights = tileLightSourcesInRect(sampler, tileset, wide);
  check(
    'the only blocks lighting the delve are the lava seams',
    tileLights.length > 0 &&
      tileLights.every((source) => sampler.tileAt(source.x, source.y) === LAVA_TILE),
  );
  const itemLights = itemLightSourcesInRect(sampler, items, rect);
  check(
    'the torch lying in the seed chamber lights it before anyone picks it up',
    itemLights.length === 1 && itemLights[0]!.x === 2 && itemLights[0]!.radius > 0,
  );
}

function checkTheTorchCanBePickedUpAndCarried(check: CheckReporter): void {
  const world = undergroundWorld();
  const carrier = playerCharacterDef(world.creatures)!;
  check(
    'a character carrying nothing that glows emits no light',
    brightestCarriedLight(carrier, world.items) === null,
  );
  const missed = world.act('character', 'pick_up');
  check(
    'picking up where nothing lies says so instead of inventing an item',
    !missed.ok && missed.code === 'nothing_to_pick_up',
  );
  world.pose.x = 2;
  const taken = world.act('character', 'pick_up');
  check('walking onto the torch and picking it up succeeds', taken.ok);
  check(
    'the picked-up torch is gone from the ground and in the bag',
    world.sampler.itemSpawnsIn(2, 0, 2, 0).length === 0 &&
      playerCharacterDef(world.creatures)!.inventory!.placements.some(
        (placement) => placement.itemId === TORCH_ITEM_ID,
      ),
  );
  check(
    'a character holding the torch emits its light wherever she walks',
    brightestCarriedLight(playerCharacterDef(world.creatures), world.items)?.light ===
      world.items.byId(TORCH_ITEM_ID)!.light,
  );
  const twice = world.act('character', 'pick_up');
  check('an item already taken cannot be picked up again', !twice.ok);
}

function undergroundWorld() {
  const state = sanitizePipeline(
    examplePipelines().find((preset) => preset.name === PRESET_NAME)!.state,
  );
  const store = new PipelineStore(state);
  const tileset = new Tileset();
  const items = new ItemLibrary();
  const creatures = new CreatureLibrary();
  const takenItems = new TakenItemSpawns();
  const sampler = new WorldSampler(
    store,
    new PipelineEvaluator(store),
    tileset,
    undefined,
    items,
    takenItems,
  );
  const pose = { x: 0, y: 0, facing: 0 as const };
  const context = {
    store,
    tileset,
    prefabs: new PrefabLibrary(() => -1),
    creatures,
    items,
    templates: new TemplateLibrary([]),
    worldPresets: new WorldPresetLibrary([]),
    randomizeHistory: new RandomizeHistory(),
    regionSampler: sampler,
    groundItems: groundItemsOf(sampler, takenItems),
    actor: { pose: () => pose, tryStep: () => true, turn: () => undefined },
  };
  return {
    state: state as PipelineState,
    store,
    sampler,
    tileset,
    items,
    creatures,
    pose,
    act: (mode: 'god' | 'character', action: string, params: Record<string, unknown> = {}) =>
      performAbility(context, mode, action, params),
  };
}

function everyCellInSpan(span: number, holds: (x: number, y: number) => boolean): boolean {
  for (let y = -span; y <= span; y++) {
    for (let x = -span; x <= span; x++) if (!holds(x, y)) return false;
  }
  return true;
}

function largestOpenSquare(sampler: WorldSampler, tileset: Tileset): number {
  let largest = 0;
  for (let y = -CHUNK_SIZE; y <= CHUNK_SIZE; y++) {
    for (let x = -CHUNK_SIZE; x <= CHUNK_SIZE; x++) {
      while (isOpenSquare(sampler, tileset, x, y, largest + 1)) largest++;
    }
  }
  return largest;
}

function isOpenSquare(
  sampler: WorldSampler,
  tileset: Tileset,
  x: number,
  y: number,
  side: number,
): boolean {
  for (let row = 0; row < side; row++) {
    for (let column = 0; column < side; column++) {
      if (!isWalkableTile(tileset, sampler.tileAt(x + column, y + row))) return false;
    }
  }
  return true;
}

function walkableCount(sampler: WorldSampler, tileset: Tileset): number {
  let count = 0;
  for (let y = -INNER_SPAN; y <= INNER_SPAN; y++) {
    for (let x = -INNER_SPAN; x <= INNER_SPAN; x++) {
      if (isWalkableTile(tileset, sampler.tileAt(x, y))) count++;
    }
  }
  return count;
}

function reachableFloorCount(sampler: WorldSampler, tileset: Tileset): number {
  const seen = new Set(['0,0']);
  let insideInner = 0;
  const queue: [number, number][] = [[0, 0]];
  while (queue.length > 0) {
    const [x, y] = queue.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const next: [number, number] = [x + dx, y + dy];
      if (Math.abs(next[0]) > REACH_SPAN || Math.abs(next[1]) > REACH_SPAN) continue;
      const key = `${next[0]},${next[1]}`;
      if (seen.has(key) || !isWalkableTile(tileset, sampler.tileAt(next[0], next[1]))) continue;
      seen.add(key);
      queue.push(next);
      if (Math.abs(next[0]) <= INNER_SPAN && Math.abs(next[1]) <= INNER_SPAN) insideInner++;
    }
  }
  return insideInner + 1;
}
