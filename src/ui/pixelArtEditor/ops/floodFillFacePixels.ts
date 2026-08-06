import type { FacePixels } from '../../../world/tiles/tileFaceArt';

export function floodFillFacePixels(
  pixels: FacePixels,
  size: number,
  startIndex: number,
  color: string | null,
): FacePixels {
  const filled = [...pixels];
  const matchColor = filled[startIndex] ?? null;
  if (matchColor === color) return filled;
  fillConnectedRegion(filled, size, startIndex, matchColor, color);
  return filled;
}

function fillConnectedRegion(
  pixels: FacePixels,
  size: number,
  startIndex: number,
  matchColor: string | null,
  color: string | null,
): void {
  const frontier = [startIndex];
  while (frontier.length > 0) {
    const index = frontier.pop()!;
    if ((pixels[index] ?? null) !== matchColor) continue;
    pixels[index] = color;
    frontier.push(...adjacentIndices(index, size));
  }
}

function adjacentIndices(index: number, size: number): number[] {
  const row = Math.floor(index / size);
  const col = index % size;
  const neighbors: number[] = [];
  if (row > 0) neighbors.push(index - size);
  if (row < size - 1) neighbors.push(index + size);
  if (col > 0) neighbors.push(index - 1);
  if (col < size - 1) neighbors.push(index + 1);
  return neighbors;
}
