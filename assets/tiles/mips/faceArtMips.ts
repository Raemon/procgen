import { faceGridSize, type FacePixels } from '../tileFaceArt';
import { halvedSide, halveFacePixels } from './halveFacePixels';

export interface FaceMip {
  side: number;
  inks: FacePixels;
}

const NOTHING_UNPAINTED = 'transparent';

const mipsByPixels = new WeakMap<FacePixels, Map<string, FaceMip[]>>();

export function faceArtMips(pixels: FacePixels, unpainted: string | null): FaceMip[] {
  const byUnpainted = mipsByPixels.get(pixels) ?? new Map<string, FaceMip[]>();
  mipsByPixels.set(pixels, byUnpainted);
  const key = unpainted ?? NOTHING_UNPAINTED;
  const cached = byUnpainted.get(key);
  if (cached) return cached;
  const mips = builtMips(pixels, unpainted);
  byUnpainted.set(key, mips);
  return mips;
}

export function mipWithin(mips: readonly FaceMip[], sideBudget: number): FaceMip {
  return mips.find((mip) => mip.side <= sideBudget) ?? mips[mips.length - 1]!;
}

export function mipLevelWithin(mips: readonly FaceMip[], sideBudget: number): number {
  const level = mips.findIndex((mip) => mip.side <= sideBudget);
  return level < 0 ? mips.length - 1 : level;
}

function builtMips(pixels: FacePixels, unpainted: string | null): FaceMip[] {
  const mips: FaceMip[] = [{ side: faceGridSize(pixels), inks: overUnpainted(pixels, unpainted) }];
  while (mips[mips.length - 1]!.side > 1) {
    const finer = mips[mips.length - 1]!;
    mips.push({ side: halvedSide(finer.side), inks: halveFacePixels(finer.inks, finer.side) });
  }
  return mips;
}

function overUnpainted(pixels: FacePixels, unpainted: string | null): FacePixels {
  return pixels.map((pixel) => pixel ?? unpainted);
}
