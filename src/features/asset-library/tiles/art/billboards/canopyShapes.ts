import { discPainter } from '../painters/shapePainters';
import { stackedPainters, type PixelPainter } from '../pixelCanvas';
import { gridLength, MASK_INK } from './billboardGrid';
import { edgedThroughMask } from './billboardEdges';
import { leafEdges, type BillboardPalette } from './billboardPalette';
import { foliageInk, withCanopyGaps } from './foliageInk';
import { leanedPoint } from './windLean';

export interface CanopyLobe {
  across: number;
  down: number;
  radius: number;
}

export function canopyPainter(
  size: number,
  palette: BillboardPalette,
  seed: number,
  lobes: readonly CanopyLobe[],
): PixelPainter {
  return edgedThroughMask(
    withCanopyGaps(canopyMask(size, seed, lobes), size, seed),
    foliageInk(palette, size, seed),
    leafEdges(palette),
    size,
  );
}

function canopyMask(size: number, seed: number, lobes: readonly CanopyLobe[]): PixelPainter {
  return stackedPainters(...lobes.map((lobe) => lobeMask(size, seed, lobe)));
}

function lobeMask(size: number, seed: number, lobe: CanopyLobe): PixelPainter {
  return discPainter(
    leanedPoint(size, lobe.across, lobe.down, seed),
    gridLength(size, lobe.radius),
    MASK_INK,
  );
}
