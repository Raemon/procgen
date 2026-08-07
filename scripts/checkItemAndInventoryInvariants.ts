import '../src/abilities/index';
import { performAbility } from '../src/abilities/performAbility';
import { DEFAULT_CHARACTER_SIGHT_RADIUS_TILES } from '../src/world/vision/characterSight';
import type { AbilityContext, AbilityResult } from '../src/abilities/ability';
import { CreatureLibrary } from '../src/creatures/creatureLibrary';
import { creaturesFromStoredJson } from '../src/creatures/creatureStorage';
import { CHARACTER, CREATURE } from '../src/creatures/entityKinds';
import { blankInventory, resizedInventory, slotAt, withSlotAt } from '../src/items/inventory/inventoryDef';
import {
  canPlaceItemAt,
  placementCovering,
  placementRefusal,
  prunedPlacements,
  withItemPlaced,
} from '../src/items/inventory/inventoryPlacement';
import { sanitizeInventory } from '../src/items/inventory/sanitizeInventory';
import { BILLBOARD, CUBE, LYING_FLAT, type ItemDef } from '../src/items/itemDef';
import { ItemLibrary } from '../src/items/itemLibrary';
import { itemsFromStoredJson } from '../src/items/itemStorage';
import { PrefabLibrary } from '../src/prefabs/prefabLibrary';
import { displayModesForKind } from '../src/procgen/display/displayBinding';
import { PipelineEvaluator } from '../src/procgen/eval/evaluator';
import { emptyPipeline, type PipelineState } from '../src/procgen/pipeline/pipelineState';
import { PipelineStore } from '../src/procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../src/procgen/pipeline/sanitizePipeline';
import { RandomizeHistory } from '../src/procgen/randomize/randomizeHistory';
import { WorldPresetLibrary } from '../src/procgen/presets/worldPresetLibrary';
import { TemplateLibrary } from '../src/procgen/templates/templateLibrary';
import { WorldSampler } from '../src/procgen/worldSampler';
import { asciiSnapshot } from '../src/views/ascii/asciiSnapshot';
import { itemGeometry, itemHalfHeight } from '../src/views/view3d/itemMeshBuild';
import { isSpriteArt } from '../src/world/tiles/spriteArt';
import { Tileset } from '../src/world/tiles/tileset';

export interface CheckReporter {
  (name: string, condition: boolean): void;
}

export function checkItemAndInventoryInvariants(check: CheckReporter): void {
  checkDefaultItems(check);
  checkItemStorage(check);
  checkItemGeometry(check);
  checkItemsInTheWorld(check);
  checkPlacementRules(check);
  checkInventoryReshaping(check);
  checkCharacterStorage(check);
  checkItemAndInventoryAbilities(check);
}

function checkDefaultItems(check: CheckReporter): void {
  const items = new ItemLibrary();
  const byName = (name: string) => items.all().find((item) => item.name === name)!;
  check(
    'the default items ship with 1x1, 1x2 and 2x2 footprints',
    byName('health potion').gridWidth === 1 &&
      byName('health potion').gridHeight === 1 &&
      byName('short sword').gridHeight === 2 &&
      byName('kite shield').gridWidth === 2 &&
      byName('kite shield').gridHeight === 2,
  );
  check(
    'billboard items carry a sprite with transparent pixels, cube items carry cube art',
    byName('short sword').sprite !== null &&
      byName('short sword').sprite!.some((pixel) => pixel === null) &&
      byName('rune stone').render === CUBE &&
      byName('rune stone').faceArt !== null,
  );
  check(
    'a coin lies flat while a sword stands up',
    byName('gold coin').orientation === LYING_FLAT && byName('short sword').orientation === 0,
  );
}

function checkItemStorage(check: CheckReporter): void {
  const items = new ItemLibrary();
  const reloaded = itemsFromStoredJson(JSON.parse(JSON.stringify(items.all())))!;
  check(
    'items round-trip through storage with their art, footprint and tags',
    reloaded.length === items.all().length &&
      isSpriteArt(reloaded[1]!.sprite) &&
      reloaded[1]!.gridHeight === 2 &&
      reloaded[2]!.tags.join(',') === items.all()[2]!.tags.join(','),
  );
  const junk = itemsFromStoredJson([
    { id: 0, name: 'broken', sprite: ['#fff'], faceArt: 3, render: 9, gridWidth: 99, tags: [1, 'ok'] },
  ])!;
  check(
    'stored item junk is repaired rather than trusted',
    junk[0]!.sprite === null &&
      junk[0]!.faceArt === null &&
      junk[0]!.render === BILLBOARD &&
      junk[0]!.gridWidth === 8 &&
      junk[0]!.tags.join(',') === 'ok',
  );
}

