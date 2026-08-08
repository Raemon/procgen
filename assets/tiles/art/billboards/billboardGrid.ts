import type { PixelPoint } from '../painters/shapePainters';

export const MASK_INK = '#ffffff';

export function gridPoint(size: number, across: number, down: number): PixelPoint {
  return { x: size * across, y: size * down };
}

export function gridLength(size: number, fraction: number): number {
  return size * fraction;
}
