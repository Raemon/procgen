import type { ChunkGenCtx, KnobParamSpec } from '../../nodeType';
import type { TilesChunk } from '../../values/chunkValues';
import { braidCellMaze } from './braidCellMaze';
import { CARVER_CHOICES, CARVER_DFS, carveCellMaze } from './mazeCarvers';
import { regionBorderDoors } from './mazeRegionDoors';
import { chunkOffsetInRegion, mazeRegionLayout, regionIndexOfChunk } from './mazeRegionLayout';
import { carveMazeRooms } from './mazeRooms';
import { paintMazeWindow } from './paintMazeWindow';

export const MAZE_CARVE_PARAMS: Record<string, KnobParamSpec> = {
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
    help: 'Thickness of the walls between corridors, in tiles. 2 or more keeps a jump from clearing a wall.',
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
  rooms: {
    kind: 'number',
    label: 'rooms',
    help: 'Fraction of the maze given over to open rooms: rectangles of lattice cells whose inner walls are knocked out. 0 is pure corridors; 0.4 reads as chambers joined by passages.',
    min: 0,
    max: 0.9,
    step: 0.05,
    default: 0,
  },
  roomCells: {
    kind: 'int',
    label: 'room size',
    help: 'Largest room, measured in maze cells on a side. With corridor 3 / wall 1 a 4-cell room is a 15-tile chamber.',
    min: 2,
    max: 8,
    default: 3,
  },
};

export function carvedMazeWindow(ctx: ChunkGenCtx, wallTile: number, floorTile: number): TilesChunk {
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
  const rooms = carveMazeRooms(
    layout.cells,
    ctx.params.rooms as number,
    ctx.params.roomCells as number,
    ctx.rngAt(regionX, regionY, 'rooms'),
  );
  return paintMazeWindow(
    ctx.newTiles(),
    ctx.size,
    chunkOffsetInRegion(ctx.chunkX, regionX, regionChunks, ctx.size),
    chunkOffsetInRegion(ctx.chunkY, regionY, regionChunks, ctx.size),
    { layout, maze, doors, rooms },
    wallTile,
    floorTile,
  );
}
