import type { SpriteArt } from '../../world/tiles/spriteArt';
import {
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
  const rotation = drawnRotation(billboard, view.rotation, motion.moving);
  if (!rotation) return null;
  const animation = drawnAnimation(billboard, rotation, motion.moving);
  const frames = framesOf(billboard, rotation, animation);
  const index = frameIndexAt(frames.length, fpsOf(billboard, animation), seconds);
  return { rotation, animation, index, sprite: frames[index]!, mirrored: view.mirrored };
}

export function frameKey(frame: CharacterFrame): string {
  return `${frame.rotation}:${frame.animation}:${frame.index}`;
}

function drawnRotation(
  billboard: CharacterBillboard,
  wanted: CharacterRotation,
  moving: boolean,
): CharacterRotation | null {
  if (hasFrames(billboard, wanted, moving)) return wanted;
  return CHARACTER_ROTATIONS.find((rotation) => hasFrames(billboard, rotation, moving)) ?? null;
}

function drawnAnimation(
  billboard: CharacterBillboard,
  rotation: CharacterRotation,
  moving: boolean,
): CharacterAnimation {
  const wanted: CharacterAnimation = moving ? 'moving' : 'idle';
  return framesOf(billboard, rotation, wanted).length > 0 ? wanted : otherAnimation(wanted);
}

function otherAnimation(animation: CharacterAnimation): CharacterAnimation {
  return animation === 'moving' ? 'idle' : 'moving';
}

function hasFrames(
  billboard: CharacterBillboard,
  rotation: CharacterRotation,
  moving: boolean,
): boolean {
  return (
    framesOf(billboard, rotation, moving ? 'moving' : 'idle').length > 0 ||
    framesOf(billboard, rotation, moving ? 'idle' : 'moving').length > 0
  );
}
