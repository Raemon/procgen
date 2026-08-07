const WHEEL_PIXELS_PER_DOUBLING = 420;

export class ZoomScale {
  constructor(
    private scale: number,
    private readonly minScale: number,
    private readonly maxScale: number,
  ) {}

  current(): number {
    return this.scale;
  }

  reset(scale: number): void {
    this.scale = this.clamped(scale);
  }

  applyWheelPixels(wheelPixelsY: number): boolean {
    const previous = this.scale;
    this.scale = this.clamped(previous * magnificationFactor(-wheelPixelsY));
    return this.scale !== previous;
  }

  private clamped(scale: number): number {
    return Math.max(this.minScale, Math.min(this.maxScale, scale));
  }
}

function magnificationFactor(zoomInPixels: number): number {
  return Math.pow(2, zoomInPixels / WHEEL_PIXELS_PER_DOUBLING);
}
