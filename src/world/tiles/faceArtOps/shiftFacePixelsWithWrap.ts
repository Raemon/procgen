import type { FacePixels } from '../tileFaceArt';

export function shiftFacePixelsWithWrap(
  pixels: FacePixels,
  size: number,
  dx: number,
  dy: number,
): FacePixels {
  const shifted: FacePixels = new Array<string | null>(pixels.length);
  for (let row = 0; row < size; row++)
    for (let col = 0; col < size; col++)
      shifted[row * size + col] =
        pixels[wrapped(row - dy, size) * size + wrapped(col - dx, size)] ?? null;
  return shifted;
}

function wrapped(coord: number, size: number): number {
  return ((coord % size) + size) % size;
}
