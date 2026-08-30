import { WHEEL_PIXELS_PER_DOUBLING } from './zoomScale';

export class WheelTileZoom {
  private wheelPixels = 0;

  constructor(private readonly clamp: (sizeTiles: number) => number) {}

  sizeAfterWheelPixels(currentSizeTiles: number, wheelPixelsY: number): number | null {
    this.wheelPixels += wheelPixelsY;
    const magnified = currentSizeTiles * Math.pow(2, this.wheelPixels / WHEEL_PIXELS_PER_DOUBLING);
    const next = this.clamp(magnified);
    if (next === currentSizeTiles) {
      this.wheelPixels = withinOneDoubling(this.wheelPixels);
      return null;
    }
    this.wheelPixels = 0;
    return next;
  }
}

function withinOneDoubling(wheelPixels: number): number {
  return Math.max(-WHEEL_PIXELS_PER_DOUBLING, Math.min(WHEEL_PIXELS_PER_DOUBLING, wheelPixels));
}
