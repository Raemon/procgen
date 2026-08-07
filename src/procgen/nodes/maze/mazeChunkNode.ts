import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { tilesValue, type ChunkValue } from '../../values/chunkValues';
import { braidCellMaze } from './braidCellMaze';
import { CARVER_CHOICES, CARVER_DFS, carveCellMaze } from './mazeCarvers';
import { regionBorderDoors } from './mazeRegionDoors';
import { chunkOffsetInRegion, mazeRegionLayout, regionIndexOfChunk } from './mazeRegionLayout';
import { paintMazeWindow } from './paintMazeWindow';

registerNodeType({
  type: 'mazeChunk',
  title: 'labyrinth',
  category: 'maze',
  description:
    'Carves an endless labyrinth from numeric knobs: corridor width, wall thickness, and how many chunks each self-contained maze spans. Mazes join to every neighbor through border doors so the whole world stays connected.',
  whenToUse:
    'Dungeon-like structure instead of organic noise terrain. Layer two of these at different maze sizes for nested labyrinths (give the big one an empty floor so the small one shows through), or scatter monsters and loot on top with points nodes.',
  inputs: {},
  params: {
    corridor: {
      kind: 'int',
      label: 'corridor width',
      help: 'Width of passages and rooms in tiles. 1 is claustrophobic, 3 is the classic maze look, 20+ makes halls that can contain a whole smaller labyrinth.',
      min: 1,
      max: 24,
      default: 3,
    },
    wall: {
      kind: 'int',
      label: 'wall thickness',
      help: 'Thickness of the walls between corridors, in tiles.',
      min: 1,
      max: 8,
      default: 1,
    },
    mazeChunks: {
      kind: 'int',
      label: 'chunks per maze',
      help: 'Side length, in 32-tile chunks, of each self-contained maze. 1 carves a maze per chunk; higher values carve one big maze across that many chunks — the way to build higher-order labyrinths.',
      min: 1,
      max: 8,
      default: 1,
    },
    carver: {
      kind: 'choice',
      label: 'carver',
      help: 'The algorithm that carves the passages; each has a distinct corridor character.',
      options: CARVER_CHOICES,
      default: CARVER_DFS,
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
      help: 'Passages punched through each maze border so neighboring mazes connect. More doors = a more open world.',
      min: 1,
      max: 4,
      default: 1,
    },
    wallTile: { kind: 'tile', label: 'wall', help: 'Tile painted on maze walls. Pick (empty) to let lower layers show through the walls.' },
    floorTile: { kind: 'tile', label: 'floor', help: 'Tile painted on corridors and doors. Pick (empty) to let lower layers show through the corridors — the trick behind nesting a small labyrinth inside a big one.' },
  },
  output: 'tiles',
  generateChunk: mazeChunk,
});

function mazeChunk(ctx: ChunkGenCtx): ChunkValue {
  const regionChunks = ctx.params.mazeChunks as number;
  const layout = mazeRegionLayout(
    ctx.size,
    ctx.params.corridor as number,
    ctx.params.wall as number,
    regionChunks,
  );
  const regionX = regionIndexOfChunk(ctx.chunkX, regionChunks);
  const regionY = regionIndexOfChunk(ctx.chunkY, regionChunks);
  const maze = carveCellMaze(layout.cells, ctx.params.carver as number, ctx.rngAt(regionX, regionY, 'carve'));
  braidCellMaze(maze, ctx.params.braid as number, ctx.rngAt(regionX, regionY, 'braid'));
  const doors = regionBorderDoors(ctx, regionX, regionY, layout.cells, ctx.params.doorsPerEdge as number);
  const tiles = paintMazeWindow(
    ctx.newTiles(),
    ctx.size,
    chunkOffsetInRegion(ctx.chunkX, regionX, regionChunks, ctx.size),
    chunkOffsetInRegion(ctx.chunkY, regionY, regionChunks, ctx.size),
    layout,
    maze,
    doors,
    ctx.params.wallTile as number,
    ctx.params.floorTile as number,
  );
  return tilesValue(tiles);
}
