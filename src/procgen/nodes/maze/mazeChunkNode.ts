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
  whenToUse:
    'Dungeon-like structure instead of organic noise terrain. Use it as a base layer, then scatter monsters or loot on top with points nodes.',
  inputs: {},
  params: {
    lattice: {
      kind: 'select',
      label: 'lattice',
      help: 'Corridor scale: how wide passages are and how densely they pack into each chunk.',
      options: LATTICE_NAMES,
      optionHelp: {
        capillary: '1-wide corridors packed as tight as possible — claustrophobic and twisty.',
        warren: '2-wide passages with 2-thick walls — dense burrows.',
        classic: '3-wide passages with 1-thick walls — the standard maze look.',
        atrium: '6-wide halls with 2-thick walls — spacious rooms.',
        cathedral: '7-wide halls with 1-thick walls — vast open galleries.',
      },
      default: 'classic',
    },
    carver: {
      kind: 'select',
      label: 'carver',
      help: 'The algorithm that carves the passages; each has a distinct corridor character.',
      options: CARVER_NAMES,
      optionHelp: {
        dfs: 'Depth-first backtracker: long winding corridors with few branches.',
        prim: 'Random frontier growth: short branchy passages with many dead ends.',
        sidewinder: 'Row-by-row runs: a horizontal bias with long straight stretches.',
      },
      default: 'dfs',
    },
    braid: {
      kind: 'number',
      label: 'braid',
      help: 'Fraction of dead ends opened into loops. 0 keeps a perfect maze; higher values add alternate routes.',
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.15,
    },
    doorsPerEdge: {
      kind: 'int',
      label: 'doors per edge',
      help: 'Passages punched through each chunk border so neighboring mazes connect. More doors = a more open world.',
      min: 1,
      max: 4,
      default: 1,
    },
    wallTile: { kind: 'tile', label: 'wall', help: 'Tile painted on maze walls.' },
    floorTile: { kind: 'tile', label: 'floor', help: 'Tile painted on corridors and doors.' },
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
