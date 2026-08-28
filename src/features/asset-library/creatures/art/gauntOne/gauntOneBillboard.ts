import {
  blankCharacterClips,
  CHARACTER_ROTATIONS,
  type CharacterBillboard,
} from '../../../characters/characterBillboard';
import {
  GAUNT_IDLE_FRAMES,
  GAUNT_WALK_FRAMES,
  idleGauntPose,
  walkingGauntPose,
} from './gauntOnePose';
import { gauntOneSprite } from './gauntOneSprite';

export const GAUNT_IDLE_FPS = 3;
export const GAUNT_WALK_FPS = 10;

export function gauntOneBillboard(): CharacterBillboard {
  const clips = blankCharacterClips();
  for (const rotation of CHARACTER_ROTATIONS) {
    clips[rotation].idle = Array.from({ length: GAUNT_IDLE_FRAMES }, (_, frame) =>
      gauntOneSprite(rotation, idleGauntPose(frame)),
    );
    clips[rotation].moving = Array.from({ length: GAUNT_WALK_FRAMES }, (_, frame) =>
      gauntOneSprite(rotation, walkingGauntPose(frame / GAUNT_WALK_FRAMES)),
    );
  }
  return { idleFps: GAUNT_IDLE_FPS, movingFps: GAUNT_WALK_FPS, clips };
}
