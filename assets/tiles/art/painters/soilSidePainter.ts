import { pickByValue, pixelNoise } from '../artNoise';
import { darken, lighten, shadedRamp } from '../colorMath';
import type { PixelPainter } from '../pixelCanvas';

export interface SoilSideStyle {
  surface: string;
  soil: string;
  capHeight: number;
  seed: number;
  size: number;
}

export function soilSidePainter(style: SoilSideStyle): PixelPainter {
  const surfaceRamp = shadedRamp(style.surface, 4, 0.1);
  const soilRamp = shadedRamp(style.soil, 5, 0.14);
  return (x, y) => {
    if (y < style.capHeight) return pickByValue(surfaceRamp, pixelNoise(x, y, style.seed));
    if (y === style.capHeight) return darken(style.surface, 0.4);
    return depthShadedSoil(x, y, soilRamp, style);
  };
}

function depthShadedSoil(
  x: number,
  y: number,
  soilRamp: readonly string[],
  style: SoilSideStyle,
): string {
  const grain = pickByValue(soilRamp, pixelNoise(x, y, style.seed ^ 0x1b873593));
  if (isPebble(x, y, style.seed)) return lighten(grain, 0.22);
  return darken(grain, (0.35 * (y - style.capHeight)) / style.size);
}

function isPebble(x: number, y: number, seed: number): boolean {
  return pixelNoise(x, y, seed ^ 0x9e3779b9) < 0.05;
}
