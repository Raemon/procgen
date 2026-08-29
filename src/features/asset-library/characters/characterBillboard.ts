import type { SpriteArt } from '../tiles/spriteArt';

export const CHARACTER_ROTATIONS = ['front', 'frontQuarter', 'side', 'backQuarter', 'back'] as const;
export const CHARACTER_ANIMATIONS = ['idle', 'moving', 'attack'] as const;

export type CharacterRotation = (typeof CHARACTER_ROTATIONS)[number];
export type CharacterAnimation = (typeof CHARACTER_ANIMATIONS)[number];

export const ROTATION_HELP: Readonly<Record<CharacterRotation, string>> = {
  front: 'facing the viewer',
  frontQuarter: 'turned 45° away from facing the viewer',
  side: 'in profile, walking across the view',
  backQuarter: 'turned 45° away from facing away',
  back: 'facing away from the viewer',
};

export const ANIMATION_HELP: Readonly<Record<CharacterAnimation, string>> = {
  idle: 'played while the character is standing still',
  moving: 'played while the character is walking',
  attack: 'played while the character is striking at someone in reach',
};

export const MAX_ANIMATION_FRAMES = 16;
export const DEFAULT_IDLE_FPS = 3;
export const DEFAULT_MOVING_FPS = 8;
export const DEFAULT_ATTACK_FPS = 10;

export type CharacterClips = Record<CharacterRotation, Record<CharacterAnimation, SpriteArt[]>>;

export interface CharacterBillboard {
  idleFps: number;
  movingFps: number;
  attackFps: number;
  clips: CharacterClips;
}

export function blankCharacterClips(): CharacterClips {
  const clips = {} as CharacterClips;
  for (const rotation of CHARACTER_ROTATIONS) {
    clips[rotation] = { idle: [], moving: [], attack: [] };
  }
  return clips;
}

export function blankCharacterBillboard(): CharacterBillboard {
  return {
    idleFps: DEFAULT_IDLE_FPS,
    movingFps: DEFAULT_MOVING_FPS,
    attackFps: DEFAULT_ATTACK_FPS,
    clips: blankCharacterClips(),
  };
}

export function framesOf(
  billboard: CharacterBillboard,
  rotation: CharacterRotation,
  animation: CharacterAnimation,
): SpriteArt[] {
  return billboard.clips[rotation][animation];
}

export function fpsOf(billboard: CharacterBillboard, animation: CharacterAnimation): number {
  if (animation === 'idle') return billboard.idleFps;
  return animation === 'attack' ? billboard.attackFps : billboard.movingFps;
}

export function frameIndexAt(frameCount: number, fps: number, seconds: number): number {
  if (frameCount <= 1) return 0;
  const tick = Math.floor(seconds * Math.max(0, fps));
  return ((tick % frameCount) + frameCount) % frameCount;
}

export function hasAnyFrame(billboard: CharacterBillboard): boolean {
  return CHARACTER_ROTATIONS.some((rotation) =>
    CHARACTER_ANIMATIONS.some((animation) => framesOf(billboard, rotation, animation).length > 0),
  );
}

export function isCharacterRotation(value: unknown): value is CharacterRotation {
  return CHARACTER_ROTATIONS.includes(value as CharacterRotation);
}

export function isCharacterAnimation(value: unknown): value is CharacterAnimation {
  return CHARACTER_ANIMATIONS.includes(value as CharacterAnimation);
}
