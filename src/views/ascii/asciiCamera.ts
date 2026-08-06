import { PanOffset } from '../camera/panOffset';
import { ZoomScale } from '../camera/zoomScale';
import type { CanvasSize } from '../canvasSurface';
import { cellPixelsFor, MAX_ZOOM_SCALE, MIN_ZOOM_SCALE } from './asciiCellPixels';

export class AsciiCamera {
  private readonly zoom = new ZoomScale(1, MIN_ZOOM_SCALE, MAX_ZOOM_SCALE);
  private readonly pan = new PanOffset();

  cellPixels(size: CanvasSize): number {
    return cellPixelsFor(this.zoom.current(), size);
  }

  centerX(playerX: number): number {
    return playerX + 0.5 + this.pan.tilesX();
  }

  centerY(playerY: number): number {
    return playerY + 0.5 + this.pan.tilesY();
  }

  dragByPixels(dxPixels: number, dyPixels: number, size: CanvasSize): void {
    const cellPx = this.cellPixels(size);
    this.pan.shiftBy(-dxPixels / cellPx, -dyPixels / cellPx);
  }

  recenter(): boolean {
    return this.pan.recenter();
  }

  zoomAtCursor(wheelPixelsY: number, cursor: CursorPixels, size: CanvasSize): boolean {
    const cellPxBefore = this.cellPixels(size);
    if (!this.zoom.applyWheelPixels(wheelPixelsY)) return false;
    const cellPxAfter = this.cellPixels(size);
    if (cellPxAfter === cellPxBefore) return false;
    this.holdWorldPointUnderCursor(cursor, size, cellPxBefore, cellPxAfter);
    return true;
  }

  private holdWorldPointUnderCursor(
    cursor: CursorPixels,
    size: CanvasSize,
    cellPxBefore: number,
    cellPxAfter: number,
  ): void {
    const fromCenterX = cursor.x - size.cssWidth / 2;
    const fromCenterY = cursor.y - size.cssHeight / 2;
    this.pan.shiftBy(
      fromCenterX / cellPxBefore - fromCenterX / cellPxAfter,
      fromCenterY / cellPxBefore - fromCenterY / cellPxAfter,
    );
  }
}

export interface CursorPixels {
  x: number;
  y: number;
}
