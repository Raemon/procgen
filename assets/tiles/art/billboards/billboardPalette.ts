import { darken, lighten, mixHex } from '../colorMath';

export interface BillboardPalette {
  lit: string;
  base: string;
  shade: string;
  stem: string;
  stemShade: string;
  petal: string;
  petalHeart: string;
}

const BARK_INK = '#5a4025';
const PETAL_INKS = ['#e8d17a', '#e5a2bd', '#cbb7e8', '#e9e2d2'] as const;
const PETAL_HEART_INK = '#8a6a2c';

export function billboardPalette(color: string, petalChoice: number): BillboardPalette {
  const stem = mixHex(color, BARK_INK, 0.68);
  return {
    lit: lighten(color, 0.26),
    base: color,
    shade: darken(color, 0.32),
    stem,
    stemShade: darken(stem, 0.3),
    petal: petalInkAt(petalChoice),
    petalHeart: PETAL_HEART_INK,
  };
}

function petalInkAt(choice: number): string {
  return PETAL_INKS[Math.abs(Math.trunc(choice)) % PETAL_INKS.length]!;
}
