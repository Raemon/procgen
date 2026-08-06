import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { tilesValue, type ChunkValue } from '../../values/chunkValues';
import { braidCellMaze } from './braidCellMaze';
import { CARVER_NAMES, carveCellMaze } from './mazeCarvers';
import { pickEdgeDoors } from './mazeEdgeDoors';
import { LATTICE_NAMES, latticeByName, latticeCells } from './mazeLattices';
import { paintMazeTiles } from './paintMazeTiles';

registerNodeType({
  type: 'mazeChunk',
  title: 'labyrinth',
  category: 'maze',
  description:
    'Carves an endless labyrinth, one maze per chunk, joined to every neighbor through doors so the whole world stays connected. Lattice sets corridor scale; braid melts dead ends into loops.',
  inputs: {},
  params: {
    lattice: { kind: 'select', label: 'lattice', options: LATTICE_NAMES, default: 'classic' },
    carver: { kind: 'select', label: 'carver', options: CARVER_NAMES, default: 'dfs' },
    braid: { kind: 'number', label: 'braid', min: 0, max: 1, step: 0.05, default: 0.15 },
    doorsPerEdge: { kind: 'int', label: 'doors per edge', min: 1, max: 4, default: 1 },
    wallTile: { kind: 'tile', label: 'wall' },
    floorTile: { kind: 'tile', label: 'floor' },
  },
  output: 'tiles',
  generateChunk: mazeChunk,
});

function mazeChunk(ctx: ChunkGenCtx): ChunkValue {
  const lattice = latticeByName(ctx.params.lattice as string);
  const cells = latticeCells(lattice, ctx.size);
  const maze = carveCellMaze(cells, ctx.params.carver as string, ctx.rng('carve'));
  braidCellMaze(maze, ctx.params.braid as number, ctx.rng('braid'));
  const doors = pickEdgeDoors(
    cells,
    ctx.params.doorsPerEdge as number,
    ctx.rng('west doors'),
    ctx.rng('north doors'),
  );
  const tiles = paintMazeTiles(
    ctx.newTiles(),
    ctx.size,
    lattice,
    maze,
    doors,
    ctx.params.wallTile as number,
    ctx.params.floorTile as number,
  );
  return tilesValue(tiles);
}
