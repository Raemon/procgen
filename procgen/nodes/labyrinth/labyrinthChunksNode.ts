import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { tilesValue, type ChunkValue, type TilesChunk } from '../../values/chunkValues';
import { chunkExitsOf, type ChunkExits } from '../../labyrinth/chunkExits';
import { roleOf, ROOM } from '../../labyrinth/chunkRole';
import {
  LABYRINTH_NODE_TYPE,
  LABYRINTH_SEED_LABEL,
  labyrinthKnobsFrom,
  type LabyrinthKnobs,
} from '../../labyrinth/labyrinthKnobs';
import {
  LABYRINTH_CELL_SIZE,
  labyrinthCellCoordOf,
  labyrinthCellOrigin,
} from '../../labyrinth/labyrinthLattice';
import { isRoomFloor, roomGeometryOf } from '../../labyrinth/roomLayout';
import { submazeFloorMask } from '../../labyrinth/submazeLayout';
import { LABYRINTH_GEOMETRY_PARAMS } from './labyrinthGeometryParams';

registerNodeType({
  type: LABYRINTH_NODE_TYPE,
  title: 'infinite labyrinth',
  category: 'maze',
  description:
    'Lays out an endless labyrinth one 8-tile cell at a time: most cells are walled rooms, the rest are dense one-cell warrens, and every cell opens onto its neighbours through one to four doorways. The doors spiral: each ring of cells around the origin has one or two ways outward, turned a golden angle from the ring before, and one hidden seam sealed shut, so reaching the next ring means winding around the current one. The puzzle layer reads the same seed and knobs to furnish each room, which is why this node needs no knobs for levers or crates.',
  whenToUse:
    'A world that is one endless dungeon rather than terrain: rooms of escalating challenge near the middle, warrens between them, and a spiral pull that makes outward progress feel earned. Use it as the base tile layer with a ceiling on top for a lightless delve, and keep the tutorial rings wide if you want the first minutes to be all rooms.',
  inputs: {},
  params: {
    ...LABYRINTH_GEOMETRY_PARAMS,
    wallTile: {
      kind: 'tile',
      label: 'wall',
      help: 'Tile painted on room walls, warren walls, and everything between doorways.',
    },
    floorTile: {
      kind: 'tile',
      label: 'floor',
      help: 'Tile painted on room floors, warren passages, and through every doorway.',
    },
  },
  output: 'tiles',
  generateChunk: labyrinthChunk,
});

function labyrinthChunk(ctx: ChunkGenCtx): ChunkValue {
  const knobs = labyrinthKnobsFrom(ctx.hashSeed(LABYRINTH_SEED_LABEL), ctx.params);
  const tiles = ctx.newTiles();
  const cellsAcross = ctx.size / LABYRINTH_CELL_SIZE;
  const firstCellX = labyrinthCellCoordOf(ctx.originX);
  const firstCellY = labyrinthCellCoordOf(ctx.originY);
  for (let cy = 0; cy < cellsAcross; cy++) {
    for (let cx = 0; cx < cellsAcross; cx++) {
      paintCell(ctx, tiles, firstCellX + cx, firstCellY + cy, knobs);
    }
  }
  return tilesValue(tiles);
}

function paintCell(
  ctx: ChunkGenCtx,
  tiles: TilesChunk,
  cellX: number,
  cellY: number,
  knobs: LabyrinthKnobs,
): void {
  const exits = chunkExitsOf(cellX, cellY, knobs);
  if (roleOf(cellX, cellY, knobs) === ROOM) paintRoom(ctx, tiles, cellX, cellY, exits, knobs);
  else paintSubmaze(ctx, tiles, cellX, cellY, exits, knobs);
}

function paintRoom(
  ctx: ChunkGenCtx,
  tiles: TilesChunk,
  cellX: number,
  cellY: number,
  exits: ChunkExits,
  knobs: LabyrinthKnobs,
): void {
  const geometry = roomGeometryOf(cellX, cellY, exits, knobs);
  const originX = labyrinthCellOrigin(cellX);
  const originY = labyrinthCellOrigin(cellY);
  for (let y = 0; y < LABYRINTH_CELL_SIZE; y++) {
    for (let x = 0; x < LABYRINTH_CELL_SIZE; x++) {
      const floor = isRoomFloor(originX + x, originY + y, geometry);
      tiles[tileIndex(ctx, originX + x, originY + y)] = floor ? knobs.floorTile : knobs.wallTile;
    }
  }
}

function paintSubmaze(
  ctx: ChunkGenCtx,
  tiles: TilesChunk,
  cellX: number,
  cellY: number,
  exits: ChunkExits,
  knobs: LabyrinthKnobs,
): void {
  const mask = submazeFloorMask(cellX, cellY, exits, knobs);
  const originX = labyrinthCellOrigin(cellX);
  const originY = labyrinthCellOrigin(cellY);
  for (let y = 0; y < LABYRINTH_CELL_SIZE; y++) {
    for (let x = 0; x < LABYRINTH_CELL_SIZE; x++) {
      const floor = mask[y * LABYRINTH_CELL_SIZE + x] === 1;
      tiles[tileIndex(ctx, originX + x, originY + y)] = floor ? knobs.floorTile : knobs.wallTile;
    }
  }
}

function tileIndex(ctx: ChunkGenCtx, worldX: number, worldY: number): number {
  return (worldY - ctx.originY) * ctx.size + (worldX - ctx.originX);
}
