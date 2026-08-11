import type { WorldRect } from '@/features/asset-library/worlds/values/pointsInRect';
import type { FeaturesCamera } from './featuresCamera';

export const FEATURE_SURVEY_SPAN_TILES = 256;
export const MAX_PIXELS_PER_TILE = 64;

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

export function minPixelsPerTile(widthPx: number, heightPx: number): number {
  return Math.max(widthPx, heightPx) / FEATURE_SURVEY_SPAN_TILES;
}

export function clampedPixelsPerTile(raw: number, widthPx: number, heightPx: number): number {
  return Math.max(minPixelsPerTile(widthPx, heightPx), Math.min(MAX_PIXELS_PER_TILE, raw));
}
