import { pixelNoise } from '../artNoise';
import type { PixelPoint } from '../painters/shapePainters';
import { gridLength, gridPoint } from './billboardGrid';

const LEAN_REACH = 0.1;

export function leanedPoint(size: number, across: number, down: number, seed: number): PixelPoint {
  const point = gridPoint(size, across, down);
  return { x: point.x + leanAcrossAt(size, down, seed), y: point.y };
}

export function leanAcrossAt(size: number, down: number, seed: number): number {
  const rise = Math.max(0, 1 - down);
  return gridLength(size, LEAN_REACH) * leanDirection(seed) * rise * rise;
}

function leanDirection(seed: number): number {
  return pixelNoise(seed, 7, seed) * 2 - 1;
}
