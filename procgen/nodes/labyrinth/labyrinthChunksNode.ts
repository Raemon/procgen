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
import { CARVER_CHOICES, CARVER_DFS } from '../maze/mazeCarvers';

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
    roomFraction: {
      kind: 'number',
      label: 'room share',
      help: 'Fraction of chunks beyond the tutorial rings that become puzzle rooms; the rest are carved into dense one-chunk warrens.',
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.75,
    },
    tutorialRings: {
      kind: 'int',
      label: 'tutorial rings',
      help: 'Rings of chunks around the origin forced to be rooms, so the opening minutes teach the puzzle kinds before any warren appears.',
      min: 1,
      max: 6,
      default: 3,
    },
    corridor: {
      kind: 'int',
      label: 'doorway width',
      help: 'Width in tiles of every doorway and of the warren passages. 1 is single file; 3 lets two walk abreast.',
      min: 1,
      max: 3,
      default: 1,
    },
    wall: {
      kind: 'int',
      label: 'wall thickness',
      help: 'Thickness of the wall ring around each room and of the warren walls, in tiles.',
      min: 1,
      max: 2,
      default: 1,
    },
    braid: {
      kind: 'number',
      label: 'braid',
      help: 'Fraction of warren dead ends opened into loops. 0 keeps each warren a perfect maze; higher values add alternate routes.',
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.15,
    },
    carver: {
      kind: 'choice',
      label: 'carver',
      help: 'The algorithm that carves each warren chunk; each has a distinct corridor character.',
      options: CARVER_CHOICES,
      default: CARVER_DFS,
    },
    doorJitter: {
      kind: 'number',
      label: 'door jitter',
      help: 'How far each ring’s outward door may wander from the pure golden-angle spiral. 0 is a strict spiral; 1 lets doors drift up to a half-octant.',
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.5,
    },
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
