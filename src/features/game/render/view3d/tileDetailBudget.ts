import { MAX_FACE_ART_SIZE } from '@/features/asset-library/tiles/tileFaceArt';

const SMALLEST_BUDGET = 1;
const DEGREES_TO_RADIANS = Math.PI / 180;

export function tileSideBudget(
  verticalFovDegrees: number,
  viewportHeightPixels: number,
  distanceTiles: number,
): number {
  return powerOfTwoWithin(
    pixelsPerTile(verticalFovDegrees, viewportHeightPixels, distanceTiles),
  );
}

export function drawsNormalMapAt(mipLevel: number): boolean {
  return mipLevel === 0;
}

function pixelsPerTile(
  verticalFovDegrees: number,
  viewportHeightPixels: number,
  distanceTiles: number,
): number {
  const tilesTallOnScreen =
    2 * Math.max(distanceTiles, 0) * Math.tan((verticalFovDegrees * DEGREES_TO_RADIANS) / 2);
  return tilesTallOnScreen > 0 ? viewportHeightPixels / tilesTallOnScreen : MAX_FACE_ART_SIZE;
}

function powerOfTwoWithin(pixels: number): number {
  if (!Number.isFinite(pixels) || pixels >= MAX_FACE_ART_SIZE) return MAX_FACE_ART_SIZE;
  if (pixels <= SMALLEST_BUDGET) return SMALLEST_BUDGET;
  return 2 ** Math.floor(Math.log2(pixels));
}
