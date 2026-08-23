import { assetId, type TileId } from '@/features/asset-library/asset';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import { kitStream } from '../generation/kitRandom';
import { tileSlotsOfKit } from '../generation/kitTileSlots';
import { defaultTiles } from '../tiles/defaultTiles';
import { TileAssets } from '../tiles/tileAssets';
import { newTileWithId, type TileDef } from '../tiles/tileDef';
import { MIN_BLOCKING_TILE_HEIGHT } from '../tiles/tileHeight';
import { tilesFromStoredJson } from '../tiles/tileStorage';
import { shapeSealsAgainstNeighbours } from '../tiles/tileShapeKind';
import {
  WALL_DIRECTIONS,
  wallBoxParts,
  type WallDirection,
} from '@/features/game/render/view3d/shaped/shapedTileBoxParts';
import { tilePlacementsForRect } from '@/features/game/render/view3d/tilePlacements';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

const KIT_SEEDS = [...Array(24).keys()];
const EVERY_CONNECTION_MASK = [...Array(16).keys()];
const WALL_TILE = assetId<'tiles'>(1);
const FLOOR_TILE = assetId<'tiles'>(2);

export function checkBlockingTileInvariants(check: CheckReporter): void {
  checkShippedBlockersAreSealed(check);
  checkEditsKeepBlockersSealed(check);
  checkWallPiecesSealTheirCell(check);
  checkWallsConnectToBlockingNeighbours(check);
}

function checkShippedBlockersAreSealed(check: CheckReporter): void {
  const blockers = defaultTiles().filter((tile) => !tile.walkable);
  check(
    'every default tile that blocks movement draws as a shape that seals its cell',
    blockers.every((tile) => shapeSealsAgainstNeighbours(tile.shape)),
  );
  check(
    `every default blocker stands at least ${MIN_BLOCKING_TILE_HEIGHT} tiles tall`,
    blockers.every((tile) => tile.height >= MIN_BLOCKING_TILE_HEIGHT),
  );
  const kitBlockers = KIT_SEEDS.flatMap((seed) => tileSlotsOfKit(kitStream(seed, 'tileSlots'))).filter(
    (slot) => !slot.walkable,
  );
  check(
    'every generated kit slot that blocks movement is sealed as cube or wall',
    kitBlockers.every((slot) => shapeSealsAgainstNeighbours(slot.shape)),
  );
  check(
    'no generated kit slot pins a blocker below the minimum height',
    kitBlockers.every((slot) => slot.height === null || slot.height >= MIN_BLOCKING_TILE_HEIGHT),
  );
}

function checkEditsKeepBlockersSealed(check: CheckReporter): void {
  const assets = new TileAssets([
    { ...newTileWithId(assetId<'tiles'>(0)), shape: 'panel', height: 0.5 },
    { ...newTileWithId(assetId<'tiles'>(1)), shape: 'stairs' },
  ]);
  assets.update(assetId<'tiles'>(0), { walkable: false });
  assets.update(assetId<'tiles'>(1), { walkable: false });
  const post = assets.byId(assetId<'tiles'>(0))!;
  const stack = assets.byId(assetId<'tiles'>(1))!;
  check(
    'turning a thin upright tile into a blocker makes it a wall at full height',
    post.shape === 'wall' && post.height >= MIN_BLOCKING_TILE_HEIGHT,
  );
  check('turning a stepped tile into a blocker makes it a whole cube', stack.shape === 'cube');
  const stored = tilesFromStoredJson([
    { ...newTileWithId(assetId<'tiles'>(0)), walkable: false, shape: 'diagonalWall', height: 1 },
  ])!;
  check(
    'a stored blocker that predates the sealing rules is sealed on load',
    stored[0]!.shape === 'wall' && stored[0]!.height >= MIN_BLOCKING_TILE_HEIGHT,
  );
}

function checkWallPiecesSealTheirCell(check: CheckReporter): void {
  check('a wall with nothing beside it stands as a single post', wallBoxParts(0).length === 1);
  check(
    'each connected side adds one arm to the wall',
    EVERY_CONNECTION_MASK.every(
      (mask) => wallBoxParts(mask).length === 1 + WALL_DIRECTIONS.filter((one) => mask & one.bit).length,
    ),
  );
  check(
    'every wall arm reaches the edge of its cell, so runs of wall stay solid',
    WALL_DIRECTIONS.every((direction) => armReachesCellEdge(direction)),
  );
}

function armReachesCellEdge(direction: WallDirection): boolean {
  const arm = wallBoxParts(direction.bit)[1]!;
  return direction.dx !== 0
    ? arm.x + (direction.dx * arm.width) / 2 === direction.dx * 0.5
    : arm.z + (direction.dy * arm.depth) / 2 === direction.dy * 0.5;
}

function checkWallsConnectToBlockingNeighbours(check: CheckReporter): void {
  const placements = tilePlacementsForRect(wallRunSampler(), wallRunTiles(), 0, 0, 3, 1);
  const byX = new Map(placements.shaped.map((placement) => [placement.x, placement]));
  check(
    'a wall inside a run reaches both neighbouring walls',
    byX.get(1)?.facing === (2 | 8),
  );
  check(
    'the walls ending a run reach only toward the wall beside them',
    byX.get(0)?.facing === 2 && byX.get(2)?.facing === 8,
  );
  check(
    'every placed wall stands at least the blocking minimum tall',
    placements.shaped.every((placement) => placement.height >= MIN_BLOCKING_TILE_HEIGHT),
  );
}

function wallRunTiles(): ReadOnlyTileAssets {
  const wall: TileDef = { ...newTileWithId(WALL_TILE), walkable: false, shape: 'wall' };
  const floor = newTileWithId(FLOOR_TILE);
  return {
    byId: (id: TileId) => (id === WALL_TILE ? wall : id === FLOOR_TILE ? floor : undefined),
  } as ReadOnlyTileAssets;
}

function wallRunSampler(): WorldSampler {
  return {
    tileAt: (x: number, y: number) => (y === 0 && x >= 0 && x < 3 ? WALL_TILE : FLOOR_TILE),
    elevationAt: () => 0,
    groundFacingAt: () => 0,
  } as unknown as WorldSampler;
}
