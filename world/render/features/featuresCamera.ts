import type { PanOffset } from '../camera/panOffset';
import type { CanvasSize } from '../canvasSurface';

export interface FeaturesCamera {
  centerX: number;
  centerY: number;
  pixelsPerTile: number;
  widthPx: number;
  heightPx: number;
}

export interface WorldAnchor {
  x: number;
  y: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export function featuresCameraOf(
  anchor: WorldAnchor,
  pan: PanOffset,
  pixelsPerTile: number,
  size: CanvasSize,
): FeaturesCamera {
  return {
    centerX: anchor.x + pan.tilesX(),
    centerY: anchor.y + pan.tilesY(),
    pixelsPerTile,
    widthPx: size.cssWidth,
    heightPx: size.cssHeight,
  };
}

export function screenOfWorld(camera: FeaturesCamera, worldX: number, worldY: number): ScreenPoint {
  return {
    x: camera.widthPx / 2 + (worldX - camera.centerX) * camera.pixelsPerTile,
    y: camera.heightPx / 2 + (worldY - camera.centerY) * camera.pixelsPerTile,
  };
}

export function worldOfScreen(camera: FeaturesCamera, screenX: number, screenY: number): WorldAnchor {
  return {
    x: camera.centerX + (screenX - camera.widthPx / 2) / camera.pixelsPerTile,
    y: camera.centerY + (screenY - camera.heightPx / 2) / camera.pixelsPerTile,
  };
}
