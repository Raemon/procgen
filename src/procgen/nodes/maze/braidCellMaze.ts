import type { RandomStream } from '../../../random/mulberry32';
import {
  isOpenBetween,
  neighborsOf,
  openBetween,
  passageCount,
  type Cell,
  type CellMaze,
} from './cellMaze';

export function braidCellMaze(maze: CellMaze, braid: number, rng: RandomStream): void {
  if (braid <= 0) return;
  for (let y = 0; y < maze.cells; y++) {
    for (let x = 0; x < maze.cells; x++) braidDeadEnd(maze, { x, y }, braid, rng);
  }
}

function braidDeadEnd(maze: CellMaze, cell: Cell, braid: number, rng: RandomStream): void {
  if (passageCount(maze, cell) !== 1) return;
  if (rng() >= braid) return;
  const walled = neighborsOf(maze, cell).filter((neighbor) => !isOpenBetween(maze, cell, neighbor));
  if (walled.length === 0) return;
  openBetween(maze, cell, walled[Math.floor(rng() * walled.length)]!);
}
