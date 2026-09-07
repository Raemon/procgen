import type { Rgb } from '../materialSynth';

export interface BlockTone {
  rgb: Rgb;
  relief: number;
}

export interface ToneBand {
  until: number;
  tone: BlockTone;
}

export function insetFromTileEdge(x: number, y: number): number {
  return Math.min(x, 1 - x, y, 1 - y);
}

export function distanceToTileMidlines(x: number, y: number): number {
  return Math.min(Math.abs(x - 0.5), Math.abs(y - 0.5));
}

export function toneWithin(inset: number, bands: readonly ToneBand[], middle: BlockTone): BlockTone {
  for (const band of bands) if (inset < band.until) return band.tone;
  return middle;
}

export function litHalf(x: number, y: number, lit: BlockTone, shaded: BlockTone): BlockTone {
  return x + y < 1 ? lit : shaded;
}
