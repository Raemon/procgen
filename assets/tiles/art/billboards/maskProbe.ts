import type { PixelPainter } from '../pixelCanvas';

export function maskHolds(mask: PixelPainter, x: number, y: number): boolean {
  return mask(x, y) !== null;
}

export function maskOpensToward(
  mask: PixelPainter,
  x: number,
  y: number,
  acrossStep: number,
  downStep: number,
): boolean {
  return !maskHolds(mask, x + acrossStep, y) || !maskHolds(mask, x, y + downStep);
}

export function maskWellInside(mask: PixelPainter, x: number, y: number, inset: number): boolean {
  return (
    maskHolds(mask, x - inset, y) &&
    maskHolds(mask, x + inset, y) &&
    maskHolds(mask, x, y - inset) &&
    maskHolds(mask, x, y + inset)
  );
}
