export interface CellPoint {
  x: number;
  y: number;
}

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function cellFromKey(key: string): CellPoint {
  const [x, y] = key.split(',').map(Number);
  return { x: x ?? 0, y: y ?? 0 };
}
