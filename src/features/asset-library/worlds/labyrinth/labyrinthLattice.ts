import { CHUNK_SIZE } from '../chunk';

export const LABYRINTH_CELLS_PER_CHUNK = 4;
export const LABYRINTH_CELL_SIZE = CHUNK_SIZE / LABYRINTH_CELLS_PER_CHUNK;

export function labyrinthCellOrigin(cellCoord: number): number {
  return cellCoord * LABYRINTH_CELL_SIZE;
}

export function labyrinthCellCoordOf(worldCoord: number): number {
  return Math.floor(worldCoord / LABYRINTH_CELL_SIZE);
}

export function labyrinthCellKey(cellX: number, cellY: number): string {
  return `${cellX},${cellY}`;
}
