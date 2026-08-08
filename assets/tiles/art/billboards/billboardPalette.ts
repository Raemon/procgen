import { darken, lighten, mixHex } from '../colorMath';

export interface EdgeInks {
  rim: string;
  edge: string;
}

export interface BillboardPalette {
  lit: string;
  base: string;
  shade: string;
  deep: string;
  rim: string;
  edge: string;
  moss: string;
  stemLit: string;
  stem: string;
  stemShade: string;
  stemRim: string;
  stemEdge: string;
  petal: string;
  petalGlow: string;
  petalHeart: string;
}

const BARK_INK = '#4a3524';
const SUNLIGHT_INK = '#f6e2ae';
const MOONLIGHT_INK = '#cfe0ff';
const NIGHT_INK = '#151a26';
const MOSS_INK = '#9cb679';
const PETAL_INKS = ['#f0dc95', '#efb4cb', '#d6c4f2', '#f2ece0'] as const;
const PETAL_HEART_INK = '#8a6a2c';

export function billboardPalette(color: string, petalChoice: number): BillboardPalette {
  const stem = mixHex(color, BARK_INK, 0.74);
  const petal = petalInkAt(petalChoice);
  return {
    ...leafRamp(color),
    ...leafEdgeInks(color),
    moss: mixHex(lighten(color, 0.12), MOSS_INK, 0.72),
    ...stemInks(stem),
    petal,
    petalGlow: mixHex(lighten(petal, 0.24), MOONLIGHT_INK, 0.26),
    petalHeart: PETAL_HEART_INK,
  };
}

export function leafEdges(palette: BillboardPalette): EdgeInks {
  return { rim: palette.rim, edge: palette.edge };
}

export function barkEdges(palette: BillboardPalette): EdgeInks {
  return { rim: palette.stemRim, edge: palette.stemEdge };
}

function leafRamp(color: string): Pick<BillboardPalette, 'lit' | 'base' | 'shade' | 'deep'> {
  return {
    lit: mixHex(lighten(color, 0.24), SUNLIGHT_INK, 0.34),
    base: color,
    shade: mixHex(darken(color, 0.34), MOONLIGHT_INK, 0.12),
    deep: mixHex(darken(color, 0.56), NIGHT_INK, 0.34),
  };
}

function leafEdgeInks(color: string): Pick<BillboardPalette, 'rim' | 'edge'> {
  return {
    rim: mixHex(lighten(color, 0.3), MOONLIGHT_INK, 0.4),
    edge: mixHex(darken(color, 0.62), NIGHT_INK, 0.5),
  };
}

function stemInks(
  stem: string,
): Pick<BillboardPalette, 'stemLit' | 'stem' | 'stemShade' | 'stemRim' | 'stemEdge'> {
  return {
    stemLit: mixHex(lighten(stem, 0.22), SUNLIGHT_INK, 0.24),
    stem,
    stemShade: darken(stem, 0.34),
    stemRim: mixHex(lighten(stem, 0.3), MOONLIGHT_INK, 0.44),
    stemEdge: mixHex(darken(stem, 0.6), NIGHT_INK, 0.5),
  };
}

function petalInkAt(choice: number): string {
  return PETAL_INKS[Math.abs(Math.trunc(choice)) % PETAL_INKS.length]!;
}
