import { spriteGridSize, type SpriteArt } from '../../tiles/spriteArt';
import { bytesPerIndex, isPalette, paletteIndexes } from '../../tiles/storage/faceArtPalette';
import { base64OfFaceGrid, faceGridOfBase64 } from '../../tiles/storage/faceGridIndexes';
import {
  blankCharacterClips,
  CHARACTER_ANIMATIONS,
  CHARACTER_ROTATIONS,
  framesOf,
  hasAnyFrame,
  MAX_ANIMATION_FRAMES,
  type CharacterAnimation,
  type CharacterBillboard,
  type CharacterRotation,
} from '../characterBillboard';
import { clampFps } from '../sanitizeCharacterBillboard';

export const COMPACT_BILLBOARD_FORMAT = 1;

export type CompactClips = Record<string, Record<string, string[]>>;

export interface CompactCharacterBillboard {
  compact: number;
  size: number;
  palette: string[];
  idleFps: number;
  movingFps: number;
  clips: CompactClips;
}

export function isCompactCharacterBillboard(value: unknown): value is CompactCharacterBillboard {
  if (typeof value !== 'object' || value === null) return false;
  return (value as Partial<CompactCharacterBillboard>).compact === COMPACT_BILLBOARD_FORMAT;
}

export function compactBillboardOf(billboard: CharacterBillboard): CompactCharacterBillboard | null {
  const size = oneGridSizeOf(billboard);
  if (size === null) return null;
  const palette = paletteOfBillboard(billboard);
  const indexes = paletteIndexes(palette);
  const width = bytesPerIndex(palette);
  const clips: CompactClips = {};
  for (const rotation of CHARACTER_ROTATIONS) {
    clips[rotation] = {};
    for (const animation of CHARACTER_ANIMATIONS) {
      clips[rotation]![animation] = framesOf(billboard, rotation, animation).map((frame) =>
        base64OfFaceGrid(frame, indexes, width),
      );
    }
  }
  return {
    compact: COMPACT_BILLBOARD_FORMAT,
    size,
    palette,
    idleFps: billboard.idleFps,
    movingFps: billboard.movingFps,
    clips,
  };
}

export function billboardFromCompact(value: unknown): CharacterBillboard | null {
  if (!isCompactCharacterBillboard(value)) return null;
  if (!Number.isInteger(value.size) || value.size < 2 || !isPalette(value.palette)) return null;
  const billboard = blankCharacterClips();
  for (const rotation of CHARACTER_ROTATIONS) {
    for (const animation of CHARACTER_ANIMATIONS) {
      const frames = decodedFrames(value, rotation, animation);
      if (frames === null) return null;
      billboard[rotation][animation] = frames;
    }
  }
  const decoded: CharacterBillboard = {
    idleFps: clampFps(value.idleFps, 0),
    movingFps: clampFps(value.movingFps, 0),
    clips: billboard,
  };
  return hasAnyFrame(decoded) ? decoded : null;
}

function decodedFrames(
  value: CompactCharacterBillboard,
  rotation: CharacterRotation,
  animation: CharacterAnimation,
): SpriteArt[] | null {
  const packed = value.clips?.[rotation]?.[animation];
  if (packed === undefined) return [];
  if (!Array.isArray(packed)) return null;
  const frames: SpriteArt[] = [];
  for (const grid of packed.slice(0, MAX_ANIMATION_FRAMES)) {
    const pixels = faceGridOfBase64(grid, value.palette, value.size);
    if (pixels === null) return null;
    frames.push(pixels);
  }
  return frames;
}

function paletteOfBillboard(billboard: CharacterBillboard): string[] {
  const colors = new Set<string>();
  for (const frame of everyFrameOf(billboard)) {
    for (const pixel of frame) if (pixel !== null) colors.add(pixel);
  }
  return [...colors].sort();
}

function oneGridSizeOf(billboard: CharacterBillboard): number | null {
  const sizes = new Set(everyFrameOf(billboard).map(spriteGridSize));
  if (sizes.size !== 1) return null;
  return [...sizes][0]!;
}

function everyFrameOf(billboard: CharacterBillboard): SpriteArt[] {
  return CHARACTER_ROTATIONS.flatMap((rotation) =>
    CHARACTER_ANIMATIONS.flatMap((animation) => framesOf(billboard, rotation, animation)),
  );
}
