import {
  blankFacePixels,
  DEFAULT_FACE_ART_SIZE,
  faceGridSize,
  type FacePixels,
} from './tileFaceArt';

export type SpriteArt = FacePixels;

export function blankSpriteArt(size: number = DEFAULT_FACE_ART_SIZE): SpriteArt {
  return blankFacePixels(size);
}

export function spriteGridSize(sprite: SpriteArt): number {
  return faceGridSize(sprite);
}

export function isSpriteArt(value: unknown): value is SpriteArt {
  if (!Array.isArray(value)) return false;
  const size = faceGridSize(value as SpriteArt);
  if (size < 2 || size > 64 || size * size !== value.length) return false;
  return value.every((pixel) => pixel === null || typeof pixel === 'string');
}

export function isEntirelyTransparent(sprite: SpriteArt): boolean {
  return sprite.every((pixel) => pixel === null);
}
