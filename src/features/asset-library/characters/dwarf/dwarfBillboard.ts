import {
  blankCharacterClips,
  CHARACTER_ROTATIONS,
  type CharacterBillboard,
} from '../characterBillboard';
import { MOONLIT_DWARF_PALETTE, type DwarfPalette } from './dwarfPalette';
import { idleDwarfPose, walkingDwarfPose, type DwarfPose } from './dwarfPose';
import { dwarfSprite } from './dwarfSprite';

export const DWARF_IDLE_FRAMES = 6;
export const DWARF_WALK_FRAMES = 8;
export const DWARF_IDLE_FPS = 5;
export const DWARF_WALK_FPS = 10;

export function dwarfBillboard(palette: DwarfPalette = MOONLIT_DWARF_PALETTE): CharacterBillboard {
  const clips = blankCharacterClips();
  for (const rotation of CHARACTER_ROTATIONS) {
    clips[rotation].idle = posesOf(DWARF_IDLE_FRAMES, idleDwarfPose).map((pose) =>
      dwarfSprite(rotation, pose, palette),
    );
    clips[rotation].moving = posesOf(DWARF_WALK_FRAMES, walkingDwarfPose).map((pose) =>
      dwarfSprite(rotation, pose, palette),
    );
  }
  return { idleFps: DWARF_IDLE_FPS, movingFps: DWARF_WALK_FPS, clips };
}

function posesOf(frameCount: number, poseAt: (phase: number) => DwarfPose): DwarfPose[] {
  return Array.from({ length: frameCount }, (_, frame) => poseAt(frame / frameCount));
}
