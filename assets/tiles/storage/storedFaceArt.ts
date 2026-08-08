import { legacyFaceArtUpgraded } from '../legacyFaceArt';
import { isCubeFaceArt, type CubeFaceArt } from '../tileFaceArt';
import { compactFaceArtOf } from './compactFaceArtEncode';
import { faceArtFromCompact } from './compactFaceArtDecode';
import { isCompactFaceArt, type CompactFaceArt } from './compactFaceArtShape';

export function faceArtFromStoredShape(value: unknown): CubeFaceArt | null {
  if (isCompactFaceArt(value)) return faceArtFromCompact(value);
  if (isCubeFaceArt(value)) return value;
  return legacyFaceArtUpgraded(value);
}

export function defWithCompactFaceArt<T extends { faceArt?: CubeFaceArt | null }>(
  def: T,
): StoredArtOf<T> {
  return { ...def, faceArt: def.faceArt ? compactFaceArtOf(def.faceArt) : def.faceArt };
}

export type StoredArtOf<T> = Omit<T, 'faceArt'> & { faceArt?: CompactFaceArt | null };
