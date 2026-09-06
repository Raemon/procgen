import type { ReadOnlyWorld } from '@/features/app-shell/runtime/readOnlyAssets';
import type { WireCell } from '../circuits/circuit';
import type { PuzzleCue, PuzzleCues } from '../circuits/puzzleCues';
import { JUMP_MS } from '../sim/movementOrder';
import type { SoundCue, SoundPlayer } from './soundSynth';

export interface SoundedWorld {
  world: ReadOnlyWorld;
  puzzleCues: Pick<PuzzleCues, 'on'>;
}

export interface SoundClock {
  now(): number;
}

const CUE_SOUNDS: Array<[PuzzleCue, SoundCue]> = [
  ['crate-pushed', 'push'],
  ['plate-lit', 'plate'],
  ['door-opened', 'door'],
  ['circuit-powered', 'power'],
];
const HALF_LOUDNESS_TILES = 6;

export function playWorldSounds(
  sounded: SoundedWorld,
  player: SoundPlayer,
  isOn: () => boolean,
  clock: SoundClock = { now: () => Date.now() },
): () => void {
  let lastJumpAt = -Infinity;
  const play = (cue: SoundCue, volume = 1): void => {
    if (isOn()) player.play(cue, volume);
  };
  const stops = [
    sounded.world.on('player-jumped', () => {
      lastJumpAt = clock.now();
      play('jump');
    }),
    sounded.world.on('player-moved', () => {
      if (clock.now() - lastJumpAt >= JUMP_MS) play('step');
    }),
    ...CUE_SOUNDS.map(([cue, sound]) =>
      sounded.puzzleCues.on(cue, (cells) => play(sound, loudnessFrom(sounded.world, cells))),
    ),
  ];
  return () => {
    for (const stop of stops) stop();
    player.dispose();
  };
}

export function loudnessFrom(listener: { playerX: number; playerY: number }, cells: readonly WireCell[]): number {
  const nearest = Math.min(
    ...cells.map((cell) => Math.max(Math.abs(cell.x - listener.playerX), Math.abs(cell.y - listener.playerY))),
  );
  return 1 / (1 + nearest / HALF_LOUDNESS_TILES);
}