function checkItemGeometry(check: CheckReporter): void {
  const items = new ItemLibrary();
  const upright = items.all().find((item) => item.render === BILLBOARD && item.orientation === 0)!;
  const flat = items.all().find((item) => item.orientation === LYING_FLAT)!;
  const cube = items.all().find((item) => item.render === CUBE)!;
  const box = (item: ItemDef) => itemGeometry(item).parameters;
  check(
    'an upright billboard is only as deep as its thickness',
    box(upright).depth === upright.thickness && box(upright).height === upright.size,
  );
  check(
    'a flat billboard is only as tall as its thickness',
    box(flat).height === flat.thickness && box(flat).depth === flat.size,
  );
  check(
    'a cube item is square in all three axes',
    box(cube).width === cube.size && box(cube).height === cube.size && box(cube).depth === cube.size,
  );
  check(
    'items float clear of the ground they stand on',
    itemHalfHeight(upright) === upright.size / 2 && itemHalfHeight(flat) === flat.thickness / 2,
  );
}

function checkItemsInTheWorld(check: CheckReporter): void {
  check(
    'a points node can be displayed as items',
    displayModesForKind('points').includes('items'),
  );
  const tileset = new Tileset();
  const items = new ItemLibrary();
  const potion = items.all()[0]!;
  const store = new PipelineStore(itemPointsPipeline(potion.id));
  const evaluator = new PipelineEvaluator(store);
  const sampler = new WorldSampler(store, evaluator, tileset, new PrefabLibrary(() => -1), items);
  const spawns = sampler.itemSpawnsIn(-40, -40, 40, 40);
  check('an items-bound points node scatters items through the world', spawns.length > 0);
  check(
    'every item spawn reports the glyph and colour of its item',
    spawns.every((spawn) => spawn.itemId === potion.id && spawn.glyph === potion.symbol),
  );
  const spawn = spawns[0]!;
  const beside = asciiSnapshot(sampler, tileset, spawn.x + 1, spawn.y, 3, 3).split('\n');
  check('a spawned item draws its own symbol in the ascii view', beside[1]![0] === potion.symbol);
  items.remove(potion.id);
  check(
    'deleting an item stops the world from spawning it',
    sampler.itemSpawnsIn(-40, -40, 40, 40).length === 0,
  );
}

function checkPlacementRules(check: CheckReporter): void {
  const items = new ItemLibrary();
  const sword = items.all().find((item) => item.gridHeight === 2 && item.gridWidth === 1)!;
  const potion = items.all()[0]!;
  const empty = blankInventory(4, 3);
  check('a 1x2 item fits where there is room below it', canPlaceItemAt(empty, items, sword, 0, 0));
  check(
    'a 1x2 item hanging off the bottom row is refused',
    placementRefusal(empty, items, sword, 0, 2) === 'off_grid',
  );
  const withDeadSlot = withSlotAt(empty, 0, 1, { usable: false });
  check(
    'an item covering a dead slot is refused',
    placementRefusal(withDeadSlot, items, sword, 0, 0) === 'slot_unusable',
  );
  const weaponOnly = withSlotAt(withSlotAt(empty, 2, 0, { tags: ['weapon'] }), 2, 1, {
    tags: ['weapon'],
  });
  check(
    'a tagged slot takes the item that carries its tag and refuses the one that does not',
    canPlaceItemAt(weaponOnly, items, sword, 2, 0) &&
      placementRefusal(weaponOnly, items, potion, 2, 0) === 'tag_mismatch',
  );
  const occupied = withItemPlaced(empty, sword, 0, 0);
  check(
    'an item overlapping one already placed is refused, anywhere in its footprint',
    placementRefusal(occupied, items, potion, 0, 1) === 'slot_taken' &&
      canPlaceItemAt(occupied, items, potion, 1, 1),
  );
  check(
    'the item covering a cell is found from any cell of its footprint',
    placementCovering(occupied, items, 0, 1)?.itemId === sword.id &&
      placementCovering(occupied, items, 1, 0) === null,
  );
}

