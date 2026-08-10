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
import { isRoomFloor, roomGeometryOf } from '../../labyrinth/roomLayout';
import { submazeFloorMask } from '../../labyrinth/submazeLayout';
import { LABYRINTH_GEOMETRY_PARAMS } from './labyrinthGeometryParams';

registerNodeType({
  type: LABYRINTH_NODE_TYPE,
  title: 'infinite labyrinth',
  category: 'maze',
  description:
    'Lays out an endless labyrinth one whole chunk at a time: most chunks are big walled rooms, the rest are dense one-chunk warrens, and every chunk opens onto its neighbours through one to four doorways. The doors spiral: each ring of chunks around the origin has one or two ways outward, turned a golden angle from the ring before, and one hidden seam sealed shut, so reaching the next ring means winding around the current one. The puzzle layer reads the same seed and knobs to furnish each room, which is why this node needs no knobs for levers or crates.',
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
  const exits = chunkExitsOf(ctx.chunkX, ctx.chunkY, knobs);
  const tiles = ctx.newTiles();
  if (roleOf(ctx.chunkX, ctx.chunkY, knobs) === ROOM) paintRoom(ctx, tiles, exits, knobs);
  else paintSubmaze(ctx, tiles, exits, knobs);
  return tilesValue(tiles);
}

function paintRoom(ctx: ChunkGenCtx, tiles: TilesChunk, exits: ChunkExits, knobs: LabyrinthKnobs): void {
  const geometry = roomGeometryOf(ctx.chunkX, ctx.chunkY, exits, knobs);
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      const floor = isRoomFloor(ctx.originX + x, ctx.originY + y, geometry);
      tiles[y * ctx.size + x] = floor ? knobs.floorTile : knobs.wallTile;
    }
  }
}

function paintSubmaze(ctx: ChunkGenCtx, tiles: TilesChunk, exits: ChunkExits, knobs: LabyrinthKnobs): void {
  const mask = submazeFloorMask(ctx.chunkX, ctx.chunkY, exits, knobs);
  for (let i = 0; i < tiles.length; i++) tiles[i] = mask[i] ? knobs.floorTile : knobs.wallTile;
}
