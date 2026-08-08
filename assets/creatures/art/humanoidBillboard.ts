import {
  blankCharacterClips,
  CHARACTER_ROTATIONS,
  DEFAULT_IDLE_FPS,
  DEFAULT_MOVING_FPS,
  type CharacterBillboard,
} from '../../characters/characterBillboard';
import type { HumanoidPalette } from './humanoidPalette';
import { humanoidSprite } from './humanoidSprite';

const IDLE_POSES = [
  { stride: 0, bob: 0 },
  { stride: 0, bob: 1 },
];

const WALK_POSES = [
  { stride: 1, bob: 0 },
  { stride: 0, bob: 1 },
  { stride: -1, bob: 0 },
  { stride: 0, bob: 1 },
];

export function humanoidBillboard(palette: HumanoidPalette): CharacterBillboard {
  const clips = blankCharacterClips();
  for (const rotation of CHARACTER_ROTATIONS) {
    clips[rotation].idle = IDLE_POSES.map((pose) => humanoidSprite({ rotation, ...pose }, palette));
    clips[rotation].moving = WALK_POSES.map((pose) => humanoidSprite({ rotation, ...pose }, palette));
  }
  return { idleFps: DEFAULT_IDLE_FPS, movingFps: DEFAULT_MOVING_FPS, clips };
}