function checkInventoryReshaping(check: CheckReporter): void {
  const items = new ItemLibrary();
  const sword = items.all().find((item) => item.gridHeight === 2)!;
  const tagged = withSlotAt(withSlotAt(blankInventory(4, 3), 3, 2, { usable: false }), 0, 0, {
    tags: ['weapon'],
  });
  const placed = withItemPlaced(tagged, sword, 0, 0);
  const grown = resizedInventory(placed, 6, 4);
  check(
    'growing an inventory keeps every slot flag, tag and placed item',
    grown.slots.length === 24 &&
      slotAt(grown, 0, 0)!.tags.join(',') === 'weapon' &&
      slotAt(grown, 3, 2)!.usable === false &&
      grown.placements.length === 1,
  );
  const shrunk = prunedPlacements(resizedInventory(placed, 4, 1), items);
  check(
    'shrinking an inventory drops the items that no longer fit',
    shrunk.slots.length === 4 && shrunk.placements.length === 0,
  );
  const restored = sanitizeInventory(JSON.parse(JSON.stringify(placed)))!;
  check(
    'an inventory round-trips through storage with its slots, tags and placements',
    restored.width === 4 &&
      slotAt(restored, 0, 0)!.tags.join(',') === 'weapon' &&
      restored.placements[0]!.itemId === sword.id,
  );
  check(
    'inventory junk is rejected rather than trusted',
    sanitizeInventory(null) === null &&
      sanitizeInventory({ width: 3 }) === null &&
      sanitizeInventory({ width: 2, height: 2, slots: 'nope', placements: [{ itemId: 'x' }] })!
        .placements.length === 0,
  );
}

function checkCharacterStorage(check: CheckReporter): void {
  const creatures = new CreatureLibrary();
  const trader = creatures.all().find((creature) => creature.kind === CHARACTER)!;
  check(
    'the default library ships a character carrying items in its inventory',
    trader.inventory !== null && trader.inventory.placements.length > 0,
  );
  const reloaded = creaturesFromStoredJson(JSON.parse(JSON.stringify(creatures.all())))!;
  check(
    'characters round-trip through storage with their inventory',
    reloaded.find((creature) => creature.id === trader.id)!.inventory!.placements.length ===
      trader.inventory!.placements.length,
  );
  const legacy = creaturesFromStoredJson([
    { id: 0, name: 'old deer', symbol: 'd', color: '#fff', behavior: 0, speed: 1 },
  ])!;
  check(
    'a creature saved before inventories existed loads as a plain creature',
    legacy[0]!.kind === CREATURE && legacy[0]!.inventory === null,
  );
}

