import { voxelAt, voxelIndex, type Piece } from '../../pieceDef';

export function floodFilledIndices(
  piece: Piece,
  layer: number,
  startX: number,
  startY: number,
): number[] {
  const target = voxelAt(piece, startX, startY, layer);
  const seen = new Set<number>();
  const queue = [[startX, startY] as const];
  const filled: number[] = [];
  while (queue.length > 0) {
    const [x, y] = queue.pop()!;
    const index = voxelIndex(piece, x, y, layer);
    if (!isFillable(piece, x, y, layer, target, seen, index)) continue;
    seen.add(index);
    filled.push(index);
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return filled;
}

function isFillable(
  piece: Piece,
  x: number,
  y: number,
  layer: number,
  target: number,
  seen: Set<number>,
  index: number,
): boolean {
  if (x < 0 || y < 0 || x >= piece.width || y >= piece.depth) return false;
  if (seen.has(index)) return false;
  return voxelAt(piece, x, y, layer) === target;
}
