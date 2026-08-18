import type { WorldRect } from '@/features/asset-library/worlds/values/pointsInRect';
import type { FeaturesCamera } from './featuresCamera';

export const FEATURE_SURVEY_SPAN_TILES = 256;
const SMALLEST_USEFUL_PIXELS_PER_TILE = 1e-4;
const LARGEST_USEFUL_PIXELS_PER_TILE = 1e6;

export function surveyRectOf(camera: FeaturesCamera): WorldRect {
  const halfWidth = visibleTiles(camera.widthPx, camera.pixelsPerTile) / 2;
  const halfHeight = visibleTiles(camera.heightPx, camera.pixelsPerTile) / 2;
  return {
    minX: Math.floor(camera.centerX - halfWidth),
    minY: Math.floor(camera.centerY - halfHeight),
    maxX: Math.ceil(camera.centerX + halfWidth),
    maxY: Math.ceil(camera.centerY + halfHeight),
  };
}

function visibleTiles(spanPx: number, pixelsPerTile: number): number {
  return Math.min(FEATURE_SURVEY_SPAN_TILES, spanPx / pixelsPerTile);
}

export function clampedPixelsPerTile(raw: number): number {
  return Math.max(
    SMALLEST_USEFUL_PIXELS_PER_TILE,
    Math.min(LARGEST_USEFUL_PIXELS_PER_TILE, raw),
  );
}
