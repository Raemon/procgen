import { CUBE_FACES, type CubeFaceArt, type FacePixels } from '../../../world/tiles/tileFaceArt';

export function resizeCubeFaceArt(art: CubeFaceArt, size: number): CubeFaceArt {
  const resized = { size } as CubeFaceArt;
  for (const face of CUBE_FACES) resized[face] = resampleFacePixels(art[face], art.size, size);
  return resized;
}

export function resampleFacePixels(
  pixels: FacePixels,
  fromSize: number,
  toSize: number,
): FacePixels {
  if (fromSize === toSize) return [...pixels];
  const resampled: FacePixels = [];
  for (let row = 0; row < toSize; row++)
    for (let col = 0; col < toSize; col++)
      resampled.push(pixels[nearestSourceIndex(row, col, fromSize, toSize)] ?? null);
  return resampled;
}

function nearestSourceIndex(row: number, col: number, fromSize: number, toSize: number): number {
  const sourceRow = Math.floor((row * fromSize) / toSize);
  const sourceCol = Math.floor((col * fromSize) / toSize);
  return sourceRow * fromSize + sourceCol;
}
