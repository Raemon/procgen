import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { tilesValue, type ChunkValue, type TilesChunk } from '../../values/chunkValues';
import {
  PUZZLE_ROOMS_NODE_TYPE,
  PUZZLE_ROOM_PARAMS,
  puzzleRoomKnobsFrom,
} from './puzzleRoomKnobs';
import { puzzleShellAt } from './puzzleRoomShell';

registerNodeType({
  type: PUZZLE_ROOMS_NODE_TYPE,
  title: 'puzzle rooms',
  category: 'maze',
  description:
    'Carves an endless grid of walled chambers joined east and south by corridors, with a doorway punched through the wall at each corridor mouth. Every doorway is a locked door held shut by the puzzle inside the chamber west or north of it, so the labyrinth only opens as it is solved. The levers, keys, crates and plates themselves are laid out from the same seed and knobs by the puzzle layer, which is why this node needs no knobs for them.',
  whenToUse:
    'A labyrinth the player has to earn rather than walk. Add it as the top tile layer to make chambers the only navigable space, or turn "solid between rooms" off and lay it over a labyrinth so the gated chambers become vaults inside an open maze.',
  inputs: {},
  params: PUZZLE_ROOM_PARAMS,
  output: 'tiles',
  generateChunk: puzzleRoomsChunk,
});

function puzzleRoomsChunk(ctx: ChunkGenCtx): ChunkValue {
  const knobs = puzzleRoomKnobsFrom(0, ctx.params);
  const tiles = ctx.newTiles();
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      paintShellCell(ctx, knobs, tiles, x, y);
    }
  }
  return tilesValue(tiles);
}

function paintShellCell(
  ctx: ChunkGenCtx,
  knobs: ReturnType<typeof puzzleRoomKnobsFrom>,
  tiles: TilesChunk,
  x: number,
  y: number,
): void {
  const cell = puzzleShellAt(knobs, ctx.originX + x, ctx.originY + y);
  if (cell === 'outside' && knobs.fillBetween === 0) return;
  tiles[y * ctx.size + x] =
    cell === 'floor' ? (knobs.floorTile as number) : (knobs.wallTile as number);
}
