import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { tilesValue, type ChunkValue, type TilesChunk } from '../../values/chunkValues';
import {
  PUZZLE_LATTICE_LABEL,
  PUZZLE_ROOMS_NODE_TYPE,
  PUZZLE_ROOM_PARAMS,
  puzzleRoomKnobsFrom,
} from './puzzleRoomKnobs';
import { puzzleShellAt } from './puzzleRoomShell';
import { roomLatticeMazeFor } from './roomLatticeMazeCache';
import type { RoomLatticeMaze } from './roomLatticeMaze';

registerNodeType({
  type: PUZZLE_ROOMS_NODE_TYPE,
  title: 'puzzle rooms',
  category: 'maze',
  description:
    'Carves an endless labyrinth of walled chambers. A maze is carved over the chambers themselves rather than over tiles, so most neighbouring chambers are not joined at all and the corridors that do exist run between chamber centres, with a doorway punched through the wall at each mouth. Every doorway is a locked door, and it only opens once one of the two chambers it joins has been solved. The levers, keys, crates and plates themselves are laid out from the same seed and knobs by the puzzle layer, which is why this node needs no knobs for them.',
  whenToUse:
    'A labyrinth the player has to earn rather than walk: dead ends, loops and locked chambers, where getting anywhere means solving what stands in the room. Add it as the top tile layer to make the chambers the only navigable space, or turn "solid between rooms" off and lay it over an ordinary labyrinth so the gated chambers become vaults inside an open maze.',
  inputs: {},
  params: PUZZLE_ROOM_PARAMS,
  output: 'tiles',
  generateChunk: puzzleRoomsChunk,
});

function puzzleRoomsChunk(ctx: ChunkGenCtx): ChunkValue {
  const knobs = puzzleRoomKnobsFrom(ctx.hashSeed(PUZZLE_LATTICE_LABEL), ctx.params);
  const maze = roomLatticeMazeFor(knobs);
  const tiles = ctx.newTiles();
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      paintShellCell(ctx, knobs, maze, tiles, x, y);
    }
  }
  return tilesValue(tiles);
}

function paintShellCell(
  ctx: ChunkGenCtx,
  knobs: ReturnType<typeof puzzleRoomKnobsFrom>,
  maze: RoomLatticeMaze,
  tiles: TilesChunk,
  x: number,
  y: number,
): void {
  const cell = puzzleShellAt(knobs, maze, ctx.originX + x, ctx.originY + y);
  if (cell === 'outside' && knobs.fillBetween === 0) return;
  tiles[y * ctx.size + x] =
    cell === 'floor' ? (knobs.floorTile as number) : (knobs.wallTile as number);
}
