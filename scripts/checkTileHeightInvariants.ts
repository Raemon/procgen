import type { WorldSampler } from '../src/procgen/worldSampler';
import type { ReadOnlyTileset } from '../src/app/readOnlyLibraries';
import { defaultTiles } from '../src/world/tiles/defaultTiles';
import type { TileDef } from '../src/world/tiles/tileDef';
import { BLOCKING_TILE_HEIGHT, WALKABLE_TILE_HEIGHT } from '../src/world/tiles/tileHeight';
import { tilesFromStoredJson } from '../src/world/tiles/tilesetStorage';
import { tilePlacementsForRect } from '../src/views/view3d/tilePlacements';
import type { CheckReporter } from './checkCharacterBillboardInvariants';

const POOL_TILE_NAMES = ['water', 'deep water', 'lava'];

export function checkTileHeightInvariants(check: CheckReporter): void {
  checkBlockersStandTallEnoughToHideBehind(check);
  checkBlocksStackOneCubePerUnitOfHeight(check);
  checkStoredTilesWithoutAHeightGetOne(check);
}

function checkBlockersStandTallEnoughToHideBehind(check: CheckReporter): void {
  const tiles = defaultTiles();
  check(
    'every blocking tile in the catalog stands at least two tiles tall, except the pools',
    tiles
      .filter((tile) => !tile.walkable && !POOL_TILE_NAMES.includes(tile.name))
      .every((tile) => tile.height >= BLOCKING_TILE_HEIGHT),
  );
  check(
    'pools stay ankle deep rather than standing as a wall',
    tiles
      .filter((tile) => POOL_TILE_NAMES.includes(tile.name))
      .every((tile) => tile.height === WALKABLE_TILE_HEIGHT),
  );
  check(
    'walkable tiles are floors, so they claim no standing height',
    tiles.filter((tile) => tile.walkable).every((tile) => tile.height === WALKABLE_TILE_HEIGHT),
  );
}

function checkBlocksStackOneCubePerUnitOfHeight(check: CheckReporter): void {
  const wall = tileNamed('stone wall');
  const { floors, blocks } = onlyTilePlacements(wall);
  check(
    'a two-tall wall draws two stacked cubes over one floor',
    floors.length === 1 && blocks.length === 2,
  );
  check(
    'the stacked cubes sit one unit apart, starting at the ground',
    blocks[0]!.elevation === 0 && blocks[1]!.elevation === 1,
  );
  const { trees } = onlyTilePlacements(tileNamed('pine tree'));
  check(
    'a tree is drawn as a single cone as tall as the tile says',
    trees.length === 1 && trees[0]!.height === tileNamed('pine tree').height,
  );
}

function checkStoredTilesWithoutAHeightGetOne(check: CheckReporter): void {
  const legacy = defaultTiles().map(({ height, ...tile }) => tile);
  const loaded = tilesFromStoredJson(JSON.parse(JSON.stringify(legacy)))!;
  check(
    'a tileset saved before heights existed loads with blockers two tall and floors one',
    loaded.every((tile) => tile.height === (tile.walkable ? WALKABLE_TILE_HEIGHT : BLOCKING_TILE_HEIGHT)),
  );
  const roundtripped = tilesFromStoredJson(JSON.parse(JSON.stringify(defaultTiles())))!;
  check(
    'an authored height survives a save and reload',
    roundtripped.every((tile, index) => tile.height === defaultTiles()[index]!.height),
  );
}

function tileNamed(name: string): TileDef {
  return defaultTiles().find((tile) => tile.name === name)!;
}

function onlyTilePlacements(tile: TileDef) {
  return tilePlacementsForRect(samplerOfOneTile(tile), tilesetOfOneTile(tile), 0, 0, 1, 1);
}

function samplerOfOneTile(tile: TileDef): WorldSampler {
  return { tileAt: () => tile.id, elevationAt: () => 0 } as unknown as WorldSampler;
}

function tilesetOfOneTile(tile: TileDef): ReadOnlyTileset {
  return {
    byId: (id: number) => (id === tile.id ? tile : undefined),
    byRole: () => undefined,
    all: () => [tile],
  } as unknown as ReadOnlyTileset;
}
