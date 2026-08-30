import { isSpriteArt, spriteGridSize, type SpriteArt } from '../spriteArt';
import { isValidFaceArtSize } from '../tileFaceArt';
import { isPaintedRowsSprite, spriteFromPaintedRows } from './paintedRowsArt';
import {
  bytesPerIndex,
  isPalette,
  MAX_PALETTE_COLORS,
  paletteIndexes,
  paletteOfPixelGrids,
} from './faceArtPalette';
import { base64OfFaceGrid, faceGridOfBase64 } from './faceGridIndexes';

export const COMPACT_SPRITE_ART_FORMAT = 1;

export interface CompactSpriteArt {
  compact: number;
  size: number;
  palette: string[];
  pixels: string;
}

export type StoredSpriteArt = CompactSpriteArt | SpriteArt;

export function isCompactSpriteArt(value: unknown): value is CompactSpriteArt {
  if (typeof value !== 'object' || value === null) return false;
  const art = value as Partial<CompactSpriteArt>;
  return art.compact === COMPACT_SPRITE_ART_FORMAT && typeof art.pixels === 'string';
}

export function storedSpriteOf(sprite: SpriteArt): StoredSpriteArt {
  const palette = paletteOfPixelGrids([sprite]);
  if (palette.length > MAX_PALETTE_COLORS) return sprite;
  return {
    compact: COMPACT_SPRITE_ART_FORMAT,
    size: spriteGridSize(sprite),
    palette,
    pixels: base64OfFaceGrid(sprite, paletteIndexes(palette), bytesPerIndex(palette)),
  };
}

export function spriteArtFromStoredShape(value: unknown): SpriteArt | null {
  if (isCompactSpriteArt(value)) return spriteArtFromCompact(value);
  if (isPaintedRowsSprite(value)) return spriteFromPaintedRows(value);
  return isSpriteArt(value) ? value : null;
}

function spriteArtFromCompact(value: CompactSpriteArt): SpriteArt | null {
  if (!isValidFaceArtSize(value.size) || !isPalette(value.palette)) return null;
  return faceGridOfBase64(value.pixels, value.palette, value.size);
}

export function defWithCompactSprite<T extends { sprite?: SpriteArt | null }>(
  def: T,
): StoredSpriteOf<T> {
  return { ...def, sprite: def.sprite ? storedSpriteOf(def.sprite) : def.sprite };
}

export type StoredSpriteOf<T> = Omit<T, 'sprite'> & { sprite?: StoredSpriteArt | null };
