import type { RandomStream } from '../../random/mulberry32';
import {
  cellId,
  neighborsOf,
  newCellMaze,
  openBetween,
  type Cell,
  type CellMaze,
} from './cellMaze';

export const CARVER_DFS = 0;
export const CARVER_PRIM = 1;
export const CARVER_SIDEWINDER = 2;

export const CARVER_CHOICES = [
  { value: CARVER_DFS, label: 'dfs', help: 'Depth-first backtracker: long winding corridors with few branches.' },
  { value: CARVER_PRIM, label: 'prim', help: 'Random frontier growth: short branchy passages with many dead ends.' },
  { value: CARVER_SIDEWINDER, label: 'sidewinder', help: 'Row-by-row runs: a horizontal bias with long straight stretches.' },
] as const;

export function carveCellMaze(cells: number, carver: number, rng: RandomStream): CellMaze {
  const maze = newCellMaze(cells);
  if (carver === CARVER_PRIM) carvePrim(maze, rng);
  else if (carver === CARVER_SIDEWINDER) carveSidewinder(maze, rng);
  else carveDfs(maze, rng);
  return maze;
}

function randomCell(maze: CellMaze, rng: RandomStream): Cell {
  return { x: Math.floor(rng() * maze.cells), y: Math.floor(rng() * maze.cells) };
}

function carveDfs(maze: CellMaze, rng: RandomStream): void {
  const visited = new Uint8Array(maze.cells * maze.cells);
  const stack = [randomCell(maze, rng)];
  visited[cellId(maze, stack[0]!)] = 1;
  while (stack.length > 0) {
    const next = unvisitedNeighbor(maze, stack[stack.length - 1]!, visited, rng);
    if (!next) {
      stack.pop();
      continue;
    }
    openBetween(maze, stack[stack.length - 1]!, next);
    visited[cellId(maze, next)] = 1;
    stack.push(next);
  }
}

function unvisitedNeighbor(
  maze: CellMaze,
  cell: Cell,
  visited: Uint8Array,
  rng: RandomStream,
): Cell | null {
  const open = neighborsOf(maze, cell).filter((neighbor) => !visited[cellId(maze, neighbor)]);
  if (open.length === 0) return null;
  return open[Math.floor(rng() * open.length)]!;
}

function carvePrim(maze: CellMaze, rng: RandomStream): void {
  const visited = new Uint8Array(maze.cells * maze.cells);
  const start = randomCell(maze, rng);
  visited[cellId(maze, start)] = 1;
  const frontier: Array<[Cell, Cell]> = neighborsOf(maze, start).map((n) => [start, n]);
  while (frontier.length > 0) {
    const [from, to] = frontier.splice(Math.floor(rng() * frontier.length), 1)[0]!;
    if (visited[cellId(maze, to)]) continue;
    openBetween(maze, from, to);
    visited[cellId(maze, to)] = 1;
    for (const next of neighborsOf(maze, to)) frontier.push([to, next]);
  }
}

function carveSidewinder(maze: CellMaze, rng: RandomStream): void {
  for (let x = 0; x < maze.cells - 1; x++) maze.eastOpen[x] = 1;
  for (let y = 1; y < maze.cells; y++) carveSidewinderRow(maze, y, rng);
}

function carveSidewinderRow(maze: CellMaze, y: number, rng: RandomStream): void {
  let runStart = 0;
  for (let x = 0; x < maze.cells; x++) {
    if (x < maze.cells - 1 && rng() < 0.5) {
      maze.eastOpen[y * maze.cells + x] = 1;
      continue;
    }
    const doorX = runStart + Math.floor(rng() * (x - runStart + 1));
    maze.southOpen[(y - 1) * maze.cells + doorX] = 1;
    runStart = x + 1;
  }
}
