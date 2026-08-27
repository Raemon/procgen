import type { Cell } from '../../values/cell';
export type { Cell };
export interface CellMaze {
  cells: number;
  eastOpen: Uint8Array;
  southOpen: Uint8Array;
  blocked: Uint8Array;
}

export function newCellMaze(cells: number, blocked?: Uint8Array): CellMaze {
  return {
    cells,
    eastOpen: new Uint8Array(cells * cells),
    southOpen: new Uint8Array(cells * cells),
    blocked: blocked ?? new Uint8Array(cells * cells),
  };
}

export function isBlocked(maze: CellMaze, cell: Cell): boolean {
  return maze.blocked[cellId(maze, cell)] === 1;
}

export function cellId(maze: CellMaze, cell: Cell): number {
  return cell.y * maze.cells + cell.x;
}

export function openBetween(maze: CellMaze, a: Cell, b: Cell): void {
  if (b.x > a.x) maze.eastOpen[cellId(maze, a)] = 1;
  else if (b.x < a.x) maze.eastOpen[cellId(maze, b)] = 1;
  else if (b.y > a.y) maze.southOpen[cellId(maze, a)] = 1;
  else maze.southOpen[cellId(maze, b)] = 1;
}

export function isOpenBetween(maze: CellMaze, a: Cell, b: Cell): boolean {
  if (b.x > a.x) return maze.eastOpen[cellId(maze, a)] === 1;
  if (b.x < a.x) return maze.eastOpen[cellId(maze, b)] === 1;
  if (b.y > a.y) return maze.southOpen[cellId(maze, a)] === 1;
  return maze.southOpen[cellId(maze, b)] === 1;
}

export function neighborsOf(maze: CellMaze, cell: Cell): Cell[] {
  if (isBlocked(maze, cell)) return [];
  const found: Cell[] = [];
  if (cell.x > 0) found.push({ x: cell.x - 1, y: cell.y });
  if (cell.x < maze.cells - 1) found.push({ x: cell.x + 1, y: cell.y });
  if (cell.y > 0) found.push({ x: cell.x, y: cell.y - 1 });
  if (cell.y < maze.cells - 1) found.push({ x: cell.x, y: cell.y + 1 });
  return found.filter((neighbor) => !isBlocked(maze, neighbor));
}

export function passageCount(maze: CellMaze, cell: Cell): number {
  return neighborsOf(maze, cell).filter((neighbor) => isOpenBetween(maze, cell, neighbor)).length;
}
