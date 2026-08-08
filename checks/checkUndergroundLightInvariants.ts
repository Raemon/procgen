import { performAbility } from '../abilities/performAbility';
import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  hazeStartTiles,
} from '../world/vision/characterSight';
import { CreatureLibrary } from '../library/creatures/creatureLibrary';
import { playerCharacterDef } from '../library/characters/playerCharacter';
import { brightestCarriedLight } from '../library/items/inventory/carriedLight';
import { ItemLibrary } from '../library/items/itemLibrary';
import { TORCH_ITEM_ID } from '../library/items/defaultItems';
import { groundItemsOf } from '../library/items/pickups/groundItems';
import { PickupFeed } from '../library/items/pickups/pickupFeed';
import { TakenItemSpawns } from '../library/items/pickups/takenItemSpawns';
import { WalkOverPickup } from '../library/items/pickups/walkOverPickup';
import { PrefabLibrary } from '../library/prefabs/prefabLibrary';
import { CHUNK_SIZE } from '../procgen/chunk';
import { PipelineEvaluator } from '../procgen/eval/evaluator';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { examplePipelines } from '../procgen/presets/examplePipelines';
import { RandomizeHistory } from '../procgen/randomize/randomizeHistory';
import { TemplateLibrary } from '../procgen/templates/templateLibrary';
import { WorldPresetLibrary } from '../procgen/presets/worldPresetLibrary';
import { EMPTY_TILE } from '../procgen/values/chunkValues';
import { WorldSampler } from '../procgen/worldSampler';
import { ceilingPlacementsForRect } from '../world/render/view3d/ceilingPlacements';
import {
  CHARACTER_EYE_HEIGHT,
  distanceWhereHeightEntersView,
} from '../world/render/view3d/firstPersonSightline';
import { glowOfEmitter } from '../world/render/view3d/selfLitGlow';
import {
  tilePlacementsForRect,
  tileStandsAsSolidBlock,
} from '../world/render/view3d/tilePlacements';
import { itemLightSourcesInRect } from '../world/light/itemLightSources';
import { clampLightRadius, emitsLight, MAX_LIGHT_RADIUS } from '../world/light/lightEmission';
import { tileLightSourcesInRect } from '../world/light/tileLightSources';
import { defaultTiles } from '../library/tiles/defaultTiles';
import { tilesFromStoredJson } from '../library/tiles/tilesetStorage';
import { blockLayersOfTile } from '../library/tiles/tileHeight';
import { itemsFromStoredJson } from '../library/items/itemStorage';
import { PuzzleWorld } from '../world/puzzles/puzzleWorld';
import { isWalkableTile } from '../world/tileWalkability';
import { Tileset } from '../library/tiles/tileset';
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
  checkWalkingOverTheTorchStowsItWithoutAKeypress(check);
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
    'whatever emits light glows in its own right, since its light sits inside it',
    (() => {
      const torch = new ItemLibrary().byId(TORCH_ITEM_ID)!;
      const lava = defaultTiles().find(emitsLight)!;
      const dullStone = defaultTiles().find((tile) => !emitsLight(tile))!;
      return glowOfEmitter(torch) > 0 && glowOfEmitter(lava) > 0 && glowOfEmitter(dullStone) === 0;
    })(),
  );
  check(
    'a brighter emitter glows harder, and none of them glow past full',
    glowOfEmitter({ light: 2, lightInk: '#fff' }) < glowOfEmitter({ light: 8, lightInk: '#fff' }) &&
      glowOfEmitter({ light: MAX_LIGHT_RADIUS, lightInk: '#fff' }) === 1,
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
  const lavaBlocks = tilePlacementsForRect(
    sampler,
    tileset,
    -LIGHT_SCAN_SPAN,
    -LIGHT_SCAN_SPAN,
    LIGHT_SCAN_SPAN * 2,
    LIGHT_SCAN_SPAN * 2,
  ).blocks.filter(
    (placement) => placement.faceArt === tileset.byId(LAVA_TILE)?.faceArt,
  );
  check(
    'the lava seams lighting the delve are placed as glowing surfaces, not dark ones',
    lavaBlocks.length > 0 && lavaBlocks.every((placement) => placement.glow > 0),
  );
  check('the underground world turns the sky off entirely', state.daylight === 0);
  check(
    'every cell of the underground world has a ceiling over it',
    everyCellInSpan(CHUNK_SIZE, (x, y) => sampler.ceilingTileAt(x, y) !== EMPTY_TILE),
  );
  const roofHeight = sampler.ceilingHeightAt(0, 0);
  check(
    'the roof hangs above head height, not on the floor',
    roofHeight > CHARACTER_EYE_HEIGHT &&
      ceilingPlacementsForRect(sampler, tileset, 0, 0, 4, 4).every(
        (placement) => placement.elevation >= roofHeight,
      ),
  );
  check(
    'the roof rests on the walls of the delve instead of floating above them',
    roofHeight <= lowestWallTop(sampler, tileset),
  );
  check(
    'the roof enters the first-person view before the haze swallows it',
    distanceWhereHeightEntersView(roofHeight) <=
      hazeStartTiles(DEFAULT_CHARACTER_SIGHT_RADIUS_TILES),
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

function checkWalkingOverTheTorchStowsItWithoutAKeypress(check: CheckReporter): void {
  const world = undergroundWorld();
  const feed = new PickupFeed();
  const walkOver = new WalkOverPickup(
    { creatures: world.creatures, items: world.items, groundItems: world.groundItems },
    feed,
  );
  walkOver.onSteppedOnto(0, 0);
  check(
    'walking over bare ground stows nothing and says nothing',
    feed.recent().length === 0 &&
      playerCharacterDef(world.creatures)!.inventory!.placements.length === 0,
  );
  walkOver.onSteppedOnto(2, 0);
  check(
    'walking onto the torch stows it without pressing a key',
    playerCharacterDef(world.creatures)!.inventory!.placements.some(
      (placement) => placement.itemId === TORCH_ITEM_ID,
    ) && world.sampler.itemSpawnsIn(2, 0, 2, 0).length === 0,
  );
  check(
    'the walk-over pickup says what it picked up',
    feed.recent().some((notice) => notice.tone === 'taken' && notice.text.includes('torch')),
  );
  const placementsAfterFirstWalk = playerCharacterDef(world.creatures)!.inventory!.placements.length;
  walkOver.onSteppedOnto(2, 0);
  check(
    'walking back over an emptied tile picks nothing up twice',
    playerCharacterDef(world.creatures)!.inventory!.placements.length === placementsAfterFirstWalk,
  );
  check(
    'the torch lights the way once it has been walked over',
    brightestCarriedLight(playerCharacterDef(world.creatures), world.items)?.light ===
      world.items.byId(TORCH_ITEM_ID)!.light,
  );
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
  const groundItems = groundItemsOf(sampler, takenItems);
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
    groundItems,
    puzzles: new PuzzleWorld(store, () => true),
    actor: {
      pose: () => pose,
      tryStep: () => true,
      turn: () => undefined,
      sightRadiusTiles: () => DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
      setSightRadiusTiles: () => undefined,
    },
  };
  return {
    state: state as PipelineState,
    store,
    sampler,
    tileset,
    items,
    creatures,
    groundItems,
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

function lowestWallTop(sampler: WorldSampler, tileset: Tileset): number {
  let lowest = Infinity;
  for (let y = -CHUNK_SIZE; y <= CHUNK_SIZE; y++) {
    for (let x = -CHUNK_SIZE; x <= CHUNK_SIZE; x++) {
      const tile = tileset.byId(sampler.tileAt(x, y));
      if (!tile || !tileStandsAsSolidBlock(tile)) continue;
      lowest = Math.min(lowest, sampler.elevationAt(x, y) + blockLayersOfTile(tile));
    }
  }
  return lowest;
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
