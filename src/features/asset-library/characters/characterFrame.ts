import type { SpriteArt } from '../tiles/spriteArt';
import {
  CHARACTER_ANIMATIONS,
  CHARACTER_ROTATIONS,
  frameIndexAt,
  framesOf,
  fpsOf,
  type CharacterAnimation,
  type CharacterBillboard,
  type CharacterRotation,
} from './characterBillboard';
import { viewRelativeRotation } from './characterFacing';

export interface CharacterMotion {
  heading: number;
  moving: boolean;
  attacking?: boolean;
  attackSeconds?: number;
}

export interface CharacterFrame {
  rotation: CharacterRotation;
  animation: CharacterAnimation;
  index: number;
  sprite: SpriteArt;
  mirrored: boolean;
}

export function characterFrame(
  billboard: CharacterBillboard,
  motion: CharacterMotion,
  cameraYaw: number,
  seconds: number,
): CharacterFrame | null {
  const view = viewRelativeRotation(motion.heading, cameraYaw);
  const rotation = drawnRotation(billboard, view.rotation);
  if (!rotation) return null;
  const animation = drawnAnimation(billboard, rotation, motion);
  const frames = framesOf(billboard, rotation, animation);
  const clock = animation === 'attack' ? motion.attackSeconds ?? seconds : seconds;
  const index = frameIndexAt(frames.length, fpsOf(billboard, animation), clock);
  return { rotation, animation, index, sprite: frames[index]!, mirrored: view.mirrored };
}

export function frameKey(frame: CharacterFrame): string {
  return `${frame.rotation}:${frame.animation}:${frame.index}`;
}

function drawnRotation(
  billboard: CharacterBillboard,
  wanted: CharacterRotation,
): CharacterRotation | null {
  if (hasFrames(billboard, wanted)) return wanted;
  return CHARACTER_ROTATIONS.find((rotation) => hasFrames(billboard, rotation)) ?? null;
}

function drawnAnimation(
  billboard: CharacterBillboard,
  rotation: CharacterRotation,
  motion: CharacterMotion,
): CharacterAnimation {
  const walking: CharacterAnimation = motion.moving ? 'moving' : 'idle';
  const standing: CharacterAnimation = motion.moving ? 'idle' : 'moving';
  const preferred: CharacterAnimation[] = motion.attacking
    ? ['attack', walking, standing]
    : [walking, standing, 'attack'];
  return preferred.find((animation) => framesOf(billboard, rotation, animation).length > 0)!;
}

function hasFrames(billboard: CharacterBillboard, rotation: CharacterRotation): boolean {
  return CHARACTER_ANIMATIONS.some((animation) => framesOf(billboard, rotation, animation).length > 0);
}
