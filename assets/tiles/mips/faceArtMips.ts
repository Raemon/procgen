import { faceGridSize, type FacePixels } from '../tileFaceArt';
import { halvedSide, halveFacePixels } from './halveFacePixels';

export interface FaceMip {
  side: number;
  inks: string[];
}

const mipsByPixels = new WeakMap<FacePixels, Map<string, FaceMip[]>>();

export function faceArtMips(pixels: FacePixels, baseColor: string): FaceMip[] {
  const byBaseColor = mipsByPixels.get(pixels) ?? new Map<string, FaceMip[]>();
  mipsByPixels.set(pixels, byBaseColor);
  const cached = byBaseColor.get(baseColor);
  if (cached) return cached;
  const mips = builtMips(pixels, baseColor);
  byBaseColor.set(baseColor, mips);
  return mips;
}

export function mipWithin(mips: readonly FaceMip[], sideBudget: number): FaceMip {
  return mips.find((mip) => mip.side <= sideBudget) ?? mips[mips.length - 1]!;
}

export function mipLevelWithin(mips: readonly FaceMip[], sideBudget: number): number {
  const level = mips.findIndex((mip) => mip.side <= sideBudget);
  return level < 0 ? mips.length - 1 : level;
}

function builtMips(pixels: FacePixels, baseColor: string): FaceMip[] {
  const mips: FaceMip[] = [{ side: faceGridSize(pixels), inks: overBaseColor(pixels, baseColor) }];
  while (mips[mips.length - 1]!.side > 1) {
    const finer = mips[mips.length - 1]!;
    mips.push({ side: halvedSide(finer.side), inks: halveFacePixels(finer.inks, finer.side) });
  }
  return mips;
}

function overBaseColor(pixels: FacePixels, baseColor: string): string[] {
  return pixels.map((pixel) => pixel ?? baseColor);
}
