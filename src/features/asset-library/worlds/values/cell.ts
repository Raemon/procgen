export interface Cell {
  x: number;
  y: number;
}

export function cellsMatch(one: Cell, other: Cell): boolean {
  return one.x === other.x && one.y === other.y;
}
