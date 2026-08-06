import { independentStreamPerLabel } from '../random/independentStreamPerLabel';
import type { Grid } from './grid';

export interface Point {
  x: number;
  y: number;
}

export function spawnPointForSeed(
  grid: Grid,
  seed: number,
  isWalkable: (tileId: number) => boolean,
): Point {
  const candidates = walkableCellIndexes(grid, isWalkable);
  if (candidates.length === 0) return gridCenter(grid);
  const random = independentStreamPerLabel(seed, 'spawn');
  return cellIndexToPoint(grid, candidates[Math.floor(random() * candidates.length)]!);
}

function walkableCellIndexes(grid: Grid, isWalkable: (tileId: number) => boolean): number[] {
  const indexes: number[] = [];
  grid.forEach((x, y, tileId) => {
    if (isWalkable(tileId)) indexes.push(grid.indexOf(x, y));
  });
  return indexes;
}

function cellIndexToPoint(grid: Grid, index: number): Point {
  return { x: index % grid.width, y: Math.floor(index / grid.width) };
}

function gridCenter(grid: Grid): Point {
  return { x: Math.floor(grid.width / 2), y: Math.floor(grid.height / 2) };
}