function checkItemAndInventoryAbilities(check: CheckReporter): void {
  const world = abilityWorld();
  const act = (action: string, params: Record<string, unknown> = {}): AbilityResult =>
    performAbility(world.context, 'god', action, params);

  const added = act('add_item');
  const newItemId = world.items.all()[world.items.all().length - 1]!.id;
  check('add_item creates an item through the ability layer', added.ok);
  check(
    'update_item changes the footprint, tags and render mode',
    act('update_item', {
      item_id: newItemId,
      grid_width: 2,
      grid_height: 2,
      tags: ['Shield', ' armor '],
      render: CUBE,
    }).ok &&
      world.items.byId(newItemId)!.gridWidth === 2 &&
      world.items.byId(newItemId)!.tags.join(',') === 'shield,armor' &&
      world.items.byId(newItemId)!.render === CUBE,
  );
  const badRender = act('update_item', { item_id: newItemId, render: 42 });
  check('update_item refuses a render mode that does not exist', !badRender.ok);
  const badSprite = act('update_item', { item_id: newItemId, sprite: ['#fff', '#000', '#111'] });
  check(
    'update_item refuses a sprite that is not a square grid',
    !badSprite.ok && badSprite.code === 'invalid_value',
  );
  check(
    'update_item accepts a square sprite',
    act('update_item', { item_id: newItemId, sprite: ['#ffffff', null, null, '#000000'] }).ok &&
      world.items.byId(newItemId)!.sprite!.length === 4,
  );

  const character = act('add_character');
  const characterId = world.creatures.all()[world.creatures.all().length - 1]!.id;
  check(
    'add_character makes a creature that starts with an inventory',
    character.ok && world.creatures.byId(characterId)!.inventory !== null,
  );
  check(
    'set_inventory reshapes the grid',
    act('set_inventory', { creature_id: characterId, width: 3, height: 3 }).ok &&
      world.creatures.byId(characterId)!.inventory!.slots.length === 9,
  );
  check(
    'update_inventory_slot can kill a slot and tag another',
    act('update_inventory_slot', { creature_id: characterId, slot_x: 2, slot_y: 2, usable: 0 }).ok &&
      act('update_inventory_slot', { creature_id: characterId, slot_x: 0, slot_y: 0, tags: ['weapon'] }).ok &&
      world.creatures.byId(characterId)!.inventory!.slots[8]!.usable === false,
  );
  const sword = world.items.all().find((item) => item.tags.includes('weapon'))!;
  const potion = world.items.all().find((item) => item.tags.includes('consumable'))!;
  const refusedByTag = act('place_inventory_item', {
    creature_id: characterId,
    item_id: potion.id,
    slot_x: 0,
    slot_y: 0,
  });
  check(
    'place_inventory_item refuses an item a tagged slot does not accept',
    !refusedByTag.ok && refusedByTag.code === 'placement_refused',
  );
  check(
    'place_inventory_item accepts the item the slot was tagged for',
    act('place_inventory_item', { creature_id: characterId, item_id: sword.id, slot_x: 0, slot_y: 0 }).ok &&
      world.creatures.byId(characterId)!.inventory!.placements.length === 1,
  );
  const overlapping = act('place_inventory_item', {
    creature_id: characterId,
    item_id: potion.id,
    slot_x: 0,
    slot_y: 1,
  });
  check(
    'place_inventory_item refuses to stack two items on the same cell',
    !overlapping.ok && overlapping.code === 'placement_refused',
  );
  check(
    'remove_inventory_item takes the item back out from any of its cells',
    act('remove_inventory_item', { creature_id: characterId, slot_x: 0, slot_y: 1 }).ok &&
      world.creatures.byId(characterId)!.inventory!.placements.length === 0,
  );
  const noInventory = act('set_inventory_background', { creature_id: 0, sprite: null });
  check(
    'inventory actions on a creature without one say so',
    !noInventory.ok && noInventory.code === 'no_inventory',
  );
  check(
    'clear_inventory takes the grid away entirely',
    act('clear_inventory', { creature_id: characterId }).ok &&
      world.creatures.byId(characterId)!.inventory === null,
  );
  check(
    'remove_item deletes the definition',
    act('remove_item', { item_id: newItemId }).ok && world.items.byId(newItemId) === undefined,
  );
}

function abilityWorld() {
  const items = new ItemLibrary();
  const creatures = new CreatureLibrary();
  const context: AbilityContext = {
    store: new PipelineStore(emptyPipeline()),
    tileset: new Tileset(),
    prefabs: new PrefabLibrary(() => -1),
    creatures,
    items,
    templates: new TemplateLibrary([]),
    worldPresets: new WorldPresetLibrary([]),
    randomizeHistory: new RandomizeHistory(),
    regionSampler: { tileAt: () => 0, elevationAt: () => 0, voxelColumnAt: () => null },
    actor: {
      pose: () => ({ x: 0, y: 0, facing: 0 }),
      tryStep: () => true,
      turn: () => undefined,
      sightRadiusTiles: () => DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
      setSightRadiusTiles: () => undefined,
    },
  };
  return { context, items, creatures };
}

function itemPointsPipeline(itemId: number): PipelineState {
  return sanitizePipeline({
    seed: 99,
    nodes: [
      { id: 'ground', type: 'constantField', params: { value: 1 }, inputs: {}, display: { mode: 'hidden' } },
      {
        id: 'terrain',
        type: 'thresholdTiles',
        params: { threshold: 0.5, aboveTile: 2, belowTile: 0 },
        inputs: { field: 'ground' },
        display: { mode: 'tileLayer' },
      },
      {
        id: 'loot',
        type: 'scatterPoints',
        params: { density: 0.01, maskAtLeast: 0, maskAtMost: 1 },
        inputs: {},
        display: { mode: 'items', itemId },
      },
    ],
  });
}
