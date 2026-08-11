import type { PixelPainter } from '../pixelCanvas';
import type { BillboardPalette } from './billboardPalette';
import { rampInk } from './billboardShading';
import { foliageLightAt } from './foliageInk';

const TIER_SHADOW = 0.14;
const NEEDLE_AMBIENT = 0.08;
const TIER_SHADOW_WITHIN = 0.34;

export function needleInk(
  palette: BillboardPalette,
  size: number,
  seed: number,
  tiers: number,
): PixelPainter {
  return (x, y) => rampInk(palette, foliageLightAt(x, y, size, seed) + NEEDLE_AMBIENT - tierShadowAt(y, size, tiers));
}

function tierShadowAt(y: number, size: number, tiers: number): number {
  const withinTier = ((y / size) * tiers) % 1;
  if (withinTier > TIER_SHADOW_WITHIN) return 0;
  return TIER_SHADOW * (1 - withinTier / TIER_SHADOW_WITHIN);
}
