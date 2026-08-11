import { stackedPainters, type PixelPainter } from '../pixelCanvas';
import { trunkPainter } from './barkInk';
import type { BillboardPalette } from './billboardPalette';
import { canopyPainter, type CanopyLobe } from './canopyShapes';

const STALK_THICKNESS = 0.08;
const STALK_TOP = 0.7;

const THICKET: readonly CanopyLobe[] = [
  { across: 0.44, down: 0.58, radius: 0.28 },
  { across: 0.71, down: 0.68, radius: 0.21 },
  { across: 0.23, down: 0.72, radius: 0.18 },
  { across: 0.53, down: 0.33, radius: 0.16 },
  { across: 0.31, down: 0.44, radius: 0.12 },
];

export function shrubPainter(
  size: number,
  palette: BillboardPalette,
  seed: number,
): PixelPainter {
  return stackedPainters(
    trunkPainter(size, palette, seed, STALK_THICKNESS, STALK_TOP),
    canopyPainter(size, palette, seed, THICKET),
  );
}
