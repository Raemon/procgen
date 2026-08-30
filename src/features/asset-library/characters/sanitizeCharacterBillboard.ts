import type { SpriteArt } from '../tiles/spriteArt';
import { spriteArtFromStoredShape } from '../tiles/storage/storedSpriteArt';
import {
  blankCharacterBillboard,
  CHARACTER_ANIMATIONS,
  CHARACTER_ROTATIONS,
  DEFAULT_ATTACK_FPS,
  DEFAULT_IDLE_FPS,
  DEFAULT_MOVING_FPS,
  hasAnyFrame,
  MAX_ANIMATION_FRAMES,
  type CharacterBillboard,
} from './characterBillboard';

export function sanitizeCharacterBillboard(raw: unknown): CharacterBillboard | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const stored = raw as Partial<CharacterBillboard>;
  const billboard = blankCharacterBillboard();
  billboard.idleFps = clampFps(stored.idleFps, DEFAULT_IDLE_FPS);
  billboard.movingFps = clampFps(stored.movingFps, DEFAULT_MOVING_FPS);
  billboard.attackFps = clampFps(stored.attackFps, DEFAULT_ATTACK_FPS);
  for (const rotation of CHARACTER_ROTATIONS) {
    for (const animation of CHARACTER_ANIMATIONS) {
      billboard.clips[rotation][animation] = storedFrames(stored, rotation, animation);
    }
  }
  return hasAnyFrame(billboard) ? billboard : null;
}

export function clampFps(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(30, value));
}

function storedFrames(
  stored: Partial<CharacterBillboard>,
  rotation: string,
  animation: string,
): ReturnType<typeof framesFromUnknown> {
  const clips = stored.clips as Record<string, Record<string, unknown>> | undefined;
  return framesFromUnknown(clips?.[rotation]?.[animation]);
}

function framesFromUnknown(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(spriteArtFromStoredShape)
    .filter((sprite): sprite is SpriteArt => sprite !== null)
    .slice(0, MAX_ANIMATION_FRAMES);
}
