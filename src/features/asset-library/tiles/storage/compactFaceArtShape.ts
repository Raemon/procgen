import type { CubeFace } from '../tileFaceArt';

export const COMPACT_FACE_ART_FORMAT = 1;

export type CompactFaceGrids = Partial<Record<CubeFace, string>>;

export interface CompactFaceArtFrame {
  color: CompactFaceGrids;
  height?: CompactFaceGrids | null;
}

export interface CompactFaceArt {
  compact: number;
  size: number;
  palette: string[];
  color: CompactFaceGrids;
  height?: CompactFaceGrids | null;
  framesAfterFirst?: CompactFaceArtFrame[];
  frameMs?: number;
}

export function isCompactFaceArt(value: unknown): value is CompactFaceArt {
  if (typeof value !== 'object' || value === null) return false;
  const art = value as Partial<CompactFaceArt>;
  return art.compact === COMPACT_FACE_ART_FORMAT && typeof art.color === 'object' && art.color !== null;
}
