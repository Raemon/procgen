import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';
import { carvedMazeWindow, MAZE_CARVE_PARAMS } from './carvedMazeWindow';

const WALL = 1;
const FLOOR = 0;

registerNodeType({
  type: 'mazeWallField',
  title: 'labyrinth walls as a field',
  category: 'maze',
  description:
    'Carves the same endless labyrinth as the labyrinth tile node but returns it as a field: 1 on every wall cell, 0 in the corridors and rooms.',
  whenToUse:
    'A labyrinth built out of terrain instead of tiles. Scale the field and add it onto elevation and the walls become sheer rock faces as tall as you like — taller than any tile — that fade wherever you multiply the field down. Threshold the same field to paint the wall tops.',
  inputs: {},
  params: MAZE_CARVE_PARAMS,
  output: 'field',
  generateChunk: mazeWallChunk,
});

function mazeWallChunk(ctx: ChunkGenCtx): ChunkValue {
  const tiles = carvedMazeWindow(ctx, WALL, FLOOR);
  const out = ctx.newField();
  for (let i = 0; i < out.length; i++) out[i] = tiles[i] === WALL ? 1 : 0;
  return fieldValue(out);
}
