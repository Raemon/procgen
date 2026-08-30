import { isSpriteArt, spriteGridSize, type SpriteArt } from '../spriteArt';
import { MAX_FACE_ART_SIZE, MIN_FACE_ART_SIZE } from '../tileFaceArt';
import { bytesPerIndex, isPalette, paletteIndexes, paletteOfPixelGrids } from './faceArtPalette';
import { base64OfFaceGrid, faceGridOfBase64 } from './faceGridIndexes';

export const COMPACT_SPRITE_ART_FORMAT = 1;

export interface CompactSpriteArt {
  compact: number;
  size: number;
  palette: string[];
  pixels: string;
}

export function isCompactSpriteArt(value: unknown): value is CompactSpriteArt {
  if (typeof value !== 'object' || value === null) return false;
  const art = value as Partial<CompactSpriteArt>;
  return art.compact === COMPACT_SPRITE_ART_FORMAT && typeof art.pixels === 'string';
}

export function compactSpriteArtOf(sprite: SpriteArt): CompactSpriteArt {
  const palette = paletteOfPixelGrids([sprite]);
  return {
    compact: COMPACT_SPRITE_ART_FORMAT,
    size: spriteGridSize(sprite),
    palette,
    pixels: base64OfFaceGrid(sprite, paletteIndexes(palette), bytesPerIndex(palette)),
  };
}

export function spriteArtFromStoredShape(value: unknown): SpriteArt | null {
  if (isCompactSpriteArt(value)) return spriteArtFromCompact(value);
  return isSpriteArt(value) ? value : null;
}

function spriteArtFromCompact(value: CompactSpriteArt): SpriteArt | null {
  if (!isStorableSize(value.size) || !isPalette(value.palette)) return null;
  return faceGridOfBase64(value.pixels, value.palette, value.size);
}

function isStorableSize(size: unknown): size is number {
  return (
    typeof size === 'number' &&
    Number.isInteger(size) &&
    size >= MIN_FACE_ART_SIZE &&
    size <= MAX_FACE_ART_SIZE
  );
}

export function defWithCompactSprite<T extends { sprite?: SpriteArt | null }>(
  def: T,
): StoredSpriteOf<T> {
  return { ...def, sprite: def.sprite ? compactSpriteArtOf(def.sprite) : def.sprite };
}

export type StoredSpriteOf<T> = Omit<T, 'sprite'> & { sprite?: CompactSpriteArt | null };
