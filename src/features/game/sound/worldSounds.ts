import type { ReadOnlyWorld } from '@/features/app-shell/runtime/readOnlyAssets';
import type { Fight } from '../combat/fight';
import type { PuzzleCues } from '../circuits/puzzleCues';
import {
  DIAGONAL_MOVE_COOLDOWN_TICKS,
  JUMP_MS,
  MOVE_COOLDOWN_TICKS,
  TICK_MS,
} from '../sim/movementOrder';
import type { Cell } from '../worldRules';
import { footingCueOf, type FootingTerrain } from './footing';
import { roomSizeAround, type OpenSpace } from './roomSense';
import type { SoundCue } from './soundCues';
import type { SoundPlayer } from './soundPlayer';
import type { SoundShape } from './soundRecipe';
import {
  momentumOf,
  restingStride,
  strideAfterStep,
  strideEndsInASettle,
  STRIDE_REST_MS,
} from './stride';

export interface SoundedWorld {
  world: ReadOnlyWorld;
  rules: FootingTerrain & OpenSpace;
  puzzleCues: Pick<PuzzleCues, 'on'>;
  fight: Pick<Fight, 'on'>;
}

export interface SoundClock {
  now(): number;
  after(ms: number, run: () => void): () => void;
}

const CIRCUIT_SOUNDS: Array<['plate-lit' | 'door-opened' | 'circuit-powered', SoundCue]> = [
  ['plate-lit', 'plate'],
  ['door-opened', 'door'],
  ['circuit-powered', 'power'],
];
const FIGHT_SOUNDS: Array<['creature-struck' | 'creature-slain' | 'player-struck', SoundCue]> = [
  ['creature-struck', 'strike'],
  ['creature-slain', 'slain'],
  ['player-struck', 'hurt'],
];
const HALF_LOUDNESS_TILES = 6;
const STEP_SECONDS = (MOVE_COOLDOWN_TICKS * TICK_MS) / 1000;
const DIAGONAL_STEP_SECONDS = (DIAGONAL_MOVE_COOLDOWN_TICKS * TICK_MS) / 1000;
const CRATE_GRIND_STRETCH = 1.5;

export function realSoundClock(): SoundClock {
  return {
    now: () => Date.now(),
    after: (ms, run) => {
      const timer = setTimeout(run, ms);
      return () => clearTimeout(timer);
    },
  };
}

export function playWorldSounds(
  sounded: SoundedWorld,
  player: SoundPlayer,
  isOn: () => boolean,
  clock: SoundClock = realSoundClock(),
): () => void {
  const { world, rules } = sounded;
  let lastJumpAt = -Infinity;
  let stride = restingStride();
  let stood: Cell = { x: world.playerX, y: world.playerY };
  let cancelRest = () => undefined as void;
  const here = (): Cell => ({ x: world.playerX, y: world.playerY });
  const play = (cue: SoundCue, shape: Partial<SoundShape>): void => {
    if (isOn()) player.play(cue, shape);
  };
  const waitForTheRunToEnd = (): void => {
    cancelRest();
    cancelRest = clock.after(STRIDE_REST_MS, () => {
      const ended = stride;
      stride = restingStride();
      cancelRest = () => undefined;
      if (strideEndsInASettle(ended)) {
        play('settle', { roomSize: roomSizeAround(rules, here()), effort: momentumOf(ended) });
      }
    });
  };
  const stops = [
    world.on('player-jumped', () => {
      lastJumpAt = clock.now();
      cancelRest();
      cancelRest = () => undefined;
      stride = restingStride();
      play('jump', { roomSize: roomSizeAround(rules, here()) });
    }),
    world.on('player-moved', () => {
      const from = stood;
      const to = here();
      stood = to;
      if (clock.now() - lastJumpAt < JUMP_MS) return;
      stride = strideAfterStep(stride, to.x - from.x, to.y - from.y);
      play(footingCueOf(rules, from, to), {
        roomSize: roomSizeAround(rules, to),
        effort: momentumOf(stride),
        seconds: strideSecondsOf(from, to),
      });
      waitForTheRunToEnd();
    }),
    sounded.puzzleCues.on('crate-pushed', (pushes) =>
      play('push', {
        volume: loudnessFrom(world, pushes.map((push) => push.to)),
        roomSize: roomSizeAround(rules, pushes[0]!.to),
        effort: momentumOf(stride),
        seconds: STEP_SECONDS * CRATE_GRIND_STRETCH,
      }),
    ),
    ...CIRCUIT_SOUNDS.map(([cue, sound]) =>
      sounded.puzzleCues.on(cue, (cells) =>
        play(sound, { volume: loudnessFrom(world, cells), roomSize: roomSizeAround(rules, cells[0]!) }),
      ),
    ),
    ...FIGHT_SOUNDS.map(([event, sound]) =>
      sounded.fight.on(event, (blow) => play(sound, { volume: loudnessFrom(sounded.world, [blow.at]) })),
    ),
  ];
  return () => {
    cancelRest();
    for (const stop of stops) stop();
    player.dispose();
  };
}

function strideSecondsOf(from: Cell, to: Cell): number {
  return to.x !== from.x && to.y !== from.y ? DIAGONAL_STEP_SECONDS : STEP_SECONDS;
}

export function loudnessFrom(listener: { playerX: number; playerY: number }, cells: readonly Cell[]): number {
  const nearest = Math.min(
    ...cells.map((cell) => Math.max(Math.abs(cell.x - listener.playerX), Math.abs(cell.y - listener.playerY))),
  );
  return 1 / (1 + nearest / HALF_LOUDNESS_TILES);
}
