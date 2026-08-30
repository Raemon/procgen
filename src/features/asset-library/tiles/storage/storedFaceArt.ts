import { legacyFaceArtUpgraded } from '../legacyFaceArt';
import { isCubeFaceArt, type CubeFaceArt } from '../tileFaceArt';
import { compactFaceArtOf } from './compactFaceArtEncode';
import { faceArtFromCompact } from './compactFaceArtDecode';
import { isCompactFaceArt, type CompactFaceArt } from './compactFaceArtShape';
import { MAX_PALETTE_COLORS, paletteOfFaceArt } from './faceArtPalette';

export type StoredFaceArt = CompactFaceArt | CubeFaceArt;

export function faceArtFromStoredShape(value: unknown): CubeFaceArt | null {
  if (isCompactFaceArt(value)) return faceArtFromCompact(value);
  if (isCubeFaceArt(value)) return value;
  return legacyFaceArtUpgraded(value);
}

export function storedFaceArtOf(art: CubeFaceArt): StoredFaceArt {
  return paletteOfFaceArt(art).length > MAX_PALETTE_COLORS ? art : compactFaceArtOf(art);
}

export function defWithCompactFaceArt<T extends { faceArt?: CubeFaceArt | null }>(
  def: T,
): StoredArtOf<T> {
  return { ...def, faceArt: def.faceArt ? storedFaceArtOf(def.faceArt) : def.faceArt };
}

export type StoredArtOf<T> = Omit<T, 'faceArt'> & { faceArt?: StoredFaceArt | null };
